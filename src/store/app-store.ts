/**
 * アプリケーション状態管理ストア (Zustand)
 *
 * プロンプトプリセット、キャラクター定義、生成結果などを管理する。
 * ローカルストレージに永続化する。
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ImageGenerateParams } from "@/types/novelai";
import type {
  PromptPreset,
  PromptGroup,
  CharacterDefinition,
  VibeTransferConfig,
  GenerationResult,
} from "@/types/app";
import { DEFAULT_GENERATE_PARAMS } from "@/types/app";
import { generateId, nowISO } from "@/lib/utils";

interface AppState {
  // 認証
  apiToken: string;
  setApiToken: (token: string) => void;

  // 生成パラメータ
  generateParams: ImageGenerateParams;
  setGenerateParams: (params: Partial<ImageGenerateParams>) => void;
  resetGenerateParams: () => void;

  // プロンプトプリセット
  presets: PromptPreset[];
  addPreset: (name: string, prompt: string, negativePrompt?: string, description?: string) => string;
  updatePreset: (
    id: string,
    updates: Partial<Omit<PromptPreset, "id" | "createdAt">>
  ) => void;
  deletePreset: (id: string) => void;

  // 適用中のプリセットID
  appliedPresetIds: string[];
  applyPreset: (id: string) => void;
  removeAppliedPreset: (id: string) => void;
  clearAppliedPresets: () => void;
  getAppliedPresetsPrompt: () => string;
  getAppliedPresetsNegativePrompt: () => string;

  // プロンプトグループ
  groups: PromptGroup[];
  addGroup: (name: string, presetIds: string[]) => string;
  updateGroup: (
    id: string,
    updates: Partial<Omit<PromptGroup, "id" | "createdAt">>
  ) => void;
  deleteGroup: (id: string) => void;
  getGroupPrompt: (groupId: string) => string;

  // キャラクター定義
  characters: CharacterDefinition[];
  addCharacter: (
    name: string,
    prompt: string,
    negativePrompt?: string
  ) => string;
  updateCharacter: (
    id: string,
    updates: Partial<Omit<CharacterDefinition, "id" | "createdAt">>
  ) => void;
  deleteCharacter: (id: string) => void;

  // 適用中のキャラクターID
  appliedCharacterIds: string[];
  applyCharacter: (id: string) => void;
  removeAppliedCharacter: (id: string) => void;
  clearAppliedCharacters: () => void;
  getAppliedCharacters: () => CharacterDefinition[];

  // Vibe Transfer 設定
  vibeConfigs: VibeTransferConfig[];
  addVibeConfig: (config: Omit<VibeTransferConfig, "id" | "createdAt">) => string;
  updateVibeConfig: (
    id: string,
    updates: Partial<Omit<VibeTransferConfig, "id" | "createdAt">>
  ) => void;
  deleteVibeConfig: (id: string) => void;

  // 生成結果
  results: GenerationResult[];
  addResult: (result: Omit<GenerationResult, "id" | "createdAt">) => string;
  deleteResult: (id: string) => void;
  clearResults: () => void;

  // 生成中フラグ
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;

  // 選択中の結果（リファレンスとして使用）
  selectedResultId: string | null;
  setSelectedResultId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 認証
      apiToken: "",
      setApiToken: (token) => set({ apiToken: token }),

      // 生成パラメータ
      generateParams: { ...DEFAULT_GENERATE_PARAMS },
      setGenerateParams: (params) =>
        set((state) => ({
          generateParams: { ...state.generateParams, ...params },
        })),
      resetGenerateParams: () =>
        set({ generateParams: { ...DEFAULT_GENERATE_PARAMS } }),

      // プロンプトプリセット
      presets: [],
      addPreset: (name, prompt, negativePrompt, description) => {
        const id = generateId();
        const now = nowISO();
        set((state) => ({
          presets: [
            ...state.presets,
            { id, name, prompt, negativePrompt, description, createdAt: now, updatedAt: now },
          ],
        }));
        return id;
      },
      updatePreset: (id, updates) =>
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: nowISO() } : p
          ),
        })),
      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
          // グループからも削除
          groups: state.groups.map((g) => ({
            ...g,
            presetIds: g.presetIds.filter((pid) => pid !== id),
          })),
          // 適用中からも削除
          appliedPresetIds: state.appliedPresetIds.filter((pid) => pid !== id),
        })),

      // 適用中のプリセット
      appliedPresetIds: [],
      applyPreset: (id) =>
        set((state) => ({
          appliedPresetIds: state.appliedPresetIds.includes(id)
            ? state.appliedPresetIds
            : [...state.appliedPresetIds, id],
        })),
      removeAppliedPreset: (id) =>
        set((state) => ({
          appliedPresetIds: state.appliedPresetIds.filter((pid) => pid !== id),
        })),
      clearAppliedPresets: () => set({ appliedPresetIds: [] }),
      getAppliedPresetsPrompt: () => {
        const state = get();
        return state.appliedPresetIds
          .map((id) => state.presets.find((p) => p.id === id)?.prompt ?? "")
          .filter(Boolean)
          .join(", ");
      },
      getAppliedPresetsNegativePrompt: () => {
        const state = get();
        return state.appliedPresetIds
          .map((id) => state.presets.find((p) => p.id === id)?.negativePrompt ?? "")
          .filter(Boolean)
          .join(", ");
      },

      // プロンプトグループ
      groups: [],
      addGroup: (name, presetIds) => {
        const id = generateId();
        const now = nowISO();
        set((state) => ({
          groups: [
            ...state.groups,
            { id, name, presetIds, createdAt: now, updatedAt: now },
          ],
        }));
        return id;
      },
      updateGroup: (id, updates) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === id ? { ...g, ...updates, updatedAt: nowISO() } : g
          ),
        })),
      deleteGroup: (id) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
        })),
      getGroupPrompt: (groupId) => {
        const state = get();
        const group = state.groups.find((g) => g.id === groupId);
        if (!group) return "";
        return group.presetIds
          .map((pid) => state.presets.find((p) => p.id === pid)?.prompt ?? "")
          .filter(Boolean)
          .join(", ");
      },

      // キャラクター定義
      characters: [],
      addCharacter: (name, prompt, negativePrompt = "") => {
        const id = generateId();
        const now = nowISO();
        set((state) => ({
          characters: [
            ...state.characters,
            {
              id,
              name,
              prompt,
              negativePrompt,
              createdAt: now,
              updatedAt: now,
            },
          ],
        }));
        return id;
      },
      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: nowISO() } : c
          ),
        })),
      deleteCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
          // 適用中からも削除
          appliedCharacterIds: state.appliedCharacterIds.filter((cid) => cid !== id),
        })),

      // 適用中のキャラクター
      appliedCharacterIds: [],
      applyCharacter: (id) =>
        set((state) => ({
          appliedCharacterIds: state.appliedCharacterIds.includes(id)
            ? state.appliedCharacterIds
            : [...state.appliedCharacterIds, id],
        })),
      removeAppliedCharacter: (id) =>
        set((state) => ({
          appliedCharacterIds: state.appliedCharacterIds.filter((cid) => cid !== id),
        })),
      clearAppliedCharacters: () => set({ appliedCharacterIds: [] }),
      getAppliedCharacters: () => {
        const state = get();
        return state.appliedCharacterIds
          .map((id) => state.characters.find((c) => c.id === id))
          .filter((c): c is CharacterDefinition => c !== undefined);
      },

      // Vibe Transfer 設定
      vibeConfigs: [],
      addVibeConfig: (config) => {
        const id = generateId();
        set((state) => ({
          vibeConfigs: [
            ...state.vibeConfigs,
            { ...config, id, createdAt: nowISO() },
          ],
        }));
        return id;
      },
      updateVibeConfig: (id, updates) =>
        set((state) => ({
          vibeConfigs: state.vibeConfigs.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        })),
      deleteVibeConfig: (id) =>
        set((state) => ({
          vibeConfigs: state.vibeConfigs.filter((v) => v.id !== id),
        })),

      // 生成結果
      results: [],
      addResult: (result) => {
        const id = generateId();
        set((state) => ({
          results: [
            { ...result, id, createdAt: nowISO() },
            ...state.results,
          ],
        }));
        return id;
      },
      deleteResult: (id) =>
        set((state) => ({
          results: state.results.filter((r) => r.id !== id),
        })),
      clearResults: () => set({ results: [] }),

      // 生成中フラグ
      isGenerating: false,
      setIsGenerating: (value) => set({ isGenerating: value }),

      // 選択中の結果
      selectedResultId: null,
      setSelectedResultId: (id) => set({ selectedResultId: id }),
    }),
    {
      name: "novel-ai-useful-store",
      // 画像データは巨大なので永続化から除外
      // シードは常に 0 にリセット（毎回ランダム生成するため）
      partialize: (state) => ({
        apiToken: state.apiToken,
        generateParams: { ...state.generateParams, seed: 0 },
        presets: state.presets,
        groups: state.groups,
        characters: state.characters,
        appliedPresetIds: state.appliedPresetIds,
        appliedCharacterIds: state.appliedCharacterIds,
        vibeConfigs: state.vibeConfigs.map((v) => ({
          ...v,
          referenceImage: {
            ...v.referenceImage,
            image: "", // 画像データは永続化しない
          },
        })),
      }),
    }
  )
);
