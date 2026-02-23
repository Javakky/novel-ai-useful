"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Modal } from "@/components/ui/modal";
import { Plus, Trash2, Edit, X, CheckCircle } from "lucide-react";
import type { CharacterDefinition } from "@/types/app";

export function CharacterPrompts() {
  const {
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    generateParams,
    appliedCharacterIds,
    applyCharacter,
    removeAppliedCharacter,
    clearAppliedCharacters,
  } = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [editingChar, setEditingChar] = useState<CharacterDefinition | null>(
    null
  );
  const [charName, setCharName] = useState("");
  const [charPrompt, setCharPrompt] = useState("");
  const [charNegPrompt, setCharNegPrompt] = useState("");
  const [charX, setCharX] = useState(0.5);
  const [charY, setCharY] = useState(0.5);

  const handleSave = () => {
    if (!charName.trim() || !charPrompt.trim()) return;
    if (editingChar) {
      updateCharacter(editingChar.id, {
        name: charName,
        prompt: charPrompt,
        negativePrompt: charNegPrompt,
        position: { x: charX, y: charY },
      });
    } else {
      const id = addCharacter(charName, charPrompt, charNegPrompt);
      updateCharacter(id, { position: { x: charX, y: charY } });
    }
    resetForm();
  };

  const handleEdit = (char: CharacterDefinition) => {
    setEditingChar(char);
    setCharName(char.name);
    setCharPrompt(char.prompt);
    setCharNegPrompt(char.negativePrompt);
    setCharX(char.position?.x ?? 0.5);
    setCharY(char.position?.y ?? 0.5);
    setShowModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingChar(null);
    setCharName("");
    setCharPrompt("");
    setCharNegPrompt("");
    setCharX(0.5);
    setCharY(0.5);
  };

  const handleToggleCharacter = (id: string) => {
    if (appliedCharacterIds.includes(id)) {
      removeAppliedCharacter(id);
    } else {
      applyCharacter(id);
    }
  };

  // 適用中のキャラクター情報を取得
  const appliedCharacters = appliedCharacterIds
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is CharacterDefinition => c !== undefined);

  const isV4 = generateParams.model.includes("diffusion-4");

  return (
    <Card title="キャラクタープロンプト">
      <div className="flex flex-col gap-3">
        {/* 適用中のキャラクター表示 */}
        {appliedCharacters.length > 0 && (
          <div className="rounded-md border border-green-500/50 bg-green-500/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                <CheckCircle size={14} />
                適用中のキャラクター ({appliedCharacters.length})
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAppliedCharacters}
                className="text-red-400 hover:text-red-300"
              >
                <X size={14} className="mr-1" />
                全解除
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {appliedCharacters.map((char) => (
                <div
                  key={char.id}
                  className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-300"
                >
                  <span className="truncate max-w-[150px]">{char.name}</span>
                  <button
                    onClick={() => removeAppliedCharacter(char.id)}
                    className="ml-1 hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-nai-muted">
            {isV4 ? "V4モデルで複数キャラクターの描き分けに対応" : "V3モデルではプロンプトに結合されます"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} className="mr-1" />
            追加
          </Button>
        </div>

        {characters.length === 0 ? (
          <p className="text-xs text-nai-muted">
            キャラクターが未定義です。「追加」ボタンでキャラクターを定義してください。
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {characters.map((char) => {
              const isApplied = appliedCharacterIds.includes(char.id);
              return (
                <div
                  key={char.id}
                  className={`flex items-start gap-2 rounded-md border p-2 ${
                    isApplied
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-nai-primary"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-nai-text">
                      {char.name}
                    </p>
                    <p className="text-xs text-nai-muted truncate">
                      {char.prompt}
                    </p>
                    {char.negativePrompt && (
                      <p className="text-xs text-red-400/70 truncate">
                        NG: {char.negativePrompt}
                      </p>
                    )}
                    {char.position && (
                      <p className="text-xs text-nai-muted">
                        位置: ({char.position.x.toFixed(2)},{" "}
                        {char.position.y.toFixed(2)})
                      </p>
                    )}
                  </div>
                  <Button
                    variant={isApplied ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleCharacter(char.id)}
                  >
                    {isApplied ? "解除" : "適用"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(char)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCharacter(char.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingChar ? "キャラクター編集" : "キャラクター追加"}
      >
        <div className="flex flex-col gap-3">
          <Input
            label="キャラクター名"
            value={charName}
            onChange={(e) => setCharName(e.target.value)}
            placeholder="例: キャラA"
          />
          <Textarea
            label="プロンプト"
            value={charPrompt}
            onChange={(e) => setCharPrompt(e.target.value)}
            placeholder="例: long red hair, blue eyes, school uniform"
            rows={3}
          />
          <Textarea
            label="ネガティブプロンプト"
            value={charNegPrompt}
            onChange={(e) => setCharNegPrompt(e.target.value)}
            placeholder="例: lowres, bad anatomy"
            rows={2}
          />
          <Slider
            label="X座標"
            value={charX}
            min={0}
            max={1}
            step={0.01}
            onChange={setCharX}
          />
          <Slider
            label="Y座標"
            value={charY}
            min={0}
            max={1}
            step={0.01}
            onChange={setCharY}
          />
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
