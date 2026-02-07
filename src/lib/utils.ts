import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind CSS クラス名のマージユーティリティ */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ユニークIDの生成 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 現在時刻のISO文字列 */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Base64エンコードされた画像からBlobを作成 */
export function base64ToBlob(base64: string, mimeType = "image/png"): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/** ファイルをBase64に変換 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/png;base64, の部分を除去
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
