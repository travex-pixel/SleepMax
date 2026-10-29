"use client";

import { useState } from "react";
import { ChoiceList } from "@/components/ui/choice-list";
import { type Layer, type Mix, type SoundPreset, layerLabel, layerOrder, presetById, presets } from "@/lib/audio/presets";

interface SoundPickerProps {
  preset: SoundPreset;
  customMix: Mix | null;
  onPreset: (id: SoundPreset) => void;
  onMix: (mix: Mix) => void;
}

/**
 * Presets first, one tap each. Layers are tucked behind a single disclosure
 * for the people who want them; nobody has to see five sliders at midnight.
 */
export function SoundPicker({ preset, customMix, onPreset, onMix }: SoundPickerProps) {
  const [layers, setLayers] = useState(customMix !== null);
  const mix = customMix ?? presetById[preset].mix;

  return (
    <div className="flex flex-col gap-5">
      <ChoiceList<SoundPreset>
        ariaLabel="Sound"
        selected={customMix ? null : preset}
        choices={presets.map((p) => ({ id: p.id, label: p.name, note: p.note }))}
        onChoose={onPreset}
      />
      <button
        type="button"
        onClick={() => setLayers((v) => !v)}
        aria-expanded={layers}
        className="self-start text-[0.9375rem] text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink"
      >
        {layers ? "Hide layers" : "Adjust layers"}
      </button>
      {layers ? (
        <div className="flex flex-col gap-1">
          {layerOrder.map((l: Layer) => (
            <div key={l} className="flex items-center gap-4">
              <label htmlFor={`layer-${l}`} className="w-24 shrink-0 text-[0.9375rem] text-ink-2">
                {layerLabel[l]}
              </label>
              <input
                id={`layer-${l}`}
                type="range"
                className="slider"
                min={0}
                max={1}
                step={0.01}
                value={mix[l]}
                onChange={(e) => onMix({ ...mix, [l]: Number(e.target.value) })}
                aria-valuetext={`${Math.round(mix[l] * 100)} percent`}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
