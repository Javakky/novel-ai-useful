import { describe, it, expect } from "vitest";
import { DEFAULT_GENERATE_PARAMS } from "../app";
import { SIZE_PRESETS, MODEL_INFO, SAMPLER_INFO } from "../novelai";

describe("DEFAULT_GENERATE_PARAMS", () => {
  it("V4モデルがデフォルト", () => {
    expect(DEFAULT_GENERATE_PARAMS.model).toBe(
      "nai-diffusion-4-curated-preview"
    );
  });

  it("デフォルトサイズが縦長", () => {
    expect(DEFAULT_GENERATE_PARAMS.width).toBe(832);
    expect(DEFAULT_GENERATE_PARAMS.height).toBe(1216);
  });

  it("デフォルトアクションがgenerate", () => {
    expect(DEFAULT_GENERATE_PARAMS.action).toBe("generate");
  });

  it("NovelAI公式デフォルトのCFGスケール", () => {
    expect(DEFAULT_GENERATE_PARAMS.scale).toBe(5.5);
  });

  it("NovelAI公式デフォルトのサンプラー（Euler Ancestral）", () => {
    expect(DEFAULT_GENERATE_PARAMS.sampler).toBe("k_euler_ancestral");
  });

  it("NovelAI公式デフォルトのステップ数", () => {
    expect(DEFAULT_GENERATE_PARAMS.steps).toBe(23);
  });

  it("品質タグがデフォルトで有効", () => {
    expect(DEFAULT_GENERATE_PARAMS.qualityToggle).toBe(true);
  });
});

describe("SIZE_PRESETS", () => {
  it("少なくとも3つのプリセットが定義されている", () => {
    expect(SIZE_PRESETS.length).toBeGreaterThanOrEqual(3);
  });

  it("全てのプリセットが64の倍数のサイズを持つ", () => {
    for (const preset of SIZE_PRESETS) {
      expect(preset.width % 64).toBe(0);
      expect(preset.height % 64).toBe(0);
    }
  });

  it("全てのプリセットにラベルがある", () => {
    for (const preset of SIZE_PRESETS) {
      expect(preset.label).toBeTruthy();
    }
  });
});

describe("MODEL_INFO", () => {
  it("V4モデルが含まれている", () => {
    expect(MODEL_INFO["nai-diffusion-4-curated-preview"]).toBeDefined();
    expect(MODEL_INFO["nai-diffusion-4-curated-preview"].version).toBe("V4");
  });

  it("V3モデルが含まれている", () => {
    expect(MODEL_INFO["nai-diffusion-3"]).toBeDefined();
    expect(MODEL_INFO["nai-diffusion-3"].version).toBe("V3");
  });

  it("全てのモデルにラベルとバージョンがある", () => {
    for (const [, info] of Object.entries(MODEL_INFO)) {
      expect(info.label).toBeTruthy();
      expect(info.version).toBeTruthy();
    }
  });
});

describe("SAMPLER_INFO", () => {
  it("Euler サンプラーが含まれている", () => {
    expect(SAMPLER_INFO.k_euler).toBeDefined();
    expect(SAMPLER_INFO.k_euler.label).toBe("Euler");
  });

  it("全てのサンプラーにラベルがある", () => {
    for (const [, info] of Object.entries(SAMPLER_INFO)) {
      expect(info.label).toBeTruthy();
    }
  });
});
