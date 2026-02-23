/**
 * Novel AI API の型定義
 */

/** 利用可能なモデル */
export type NovelAIModel =
  | "nai-diffusion-4-curated-preview"
  | "nai-diffusion-4-full"
  | "nai-diffusion-3"
  | "nai-diffusion-3-inpainting"
  | "nai-diffusion-furry-3"
  | "nai-diffusion-furry-3-inpainting";

/** サンプラー */
export type Sampler =
  | "k_euler"
  | "k_euler_ancestral"
  | "k_dpmpp_2s_ancestral"
  | "k_dpmpp_2m"
  | "k_dpmpp_2m_sde"
  | "k_dpmpp_sde"
  | "ddim";

/** ノイズスケジュール */
export type NoiseSchedule =
  | "native"
  | "karras"
  | "exponential"
  | "polyexponential";

/** UCプリセット */
export type UCPreset = 0 | 1 | 2 | 3;

/** 生成アクション */
export type GenerateAction = "generate" | "img2img" | "inpainting";

/** キャラクタープロンプト（V4用） */
export interface CharacterCaption {
  /** キャラクター個別のプロンプト */
  char_caption: string;
  /** 配置座標（正規化座標 0.0-1.0） */
  centers?: { x: number; y: number }[];
}

/** V4プロンプト構造 */
export interface V4Prompt {
  caption: {
    base_caption: string;
    char_captions: CharacterCaption[];
  };
  use_coords: boolean;
  use_order: boolean;
}

/** 画像生成パラメータ */
export interface ImageGenerateParams {
  /** メインプロンプト */
  prompt: string;
  /** ネガティブプロンプト */
  negativePrompt: string;
  /** モデル */
  model: NovelAIModel;
  /** 生成アクション */
  action: GenerateAction;
  /** 画像幅 */
  width: number;
  /** 画像高さ */
  height: number;
  /** CFGスケール */
  scale: number;
  /** サンプラー */
  sampler: Sampler;
  /** 生成ステップ数 */
  steps: number;
  /** ランダムシード (0 = ランダム) */
  seed: number;
  /** 生成枚数 */
  nSamples: number;
  /** UCプリセット */
  ucPreset: UCPreset;
  /** 品質タグ自動追加 */
  qualityToggle: boolean;
  /** SMEA */
  smea: boolean;
  /** SMEA Dynamic */
  smeaDyn: boolean;
  /** ノイズスケジュール */
  noiseSchedule: NoiseSchedule;
  /** CFGリスケール */
  cfgRescale: number;
  /** UC強度 */
  uncondScale: number;

  /** V4キャラクタープロンプト */
  v4Prompt?: V4Prompt;
  /** V4ネガティブプロンプト */
  v4NegativePrompt?: {
    caption: {
      base_caption: string;
      char_captions: {
        char_caption: string;
        centers?: { x: number; y: number }[];
      }[];
    };
    legacy_uc?: boolean;
  };
  /** キャラクタープロンプト配列（V4用） */
  characterPrompts?: {
    prompt: string;
    uc: string;
    center: { x: number; y: number };
    enabled: boolean;
  }[];

  /** リファレンス画像（Vibe Transfer） */
  referenceImages?: ReferenceImage[];

  /** img2img用画像 (Base64) */
  image?: string;
  /** img2img強度 */
  strength?: number;
  /** img2imgノイズ */
  noise?: number;
}

/** リファレンス画像（Vibe Transfer） */
export interface ReferenceImage {
  /** Base64エンコードされた画像 */
  image: string;
  /** 情報抽出量 (0.0-1.0) */
  informationExtracted: number;
  /** 参照強度 (0.0-1.0) */
  referenceStrength: number;
}

/** API リクエストボディ */
export interface NovelAIGenerateRequest {
  input: string;
  model: NovelAIModel;
  action: GenerateAction;
  parameters: Record<string, unknown>;
}

/** 画像サイズプリセット */
export interface SizePreset {
  label: string;
  width: number;
  height: number;
}

/** 定義済みサイズプリセット */
export const SIZE_PRESETS: SizePreset[] = [
  { label: "縦長 (832×1216)", width: 832, height: 1216 },
  { label: "縦長 大 (832×1408)", width: 832, height: 1408 },
  { label: "横長 (1216×832)", width: 1216, height: 832 },
  { label: "横長 大 (1408×832)", width: 1408, height: 832 },
  { label: "正方形 (1024×1024)", width: 1024, height: 1024 },
  { label: "小 正方形 (512×512)", width: 512, height: 512 },
];

/** モデル情報 */
export const MODEL_INFO: Record<
  NovelAIModel,
  { label: string; version: string }
> = {
  "nai-diffusion-4-curated-preview": { label: "NAI Diffusion V4 (Curated)", version: "V4" },
  "nai-diffusion-4-full": { label: "NAI Diffusion V4 (Full)", version: "V4" },
  "nai-diffusion-3": { label: "NAI Diffusion V3", version: "V3" },
  "nai-diffusion-3-inpainting": { label: "NAI Diffusion V3 (Inpainting)", version: "V3" },
  "nai-diffusion-furry-3": { label: "NAI Diffusion Furry V3", version: "V3" },
  "nai-diffusion-furry-3-inpainting": { label: "NAI Diffusion Furry V3 (Inpainting)", version: "V3" },
};

/** サンプラー情報 */
export const SAMPLER_INFO: Record<Sampler, { label: string }> = {
  k_euler: { label: "Euler" },
  k_euler_ancestral: { label: "Euler Ancestral" },
  k_dpmpp_2s_ancestral: { label: "DPM++ 2S Ancestral" },
  k_dpmpp_2m: { label: "DPM++ 2M" },
  k_dpmpp_2m_sde: { label: "DPM++ 2M SDE" },
  k_dpmpp_sde: { label: "DPM++ SDE" },
  ddim: { label: "DDIM" },
};
