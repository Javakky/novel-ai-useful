import { describe, it, expect } from "vitest";
import { buildMergedParams } from "../merge-params";
import type { ImageGenerateParams } from "@/types/novelai";
import type { CharacterDefinition } from "@/types/app";

const baseParams: ImageGenerateParams = {
  prompt: "1girl",
  negativePrompt: "lowres",
  model: "nai-diffusion-4-curated-preview",
  action: "generate",
  width: 832,
  height: 1216,
  scale: 5.0,
  sampler: "k_euler",
  steps: 28,
  seed: 42,
  nSamples: 1,
  ucPreset: 0,
  qualityToggle: true,
  smea: false,
  smeaDyn: false,
  noiseSchedule: "karras",
  cfgRescale: 0,
  uncondScale: 1.0,
};

function makeChar(
  overrides: Partial<CharacterDefinition> & Pick<CharacterDefinition, "prompt">
): CharacterDefinition {
  return {
    id: overrides.id ?? "char-1",
    name: overrides.name ?? "char",
    prompt: overrides.prompt,
    negativePrompt: overrides.negativePrompt ?? "",
    position: overrides.position,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("buildMergedParams", () => {
  it("プリセットのプロンプトを既存プロンプトにカンマで連結する", () => {
    const result = buildMergedParams({
      generateParams: baseParams,
      presetPrompt: "best quality",
      presetNegativePrompt: "worst quality",
      appliedCharacters: [],
    });
    expect(result.prompt).toBe("1girl, best quality");
    expect(result.negativePrompt).toBe("lowres, worst quality");
  });

  it("ベースプロンプトが空でもプリセットだけで埋まる", () => {
    const result = buildMergedParams({
      generateParams: { ...baseParams, prompt: "", negativePrompt: "" },
      presetPrompt: "best quality",
      presetNegativePrompt: "worst quality",
      appliedCharacters: [],
    });
    expect(result.prompt).toBe("best quality");
    expect(result.negativePrompt).toBe("worst quality");
  });

  it("キャラ未適用なら v4Prompt 系は undefined に戻す (前回の残骸を引きずらない)", () => {
    const result = buildMergedParams({
      generateParams: {
        ...baseParams,
        v4Prompt: {
          caption: { base_caption: "stale", char_captions: [] },
          use_coords: false,
          use_order: true,
        },
      },
      presetPrompt: "",
      presetNegativePrompt: "",
      appliedCharacters: [],
    });
    expect(result.v4Prompt).toBeUndefined();
    expect(result.v4NegativePrompt).toBeUndefined();
    expect(result.characterPrompts).toBeUndefined();
  });

  it("V3 モデルでは V4 用フィールドを構築しない", () => {
    const result = buildMergedParams({
      generateParams: { ...baseParams, model: "nai-diffusion-3" },
      presetPrompt: "",
      presetNegativePrompt: "",
      appliedCharacters: [makeChar({ prompt: "red hair" })],
    });
    expect(result.v4Prompt).toBeUndefined();
    expect(result.v4NegativePrompt).toBeUndefined();
    expect(result.characterPrompts).toBeUndefined();
  });

  it("V4 でキャラが適用されたら v4_prompt/v4_negative_prompt を同じ件数・順序で構築する", () => {
    const result = buildMergedParams({
      generateParams: baseParams,
      presetPrompt: "",
      presetNegativePrompt: "",
      appliedCharacters: [
        makeChar({
          id: "a",
          prompt: "red hair",
          negativePrompt: "long hair",
          position: { x: 0.3, y: 0.5 },
        }),
        makeChar({
          id: "b",
          prompt: "blue hair",
          negativePrompt: "short hair",
          position: { x: 0.7, y: 0.5 },
        }),
      ],
    });
    expect(result.v4Prompt?.caption.char_captions).toEqual([
      { char_caption: "red hair", centers: [{ x: 0.3, y: 0.5 }] },
      { char_caption: "blue hair", centers: [{ x: 0.7, y: 0.5 }] },
    ]);
    expect(result.v4NegativePrompt?.caption.char_captions).toEqual([
      { char_caption: "long hair", centers: [{ x: 0.3, y: 0.5 }] },
      { char_caption: "short hair", centers: [{ x: 0.7, y: 0.5 }] },
    ]);
  });

  it("ネガティブが空のキャラがいても char_captions の件数・順序を落とさない (NovelAI Internal Server Error 回避)", () => {
    // 回帰: filter で要素が消えて positive/negative の長さがズレると
    // 生成中に gen_id 付き "Internal Server Error" になる
    const result = buildMergedParams({
      generateParams: baseParams,
      presetPrompt: "",
      presetNegativePrompt: "",
      appliedCharacters: [
        makeChar({ id: "a", prompt: "red hair", negativePrompt: "" }),
        makeChar({ id: "b", prompt: "blue hair", negativePrompt: "short hair" }),
      ],
    });
    expect(result.v4Prompt?.caption.char_captions).toHaveLength(2);
    expect(result.v4NegativePrompt?.caption.char_captions).toHaveLength(2);
    expect(result.v4NegativePrompt?.caption.char_captions[0].char_caption).toBe("");
    expect(result.v4NegativePrompt?.caption.char_captions[1].char_caption).toBe("short hair");
  });

  it("position が未設定なら (0.5, 0.5) を採用する", () => {
    const result = buildMergedParams({
      generateParams: baseParams,
      presetPrompt: "",
      presetNegativePrompt: "",
      appliedCharacters: [makeChar({ prompt: "red hair" })],
    });
    expect(result.v4Prompt?.caption.char_captions[0].centers).toEqual([
      { x: 0.5, y: 0.5 },
    ]);
  });
});
