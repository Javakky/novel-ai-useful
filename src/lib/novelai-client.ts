/**
 * Novel AI API クライアント
 *
 * サーバーサイド（API Routes）から呼び出すためのクライアント。
 * ブラウザから直接APIを叩かず、Next.js の API Routes を経由する。
 */

import type {
  ImageGenerateParams,
  NovelAIGenerateRequest,
  NovelAIModel,
} from "@/types/novelai";

const NOVELAI_API_BASE = "https://image.novelai.net";

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

  const parameters: Record<string, unknown> = {
    width: params.width,
    height: params.height,
    scale: params.scale,
    sampler: params.sampler,
    steps: params.steps,
    seed: params.seed,
    n_samples: params.nSamples,
    negative_prompt: params.negativePrompt,
    noise_schedule: params.noiseSchedule,
    qualityToggle: params.qualityToggle,
    ucPreset: params.ucPreset,
    sm: params.smea,
    sm_dyn: params.smeaDyn,
    cfg_rescale: params.cfgRescale,
    uncond_scale: params.uncondScale,
  };

  if (isV4) {
    parameters.params_version = 3;
  }

  // V4 キャラクタープロンプト
  if (isV4 && params.v4Prompt) {
    parameters.v4_prompt = params.v4Prompt;
  }
  if (isV4 && params.v4NegativePrompt) {
    parameters.v4_negative_prompt = params.v4NegativePrompt;
  }

  // Vibe Transfer（リファレンス画像）
  if (params.referenceImages && params.referenceImages.length > 0) {
    parameters.reference_image_multiple = params.referenceImages.map(
      (ref) => ref.image
    );
    parameters.reference_information_extracted_multiple =
      params.referenceImages.map((ref) => ref.informationExtracted);
    parameters.reference_strength_multiple = params.referenceImages.map(
      (ref) => ref.referenceStrength
    );
  }

  // img2img
  if (params.action === "img2img" && params.image) {
    parameters.image = params.image;
    parameters.strength = params.strength ?? 0.7;
    parameters.noise = params.noise ?? 0.0;
  }

  return {
    input: params.prompt,
    model: params.model as NovelAIModel,
    action: params.action,
    parameters,
  };
}

/** Novel AI の画像生成APIを呼び出す */
export async function generateImage(
  params: ImageGenerateParams,
  token: string
): Promise<ArrayBuffer> {
  const body = buildRequestBody(params);

  const response = await fetch(`${NOVELAI_API_BASE}/ai/generate-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "不明なエラー");
    throw new NovelAIApiError(
      `Novel AI API エラー (${response.status}): ${errorText}`,
      response.status
    );
  }

  return response.arrayBuffer();
}
