'use client';

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { HeaderBar } from '@/components/HeaderBar';
import { NumberLineTool } from '@/components/NumberLineTool';
import { CounterBoardTool } from '@/components/CounterBoardTool';
import {
  DIAGNOSTIC_ITEMS,
  PREREQUISITE_LESSONS,
  QUESTION_BANK,
} from '@/lib/questionBank';
import {
  buildEvaluationResult,
  evaluateAndDecide,
  selectNextQuestion,
} from '@/lib/adaptiveEngine';
import {
  clearSavedSession,
  createInitialSessionState,
  loadSavedSession,
  saveSession,
} from '@/lib/sessionStorage';
import {
  ConfidenceLevel,
  LearningEvent,
  StructuredQuestion,
  TutorSessionState,
  VisualToolType,
} from '@/types/tutor';

const TARGET_SESSION_TASKS = 5;
const emptySubscribe = () => () => {};

export default function HomePage() {
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [state, setState] = useState<TutorSessionState>(() => {
    const saved = loadSavedSession();
    if (saved && saved.screen !== 'WELCOME') return saved;
    return createInitialSessionState();
  });
  const [hasSavedResume, setHasSavedResume] = useState<boolean>(() => {
    const saved = loadSavedSession();
    return Boolean(saved && saved.screen !== 'WELCOME' && saved.isPaused);
  });
  const [confirmFresh, setConfirmFresh] = useState(false);
  const [pauseNotice, setPauseNotice] = useState(false);

  // Diagnostic local inputs
  const [diagCompare, setDiagCompare] = useState('');
  const [diagSub, setDiagSub] = useState('');
  const [diagConfidence, setDiagConfidence] =
    useState<ConfidenceLevel | null>(null);

  // Practice local inputs
  const [numberLineVal, setNumberLineVal] = useState<number>(0);
  const [counterNetVal, setCounterNetVal] = useState<number>(0);
  const [rewriteInput, setRewriteInput] = useState('');
  const [numericInput, setNumericInput] = useState('');
  const [selectedDebugId, setSelectedDebugId] = useState('');
  const [writtenInput, setWrittenInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [altToolOverride, setAltToolOverride] = useState<VisualToolType | null>(
    null
  );
  const [prereqCheckChoice, setPrereqCheckChoice] = useState<number | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSourceLabel, setAiSourceLabel] = useState<string | null>(null);
  const [walkthroughVal, setWalkthroughVal] = useState<number>(0);

  const questionShownAtRef = useRef<number>(0);

  // Persist every meaningful state change
  useEffect(() => {
    if (!hydrated) return;
    if (state.screen !== 'WELCOME') {
      saveSession(state);
    }
  }, [state, hydrated]);

  // Active elapsed time ticker (paused time never counts)
  useEffect(() => {
    const isActiveLearning =
      !state.isPaused &&
      (state.screen === 'DIAGNOSTIC' ||
        state.screen === 'WARMUP' ||
        state.screen === 'PRACTICE' ||
        state.screen === 'ADAPTIVE_FEEDBACK');

    if (!isActiveLearning) return;

    const timer = setInterval(() => {
      setState((prev) => ({
        ...prev,
        activeElapsedSec: prev.activeElapsedSec + 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [state.isPaused, state.screen]);

  const currentQuestion: StructuredQuestion = useMemo(() => {
    const all = [...state.customQuestions, ...QUESTION_BANK];
    return (
      all.find((q) => q.id === state.currentQuestionId) ?? QUESTION_BANK[0]
    );
  }, [state.customQuestions, state.currentQuestionId]);

  const resetQuestionInputs = (q: StructuredQuestion) => {
    setNumberLineVal(q.startValue ?? 0);
    setWalkthroughVal(q.startValue ?? 0);
    setCounterNetVal((q.initialPositives ?? 0) - (q.initialNegatives ?? 0));
    setRewriteInput('');
    setNumericInput('');
    setSelectedDebugId('');
    setWrittenInput('');
    setShowHint(false);
    setAltToolOverride(null);
    setPrereqCheckChoice(null);
    questionShownAtRef.current = Date.now();
  };

  // Track when current question is shown
  useEffect(() => {
    questionShownAtRef.current = Date.now();
  }, [currentQuestion.id]);

  const appendEvents = (
    prev: TutorSessionState,
    events: LearningEvent[]
  ): TutorSessionState => ({
    ...prev,
    eventLog: [...prev.eventLog, ...events],
  });

  const handleStartFresh = () => {
    clearSavedSession();
    const fresh = createInitialSessionState();
    const started: TutorSessionState = {
      ...fresh,
      screen: 'DIAGNOSTIC',
      partIndex: 1,
      isPaused: false,
      eventLog: [
        {
          timestamp: new Date().toISOString(),
          type: 'SESSION_STARTED',
          details: 'Fresh 10-minute session started',
        },
      ],
    };
    setState(started);
    setHasSavedResume(false);
    setConfirmFresh(false);
    setPauseNotice(false);
  };

  const handleResume = () => {
    const saved = loadSavedSession();
    if (!saved) {
      handleStartFresh();
      return;
    }
    setState({
      ...saved,
      isPaused: false,
      eventLog: [
        ...saved.eventLog,
        {
          timestamp: new Date().toISOString(),
          type: 'SESSION_RESUMED',
          details: `Resumed at ${saved.screen}`,
        },
      ],
    });
    setHasSavedResume(false);
    setPauseNotice(false);
  };

  const handleSaveAndPause = () => {
    const pausedState: TutorSessionState = {
      ...state,
      isPaused: true,
      eventLog: [
        ...state.eventLog,
        {
          timestamp: new Date().toISOString(),
          type: 'SESSION_PAUSED',
          details: `Paused at ${state.screen}, activeElapsedSec=${state.activeElapsedSec}`,
        },
      ],
    };
    saveSession(pausedState);
    setState(pausedState);
    setHasSavedResume(true);
    setPauseNotice(true);
  };

  const handleDiagnosticSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagCompare || !diagSub || !diagConfidence) return;

    const compCorrect = diagCompare === '-3';
    const subCorrect = diagSub === '-2';
    const score = (compCorrect ? 1 : 0) + (subCorrect ? 1 : 0);

    let gap: TutorSessionState['diagnosticGap'] = 'NONE';
    let warmUpTool: VisualToolType = 'COUNTER_BOARD';

    if (!compCorrect) {
      gap = 'ORDERING_DIRECTION';
      warmUpTool = 'NUMBER_LINE';
    } else if (!subCorrect) {
      gap = 'ZERO_PAIRS_SUBTRACTION';
      warmUpTool = 'COUNTER_BOARD';
    }

    const startDiff: 1 | 2 = score === 2 && diagConfidence === 'QUITE_SURE' ? 2 : 1;
    const firstQ =
      warmUpTool === 'NUMBER_LINE'
        ? QUESTION_BANK[0]
        : QUESTION_BANK[1];

    setState((prev) =>
      appendEvents(
        {
          ...prev,
          screen: 'WARMUP',
          partIndex: 2,
          confidence: diagConfidence,
          diagnosticScore: score,
          diagnosticGap: gap,
          warmUpTool,
          difficulty: startDiff,
          currentQuestionId: firstQ.id,
        },
        [
          {
            timestamp: new Date().toISOString(),
            type: 'DIAGNOSTIC_COMPLETED',
            details: `score=${score}/2, gap=${gap}, confidence=${diagConfidence}`,
          },
        ]
      )
    );
  };

  const handleStartPractice = () => {
    resetQuestionInputs(currentQuestion);
    setState((prev) =>
      appendEvents(
        {
          ...prev,
          screen: 'PRACTICE',
          partIndex: 3,
          hintsUsedCurrentTask: 0,
        },
        [
          {
            timestamp: new Date().toISOString(),
            type: 'QUESTION_SHOWN',
            questionId: currentQuestion.id,
            format: currentQuestion.format,
          },
        ]
      )
    );
  };

  const handleRequestHint = () => {
    if (showHint) return;
    setShowHint(true);
    setState((prev) =>
      appendEvents(
        {
          ...prev,
          hintsUsedCurrentTask: prev.hintsUsedCurrentTask + 1,
        },
        [
          {
            timestamp: new Date().toISOString(),
            type: 'HINT_REQUESTED',
            questionId: currentQuestion.id,
            hintsUsed: prev.hintsUsedCurrentTask + 1,
          },
        ]
      )
    );
  };

  const handlePracticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let rawAnswer = '';
    if (currentQuestion.format === 'NUMBER_LINE') {
      rawAnswer = String(numberLineVal);
    } else if (currentQuestion.format === 'COUNTER_BOARD') {
      rawAnswer = String(counterNetVal);
    } else if (currentQuestion.format === 'STEP_BY_STEP') {
      rawAnswer = numericInput.trim();
    } else if (currentQuestion.format === 'ERROR_SPOTTING') {
      rawAnswer = selectedDebugId;
    } else if (currentQuestion.format === 'WRITTEN_EXPLANATION') {
      rawAnswer = writtenInput.trim();
    }

    if (!rawAnswer) return;

    const responseTimeMs = Date.now() - questionShownAtRef.current;
    let evaluation = evaluateAndDecide(
      currentQuestion,
      rawAnswer,
      state,
      responseTimeMs
    );
    let sourceTag: string | null = null;

    if (currentQuestion.format === 'WRITTEN_EXPLANATION') {
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'EVALUATE_EXPLANATION',
            question: currentQuestion,
            learnerExplanation: rawAnswer,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          sourceTag =
            data.source === 'AI_LIVE'
              ? 'AI Explanation Evaluator'
              : 'Fallback Evaluator (Local)';
          evaluation = buildEvaluationResult(
            currentQuestion,
            Boolean(data.isCorrect),
            data.misconception,
            state,
            data.explanationQuality,
            data.feedbackMessage,
            responseTimeMs
          );
        }
      } catch {
        sourceTag = 'Fallback Evaluator (Offline)';
      } finally {
        setIsSubmitting(false);
      }
    }

    setAiSourceLabel(sourceTag);

    setState((prev) => {
      const counts = { ...prev.misconceptionCounts };
      counts[evaluation.misconception] =
        (counts[evaluation.misconception] ?? 0) + 1;

      let nextConsecutiveCorrect = prev.consecutiveCorrect;
      let nextLastMisc = prev.lastMisconception;
      let nextSameMisc = prev.consecutiveSameMisconception;

      if (evaluation.isCorrect) {
        nextConsecutiveCorrect += 1;
        nextLastMisc = 'NONE';
        nextSameMisc = 0;
      } else if (
        evaluation.misconception === 'M1_MAGNITUDE_SIGN' ||
        evaluation.misconception === 'M2_DOUBLE_NEGATIVE'
      ) {
        nextConsecutiveCorrect = 0;
        if (prev.lastMisconception === evaluation.misconception) {
          nextSameMisc += 1;
        } else {
          nextLastMisc = evaluation.misconception;
          nextSameMisc = 1;
        }
      } else {
        // NON_CONCEPTUAL_SLIP or UNCLASSIFIED does not inflate misconception streak
        nextConsecutiveCorrect = 0;
      }

      let nextDifficulty = prev.difficulty;
      if (evaluation.outcome === 'HARDER_QUESTION' && prev.difficulty < 3) {
        nextDifficulty = (prev.difficulty + 1) as 1 | 2 | 3;
      }

      const completedTaskIds =
        evaluation.outcome === 'GENTLE_RETRY'
          ? prev.completedTaskIds
          : prev.completedTaskIds.includes(currentQuestion.id)
          ? prev.completedTaskIds
          : [...prev.completedTaskIds, currentQuestion.id];

      return appendEvents(
        {
          ...prev,
          screen: 'ADAPTIVE_FEEDBACK',
          difficulty: nextDifficulty,
          completedTaskIds,
          consecutiveCorrect: nextConsecutiveCorrect,
          lastMisconception: nextLastMisc,
          consecutiveSameMisconception: nextSameMisc,
          misconceptionCounts: counts,
          lastEvaluation: evaluation,
          lastUserAnswer: rawAnswer,
        },
        [
          {
            timestamp: new Date().toISOString(),
            type: 'RESPONSE_SUBMITTED',
            questionId: currentQuestion.id,
            format: currentQuestion.format,
            correct: evaluation.isCorrect,
            explanationQuality: evaluation.explanationQuality,
            misconception: evaluation.misconception,
            responseTimeMs,
            hintsUsed: prev.hintsUsedCurrentTask,
          },
          {
            timestamp: new Date().toISOString(),
            type: 'ADAPTIVE_OUTCOME',
            questionId: currentQuestion.id,
            outcome: evaluation.outcome,
            details: evaluation.decisionReason,
          },
        ]
      );
    });
  };

  const handleContinueAfterFeedback = async () => {
    const ev = state.lastEvaluation;

    // Gentle retry stays on same question
    if (ev?.outcome === 'GENTLE_RETRY') {
      setState((prev) => ({
        ...prev,
        screen: 'PRACTICE',
      }));
      return;
    }

    // Check if 10-minute session goal (5+ tasks) is complete
    if (state.completedTaskIds.length >= TARGET_SESSION_TASKS) {
      setState((prev) =>
        appendEvents(
          {
            ...prev,
            screen: 'SUMMARY',
            partIndex: 4,
          },
          [
            {
              timestamp: new Date().toISOString(),
              type: 'SESSION_COMPLETED',
              details: `Completed ${prev.completedTaskIds.length} tasks in ${prev.activeElapsedSec}s`,
            },
          ]
        )
      );
      return;
    }

    let nextQ = selectNextQuestion(state, state.difficulty);
    let generatedCustom: StructuredQuestion | null = null;

    // Request an AI-generated adaptive question when levelling up or mid-session
    if (
      ev?.outcome === 'HARDER_QUESTION' ||
      state.completedTaskIds.length === 3
    ) {
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'GENERATE_QUESTION',
            targetDifficulty: state.difficulty,
            focusMisconception: state.lastMisconception,
            preferredFormat:
              state.lastMisconception === 'M1_MAGNITUDE_SIGN'
                ? 'NUMBER_LINE'
                : 'STEP_BY_STEP',
            avoidIds: state.completedTaskIds,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.question?.id) {
            nextQ = data.question as StructuredQuestion;
            if (data.source === 'AI_LIVE') {
              generatedCustom = nextQ;
            }
          }
        }
      } catch {
        // Keep curated fallback nextQ
      } finally {
        setIsSubmitting(false);
      }
    }

    resetQuestionInputs(nextQ);

    setState((prev) =>
      appendEvents(
        {
          ...prev,
          screen: 'PRACTICE',
          partIndex: 3,
          currentQuestionId: nextQ.id,
          customQuestions: generatedCustom
            ? [...prev.customQuestions, generatedCustom]
            : prev.customQuestions,
          hintsUsedCurrentTask: 0,
          consecutiveSameMisconception:
            ev?.outcome === 'PREREQUISITE_INSTRUCTION'
              ? 0
              : prev.consecutiveSameMisconception,
        },
        [
          ...(ev?.outcome === 'PREREQUISITE_INSTRUCTION'
            ? [
                {
                  timestamp: new Date().toISOString(),
                  type: 'PREREQ_COMPLETED' as const,
                  details: currentQuestion.prerequisite,
                },
              ]
            : []),
          {
            timestamp: new Date().toISOString(),
            type: 'QUESTION_SHOWN',
            questionId: nextQ.id,
            format: nextQ.format,
          },
        ]
      )
    );
  };

  const activeToolInWarmup: VisualToolType =
    altToolOverride ?? state.warmUpTool;

  const activeToolInFeedback: VisualToolType =
    altToolOverride ??
    state.lastEvaluation?.recommendedTool ??
    'NUMBER_LINE';

  const prereqKey =
    state.lastEvaluation?.misconception === 'M1_MAGNITUDE_SIGN'
      ? 'ORDERING_DIRECTION'
      : state.lastEvaluation?.misconception === 'M2_DOUBLE_NEGATIVE'
      ? 'ZERO_PAIRS_SUBTRACTION'
      : currentQuestion.prerequisite;

  const prereqLesson =
    PREREQUISITE_LESSONS[prereqKey] ??
    PREREQUISITE_LESSONS.ZERO_PAIRS_SUBTRACTION;

  const outcomeBadgeLabel: Record<string, string> = {
    HARDER_QUESTION: 'Level Up · Challenge Task',
    ALTERNATIVE_EXPLANATION: 'Visual Walkthrough',
    PREREQUISITE_INSTRUCTION: 'Quick 60-Sec Refresher',
    GENTLE_RETRY: 'Quick Double-Check',
    CONTINUE_SAME_LEVEL: 'On Track',
  };

  const formatMinutesSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  if (!hydrated) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center p-6">
        <p className="text-sm text-slate-500">Loading your calm workspace...</p>
      </main>
    );
  }

  // Paused overlay / Welcome screen
  const showWelcomeScreen = state.screen === 'WELCOME' || state.isPaused;

  return (
    <div className="flex flex-1 flex-col">
      <HeaderBar
        partIndex={state.partIndex}
        activeElapsedSec={state.activeElapsedSec}
        showSavePause={!showWelcomeScreen && state.screen !== 'SUMMARY'}
        onSaveAndPause={handleSaveAndPause}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
        {/* SCREEN 1: WELCOME / RESUME (C4) */}
        {showWelcomeScreen && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {pauseNotice && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <strong>Progress saved!</strong> Take a breather—you can resume
                right where you left off whenever you are ready.
              </div>
            )}

            <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
              Class 7 · Integers &amp; Negative Numbers
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Master Negative Numbers in 10 Calm Minutes
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Minus signs can feel tricky—especially when two negatives appear
              together. Here, there are <strong>no harsh grades</strong> and{' '}
              <strong>no rushing</strong>. We will explore step by step, and you
              can pause and resume anytime.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <p className="text-xs font-semibold text-slate-800">
                  1. Quick Check-in
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  2 low-stakes questions so we start at the right spot for you.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <p className="text-xs font-semibold text-slate-800">
                  2. Visual Tools
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Number line &amp; +1/−1 tiles that show <em>why</em> rules work.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <p className="text-xs font-semibold text-slate-800">
                  3. Adaptive Practice
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  5+ bite-sized tasks that adapt to your thinking in ~10 mins.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {hasSavedResume && (
                <button
                  type="button"
                  onClick={handleResume}
                  className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  Resume Where You Left Off (Part {state.partIndex} of 4)
                </button>
              )}

              {!hasSavedResume ? (
                <button
                  type="button"
                  onClick={handleStartFresh}
                  className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  Start 10-Minute Session
                </button>
              ) : !confirmFresh ? (
                <button
                  type="button"
                  onClick={() => setConfirmFresh(true)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Start a Fresh Session
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
                  <span className="text-xs font-medium text-amber-950">
                    Erase saved progress?
                  </span>
                  <button
                    type="button"
                    onClick={handleStartFresh}
                    className="rounded-lg bg-amber-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-800"
                  >
                    Yes, Start Fresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmFresh(false)}
                    className="text-xs font-medium text-slate-700 underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SCREEN 2: LOW-STAKES DIAGNOSTIC CHECK-IN */}
        {!showWelcomeScreen && state.screen === 'DIAGNOSTIC' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Part 1 of 4 · Quick Check-in
            </span>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              Let Us See Where to Begin
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Just 2 quick questions and a confidence check—this is not a test,
              it only helps pick the best starting tool for you.
            </p>

            <form onSubmit={handleDiagnosticSubmit} className="mt-6 space-y-6">
              {/* Item 1: Comparison */}
              <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <legend className="px-1 text-sm font-semibold text-slate-900">
                  1. {DIAGNOSTIC_ITEMS.comparison.prompt}
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {DIAGNOSTIC_ITEMS.comparison.options.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium ${
                        diagCompare === opt.value
                          ? 'border-sky-600 bg-sky-50 text-sky-950'
                          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="diagCompare"
                        value={opt.value}
                        checked={diagCompare === opt.value}
                        onChange={(e) => setDiagCompare(e.target.value)}
                        className="accent-sky-600"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Item 2: Subtracting a negative */}
              <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <legend className="px-1 text-sm font-semibold text-slate-900">
                  2. {DIAGNOSTIC_ITEMS.subtraction.prompt}
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {DIAGNOSTIC_ITEMS.subtraction.options.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium ${
                        diagSub === opt.value
                          ? 'border-sky-600 bg-sky-50 text-sky-950'
                          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="diagSub"
                        value={opt.value}
                        checked={diagSub === opt.value}
                        onChange={(e) => setDiagSub(e.target.value)}
                        className="accent-sky-600"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Item 3: Confidence Check */}
              <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <legend className="px-1 text-sm font-semibold text-slate-900">
                  3. How are you feeling about negative numbers right now?
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      { id: 'NOT_SURE', label: 'Not sure yet' },
                      { id: 'A_LITTLE_SURE', label: 'A little sure' },
                      { id: 'QUITE_SURE', label: 'Quite sure' },
                    ] as const
                  ).map((c) => (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium ${
                        diagConfidence === c.id
                          ? 'border-sky-600 bg-sky-50 text-sky-950'
                          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="diagConfidence"
                        value={c.id}
                        checked={diagConfidence === c.id}
                        onChange={() => setDiagConfidence(c.id)}
                        className="accent-sky-600"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={!diagCompare || !diagSub || !diagConfidence}
                className="w-full rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-slate-300 disabled:text-slate-500 sm:w-auto"
              >
                Continue to Concept Warm-up →
              </button>
            </form>
          </section>
        )}

        {/* SCREEN 3: TARGETED VISUAL CONCEPT WARM-UP */}
        {!showWelcomeScreen && state.screen === 'WARMUP' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Part 2 of 4 · Concept Warm-up
              </span>
              <button
                type="button"
                onClick={() =>
                  setAltToolOverride(
                    activeToolInWarmup === 'NUMBER_LINE'
                      ? 'COUNTER_BOARD'
                      : 'NUMBER_LINE'
                  )
                }
                className="text-xs font-medium text-sky-700 underline hover:text-sky-900"
              >
                Try another way (switch to{' '}
                {activeToolInWarmup === 'NUMBER_LINE'
                  ? 'Counter Tiles'
                  : 'Number Line'}
                )
              </button>
            </div>

            <h1 className="mt-2 text-xl font-bold text-slate-900">
              {activeToolInWarmup === 'NUMBER_LINE'
                ? 'Let Us Picture Direction on a Number Line'
                : 'Let Us Picture Zero Pairs with +1 and −1 Tiles'}
            </h1>

            {state.confidence === 'NOT_SURE' && (
              <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900 border border-sky-200">
                It is completely okay to feel unsure—we will take this one small
                step at a time!
              </p>
            )}

            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              {activeToolInWarmup === 'NUMBER_LINE'
                ? 'On a number line, numbers grow larger as we move RIGHT and smaller as we move LEFT. That is why -3 is greater than -8—it sits further to the right!'
                : 'A yellow (+1) tile and a red (−1) tile cancel out to make a Zero Pair (0). Subtracting a negative means taking away red (−1) tiles, which leaves your total higher!'}
            </p>

            <div className="mt-5">
              {activeToolInWarmup === 'NUMBER_LINE' ? (
                <NumberLineTool
                  startValue={-3}
                  selectedValue={numberLineVal}
                  onChange={setNumberLineVal}
                />
              ) : (
                <CounterBoardTool
                  initialPositives={2}
                  initialNegatives={2}
                />
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleStartPractice}
                className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
              >
                I Am Ready to Try Practice →
              </button>
            </div>
          </section>
        )}

        {/* SCREEN 4: ADAPTIVE PRACTICE WORKSPACE */}
        {!showWelcomeScreen && state.screen === 'PRACTICE' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Part 3 of 4 · Task {state.completedTaskIds.length + 1} of{' '}
                {TARGET_SESSION_TASKS} · Level {state.difficulty}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                Format: {currentQuestion.format.replace(/_/g, ' ')}
              </span>
            </div>

            <h1 className="mt-3 text-lg font-bold text-slate-900 sm:text-xl">
              {currentQuestion.prompt}
            </h1>

            <form onSubmit={handlePracticeSubmit} className="mt-5 space-y-5">
              {/* Format 1: NUMBER_LINE */}
              {currentQuestion.format === 'NUMBER_LINE' && (
                <NumberLineTool
                  startValue={currentQuestion.startValue ?? 0}
                  selectedValue={numberLineVal}
                  onChange={setNumberLineVal}
                />
              )}

              {/* Format 2: COUNTER_BOARD */}
              {currentQuestion.format === 'COUNTER_BOARD' && (
                <CounterBoardTool
                  key={currentQuestion.id}
                  initialPositives={currentQuestion.initialPositives ?? 0}
                  initialNegatives={currentQuestion.initialNegatives ?? 0}
                  onNetChange={setCounterNetVal}
                />
              )}

              {/* Format 3: STEP_BY_STEP */}
              {currentQuestion.format === 'STEP_BY_STEP' && (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {currentQuestion.rewritePrompt && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        {currentQuestion.rewritePrompt}
                      </label>
                      <input
                        type="text"
                        value={rewriteInput}
                        onChange={(e) => setRewriteInput(e.target.value)}
                        placeholder="Write as an addition expression..."
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Step 2: Final value
                    </label>
                    <input
                      type="text"
                      inputMode="text"
                      value={numericInput}
                      onChange={(e) => setNumericInput(e.target.value)}
                      placeholder="Enter a single integer..."
                      required
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>
                </div>
              )}

              {/* Format 4: ERROR_SPOTTING */}
              {currentQuestion.format === 'ERROR_SPOTTING' && (
                <div className="space-y-3">
                  {currentQuestion.peerWork && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 font-mono text-sm text-amber-950">
                      {currentQuestion.peerWork}
                    </div>
                  )}
                  <div className="space-y-2">
                    {currentQuestion.debugOptions?.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
                          selectedDebugId === opt.id
                            ? 'border-sky-600 bg-sky-50 text-sky-950'
                            : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="debugOption"
                          value={opt.id}
                          checked={selectedDebugId === opt.id}
                          onChange={(e) => setSelectedDebugId(e.target.value)}
                          className="mt-0.5 accent-sky-600"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Format 5: WRITTEN_EXPLANATION */}
              {currentQuestion.format === 'WRITTEN_EXPLANATION' && (
                <div>
                  <label
                    htmlFor="written-explanation"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Write your explanation in plain words:
                  </label>
                  <textarea
                    id="written-explanation"
                    rows={3}
                    value={writtenInput}
                    onChange={(e) => setWrittenInput(e.target.value)}
                    placeholder="For example: Taking away -2 is like removing 2 negative tiles, so the total goes up to 5..."
                    required
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
              )}

              {/* Gentle Hint Box */}
              {showHint && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sm text-sky-950">
                  <strong>Gentle Hint:</strong> {currentQuestion.hint}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRequestHint}
                  disabled={showHint}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {showHint ? 'Hint Shown' : 'Need a Gentle Hint?'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-slate-400"
                >
                  {isSubmitting ? 'Checking...' : 'Check My Thinking'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* SCREEN 5: ADAPTIVE FEEDBACK & BRANCHING */}
        {!showWelcomeScreen &&
          state.screen === 'ADAPTIVE_FEEDBACK' &&
          state.lastEvaluation && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    state.lastEvaluation.isCorrect
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {outcomeBadgeLabel[state.lastEvaluation.outcome] ?? 'Tutor Feedback'}
                </span>
                {aiSourceLabel && (
                  <span className="text-xs text-slate-500">
                    {aiSourceLabel}
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-xl font-bold text-slate-900">
                {state.lastEvaluation.feedbackTitle}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {state.lastEvaluation.feedbackMessage}
              </p>

              {/* Transparent, learner-friendly reason */}
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 border border-slate-200">
                <strong>Next step:</strong>{' '}
                {state.lastEvaluation.decisionReason}
              </p>

              {/* Outcome B: Alternative Visual Explanation */}
              {state.lastEvaluation.outcome === 'ALTERNATIVE_EXPLANATION' && (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Let Us See It With a Visual Tool
                    </h2>
                    <button
                      type="button"
                      onClick={() =>
                        setAltToolOverride(
                          activeToolInFeedback === 'NUMBER_LINE'
                            ? 'COUNTER_BOARD'
                            : 'NUMBER_LINE'
                        )
                      }
                      className="text-xs font-medium text-sky-700 underline"
                    >
                      Try another way
                    </button>
                  </div>

                  {activeToolInFeedback === 'NUMBER_LINE' ? (
                    <NumberLineTool
                      startValue={currentQuestion.startValue ?? 0}
                      selectedValue={walkthroughVal}
                      onChange={setWalkthroughVal}
                    />
                  ) : (
                    <CounterBoardTool
                      key={`walkthrough-${currentQuestion.id}`}
                      initialPositives={currentQuestion.initialPositives ?? 2}
                      initialNegatives={currentQuestion.initialNegatives ?? 4}
                    />
                  )}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-800">
                      Step-by-step walkthrough:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
                      {currentQuestion.solutionSteps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Outcome C: 60-Second Prerequisite Micro-Lesson */}
              {state.lastEvaluation.outcome === 'PREREQUISITE_INSTRUCTION' && (
                <div className="mt-5 space-y-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                  <h2 className="text-base font-bold text-slate-900">
                    {prereqLesson.title}
                  </h2>
                  <p className="text-sm text-slate-700">{prereqLesson.summary}</p>
                  <div className="rounded-lg bg-white p-3 text-xs font-semibold text-sky-900 border border-sky-200">
                    Key Idea: {prereqLesson.keyIdea}
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-700">
                    {prereqLesson.exampleSteps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-900">
                      Quick Confidence Builder: {prereqLesson.quickCheckPrompt}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {prereqLesson.quickCheckOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPrereqCheckChoice(idx)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                            prereqCheckChoice === idx
                              ? opt.isCorrect
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                                : 'border-amber-500 bg-amber-50 text-amber-900'
                              : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {prereqCheckChoice !== null && (
                      <p className="mt-2 text-xs text-slate-800">
                        {prereqLesson.quickCheckOptions[prereqCheckChoice].feedback}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                {state.lastEvaluation.outcome === 'ALTERNATIVE_EXPLANATION' && (
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        screen: 'PRACTICE',
                      }))
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Try This Question Again
                  </button>
                )}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleContinueAfterFeedback}
                  className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-slate-400"
                >
                  {isSubmitting
                    ? 'Preparing Next Task...'
                    : state.lastEvaluation.outcome === 'GENTLE_RETRY'
                    ? 'Try This Question Again →'
                    : state.completedTaskIds.length >= TARGET_SESSION_TASKS
                    ? 'View 10-Minute Session Summary →'
                    : 'Next Adaptive Task →'}
                </button>
              </div>
            </section>
          )}

        {/* SCREEN 6: 10-MINUTE SESSION SUMMARY */}
        {!showWelcomeScreen && state.screen === 'SUMMARY' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
              Part 4 of 4 · Session Complete
            </span>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Great Effort Today!
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              You stayed calm, worked through integer operations step by step,
              and finished a complete 10-minute learning sequence.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Active Study Time</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {formatMinutesSec(state.activeElapsedSec)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Tasks Completed</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {state.completedTaskIds.length} tasks
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Highest Level Reached</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  Level {state.difficulty} / 3
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-800">
                What Your Session Showed:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                <li>
                  • Valid responses: <strong>{state.misconceptionCounts.NONE}</strong>
                </li>
                <li>
                  • Direction &amp; sign practice steps:{' '}
                  <strong>{state.misconceptionCounts.M1_MAGNITUDE_SIGN}</strong>
                </li>
                <li>
                  • Subtracting-negatives practice steps:{' '}
                  <strong>{state.misconceptionCounts.M2_DOUBLE_NEGATIVE}</strong>
                </li>
                <li>
                  • Events logged locally for D8 evaluation:{' '}
                  <strong>{state.eventLog.length}</strong>
                </li>
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleStartFresh}
                className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Start Another 10-Minute Session
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
