/**
 * 画像生成 API Route
 *
 * クライアントからの生成リクエストを受け取り、
 * Novel AI API にプロキシする。
 * トークンはリクエストヘッダーから取得する。
 */

import { NextRequest, NextResponse } from "next/server";
import { generateImage, NovelAIApiError } from "@/lib/novelai-client";
import { extractImagesFromZip } from "@/lib/zip-utils";
import type { ImageGenerateParams } from "@/types/novelai";

/** Novel AI API のステータスコードのうち、クライアントに伝播するもの */
const PROPAGATED_STATUS_CODES = new Set([400, 401, 402, 403, 429]);

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-nai-token");
    if (!token) {
      return NextResponse.json(
        { error: "APIトークンが設定されていません" },
        { status: 401 }
      );
    }

    // リクエストボディのパース
    let params: ImageGenerateParams;
    try {
      params = await request.json();
    } catch {
      return NextResponse.json(
        { error: "リクエストボディが不正です" },
        { status: 400 }
      );
    }

    // バリデーション
    if (!params.prompt && !params.v4Prompt) {
      return NextResponse.json(
        { error: "プロンプトが空です" },
        { status: 400 }
      );
    }

    if (
      typeof params.width !== "number" ||
      typeof params.height !== "number" ||
      params.width < 64 ||
      params.height < 64
    ) {
      return NextResponse.json(
        { error: "画像サイズが不正です（64以上の数値を指定してください）" },
        { status: 400 }
      );
    }

    if (params.width > 1920 || params.height > 1920) {
      return NextResponse.json(
        { error: "画像サイズが大きすぎます（最大1920）" },
        { status: 400 }
      );
    }

    // Novel AI API 呼び出し
    const zipData = await generateImage(params, token);

    // ZIP から画像を抽出
    const images = await extractImagesFromZip(zipData);

    if (images.length === 0) {
      return NextResponse.json(
        { error: "画像の生成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ images });
  } catch (error) {
    // Novel AI API のエラーはステータスコードを伝播
    if (error instanceof NovelAIApiError) {
      const statusCode = PROPAGATED_STATUS_CODES.has(error.statusCode)
        ? error.statusCode
        : 500;
      // クライアントに返すメッセージはステータスコードに応じて決定
      const clientMessage = getClientErrorMessage(error.statusCode);
      console.error("Novel AI API エラー:", error.message);
      return NextResponse.json(
        { error: clientMessage },
        { status: statusCode }
      );
    }

    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    console.error("画像生成エラー:", message);
    return NextResponse.json(
      { error: "画像生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

/** ステータスコードに応じたクライアント向けエラーメッセージ */
function getClientErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "リクエストが不正です";
    case 401:
      return "APIトークンが無効です";
    case 402:
      return "Anlas（ポイント）が不足しています";
    case 403:
      return "このモデルへのアクセス権限がありません";
    case 429:
      return "リクエストが多すぎます。しばらく待ってから再試行してください";
    default:
      return "画像生成中にエラーが発生しました";
  }
}
