/**
 * 画像生成 API Route
 *
 * クライアントからの生成リクエストを受け取り、
 * Novel AI API にプロキシする。
 * トークンはリクエストヘッダーから取得する。
 */

import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/novelai-client";
import { extractImagesFromZip } from "@/lib/zip-utils";
import type { ImageGenerateParams } from "@/types/novelai";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-nai-token");
    if (!token) {
      return NextResponse.json(
        { error: "APIトークンが設定されていません" },
        { status: 401 }
      );
    }

    const params: ImageGenerateParams = await request.json();

    // バリデーション
    if (!params.prompt && !params.v4Prompt) {
      return NextResponse.json(
        { error: "プロンプトが空です" },
        { status: 400 }
      );
    }

    if (params.width < 64 || params.height < 64) {
      return NextResponse.json(
        { error: "画像サイズが小さすぎます" },
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
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    console.error("画像生成エラー:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
