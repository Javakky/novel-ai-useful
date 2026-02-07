import { describe, it, expect } from "vitest";
import { extractImagesFromZip } from "../zip-utils";
import JSZip from "jszip";

describe("extractImagesFromZip", () => {
  it("ZIPからPNG画像をBase64として抽出する", async () => {
    const zip = new JSZip();
    // テスト用の最小PNG画像データ
    const pngData = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    zip.file("image_0.png", pngData);

    const zipBlob = await zip.generateAsync({ type: "arraybuffer" });
    const images = await extractImagesFromZip(zipBlob);

    expect(images.length).toBe(1);
    expect(typeof images[0]).toBe("string");
    // Base64 文字列であることを確認
    expect(images[0].length).toBeGreaterThan(0);
  });

  it("複数画像を抽出する", async () => {
    const zip = new JSZip();
    const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    zip.file("image_0.png", pngData);
    zip.file("image_1.png", pngData);

    const zipBlob = await zip.generateAsync({ type: "arraybuffer" });
    const images = await extractImagesFromZip(zipBlob);

    expect(images.length).toBe(2);
  });

  it("ディレクトリエントリを無視する", async () => {
    const zip = new JSZip();
    const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    zip.folder("subdir");
    zip.file("subdir/image.png", pngData);

    const zipBlob = await zip.generateAsync({ type: "arraybuffer" });
    const images = await extractImagesFromZip(zipBlob);

    expect(images.length).toBe(1);
  });

  it("非画像ファイルを無視する", async () => {
    const zip = new JSZip();
    const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    zip.file("image.png", pngData);
    zip.file("readme.txt", "not an image");

    const zipBlob = await zip.generateAsync({ type: "arraybuffer" });
    const images = await extractImagesFromZip(zipBlob);

    expect(images.length).toBe(1);
  });

  it("空のZIPからは空の配列を返す", async () => {
    const zip = new JSZip();
    const zipBlob = await zip.generateAsync({ type: "arraybuffer" });
    const images = await extractImagesFromZip(zipBlob);

    expect(images).toEqual([]);
  });
});
