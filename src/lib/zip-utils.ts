/**
 * ZIP ファイル処理ユーティリティ
 *
 * Novel AI のレスポンスは ZIP 形式で返却されるため、
 * 画像を抽出するための処理を行う。
 */

import JSZip from "jszip";

/** ZIP バイナリから画像をBase64配列として抽出 */
export async function extractImagesFromZip(
  zipData: ArrayBuffer
): Promise<string[]> {
  const zip = await JSZip.loadAsync(zipData);
  const images: string[] = [];

  for (const filename of Object.keys(zip.files)) {
    const file = zip.files[filename];
    if (file.dir) continue;

    // PNG画像を Base64 に変換
    if (filename.endsWith(".png") || filename.endsWith(".jpg")) {
      const data = await file.async("base64");
      images.push(data);
    }
  }

  return images;
}
