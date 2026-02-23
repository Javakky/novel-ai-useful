"use client";

import { useState, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Plus, Trash2, Zap, ImageIcon } from "lucide-react";
import { fileToBase64 } from "@/lib/utils";
import type { ReferenceImage } from "@/types/novelai";

export function VibeTransfer() {
  const {
    vibeConfigs,
    addVibeConfig,
    updateVibeConfig,
    deleteVibeConfig,
    generateParams,
    setGenerateParams,
    results,
    selectedResultId,
  } = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [configName, setConfigName] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [infoExtracted, setInfoExtracted] = useState(1.0);
  const [refStrength, setRefStrength] = useState(0.6);
  const [autoApply, setAutoApply] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setImageBase64(base64);
  };

  const handleSave = () => {
    if (!configName.trim() || !imageBase64) return;
    addVibeConfig({
      name: configName,
      referenceImage: {
        image: imageBase64,
        informationExtracted: infoExtracted,
        referenceStrength: refStrength,
      },
      autoApply,
    });
    resetForm();
  };

  const resetForm = () => {
    setShowModal(false);
    setConfigName("");
    setImageBase64("");
    setInfoExtracted(1.0);
    setRefStrength(0.6);
    setAutoApply(false);
  };

  const handleApplyConfig = (configId: string) => {
    const config = vibeConfigs.find((v) => v.id === configId);
    if (!config || !config.referenceImage.image) return;

    const currentRefs = generateParams.referenceImages ?? [];
    setGenerateParams({
      referenceImages: [...currentRefs, config.referenceImage],
    });
  };

  const handleApplyAll = () => {
    const autoConfigs = vibeConfigs.filter(
      (v) => v.autoApply && v.referenceImage.image
    );
    if (autoConfigs.length === 0) return;

    setGenerateParams({
      referenceImages: autoConfigs.map((v) => v.referenceImage),
    });
  };

  const handleUseResultAsReference = () => {
    if (!selectedResultId) return;
    const result = results.find((r) => r.id === selectedResultId);
    if (!result) return;

    const ref: ReferenceImage = {
      image: result.imageBase64,
      informationExtracted: 1.0,
      referenceStrength: 0.6,
    };
    const currentRefs = generateParams.referenceImages ?? [];
    setGenerateParams({
      referenceImages: [...currentRefs, ref],
    });
  };

  const handleClearReferences = () => {
    setGenerateParams({ referenceImages: [] });
  };

  const currentRefs = generateParams.referenceImages ?? [];

  return (
    <Card title="Vibe Transfer / リファレンス画像">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-nai-muted">
          参照画像のスタイルや雰囲気を生成画像に反映します
        </p>

        {/* 現在のリファレンス画像 */}
        {currentRefs.length > 0 && (
          <div className="rounded-md border border-nai-primary p-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-nai-text">
                適用中のリファレンス: {currentRefs.length}枚
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearReferences}
              >
                クリア
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {currentRefs.map((ref, i) => (
                <div key={i} className="flex-shrink-0">
                  {ref.image && (
                    <img
                      src={`data:image/png;base64,${ref.image}`}
                      alt={`リファレンス ${i + 1}`}
                      className="h-16 w-16 rounded object-cover"
                    />
                  )}
                  <p className="text-xs text-nai-muted mt-1">
                    抽出: {ref.informationExtracted} / 強度:{" "}
                    {ref.referenceStrength}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} className="mr-1" />
            マスター画像追加
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleApplyAll}
            disabled={vibeConfigs.filter((v) => v.autoApply).length === 0}
          >
            <Zap size={14} className="mr-1" />
            自動適用
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUseResultAsReference}
            disabled={!selectedResultId}
          >
            <ImageIcon size={14} className="mr-1" />
            選択画像をリファレンスに
          </Button>
        </div>

        {/* マスター画像一覧 */}
        {vibeConfigs.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-nai-muted font-medium">
              マスター画像一覧:
            </p>
            {vibeConfigs.map((config) => (
              <div
                key={config.id}
                className="flex items-center gap-2 rounded-md border border-nai-primary p-2"
              >
                {config.referenceImage.image && (
                  <img
                    src={`data:image/png;base64,${config.referenceImage.image}`}
                    alt={config.name}
                    className="h-12 w-12 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-nai-text">{config.name}</p>
                  <p className="text-xs text-nai-muted">
                    {config.autoApply ? "自動適用: ON" : "自動適用: OFF"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApplyConfig(config.id)}
                >
                  適用
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateVibeConfig(config.id, {
                      autoApply: !config.autoApply,
                    })
                  }
                >
                  {config.autoApply ? "OFF" : "ON"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteVibeConfig(config.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* マスター画像追加モーダル */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title="マスター画像追加"
      >
        <div className="flex flex-col gap-3">
          <Input
            label="設定名"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            placeholder="例: 統一画風リファレンス"
          />
          <div>
            <p className="mb-1 text-sm text-nai-muted">画像</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="text-sm text-nai-text file:mr-3 file:rounded-md file:border-0 file:bg-nai-primary file:px-3 file:py-1.5 file:text-sm file:text-nai-text hover:file:bg-nai-primary/80"
            />
            {imageBase64 && (
              <img
                src={`data:image/png;base64,${imageBase64}`}
                alt="プレビュー"
                className="mt-2 h-32 rounded object-contain"
              />
            )}
          </div>
          <Slider
            label="情報抽出量"
            value={infoExtracted}
            min={0}
            max={1}
            step={0.01}
            onChange={setInfoExtracted}
          />
          <Slider
            label="参照強度"
            value={refStrength}
            min={0}
            max={1}
            step={0.01}
            onChange={setRefStrength}
          />
          <label className="flex items-center gap-2 text-sm text-nai-text">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="accent-nai-accent"
            />
            自動適用する
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={resetForm}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
