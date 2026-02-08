"use client";

import { TokenSetting } from "@/components/token-setting";
import { PromptEditor } from "@/components/prompt-editor";
import { GenerationSettings } from "@/components/generation-settings";
import { CharacterPrompts } from "@/components/character-prompts";
import { VibeTransfer } from "@/components/vibe-transfer";
import { GenerateButton } from "@/components/generate-button";
import { ImageGallery } from "@/components/image-gallery";
import { ExportPanel } from "@/components/export-panel";
import { Tabs } from "@/components/ui/tabs";
import { Palette } from "lucide-react";

export default function Home() {
  const tabs = [
    {
      id: "prompt",
      label: "プロンプト",
      content: <PromptEditor />,
    },
    {
      id: "character",
      label: "キャラクター",
      content: <CharacterPrompts />,
    },
    {
      id: "vibe",
      label: "Vibe Transfer",
      content: <VibeTransfer />,
    },
    {
      id: "settings",
      label: "生成設定",
      content: <GenerationSettings />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* ヘッダー */}
      <header className="border-b border-nai-primary bg-nai-surface px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Palette size={24} className="text-nai-accent" />
          <h1 className="text-lg font-bold text-nai-text">
            Novel AI イラスト生成ツール
          </h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4">
        {/* 左パネル: 設定 */}
        <div className="flex w-[400px] flex-shrink-0 flex-col gap-4 overflow-y-auto">
          <TokenSetting />
          <Tabs tabs={tabs} defaultTab="prompt" />
          <GenerateButton />
          <ExportPanel />
        </div>

        {/* 右パネル: 生成結果 */}
        <div className="flex-1 overflow-y-auto">
          <ImageGallery />
        </div>
      </main>
    </div>
  );
}
