/**
 * 生成パラメータと、適用中のプリセット / キャラクターをマージする純関数。
 *
 * UI 側 (Zustand ストア) から切り離してテスト可能にしている。
 * 副作用なし。入力をコピーして返す。
 */

import type { CharacterDefinition } from "@/types/app";
import type { ImageGenerateParams } from "@/types/novelai";

export interface MergeParamsInput {
  /** ベースの生成パラメータ */
  generateParams: ImageGenerateParams;
  /** 適用中プリセットを連結した positive prompt (空文字なら無視) */
  presetPrompt: string;
  /** 適用中プリセットを連結した negative prompt (空文字なら無視) */
  presetNegativePrompt: string;
  /** 適用中のキャラクター (順序が NovelAI 側の char_captions と対応する) */
  appliedCharacters: CharacterDefinition[];
}

export function buildMergedParams(input: MergeParamsInput): ImageGenerateParams {
  const { generateParams, presetPrompt, presetNegativePrompt, appliedCharacters } = input;
  const params: ImageGenerateParams = { ...generateParams };

  if (presetPrompt) {
    params.prompt = params.prompt ? `${params.prompt}, ${presetPrompt}` : presetPrompt;
  }
  if (presetNegativePrompt) {
    params.negativePrompt = params.negativePrompt
      ? `${params.negativePrompt}, ${presetNegativePrompt}`
      : presetNegativePrompt;
  }

  const isV4 = params.model.includes("diffusion-4");

  if (isV4 && appliedCharacters.length > 0) {
    // positive / negative の char_captions は順序・件数を揃える必要がある。
    // 片側だけ filter で要素を欠落させると NovelAI 側で gen_id 付き
    // "Internal Server Error" として落ちる (ストリーム samp_ix=0 で即失敗)。
    // ネガティブが空のキャラは空文字で埋めて、配列長を揃える。
    const positions = appliedCharacters.map((c) => ({
      x: c.position?.x ?? 0.5,
      y: c.position?.y ?? 0.5,
    }));

    params.v4Prompt = {
      caption: {
        base_caption: params.prompt,
        char_captions: appliedCharacters.map((c, i) => ({
          char_caption: c.prompt,
          centers: [positions[i]],
        })),
      },
      use_coords: false,
      use_order: true,
    };

    params.v4NegativePrompt = {
      caption: {
        base_caption: params.negativePrompt,
        char_captions: appliedCharacters.map((c, i) => ({
          char_caption: c.negativePrompt || "",
          centers: [positions[i]],
        })),
      },
      legacy_uc: false,
    };

    params.characterPrompts = appliedCharacters.map((c, i) => ({
      prompt: c.prompt,
      uc: c.negativePrompt || "",
      center: positions[i],
      enabled: true,
    }));
  } else {
    params.v4Prompt = undefined;
    params.v4NegativePrompt = undefined;
    params.characterPrompts = undefined;
  }

  return params;
}
