/**
 * Novel AI API 共通ユーティリティ (クライアント/サーバー両用)
 *
 * リクエストボディ構築や型・例外など、Node.js 専用 API を使わない部分のみを置く。
 * サーバー専用処理 (生成本体 fetch / vibe エンコード / キャッシュ) は `novelai-server.ts` 側に分離。
 */

import type {
  ImageGenerateParams,
  NovelAIGenerateRequest,
  NovelAIModel,
} from "@/types/novelai";

/**
 * Vibe Transfer のリファレンス画像を `/ai/encode-vibe` で事前エンコードする必要があるモデル。
 * V4 系 (Curated / Full) はこのステップを省略すると `reference_image_multiple` に raw base64 が
 * 渡って生成本体が gen_id 付き "Internal Server Error" でストリームを落とす。
 * V3 系は raw base64 をそのまま受け付ける。
 */
export const VIBE_ENCODE_REQUIRED_MODELS = new Set<NovelAIModel>([
  "nai-diffusion-4-curated-preview",
  "nai-diffusion-4-full",
]);

/** V4 品質タグ */
const V4_QUALITY_TAGS = "no text, best quality, very aesthetic, absurdres";

/** V4 UC プリセット (ネガティブプロンプト) */
const V4_UC_PRESETS: Record<number, string> = {
  0: "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks, white blank page, blank page", // Heavy
  1: "lowres, jpeg artifacts, worst quality, bad quality, very displeasing, chromatic aberration", // Light
  2: "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, extra digits, fewer digits, multiple views, logo, too many watermarks, white blank page, blank page", // Human Focus
  3: "", // None
};

/** Novel AI API のエラーを表すカスタムエラークラス */
export class NovelAIApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "NovelAIApiError";
  }
}

/** APIリクエストボディを構築 */
export function buildRequestBody(
  params: ImageGenerateParams
): NovelAIGenerateRequest {
  const isV4 = params.model.includes("diffusion-4");

  // seed: 0 または未設定の場合はランダムなシードを生成
  const seed =
    !params.seed || params.seed === 0
      ? Math.floor(Math.random() * 4294967295)
      : params.seed;

  console.log("=== シード情報 ===");
  console.log("元の値:", params.seed);
  console.log("使用するシード:", seed);
  console.log("==================");

  // V4: 品質タグとUCプリセットを適用
  let prompt = params.prompt;
  let negativePrompt = params.negativePrompt || "";

  if (isV4) {
    // qualityToggle が true の場合、品質タグを追加
    if (params.qualityToggle) {
      prompt = prompt ? `${prompt}, ${V4_QUALITY_TAGS}` : V4_QUALITY_TAGS;
    }

    // UCプリセットに応じたネガティブプロンプトを追加
    const ucPresetNegative = V4_UC_PRESETS[params.ucPreset] || "";
    if (ucPresetNegative) {
      negativePrompt = negativePrompt
        ? `${ucPresetNegative}, ${negativePrompt}`
        : ucPresetNegative;
    }
  }

  const parameters: Record<string, unknown> = {
    width: params.width,
    height: params.height,
    scale: params.scale,
    sampler: params.sampler,
    steps: params.steps,
    seed,
    n_samples: params.nSamples,
    negative_prompt: negativePrompt,
    noise_schedule: params.noiseSchedule,
    qualityToggle: params.qualityToggle,
    ucPreset: params.ucPreset,
    cfg_rescale: params.cfgRescale,
    image_format: "png",
    stream: "msgpack",
  };

  if (isV4) {
    // V4 専用パラメータ
    parameters.params_version = 3;
    parameters.autoSmea = false;
    parameters.dynamic_thresholding = false;
    parameters.controlnet_strength = 1;
    parameters.legacy = false;
    parameters.add_original_image = true;
    parameters.legacy_v3_extend = false;
    parameters.skip_cfg_above_sigma = null;
    parameters.use_coords = false;
    parameters.legacy_uc = false;
    parameters.normalize_reference_strength_multiple = true;
    parameters.inpaintImg2ImgStrength = 1;
    parameters.characterPrompts = params.characterPrompts || [];
    parameters.deliberate_euler_ancestral_bug = false;
    parameters.prefer_brownian = true;

    // V4では v4_prompt が必須。v4Prompt が指定されていない場合は prompt から自動構築
    if (params.v4Prompt) {
      // base_caption を品質タグ付きプロンプトで上書き（キャラクター設定は維持）
      parameters.v4_prompt = {
        ...params.v4Prompt,
        caption: {
          ...params.v4Prompt.caption,
          base_caption: prompt,
        },
      };
    } else {
      // 通常のプロンプトから V4 形式に変換
      parameters.v4_prompt = {
        caption: {
          base_caption: prompt,
          char_captions: [],
        },
        use_coords: false,
        use_order: true,
      };
    }

    // V4 ネガティブプロンプト
    if (params.v4NegativePrompt) {
      // base_caption をUCプリセット付きネガティブプロンプトで上書き
      parameters.v4_negative_prompt = {
        ...params.v4NegativePrompt,
        caption: {
          ...params.v4NegativePrompt.caption,
          base_caption: negativePrompt,
        },
      };
    } else {
      parameters.v4_negative_prompt = {
        caption: {
          base_caption: negativePrompt,
          char_captions: [],
        },
        legacy_uc: false,
      };
    }
  } else {
    // V3 用パラメータ
    parameters.sm = params.smea;
    parameters.sm_dyn = params.smeaDyn;
    parameters.uncond_scale = params.uncondScale;
  }

  // Vibe Transfer（リファレンス画像）
  if (params.referenceImages && params.referenceImages.length > 0) {
    parameters.reference_image_multiple = params.referenceImages.map(
      (ref) => ref.image
    );
    parameters.reference_strength_multiple = params.referenceImages.map(
      (ref) => ref.referenceStrength
    );
    // V4 Curated は事前エンコード時に information_extracted を消費済みなので
    // 同フィールドを送ると 400 になる。それ以外のモデルでのみ付与する。
    if (!VIBE_ENCODE_REQUIRED_MODELS.has(params.model)) {
      parameters.reference_information_extracted_multiple =
        params.referenceImages.map((ref) => ref.informationExtracted);
    }
  }

  // img2img
  if (params.action === "img2img" && params.image) {
    parameters.image = params.image;
    parameters.strength = params.strength ?? 0.7;
    parameters.noise = params.noise ?? 0.0;
  }

  return {
    input: prompt,
    model: params.model as NovelAIModel,
    action: params.action,
    parameters,
  };
}
