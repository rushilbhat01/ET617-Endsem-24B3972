'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  clearSavedSession,
  createInitialSessionState,
  createVivaPreset,
  loadSavedSession,
  saveSession,
} from '@/lib/sessionStorage';

const emptySubscribe = () => () => {};

export default function AboutPage() {
  const router = useRouter();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const eventLog =
    isClient && !cleared ? loadSavedSession()?.eventLog ?? [] : [];

  const handleStartFresh = () => {
    clearSavedSession();
    const fresh = createInitialSessionState();
    saveSession({
      ...fresh,
      screen: 'DIAGNOSTIC',
      partIndex: 1,
      eventLog: [
        {
          timestamp: new Date().toISOString(),
          type: 'SESSION_STARTED',
          details: 'Fresh session started from About',
        },
      ],
    });
    router.push('/');
  };

  const handleClear = () => {
    clearSavedSession();
    setCleared(true);
    setConfirmClear(false);
    setStatusMsg('Saved session cleared.');
  };

  const handlePreset = (preset: 'CORRECT_PATH' | 'M1_PATH' | 'M2_PATH') => {
    const presetState = createVivaPreset(preset);
    saveSession(presetState);
    router.push('/');
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-sky-700 hover:text-sky-900"
          >
            ← Back to Learning Session
          </Link>
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800">
            ID: 24B3972
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 sm:py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            About IntegerEase (ET617 Endsem)
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            An adaptive tutor built for Class 7 learners repeating{' '}
            <em>Integers: operations with negative numbers</em>, designed for
            calm 10-minute sessions with pause-and-resume support.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
              <p className="font-semibold text-slate-800">Identity Token</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                24B3972
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
              <p className="font-semibold text-slate-800">Exam Card</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                P4 · T1 · L5 · C4
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
            <li>
              <strong>P4:</strong> Adaptive tutor with automatic question
              generation, 5 task formats, explanation evaluation, and a 3-way
              decision rule.
            </li>
            <li>
              <strong>T1:</strong> Integers: operations with negative numbers
              (Class 7).
            </li>
            <li>
              <strong>L5:</strong> Learner repeating the topic after failing it
              once, high anxiety and low self-efficacy.
            </li>
            <li>
              <strong>C4:</strong> 10-minute sessions with Save &amp; Pause and
              Resume Where You Left Off.
            </li>
          </ul>
        </section>

        {/* Session & Viva Demo Controls */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Session &amp; Viva Demo Controls
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Use these controls to start a fresh session or jump directly into a
            repeatable starting state for the Viva walkthrough.
          </p>

          {statusMsg && (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900">
              {statusMsg}
            </p>
          )}

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handlePreset('CORRECT_PATH')}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-left text-xs font-semibold text-emerald-950 hover:bg-emerald-100"
            >
              Start Correct-Response Path
              <span className="block font-normal text-emerald-800">
                1 correct so far → answer +2 on number line to trigger Harder
                Question
              </span>
            </button>

            <button
              type="button"
              onClick={() => handlePreset('M1_PATH')}
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-left text-xs font-semibold text-amber-950 hover:bg-amber-100"
            >
              Start M1 Path (Magnitude/Direction)
              <span className="block font-normal text-amber-800">
                Select -8 on number line to trigger Alternative Explanation
              </span>
            </button>

            <button
              type="button"
              onClick={() => handlePreset('M2_PATH')}
              className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-left text-xs font-semibold text-sky-950 hover:bg-sky-100"
            >
              Start M2 Path (Double Negative)
              <span className="block font-normal text-sky-800">
                Enter -6 for -4 - (-2) → twice triggers Prerequisite
                Instruction
              </span>
            </button>

            <button
              type="button"
              onClick={handleStartFresh}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left text-xs font-semibold text-slate-900 hover:bg-slate-50"
            >
              Start a Fresh Session
              <span className="block font-normal text-slate-600">
                Resets progress and starts at Part 1 (Check-in)
              </span>
            </button>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-xs font-medium text-rose-700 underline hover:text-rose-900"
              >
                Clear saved session
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-700">
                  Are you sure you want to delete saved progress?
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg bg-rose-700 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-800"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="text-xs text-slate-600 underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Lightweight Learning-Event Log (for D8) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">
            Local Learning-Event Log ({eventLog.length} events)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Recorded locally (no personal data) to support D8 evaluation.
          </p>
          {eventLog.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">
              No events recorded yet in the current session.
            </p>
          ) : (
            <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-700">
              {eventLog.map((ev, i) => (
                <div key={i} className="border-b border-slate-200 py-1 last:border-0">
                  <span className="font-semibold text-slate-900">{ev.type}</span>
                  {ev.questionId ? ` · q=${ev.questionId}` : ''}
                  {ev.misconception ? ` · misc=${ev.misconception}` : ''}
                  {ev.outcome ? ` · outcome=${ev.outcome}` : ''}
                  {ev.details ? ` · ${ev.details}` : ''}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
