import { MisconceptionType, TutorSessionState } from '@/types/tutor';

export const SESSION_STORAGE_KEY = 'et617_24b3972_session_v1';
export const SESSION_VERSION = 1;

const emptyMisconceptionCounts = (): Record<MisconceptionType, number> => ({
  NONE: 0,
  M1_MAGNITUDE_SIGN: 0,
  M2_DOUBLE_NEGATIVE: 0,
  NON_CONCEPTUAL_SLIP: 0,
  UNCLASSIFIED: 0,
});

export function createInitialSessionState(): TutorSessionState {
  return {
    version: SESSION_VERSION,
    screen: 'WELCOME',
    partIndex: 1,
    difficulty: 1,
    confidence: null,
    postConfidence: null,
    diagnosticScore: null,
    diagnosticGap: null,
    warmUpTool: 'NUMBER_LINE',
    currentQuestionId: 'q-nl-1',
    customQuestions: [],
    completedTaskIds: [],
    consecutiveCorrect: 0,
    consecutiveScaffoldTasks: 0,
    lastMisconception: 'NONE',
    consecutiveSameMisconception: 0,
    misconceptionCounts: emptyMisconceptionCounts(),
    hintsUsedCurrentTask: 0,
    activeElapsedSec: 0,
    isPaused: false,
    lastEvaluation: null,
    lastUserAnswer: '',
    eventLog: [],
    savedAt: '',
  };
}

export function loadSavedSession(): TutorSessionState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TutorSessionState;
    if (!parsed || parsed.version !== SESSION_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(state: TutorSessionState): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: TutorSessionState = {
      ...state,
      version: SESSION_VERSION,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function clearSavedSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Viva demo presets (from /about) to set up clean, repeatable starting states.
 */
export function createVivaPreset(
  preset: 'CORRECT_PATH' | 'M1_PATH' | 'M2_PATH'
): TutorSessionState {
  const base = createInitialSessionState();
  const now = new Date().toISOString();

  if (preset === 'CORRECT_PATH') {
    return {
      ...base,
      screen: 'PRACTICE',
      partIndex: 3,
      difficulty: 1,
      confidence: 'A_LITTLE_SURE',
      diagnosticScore: 2,
      diagnosticGap: 'NONE',
      warmUpTool: 'NUMBER_LINE',
      currentQuestionId: 'q-nl-1',
      completedTaskIds: ['q-cb-1'],
      consecutiveCorrect: 1,
      activeElapsedSec: 150,
      eventLog: [
        {
          timestamp: now,
          type: 'SESSION_STARTED',
          details: 'Viva preset: Correct-response path (1 correct so far; next correct triggers HARDER_QUESTION)',
        },
        {
          timestamp: now,
          type: 'QUESTION_SHOWN',
          questionId: 'q-nl-1',
          format: 'NUMBER_LINE',
        },
      ],
    };
  }

  if (preset === 'M1_PATH') {
    return {
      ...base,
      screen: 'PRACTICE',
      partIndex: 3,
      difficulty: 1,
      confidence: 'NOT_SURE',
      diagnosticScore: 1,
      diagnosticGap: 'NONE',
      warmUpTool: 'NUMBER_LINE',
      currentQuestionId: 'q-nl-1',
      activeElapsedSec: 120,
      eventLog: [
        {
          timestamp: now,
          type: 'SESSION_STARTED',
          details: 'Viva preset: M1 Magnitude/Direction path (selecting -8 triggers ALTERNATIVE_EXPLANATION)',
        },
        {
          timestamp: now,
          type: 'QUESTION_SHOWN',
          questionId: 'q-nl-1',
          format: 'NUMBER_LINE',
        },
      ],
    };
  }

  // M2_PATH
  return {
    ...base,
    screen: 'PRACTICE',
    partIndex: 3,
    difficulty: 1,
    confidence: 'NOT_SURE',
    diagnosticScore: 1,
    diagnosticGap: 'NONE',
    warmUpTool: 'COUNTER_BOARD',
    currentQuestionId: 'q-step-1',
    activeElapsedSec: 140,
    eventLog: [
      {
        timestamp: now,
        type: 'SESSION_STARTED',
        details: 'Viva preset: M2 Double-Negative path (answering -6 triggers ALTERNATIVE_EXPLANATION; twice triggers PREREQUISITE_INSTRUCTION)',
      },
      {
        timestamp: now,
        type: 'QUESTION_SHOWN',
        questionId: 'q-step-1',
        format: 'STEP_BY_STEP',
      },
    ],
  };
}
