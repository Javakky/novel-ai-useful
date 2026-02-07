"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Modal } from "@/components/ui/modal";
import { Plus, Trash2, Edit, Users } from "lucide-react";
import type { CharacterDefinition } from "@/types/app";
import type { V4Prompt } from "@/types/novelai";

export function CharacterPrompts() {
  const {
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    generateParams,
    setGenerateParams,
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

  const handleApplyCharacters = () => {
    if (characters.length === 0) return;

    const isV4 = generateParams.model.includes("diffusion-4");
    if (!isV4) {
      // V3: キャラクタープロンプトを通常のプロンプトに結合
      const charPrompts = characters.map((c) => c.prompt).join(", ");
      const currentPrompt = generateParams.prompt;
      setGenerateParams({
        prompt: currentPrompt ? `${currentPrompt}, ${charPrompts}` : charPrompts,
      });
      return;
    }

    // V4: キャラクタープロンプト構造を構築
    const v4Prompt: V4Prompt = {
      caption: {
        base_caption: generateParams.prompt,
        char_captions: characters.map((c) => ({
          char_caption: c.prompt,
          centers: c.position ? [{ x: c.position.x, y: c.position.y }] : undefined,
        })),
      },
      use_coords: characters.some((c) => c.position !== undefined),
      use_order: true,
    };

    const v4NegativePrompt = {
      caption: {
        base_caption: generateParams.negativePrompt,
        char_captions: characters.map((c) => ({
          char_caption: c.negativePrompt || "lowres",
        })),
      },
    };

    setGenerateParams({ v4Prompt, v4NegativePrompt });
  };

  return (
    <Card title="キャラクタープロンプト">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-nai-muted">
            V4モデルで複数キャラクターの描き分けに対応
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleApplyCharacters}
              disabled={characters.length === 0}
            >
              <Users size={14} className="mr-1" />
              適用
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
            >
              <Plus size={14} className="mr-1" />
              追加
            </Button>
          </div>
        </div>

        {characters.length === 0 ? (
          <p className="text-xs text-nai-muted">
            キャラクターが未定義です。「追加」ボタンでキャラクターを定義してください。
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {characters.map((char) => (
              <div
                key={char.id}
                className="flex items-start gap-2 rounded-md border border-nai-primary p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-nai-text">
                    {char.name}
                  </p>
                  <p className="text-xs text-nai-muted truncate">
                    {char.prompt}
                  </p>
                  {char.position && (
                    <p className="text-xs text-nai-muted">
                      位置: ({char.position.x.toFixed(2)},{" "}
                      {char.position.y.toFixed(2)})
                    </p>
                  )}
                </div>
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
            ))}
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
