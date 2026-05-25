/**
 * Novel AI API のサーバー専用クライアント
 *
 * `node:crypto` などの Node.js 専用 API を使うため、Server Components / API Routes 専用。
 * クライアント側からの import は不可（webpack バンドルに `node:` URI が混入してビルドが壊れる）。
 */

import "server-only";

import { createHash } from "node:crypto";
import { decodeMulti } from "@msgpack/msgpack";
import type { ImageGenerateParams, NovelAIModel } from "@/types/novelai";
import {
  buildRequestBody,
  NovelAIApiError,
  VIBE_ENCODE_REQUIRED_MODELS,
} from "./novelai-client";

const NOVELAI_API_BASE = "https://image.novelai.net";

/**
 * Vibe token のインメモリキャッシュ。
 *
 * `/ai/encode-vibe` は 1 回 2 Anlas 消費するため、同一の (画像 + information_extracted + model)
 * の組み合わせを毎回エンコードしないようキャッシュする。
 *
 * Map の挿入順を活用した FIFO eviction でメモリ上限を抑える
 * (vibe token 1 件 ≈ 64KB。MAX_SIZE=200 で約 13MB)。
 *
 * Next.js の dev サーバーは長時間生きるためセッション中は十分有効。
 * 本番 serverless ではコールド起動毎に消えるが、それは元々別途の問題。
 */
const vibeCache = new Map<string, string>();
const VIBE_CACHE_MAX_SIZE = 200;

/** キャッシュキーを生成 (画像本体はそのままだと長すぎるので SHA-256 で圧縮) */
function getVibeCacheKey(
  imageBase64: string,
  informationExtracted: number,
  model: NovelAIModel
): string {
  const hash = createHash("sha256").update(imageBase64).digest("hex");
  return `${hash}:${informationExtracted}:${model}`;
}

/** テスト用にキャッシュをクリアする */
export function _clearVibeCacheForTest(): void {
  vibeCache.clear();
}

/** msgpack ストリームレスポンスの型 */
interface MsgpackStreamResponse {
  event_type: string;
  image?: Uint8Array; // バイナリ画像データ
}

/**
 * リファレンス画像を vibe token に事前エンコードする (キャッシュ込み)。
 *
 * V4 Curated (`nai-diffusion-4-curated-preview`) は `reference_image_multiple` に
 * raw base64 画像を渡せず、`/ai/encode-vibe` で得たエンコード済みバイナリ
 * （base64 化したもの）を渡さないと生成全体が 500 で失敗する。
 *
 * 1 リクエストあたり 2 Anlas のコストがかかるため、同一入力はキャッシュから返す。
 */
async function encodeVibe(
  imageBase64: string,
  informationExtracted: number,
  model: NovelAIModel,
  token: string
): Promise<string> {
  const cacheKey = getVibeCacheKey(imageBase64, informationExtracted, model);
  const cached = vibeCache.get(cacheKey);
  if (cached) {
    console.log("vibe キャッシュヒット:", cacheKey.slice(0, 16) + "...");
    return cached;
  }

  console.log("vibe エンコード (キャッシュミス):", cacheKey.slice(0, 16) + "...");
  const response = await fetch(`${NOVELAI_API_BASE}/ai/encode-vibe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      image: imageBase64,
      information_extracted: informationExtracted,
      model,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "不明なエラー");
    throw new NovelAIApiError(
      `Novel AI vibe エンコードエラー (${response.status}): ${errorText}`,
      response.status
    );
  }

  // レスポンスはバイナリ vibe データ（約 48KB）。base64 化して返す。
  const arrayBuffer = await response.arrayBuffer();
  const encoded = Buffer.from(arrayBuffer).toString("base64");

  // FIFO eviction: 上限を超えたら最古のエントリを削除
  if (vibeCache.size >= VIBE_CACHE_MAX_SIZE) {
    const oldestKey = vibeCache.keys().next().value;
    if (oldestKey !== undefined) vibeCache.delete(oldestKey);
  }
  vibeCache.set(cacheKey, encoded);

  return encoded;
}

/** Novel AI の画像生成APIを呼び出す（ストリームエンドポイント） */
export async function generateImage(
  params: ImageGenerateParams,
  token: string
): Promise<string[]> {
  // V4 Curated は raw base64 画像を受け付けず、事前に /ai/encode-vibe で
  // エンコードした vibe token を渡す必要がある。
  let effectiveParams = params;
  if (
    VIBE_ENCODE_REQUIRED_MODELS.has(params.model) &&
    params.referenceImages &&
    params.referenceImages.length > 0
  ) {
    console.log(
      `=== Vibe エンコード開始 (${params.referenceImages.length}件) ===`
    );
    const encodedRefs = await Promise.all(
      params.referenceImages.map((ref) =>
        encodeVibe(ref.image, ref.informationExtracted, params.model, token)
      )
    );
    effectiveParams = {
      ...params,
      referenceImages: params.referenceImages.map((ref, i) => ({
        ...ref,
        image: encodedRefs[i],
      })),
    };
    console.log("=== Vibe エンコード完了 ===");
  }

  const body = buildRequestBody(effectiveParams);

  // デバッグ用: リクエストボディを出力
  console.log("=== Novel AI リクエスト ===");
  console.log(JSON.stringify(body, null, 2));
  console.log("===========================");

  const response = await fetch(`${NOVELAI_API_BASE}/ai/generate-image-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "不明なエラー");
    throw new NovelAIApiError(
      `Novel AI API エラー (${response.status}): ${errorText}`,
      response.status
    );
  }

  // ストリームからすべてのチャンクを読み取る
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  console.log("=== レスポンスデバッグ ===");
  console.log("レスポンスサイズ:", uint8Array.length, "bytes");
  console.log("========================");

  // msgpack をデコードして画像を抽出
  // フォーマット: [4バイト長さ][msgpackデータ] の繰り返し
  const images: string[] = [];
  let streamError: Record<string, unknown> | null = null;
  let offset = 0;

  try {
    while (offset < uint8Array.length) {
      // 4バイトの長さプレフィックスを読み取る (big-endian)
      if (offset + 4 > uint8Array.length) break;

      const length =
        (uint8Array[offset] << 24) |
        (uint8Array[offset + 1] << 16) |
        (uint8Array[offset + 2] << 8) |
        uint8Array[offset + 3];
      offset += 4;

      if (offset + length > uint8Array.length) {
        console.warn("不完全なチャンク、スキップ");
        break;
      }

      // msgpack データをデコード
      const chunk = uint8Array.slice(offset, offset + length);
      offset += length;

      // decodeMulti の最初の結果を取得
      for (const decoded of decodeMulti(chunk)) {
        const message = decoded as MsgpackStreamResponse;
        console.log("イベントタイプ:", message.event_type);

        // error イベントは API 側からの失敗通知。最初のエラーを保持する。
        if (message.event_type === "error" && !streamError) {
          // event_type と image (バイナリ) 以外のフィールドを抽出して原因を可視化
          const errorPayload = { ...(decoded as Record<string, unknown>) };
          delete errorPayload.event_type;
          delete errorPayload.image;
          // 原因切り分けのため、エラーと同じブロックに送信したリクエスト本体も出す。
          // (NovelAI の "Internal Server Error" は内容が薄いため request 本体を見ないと特定できない)
          console.error("=== NovelAI ストリームエラー: 送信リクエスト ===");
          console.error(JSON.stringify(body, null, 2));
          console.error("=== NovelAI ストリームエラー: イベント ===");
          console.error(JSON.stringify(errorPayload, null, 2));
          console.error("================================================");
          streamError = errorPayload;
        }

        // 最終画像イベントを取得 (final または newImage)
        if (
          (message.event_type === "final" ||
            message.event_type === "newImage") &&
          message.image
        ) {
          // バイナリを Base64 に変換
          const base64 = Buffer.from(message.image).toString("base64");
          images.push(base64);
          console.log("画像を取得:", base64.substring(0, 50) + "...");
        }
        break; // 各チャンクは1つのメッセージのみ
      }
    }
  } catch (e) {
    console.error("msgpack デコードエラー:", e);
    throw new NovelAIApiError("レスポンスのデコードに失敗しました", 500);
  }

  if (images.length === 0) {
    // ストリームに error イベントが含まれていた場合は、そのメッセージを優先して伝える
    if (streamError) {
      const detail =
        typeof streamError.message === "string"
          ? streamError.message
          : typeof streamError.error === "string"
            ? streamError.error
            : JSON.stringify(streamError);
      // status は HTTP 200 で返ってきた中の error イベントなので、便宜上 500 扱い
      throw new NovelAIApiError(`NovelAI エラー: ${detail}`, 500);
    }
    throw new NovelAIApiError("画像データが見つかりませんでした", 500);
  }

  return images;
}
