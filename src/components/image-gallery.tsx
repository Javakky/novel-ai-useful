"use client";

import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Check, ImageIcon, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageGallery() {
  const {
    results,
    deleteResult,
    clearResults,
    selectedResultId,
    setSelectedResultId,
    setGenerateParams,
  } = useAppStore();

  const handleDownload = (result: (typeof results)[0]) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${result.imageBase64}`;
    link.download = `nai-${result.id}.png`;
    link.click();
  };

  const handleUseAsImg2img = (result: (typeof results)[0]) => {
    setGenerateParams({
      action: "img2img",
      image: result.imageBase64,
      strength: 0.7,
      noise: 0.0,
    });
  };

  const handleCopyParams = (result: (typeof results)[0]) => {
    setGenerateParams({
      prompt: result.params.prompt,
      negativePrompt: result.params.negativePrompt,
      model: result.params.model,
      width: result.params.width,
      height: result.params.height,
      scale: result.params.scale,
      sampler: result.params.sampler,
      steps: result.params.steps,
      seed: result.params.seed,
    });
  };

  if (results.length === 0) {
    return (
      <Card title="生成結果">
        <div className="flex flex-col items-center justify-center py-12 text-nai-muted">
          <ImageIcon size={48} className="mb-3 opacity-30" />
          <p className="text-sm">生成された画像がここに表示されます</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-nai-text">
          生成結果 ({results.length})
        </h3>
        <Button variant="danger" size="sm" onClick={clearResults}>
          <Trash2 size={14} className="mr-1" />
          全削除
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((result) => (
          <div
            key={result.id}
            className={cn(
              "group relative cursor-pointer rounded-lg border-2 overflow-hidden transition-colors",
              selectedResultId === result.id
                ? "border-nai-accent"
                : "border-transparent hover:border-nai-primary"
            )}
            onClick={() =>
              setSelectedResultId(
                selectedResultId === result.id ? null : result.id
              )
            }
          >
            <img
              src={`data:image/png;base64,${result.imageBase64}`}
              alt={`生成画像 ${result.id}`}
              className="w-full aspect-[3/4] object-cover"
            />
            {selectedResultId === result.id && (
              <div className="absolute top-1 right-1 rounded-full bg-nai-accent p-1">
                <Check size={12} className="text-white" />
              </div>
            )}

            {/* ホバーオーバーレイ */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(result);
                  }}
                >
                  <Download size={14} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyParams(result);
                  }}
                  title="パラメータをコピー"
                >
                  <Copy size={14} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseAsImg2img(result);
                  }}
                  title="別バージョンを作成"
                >
                  <ImageIcon size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteResult(result.id);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <p className="text-xs text-white mt-1">
                {result.params.width}x{result.params.height}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
