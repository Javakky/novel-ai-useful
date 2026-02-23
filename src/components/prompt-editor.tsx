"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Plus, Save, FolderPlus, Trash2, ChevronDown, ChevronUp, X, CheckCircle } from "lucide-react";
import type { PromptPreset } from "@/types/app";

export function PromptEditor() {
  const {
    generateParams,
    setGenerateParams,
    presets,
    addPreset,
    updatePreset,
    deletePreset,
    groups,
    addGroup,
    deleteGroup,
    getGroupPrompt,
    appliedPresetIds,
    applyPreset,
    removeAppliedPreset,
    clearAppliedPresets,
  } = useAppStore();

  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PromptPreset | null>(null);
  const [presetName, setPresetName] = useState("");
  const [presetPrompt, setPresetPrompt] = useState("");
  const [presetNegPrompt, setPresetNegPrompt] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  const handleSavePreset = () => {
    if (!presetName.trim() || !presetPrompt.trim()) return;
    if (editingPreset) {
      updatePreset(editingPreset.id, {
        name: presetName,
        prompt: presetPrompt,
        negativePrompt: presetNegPrompt,
        description: presetDescription,
      });
    } else {
      addPreset(presetName, presetPrompt, presetNegPrompt, presetDescription);
    }
    resetPresetForm();
  };

  const handleEditPreset = (preset: PromptPreset) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setPresetPrompt(preset.prompt);
    setPresetNegPrompt(preset.negativePrompt ?? "");
    setPresetDescription(preset.description ?? "");
    setShowPresetModal(true);
  };

  const resetPresetForm = () => {
    setShowPresetModal(false);
    setEditingPreset(null);
    setPresetName("");
    setPresetPrompt("");
    setPresetNegPrompt("");
    setPresetDescription("");
  };

  const handleSaveGroup = () => {
    if (!groupName.trim() || selectedPresetIds.length === 0) return;
    addGroup(groupName, selectedPresetIds);
    setShowGroupModal(false);
    setGroupName("");
    setSelectedPresetIds([]);
  };

  const handleTogglePreset = (id: string) => {
    if (appliedPresetIds.includes(id)) {
      removeAppliedPreset(id);
    } else {
      applyPreset(id);
    }
  };

  const handleApplyGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    // グループ内の全プリセットを適用
    group.presetIds.forEach((presetId) => {
      if (!appliedPresetIds.includes(presetId)) {
        applyPreset(presetId);
      }
    });
  };

  // 適用中のプリセット情報を取得
  const appliedPresets = appliedPresetIds
    .map((id) => presets.find((p) => p.id === id))
    .filter((p): p is PromptPreset => p !== undefined);

  const togglePresetSelection = (id: string) => {
    setSelectedPresetIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Card title="プロンプト">
        <div className="flex flex-col gap-3">
          <Textarea
            id="prompt"
            label="プロンプト"
            value={generateParams.prompt}
            onChange={(e) => setGenerateParams({ prompt: e.target.value })}
            placeholder="1girl, masterpiece, best quality..."
            rows={4}
          />
          <Textarea
            id="negative-prompt"
            label="ネガティブプロンプト"
            value={generateParams.negativePrompt}
            onChange={(e) =>
              setGenerateParams({ negativePrompt: e.target.value })
            }
            placeholder="lowres, bad anatomy..."
            rows={3}
          />
        </div>
      </Card>

      {/* プリセット管理 */}
      <Card>
        <div className="flex flex-col gap-3">
          {/* 適用中のプリセット表示 */}
          {appliedPresets.length > 0 && (
            <div className="rounded-md border border-green-500/50 bg-green-500/10 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                  <CheckCircle size={14} />
                  適用中のプリセット ({appliedPresets.length})
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAppliedPresets}
                  className="text-red-400 hover:text-red-300"
                >
                  <X size={14} className="mr-1" />
                  全解除
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {appliedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-300"
                  >
                    <span className="truncate max-w-[150px]">{preset.name}</span>
                    <button
                      onClick={() => removeAppliedPreset(preset.id)}
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
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1 text-sm font-semibold text-nai-text"
            >
              プロンプトプリセット ({presets.length})
              {showPresets ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPresetModal(true)}
            >
              <Plus size={14} className="mr-1" />
              追加
            </Button>
          </div>

          {showPresets && (
            <div className="flex flex-col gap-2">
              {presets.length === 0 ? (
                <p className="text-xs text-nai-muted">
                  プリセットがありません。「追加」ボタンで作成してください。
                </p>
              ) : (
                presets.map((preset) => {
                  const isApplied = appliedPresetIds.includes(preset.id);
                  return (
                    <div
                      key={preset.id}
                      className={`flex items-center gap-2 rounded-md border p-2 ${
                        isApplied
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-nai-primary"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-nai-text truncate">
                          {preset.name}
                        </p>
                        <p className="text-xs text-nai-muted truncate">
                          {preset.prompt}
                        </p>
                        {preset.negativePrompt && (
                          <p className="text-xs text-red-400/70 truncate">
                            NG: {preset.negativePrompt}
                          </p>
                        )}
                      </div>
                      <Button
                        variant={isApplied ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleTogglePreset(preset.id)}
                      >
                        {isApplied ? "解除" : "適用"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPreset(preset)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(preset.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </Card>

      {/* グループ管理 */}
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowGroups(!showGroups)}
              className="flex items-center gap-1 text-sm font-semibold text-nai-text"
            >
              プロンプトグループ ({groups.length})
              {showGroups ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGroupModal(true)}
              disabled={presets.length === 0}
            >
              <FolderPlus size={14} className="mr-1" />
              追加
            </Button>
          </div>

          {showGroups && (
            <div className="flex flex-col gap-2">
              {groups.length === 0 ? (
                <p className="text-xs text-nai-muted">
                  グループがありません。プリセットを複数作成してからグループ化できます。
                </p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-2 rounded-md border border-nai-primary p-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-nai-text">
                        {group.name}
                      </p>
                      <p className="text-xs text-nai-muted truncate">
                        {group.presetIds.length} 個のプリセット
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApplyGroup(group.id)}
                    >
                      適用
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGroup(group.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>

      {/* プリセット追加/編集モーダル */}
      <Modal
        isOpen={showPresetModal}
        onClose={resetPresetForm}
        title={editingPreset ? "プリセット編集" : "プリセット追加"}
      >
        <div className="flex flex-col gap-3">
          <Input
            label="プリセット名"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="例: アニメ塗り"
          />
          <Textarea
            label="プロンプト"
            value={presetPrompt}
            onChange={(e) => setPresetPrompt(e.target.value)}
            placeholder="例: anime-style, cel-shading..."
            rows={4}
          />
          <Textarea
            label="ネガティブプロンプト（任意）"
            value={presetNegPrompt}
            onChange={(e) => setPresetNegPrompt(e.target.value)}
            placeholder="例: lowres, bad anatomy..."
            rows={2}
          />
          <Input
            label="説明（任意）"
            value={presetDescription}
            onChange={(e) => setPresetDescription(e.target.value)}
            placeholder="このプリセットの説明..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={resetPresetForm}>
              キャンセル
            </Button>
            <Button onClick={handleSavePreset}>
              <Save size={14} className="mr-1" />
              保存
            </Button>
          </div>
        </div>
      </Modal>

      {/* グループ作成モーダル */}
      <Modal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="グループ作成"
      >
        <div className="flex flex-col gap-3">
          <Input
            label="グループ名"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="例: 立ちバック + アニメ塗り"
          />
          <div>
            <p className="mb-2 text-sm text-nai-muted">
              含めるプリセットを選択:
            </p>
            <div className="flex flex-col gap-1">
              {presets.map((preset) => (
                <label
                  key={preset.id}
                  className="flex items-center gap-2 rounded-md p-2 hover:bg-nai-primary/30"
                >
                  <input
                    type="checkbox"
                    checked={selectedPresetIds.includes(preset.id)}
                    onChange={() => togglePresetSelection(preset.id)}
                    className="accent-nai-accent"
                  />
                  <span className="text-sm text-nai-text">{preset.name}</span>
                  <span className="text-xs text-nai-muted truncate">
                    - {preset.prompt}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowGroupModal(false)}
            >
              キャンセル
            </Button>
            <Button onClick={handleSaveGroup}>
              <FolderPlus size={14} className="mr-1" />
              作成
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
