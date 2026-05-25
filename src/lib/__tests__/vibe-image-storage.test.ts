import { describe, it, expect } from "vitest";
import { hydrateVibeConfigsWithImages } from "../vibe-image-storage";

/**
 * IndexedDB 本体 (setVibeImage / getAllVibeImages 等) は jsdom 環境では
 * 動かないためテストしない。純関数の hydrateVibeConfigsWithImages のみ検証する。
 * IDB 部分は手動確認 (ブラウザでリロード後にサムネが復元されること) に依存。
 */

describe("hydrateVibeConfigsWithImages", () => {
  it("ID に紐づく画像で referenceImage.image を上書きする", () => {
    const configs = [
      {
        id: "a",
        referenceImage: { image: "", informationExtracted: 1, referenceStrength: 0.6 },
      },
      {
        id: "b",
        referenceImage: { image: "", informationExtracted: 1, referenceStrength: 0.6 },
      },
    ];
    const result = hydrateVibeConfigsWithImages(configs, {
      a: "image-a-base64",
      b: "image-b-base64",
    });
    expect(result[0].referenceImage.image).toBe("image-a-base64");
    expect(result[1].referenceImage.image).toBe("image-b-base64");
  });

  it("対応する画像がない設定は元の値 (通常は空文字) を保持する", () => {
    const configs = [
      {
        id: "a",
        referenceImage: { image: "fallback", informationExtracted: 1, referenceStrength: 0.6 },
      },
    ];
    const result = hydrateVibeConfigsWithImages(configs, {});
    expect(result[0].referenceImage.image).toBe("fallback");
  });

  it("元の配列を破壊しない (純関数)", () => {
    const configs = [
      {
        id: "a",
        referenceImage: { image: "", informationExtracted: 1, referenceStrength: 0.6 },
      },
    ];
    const snapshot = JSON.stringify(configs);
    hydrateVibeConfigsWithImages(configs, { a: "image-a-base64" });
    expect(JSON.stringify(configs)).toBe(snapshot);
  });
});
