"use client";

import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  MODEL_INFO,
  SAMPLER_INFO,
  SIZE_PRESETS,
  type NovelAIModel,
  type Sampler,
  type NoiseSchedule,
  type UCPreset,
} from "@/types/novelai";

export function GenerationSettings() {
  const { generateParams, setGenerateParams } = useAppStore();

  const modelOptions = Object.entries(MODEL_INFO).map(([value, info]) => ({
    value,
    label: info.label,
  }));

  const samplerOptions = Object.entries(SAMPLER_INFO).map(([value, info]) => ({
    value,
    label: info.label,
  }));

  const sizeOptions = SIZE_PRESETS.map((preset) => ({
    value: `${preset.width}x${preset.height}`,
    label: preset.label,
  }));

  const noiseScheduleOptions = [
    { value: "native", label: "Native" },
    { value: "karras", label: "Karras" },
    { value: "exponential", label: "Exponential" },
    { value: "polyexponential", label: "Polyexponential" },
  ];

  const ucPresetOptions = [
    { value: "0", label: "Heavy" },
    { value: "1", label: "Light" },
    { value: "2", label: "Human Focus" },
    { value: "3", label: "None" },
  ];

  const handleSizeChange = (value: string) => {
    const [w, h] = value.split("x").map(Number);
    setGenerateParams({ width: w, height: h });
  };

  return (
    <Card title="生成設定">
      <div className="flex flex-col gap-4">
        <Select
          label="モデル"
          options={modelOptions}
          value={generateParams.model}
          onChange={(e) =>
            setGenerateParams({
              model: e.target.value as NovelAIModel,
            })
          }
        />

        <Select
          label="サイズ"
          options={sizeOptions}
          value={`${generateParams.width}x${generateParams.height}`}
          onChange={(e) => handleSizeChange(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="サンプラー"
            options={samplerOptions}
            value={generateParams.sampler}
            onChange={(e) =>
              setGenerateParams({
                sampler: e.target.value as Sampler,
              })
            }
          />
          <Select
            label="ノイズスケジュール"
            options={noiseScheduleOptions}
            value={generateParams.noiseSchedule}
            onChange={(e) =>
              setGenerateParams({
                noiseSchedule: e.target.value as NoiseSchedule,
              })
            }
          />
        </div>

        <Slider
          label="ステップ数"
          value={generateParams.steps}
          min={1}
          max={50}
          step={1}
          onChange={(v) => setGenerateParams({ steps: v })}
        />

        <Slider
          label="CFG スケール"
          value={generateParams.scale}
          min={0}
          max={10}
          step={0.1}
          onChange={(v) => setGenerateParams({ scale: v })}
        />

        <Slider
          label="CFG リスケール"
          value={generateParams.cfgRescale}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => setGenerateParams({ cfgRescale: v })}
        />

        <Select
          label="UC プリセット"
          options={ucPresetOptions}
          value={String(generateParams.ucPreset)}
          onChange={(e) =>
            setGenerateParams({
              ucPreset: Number(e.target.value) as UCPreset,
            })
          }
        />

        <Slider
          label="生成枚数"
          value={generateParams.nSamples}
          min={1}
          max={8}
          step={1}
          onChange={(v) => setGenerateParams({ nSamples: v })}
        />

        <Slider
          label="シード (0 = ランダム)"
          value={generateParams.seed}
          min={0}
          max={9999999999}
          step={1}
          onChange={(v) => setGenerateParams({ seed: v })}
        />

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-nai-text">
            <input
              type="checkbox"
              checked={generateParams.qualityToggle}
              onChange={(e) =>
                setGenerateParams({ qualityToggle: e.target.checked })
              }
              className="accent-nai-accent"
            />
            品質タグ追加
          </label>

          <label className="flex items-center gap-2 text-sm text-nai-text">
            <input
              type="checkbox"
              checked={generateParams.smea}
              onChange={(e) =>
                setGenerateParams({ smea: e.target.checked })
              }
              className="accent-nai-accent"
            />
            SMEA
          </label>

          <label className="flex items-center gap-2 text-sm text-nai-text">
            <input
              type="checkbox"
              checked={generateParams.smeaDyn}
              onChange={(e) =>
                setGenerateParams({ smeaDyn: e.target.checked })
              }
              className="accent-nai-accent"
            />
            SMEA DYN
          </label>
        </div>
      </div>
    </Card>
  );
}
