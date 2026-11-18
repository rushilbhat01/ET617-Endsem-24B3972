'use client';

import React from 'react';

interface NumberLineToolProps {
  min?: number;
  max?: number;
  startValue?: number;
  selectedValue: number;
  onChange: (val: number) => void;
  readOnly?: boolean;
}

export function NumberLineTool({
  min = -10,
  max = 10,
  startValue = 0,
  selectedValue,
  onChange,
  readOnly = false,
}: NumberLineToolProps) {
  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const delta = selectedValue - startValue;

  const movementText =
    delta === 0
      ? `At starting position ${startValue}`
      : delta > 0
      ? `Moved ${delta} ${delta === 1 ? 'step' : 'steps'} RIGHT from ${startValue} to ${selectedValue}`
      : `Moved ${Math.abs(delta)} ${
          Math.abs(delta) === 1 ? 'step' : 'steps'
        } LEFT from ${startValue} to ${selectedValue}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedValue < max) onChange(selectedValue + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedValue > min) onChange(selectedValue - 1);
    }
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Interactive Number Line ({min} to +{max})
        </span>
        <span
          className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-sky-900 border border-sky-200"
          aria-live="polite"
        >
          {movementText}
        </span>
      </div>

      {/* Scrollable/responsive tick buttons */}
      <div
        className="flex items-center justify-between gap-0.5 overflow-x-auto pb-2"
        role="group"
        aria-label="Number line positions"
      >
        {ticks.map((tick) => {
          const isSelected = tick === selectedValue;
          const isStart = tick === startValue;
          const isZero = tick === 0;
          return (
            <button
              key={tick}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(tick)}
              aria-pressed={isSelected}
              aria-label={`Position ${tick}${isStart ? ' (start)' : ''}`}
              className={`flex min-w-[28px] flex-1 flex-col items-center rounded-md py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-sm'
                  : isStart
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : isZero
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-sky-50'
              }`}
            >
              <span>{tick > 0 ? `+${tick}` : tick}</span>
              <span className="mt-0.5 text-[10px] font-normal opacity-80">
                {isSelected ? 'You' : isStart ? 'Start' : '·'}
              </span>
            </button>
          );
        })}
      </div>

      {!readOnly && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selectedValue > min && onChange(selectedValue - 1)}
              disabled={selectedValue <= min}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-40"
            >
              ← Step Left (−1)
            </button>
            <button
              type="button"
              onClick={() => selectedValue < max && onChange(selectedValue + 1)}
              disabled={selectedValue >= max}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-40"
            >
              Step Right (+1) →
            </button>
          </div>
          <button
            type="button"
            onClick={() => onChange(startValue)}
            className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
          >
            Reset to Start ({startValue})
          </button>
        </div>
      )}
    </div>
  );
}
