'use client';

import Link from 'next/link';

interface HeaderBarProps {
  partIndex: 1 | 2 | 3 | 4;
  activeElapsedSec: number;
  showSavePause: boolean;
  onSaveAndPause?: () => void;
}

export function HeaderBar({
  partIndex,
  activeElapsedSec,
  showSavePause,
  onSaveAndPause,
}: HeaderBarProps) {
  const approxMinutesLeft = Math.max(
    1,
    Math.ceil((600 - activeElapsedSec) / 60)
  );

  return (
    <header className="border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900">
              IntegerEase
            </span>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800 border border-sky-200">
              10-Min Calm Tutor
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-600" aria-live="polite">
            Part {partIndex} of 4 · About {approxMinutesLeft}{' '}
            {approxMinutesLeft === 1 ? 'minute' : 'minutes'} left
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Calm 4-segment indicator */}
          <div
            className="hidden sm:flex items-center gap-1 mr-2"
            aria-label={`Progress: Part ${partIndex} of 4`}
          >
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-2 w-6 rounded-full transition-colors ${
                  step <= partIndex ? 'bg-sky-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {showSavePause && onSaveAndPause && (
            <button
              type="button"
              onClick={onSaveAndPause}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              Save &amp; Pause
            </button>
          )}

          <Link
            href="/about"
            className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            About
          </Link>
        </div>
      </div>
    </header>
  );
}
