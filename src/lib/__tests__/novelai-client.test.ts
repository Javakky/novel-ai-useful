import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildRequestBody, NovelAIApiError } from "../novelai-client";
import {
  generateImage,
  _clearVibeCacheForTest,
} from "../novelai-server";
import type { ImageGenerateParams } from "@/types/novelai";

const baseParams: ImageGenerateParams = {
  prompt: "1girl, masterpiece",
  negativePrompt: "lowres, bad anatomy",
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

// V4 品質タグ
const V4_QUALITY_TAGS = "no text, best quality, very aesthetic, absurdres";
// V4 UC プリセット Heavy
const V4_UC_PRESET_HEAVY = "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks, white blank page, blank page";

describe("buildRequestBody", () => {
  it("基本的なリクエストボディを正しく構築する（V4）", () => {
    const result = buildRequestBody(baseParams);

    // V4では品質タグが追加される
    expect(result.input).toBe(`1girl, masterpiece, ${V4_QUALITY_TAGS}`);
    expect(result.model).toBe("nai-diffusion-4-curated-preview");
    expect(result.action).toBe("generate");
    expect(result.parameters.width).toBe(832);
    expect(result.parameters.height).toBe(1216);
    expect(result.parameters.scale).toBe(5.0);
    expect(result.parameters.sampler).toBe("k_euler");
    expect(result.parameters.steps).toBe(28);
    expect(result.parameters.seed).toBe(42);
    expect(result.parameters.n_samples).toBe(1);
    // V4ではUCプリセットがネガティブプロンプトに追加される
    expect(result.parameters.negative_prompt).toBe(`${V4_UC_PRESET_HEAVY}, lowres, bad anatomy`);
    expect(result.parameters.noise_schedule).toBe("karras");
    expect(result.parameters.qualityToggle).toBe(true);
    expect(result.parameters.ucPreset).toBe(0);
    // V4モデルでは sm/sm_dyn は設定されない
    expect(result.parameters.sm).toBeUndefined();
    expect(result.parameters.sm_dyn).toBeUndefined();
  });

  it("V3モデルで sm/sm_dyn が正しく設定される", () => {
    const v3Params = { ...baseParams, model: "nai-diffusion-3" as const };
    const result = buildRequestBody(v3Params);
    expect(result.parameters.sm).toBe(false);
    expect(result.parameters.sm_dyn).toBe(false);
  });

  it("V4モデルの場合 params_version を 3 に設定する", () => {
    const result = buildRequestBody(baseParams);
    expect(result.parameters.params_version).toBe(3);
  });

  it("V3モデルの場合 params_version を設定しない", () => {
    const v3Params = { ...baseParams, model: "nai-diffusion-3" as const };
    const result = buildRequestBody(v3Params);
    expect(result.parameters.params_version).toBeUndefined();
  });

  it("V4キャラクタープロンプトを正しく構築する", () => {
    const params: ImageGenerateParams = {
      ...baseParams,
      v4Prompt: {
        caption: {
          base_caption: "2girls, park",
          char_captions: [
            {
              char_caption: "red hair, blue eyes",
              centers: [{ x: 0.3, y: 0.5 }],
            },
            {
              char_caption: "black hair, green eyes",
              centers: [{ x: 0.7, y: 0.5 }],
            },
          ],
        },
        use_coords: true,
        use_order: true,
      },
    };

    const result = buildRequestBody(params);
    // base_caption は品質タグ付きプロンプトで上書きされる
    expect(result.parameters.v4_prompt).toEqual({
      caption: {
        base_caption: `${params.prompt}, ${V4_QUALITY_TAGS}`,
        char_captions: params.v4Prompt?.caption.char_captions,
      },
      use_coords: true,
      use_order: true,
    });
  });

  it("リファレンス画像を正しく構築する（V3: information_extracted を含む）", () => {
    const params: ImageGenerateParams = {
      ...baseParams,
      model: "nai-diffusion-3",
      referenceImages: [
        {
          image: "base64data1",
          informationExtracted: 1.0,
          referenceStrength: 0.6,
        },
        {
          image: "base64data2",
          informationExtracted: 0.5,
          referenceStrength: 0.8,
        },
      ],
    };

    const result = buildRequestBody(params);
    expect(result.parameters.reference_image_multiple).toEqual([
      "base64data1",
      "base64data2",
    ]);
    expect(
      result.parameters.reference_information_extracted_multiple
    ).toEqual([1.0, 0.5]);
    expect(result.parameters.reference_strength_multiple).toEqual([
      0.6, 0.8,
    ]);
  });

  it("V4 Curated では reference_information_extracted_multiple を含めない (事前エンコードで消費済み)", () => {
    const params: ImageGenerateParams = {
      ...baseParams,
      model: "nai-diffusion-4-curated-preview",
      referenceImages: [
        {
          image: "vibetoken1",
          informationExtracted: 1.0,
          referenceStrength: 0.6,
        },
      ],
    };

    const result = buildRequestBody(params);
    expect(result.parameters.reference_image_multiple).toEqual(["vibetoken1"]);
    expect(result.parameters.reference_strength_multiple).toEqual([0.6]);
    expect(
      result.parameters.reference_information_extracted_multiple
    ).toBeUndefined();
  });

  it("V4 Full でも reference_information_extracted_multiple を含めない (V4 Full も vibe 事前エンコード必須)", () => {
    // 回帰: V4 Full で raw base64 を reference_image_multiple に渡すと
    // gen_id 付き "Internal Server Error" でストリームが落ちる。
    const params: ImageGenerateParams = {
      ...baseParams,
      model: "nai-diffusion-4-full",
      referenceImages: [
        {
          image: "vibetoken1",
          informationExtracted: 1.0,
          referenceStrength: 0.6,
        },
      ],
    };

    const result = buildRequestBody(params);
    expect(result.parameters.reference_image_multiple).toEqual(["vibetoken1"]);
    expect(
      result.parameters.reference_information_extracted_multiple
    ).toBeUndefined();
  });

  it("img2img パラメータを正しく設定する", () => {
    const params: ImageGenerateParams = {
      ...baseParams,
      action: "img2img",
      image: "base64imagedata",
      strength: 0.7,
      noise: 0.1,
    };

    const result = buildRequestBody(params);
    expect(result.action).toBe("img2img");
    expect(result.parameters.image).toBe("base64imagedata");
    expect(result.parameters.strength).toBe(0.7);
    expect(result.parameters.noise).toBe(0.1);
  });

  it("img2img でデフォルト strength/noise が設定される", () => {
    const params: ImageGenerateParams = {
      ...baseParams,
      action: "img2img",
      image: "base64imagedata",
    };

    const result = buildRequestBody(params);
    expect(result.parameters.strength).toBe(0.7);
    expect(result.parameters.noise).toBe(0.0);
  });

  it("リファレンス画像が空の場合は設定しない", () => {
    const params: ImageGenerateParams = {
      ...baseParams,
      referenceImages: [],
    };

    const result = buildRequestBody(params);
    expect(result.parameters.reference_image_multiple).toBeUndefined();
  });

  it("seed が 0 の場合はランダムなシードを生成する", () => {
    const params: ImageGenerateParams = {
      ...baseParams,
      seed: 0,
    };

    const result1 = buildRequestBody(params);
    const result2 = buildRequestBody(params);

    // seed が 0 ではなく、有効な範囲の整数であること
    expect(result1.parameters.seed).not.toBe(0);
    expect(result1.parameters.seed).toBeGreaterThan(0);
    expect(result1.parameters.seed).toBeLessThan(4294967295);

    // 2回呼び出すと異なるシードが生成される（確率的に）
    // 注: 極めて低い確率で同じ値になる可能性があるが、実用上は問題ない
    expect(result1.parameters.seed).not.toBe(result2.parameters.seed);
  });

  it("seed が undefined の場合はランダムなシードを生成する", () => {
    const params = {
      ...baseParams,
      seed: undefined as unknown as number,
    };

    const result = buildRequestBody(params);

    expect(result.parameters.seed).not.toBe(0);
    expect(result.parameters.seed).toBeGreaterThan(0);
  });
});

describe("encodeVibe キャッシュ (generateImage 経由)", () => {
  /**
   * encodeVibe は内部 export しないため、generateImage 経由で fetch 呼び出し回数を観測する。
   *
   * generateImage の戻り値は msgpack デコード処理を経るが、空レスポンス → 例外で
   * 早期 throw する。我々が確認したいのは encode-vibe のフェッチ回数だけなので、
   * 生成本体のエラーは catch して無視する。
   */
  beforeEach(() => {
    _clearVibeCacheForTest();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("同じリファレンス画像で 2 回呼んでも encode-vibe は 1 回しか叩かない", async () => {
    const encodeCalls: string[] = [];
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockImplementation(async (input) => {
        const url = typeof input === "string" ? input : (input as Request).url;
        if (url.includes("/ai/encode-vibe")) {
          encodeCalls.push(url);
          return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200 });
        }
        // 生成エンドポイントは空レスポンスを返して早期 throw させる
        return new Response(new Uint8Array(0), { status: 200 });
      });

    const refParams: ImageGenerateParams = {
      ...baseParams,
      model: "nai-diffusion-4-curated-preview",
      referenceImages: [
        {
          image: "samebase64image",
          informationExtracted: 1.0,
          referenceStrength: 0.6,
        },
      ],
    };

    // 1 回目
    await generateImage(refParams, "fake-token").catch(() => {});
    // 2 回目 (同じ画像・同じパラメータ)
    await generateImage(refParams, "fake-token").catch(() => {});

    expect(encodeCalls.length).toBe(1);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("information_extracted が異なれば別キャッシュとして再エンコードする", async () => {
    const encodeCalls: number[] = [];
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/ai/encode-vibe")) {
        encodeCalls.push(Date.now());
        return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200 });
      }
      return new Response(new Uint8Array(0), { status: 200 });
    });

    const makeParams = (info: number): ImageGenerateParams => ({
      ...baseParams,
      model: "nai-diffusion-4-curated-preview",
      referenceImages: [
        {
          image: "samebase64image",
          informationExtracted: info,
          referenceStrength: 0.6,
        },
      ],
    });

    await generateImage(makeParams(1.0), "fake-token").catch(() => {});
    await generateImage(makeParams(0.5), "fake-token").catch(() => {});

    expect(encodeCalls.length).toBe(2);
  });

  it("V4 Full でも encode-vibe を叩く (raw base64 で叩くと生成が 500 で落ちる回帰防止)", async () => {
    const encodeCalls: number[] = [];
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/ai/encode-vibe")) {
        encodeCalls.push(Date.now());
        return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200 });
      }
      return new Response(new Uint8Array(0), { status: 200 });
    });

    const v4FullParams: ImageGenerateParams = {
      ...baseParams,
      model: "nai-diffusion-4-full",
      referenceImages: [
        {
          image: "rawbase64image",
          informationExtracted: 1.0,
          referenceStrength: 0.6,
        },
      ],
    };

    await generateImage(v4FullParams, "fake-token").catch(() => {});

    expect(encodeCalls.length).toBe(1);
  });

  it("V3 モデルでは encode-vibe を一切叩かない", async () => {
    const encodeCalls: number[] = [];
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/ai/encode-vibe")) {
        encodeCalls.push(Date.now());
        return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200 });
      }
      return new Response(new Uint8Array(0), { status: 200 });
    });

    const v3Params: ImageGenerateParams = {
      ...baseParams,
      model: "nai-diffusion-3",
      referenceImages: [
        {
          image: "anybase64image",
          informationExtracted: 1.0,
          referenceStrength: 0.6,
        },
      ],
    };

    await generateImage(v3Params, "fake-token").catch(() => {});

    expect(encodeCalls.length).toBe(0);
  });
});

describe("NovelAIApiError", () => {
  it("ステータスコードとメッセージを保持する", () => {
    const error = new NovelAIApiError("認証エラー", 401);
    expect(error.message).toBe("認証エラー");
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe("NovelAIApiError");
  });

  it("Error を継承している", () => {
    const error = new NovelAIApiError("テスト", 500);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(NovelAIApiError);
  });

  it("異なるステータスコードを正しく保持する", () => {
    const error429 = new NovelAIApiError("レート制限", 429);
    expect(error429.statusCode).toBe(429);

    const error402 = new NovelAIApiError("ポイント不足", 402);
    expect(error402.statusCode).toBe(402);
  });
});
