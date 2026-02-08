"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { base64ToBlob } from "@/lib/utils";
import type { ExportMetadata } from "@/types/app";

export function ExportPanel() {
  const { results, characters } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (results.length === 0) return;

    setIsExporting(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // キャラクターIDから名前へのマップ
      const charMap = new Map(characters.map((c) => [c.id, c.name]));

      for (const result of results) {
        // キャラクターごとにフォルダ分け
        const charIds = result.characterIds ?? [];
        const folderName =
          charIds.length > 0
            ? charIds
                .map((id) => charMap.get(id) ?? "unknown")
                .join("_")
            : "general";

        const folder = zip.folder(folderName)!;

        // 画像ファイル
        const imageBlob = base64ToBlob(result.imageBase64);
        folder.file(`${result.id}.png`, imageBlob);

        // メタデータ
        const metadata: ExportMetadata = {
          characterName: charIds
            .map((id) => charMap.get(id))
            .filter(Boolean)
            .join(", ") || undefined,
          prompt: result.params.prompt,
          negativePrompt: result.params.negativePrompt,
          model: result.params.model,
          seed: result.params.seed,
          size: {
            width: result.params.width,
            height: result.params.height,
          },
          referenceImages: result.params.referenceImages?.map((ref) => ({
            informationExtracted: ref.informationExtracted,
            referenceStrength: ref.referenceStrength,
          })),
          generatedAt: result.createdAt,
        };

        folder.file(
          `${result.id}_meta.json`,
          JSON.stringify(metadata, null, 2)
        );
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nai-export-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("エクスポートエラー:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card title="エクスポート">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-nai-muted">
          生成した画像をキャラクターごとにフォルダ分けし、メタデータ付きでZIPファイルとしてエクスポートします。
        </p>
        <Button
          onClick={handleExport}
          disabled={results.length === 0 || isExporting}
          variant="secondary"
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              エクスポート中...
            </>
          ) : (
            <>
              <Download size={16} className="mr-2" />
              エクスポート ({results.length}枚)
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
