"use client";

import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

export function GenerateButton() {
  const {
    apiToken,
    generateParams,
    isGenerating,
    setIsGenerating,
    addResult,
    vibeConfigs,
  } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!apiToken) {
      setError("APIトークンが設定されていません");
      return;
    }

    if (!generateParams.prompt && !generateParams.v4Prompt) {
      setError("プロンプトを入力してください");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // 自動適用のVibe Transfer設定を追加
      let params = { ...generateParams };
      const autoVibes = vibeConfigs.filter(
        (v) => v.autoApply && v.referenceImage.image
      );
      if (autoVibes.length > 0 && (!params.referenceImages || params.referenceImages.length === 0)) {
        params = {
          ...params,
          referenceImages: autoVibes.map((v) => v.referenceImage),
        };
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-nai-token": apiToken,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成に失敗しました");
      }

      // 結果を保存
      for (const imageBase64 of data.images) {
        addResult({
          imageBase64,
          params: { ...generateParams },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !apiToken}
        size="lg"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 size={20} className="mr-2 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Sparkles size={20} className="mr-2" />
            画像を生成
          </>
        )}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!apiToken && (
        <p className="text-xs text-nai-muted">
          APIトークンを設定してください
        </p>
      )}
    </div>
  );
}
