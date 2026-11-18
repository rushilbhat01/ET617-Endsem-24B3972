'use client';

import React, { useEffect, useState } from 'react';

interface CounterBoardToolProps {
  initialPositives?: number;
  initialNegatives?: number;
  onNetChange?: (net: number) => void;
  readOnly?: boolean;
}

export function CounterBoardTool({
  initialPositives = 0,
  initialNegatives = 0,
  onNetChange,
  readOnly = false,
}: CounterBoardToolProps) {
  const [positives, setPositives] = useState(initialPositives);
  const [negatives, setNegatives] = useState(initialNegatives);
  const [cancelledPairs, setCancelledPairs] = useState(0);

  const netValue = positives - negatives;

  useEffect(() => {
    onNetChange?.(netValue);
  }, [netValue, onNetChange]);

  const canPairZero = positives > 0 && negatives > 0;

  const handlePairZero = () => {
    if (!canPairZero || readOnly) return;
    setPositives((p) => p - 1);
    setNegatives((n) => n - 1);
    setCancelledPairs((c) => c + 1);
  };

  const handleAddZeroPair = () => {
    if (readOnly) return;
    setPositives((p) => p + 1);
    setNegatives((n) => n + 1);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Two-Color Counter Board (+1 / −1)
        </span>
        <span
          className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 border border-slate-200"
          aria-live="polite"
        >
          Board Value: {netValue > 0 ? `+${netValue}` : netValue}
        </span>
      </div>

      {/* Controls */}
      {!readOnly && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPositives((p) => Math.min(12, p + 1))}
            className="rounded-lg border border-amber-400 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-200"
          >
            + Add (+1)
          </button>
          <button
            type="button"
            onClick={() => setPositives((p) => Math.max(0, p - 1))}
            disabled={positives === 0}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            Remove (+1)
          </button>

          <button
            type="button"
            onClick={() => setNegatives((n) => Math.min(12, n + 1))}
            className="rounded-lg border border-rose-300 bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-950 hover:bg-rose-200"
          >
            + Add (−1)
          </button>
          <button
            type="button"
            onClick={() => setNegatives((n) => Math.max(0, n - 1))}
            disabled={negatives === 0}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            Remove (−1)
          </button>

          <button
            type="button"
            onClick={handleAddZeroPair}
            className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-900 hover:bg-sky-100"
          >
            + Add Zero Pair (+1 &amp; −1)
          </button>
        </div>
      )}

      {/* Tiles display */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-amber-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-amber-900">
            Positive Tiles (+1): {positives}
          </p>
          <div className="flex flex-wrap gap-1.5 min-h-[36px]">
            {positives === 0 && (
              <span className="text-xs text-slate-400">No +1 tiles</span>
            )}
            {Array.from({ length: positives }).map((_, i) => (
              <span
                key={`pos-${i}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-100 text-xs font-bold text-amber-950"
              >
                +1
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-rose-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-rose-900">
            Negative Tiles (−1): {negatives}
          </p>
          <div className="flex flex-wrap gap-1.5 min-h-[36px]">
            {negatives === 0 && (
              <span className="text-xs text-slate-400">No −1 tiles</span>
            )}
            {Array.from({ length: negatives }).map((_, i) => (
              <span
                key={`neg-${i}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-rose-400 bg-rose-100 text-xs font-bold text-rose-950"
              >
                −1
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Zero-pair cancellation action & explanation */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 border border-slate-200">
        <p className="text-xs text-slate-700">
          <strong>Zero Pair Rule:</strong> One <strong>+1</strong> and one{' '}
          <strong>−1</strong> cancel out to <strong>0</strong>.
          {cancelledPairs > 0 && (
            <span className="ml-1 text-emerald-700 font-medium">
              ({cancelledPairs} zero {cancelledPairs === 1 ? 'pair' : 'pairs'}{' '}
              cancelled)
            </span>
          )}
        </p>
        {!readOnly && (
          <button
            type="button"
            onClick={handlePairZero}
            disabled={!canPairZero}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500"
          >
            Cancel 1 Zero Pair
          </button>
        )}
      </div>
    </div>
  );
}
