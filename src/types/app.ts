/**
 * アプリケーション固有の型定義
 */

import type { ImageGenerateParams, ReferenceImage } from "./novelai";

/** プロンプトプリセット（保存可能なプロンプトのグループ） */
export interface PromptPreset {
  id: string;
  /** プリセット名 */
  name: string;
  /** プロンプトテキスト */
  prompt: string;
  /** ネガティブプロンプト（任意） */
  negativePrompt?: string;
  /** 説明（任意） */
  description?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/** プロンプトグループ（複数プリセットをまとめたもの） */
export interface PromptGroup {
  id: string;
  /** グループ名 */
  name: string;
  /** 含まれるプリセットID */
  presetIds: string[];
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/** キャラクター定義 */
export interface CharacterDefinition {
  id: string;
  /** キャラクター名 */
  name: string;
  /** キャラクタープロンプト */
  prompt: string;
  /** ネガティブプロンプト */
  negativePrompt: string;
  /** 配置座標 */
  position?: { x: number; y: number };
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/** AI ポーションマスター画像設定 */
export interface VibeTransferConfig {
  id: string;
  /** 設定名 */
  name: string;
  /** リファレンス画像 */
  referenceImage: ReferenceImage;
  /** 自動適用するか */
  autoApply: boolean;
  /** 作成日時 */
  createdAt: string;
}

/** 生成結果 */
export interface GenerationResult {
  id: string;
  /** 生成された画像 (Base64) */
  imageBase64: string;
  /** 使用したパラメータ */
  params: ImageGenerateParams;
  /** 使用したプロンプトプリセットID（あれば） */
  presetIds?: string[];
  /** 使用したキャラクター定義ID（あれば） */
  characterIds?: string[];
  /** 生成日時 */
  createdAt: string;
}

/** エクスポート設定 */
export interface ExportConfig {
  /** エクスポート対象の結果ID */
  resultIds: string[];
  /** キャラクターごとにフォルダ分けするか */
  groupByCharacter: boolean;
  /** メタデータファイルを含めるか */
  includeMetadata: boolean;
}

/** エクスポートメタデータ */
export interface ExportMetadata {
  /** キャラクター名 */
  characterName?: string;
  /** 使用プロンプト */
  prompt: string;
  /** ネガティブプロンプト */
  negativePrompt: string;
  /** モデル */
  model: string;
  /** シード */
  seed: number;
  /** サイズ */
  size: { width: number; height: number };
  /** リファレンス画像情報 */
  referenceImages?: {
    informationExtracted: number;
    referenceStrength: number;
  }[];
  /** 生成日時 */
  generatedAt: string;
}

/** デフォルトの生成パラメータ（NovelAI V4 公式デフォルトに準拠） */
export const DEFAULT_GENERATE_PARAMS: ImageGenerateParams = {
  prompt: "",
  negativePrompt: "",
  model: "nai-diffusion-4-curated-preview",
  action: "generate",
  width: 832,
  height: 1216,
  scale: 5.5,
  sampler: "k_euler_ancestral",
  steps: 23,
  seed: 0,
  nSamples: 1,
  ucPreset: 0,
  qualityToggle: true,
  smea: false,
  smeaDyn: false,
  noiseSchedule: "karras",
  cfgRescale: 0,
  uncondScale: 1.0,
  // V4キャラクター関連（リセット時に確実にクリア）
  v4Prompt: undefined,
  v4NegativePrompt: undefined,
  characterPrompts: undefined,
};
