"use client";

import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertCircle, Info, Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { buildRequestBody } from "@/lib/novelai-client";
import { buildMergedParams as mergeParams } from "@/lib/merge-params";
import type { ImageGenerateParams } from "@/types/novelai";

export function GenerateButton() {
  const {
    apiToken,
    generateParams,
    isGenerating,
    setIsGenerating,
    addResult,
    vibeConfigs,
    getAppliedPresetsPrompt,
    getAppliedPresetsNegativePrompt,
    appliedPresetIds,
    appliedCharacterIds,
    getAppliedCharacters,
  } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 統合パラメータを構築する共通関数
  const buildMergedParams = useCallback((): ImageGenerateParams => {
    return mergeParams({
      generateParams,
      presetPrompt: getAppliedPresetsPrompt(),
      presetNegativePrompt: getAppliedPresetsNegativePrompt(),
      appliedCharacters: getAppliedCharacters(),
    });
  }, [generateParams, getAppliedPresetsPrompt, getAppliedPresetsNegativePrompt, getAppliedCharacters]);

  // 適用中のキャラクター数
  const appliedCharacterCount = appliedCharacterIds.length;

  // 適用中のプリセット数
  const appliedPresetCount = appliedPresetIds.length;

  // 未適用のVibe Transferがあるかチェック
  const hasUnappliedVibes = vibeConfigs.some(
    (v) => v.autoApply && v.referenceImage.image
  ) && (!generateParams.referenceImages || generateParams.referenceImages.length === 0);

  // パラメータをJSONでコピー
  const handleCopyParams = async () => {
    try {
      const params = buildMergedParams();
      const requestBody = buildRequestBody(params);
      await navigator.clipboard.writeText(JSON.stringify(requestBody, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("コピーに失敗しました");
    }
  };

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
      const params = buildMergedParams();

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
      {/* 未適用の警告 */}
      {hasUnappliedVibes && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-2 text-xs text-yellow-400">
          <AlertCircle size={14} />
          <span>Vibe Transfer が未適用です。</span>
        </div>
      )}

      {appliedPresetCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-blue-500/50 bg-blue-500/10 p-2 text-xs text-blue-400">
          <Info size={14} />
          <span>{appliedPresetCount} 個のプリセットが適用されます</span>
        </div>
      )}

      {appliedCharacterCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-purple-500/50 bg-purple-500/10 p-2 text-xs text-purple-400">
          <Info size={14} />
          <span>{appliedCharacterCount} 人のキャラクターが適用されます</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !apiToken}
          size="lg"
          className="flex-1"
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
        <Button
          onClick={handleCopyParams}
          variant="secondary"
          size="lg"
          title="統合パラメータをJSONでコピー"
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </Button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!apiToken && (
        <p className="text-xs text-nai-muted">
          APIトークンを設定してください
        </p>
      )}
    </div>
  );
}
