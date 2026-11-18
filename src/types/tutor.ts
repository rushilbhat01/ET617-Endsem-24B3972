export type MisconceptionType =
  | 'NONE'
  | 'M1_MAGNITUDE_SIGN'
  | 'M2_DOUBLE_NEGATIVE'
  | 'NON_CONCEPTUAL_SLIP'
  | 'UNCLASSIFIED';

export type QuestionFormat =
  | 'NUMBER_LINE'
  | 'COUNTER_BOARD'
  | 'STEP_BY_STEP'
  | 'ERROR_SPOTTING'
  | 'WRITTEN_EXPLANATION';

export type DifficultyLevel = 1 | 2 | 3;

export type ConfidenceLevel = 'NOT_SURE' | 'A_LITTLE_SURE' | 'QUITE_SURE';

export type AdaptiveOutcome =
  | 'HARDER_QUESTION'
  | 'ALTERNATIVE_EXPLANATION'
  | 'PREREQUISITE_INSTRUCTION'
  | 'GENTLE_RETRY'
  | 'CONTINUE_SAME_LEVEL';

export type ScreenState =
  | 'WELCOME'
  | 'DIAGNOSTIC'
  | 'WARMUP'
  | 'PRACTICE'
  | 'ADAPTIVE_FEEDBACK'
  | 'SUMMARY';

export type VisualToolType = 'NUMBER_LINE' | 'COUNTER_BOARD';

export interface DebugOption {
  id: string;
  label: string;
  isCorrect: boolean;
  misconception: MisconceptionType;
}

export interface StructuredQuestion {
  id: string;
  format: QuestionFormat;
  difficulty: DifficultyLevel;
  concept: string;
  prompt: string;
  hint: string;
  /** Optional starting value for number line */
  startValue?: number;
  /** Optional step-by-step rewrite prompt (e.g. "-4 + 2") */
  rewritePrompt?: string;
  expectedRewrite?: string;
  /** Optional initial counters for counter board */
  initialPositives?: number;
  initialNegatives?: number;
  /** Optional peer work for error-spotting */
  peerWork?: string;
  debugOptions?: DebugOption[];
  /** Numeric answer (or target value for number line / counter board) */
  correctAnswer: number | string;
  solutionSteps: string[];
  /** Maps specific wrong numeric/string answers to a misconception class */
  misconceptionMappings: Record<string, MisconceptionType>;
  feedback: {
    correct: string;
    M1_MAGNITUDE_SIGN: string;
    M2_DOUBLE_NEGATIVE: string;
    NON_CONCEPTUAL_SLIP: string;
    UNCLASSIFIED: string;
  };
  prerequisite: 'ORDERING_DIRECTION' | 'ZERO_PAIRS_SUBTRACTION';
  estimatedDurationSec: number;
  isAIGenerated?: boolean;
}

export interface EvaluationResult {
  isCorrect: boolean;
  misconception: MisconceptionType;
  outcome: AdaptiveOutcome;
  feedbackTitle: string;
  feedbackMessage: string;
  recommendedTool: VisualToolType;
  explanationQuality?: 'ADEQUATE' | 'PARTIAL' | 'MISCONCEPTION';
  decisionReason: string;
}

export interface LearningEvent {
  timestamp: string;
  type:
    | 'SESSION_STARTED'
    | 'SESSION_PAUSED'
    | 'SESSION_RESUMED'
    | 'DIAGNOSTIC_COMPLETED'
    | 'QUESTION_SHOWN'
    | 'HINT_REQUESTED'
    | 'RESPONSE_SUBMITTED'
    | 'ADAPTIVE_OUTCOME'
    | 'PREREQ_COMPLETED'
    | 'SESSION_COMPLETED';
  questionId?: string;
  format?: QuestionFormat;
  correct?: boolean;
  explanationQuality?: 'ADEQUATE' | 'PARTIAL' | 'MISCONCEPTION';
  misconception?: MisconceptionType;
  outcome?: AdaptiveOutcome;
  responseTimeMs?: number;
  hintsUsed?: number;
  details?: string;
}

export interface TutorSessionState {
  version: number;
  screen: ScreenState;
  partIndex: 1 | 2 | 3 | 4;
  difficulty: DifficultyLevel;
  confidence: ConfidenceLevel | null;
  postConfidence: ConfidenceLevel | null;
  diagnosticScore: number | null;
  diagnosticGap: 'ORDERING_DIRECTION' | 'ZERO_PAIRS_SUBTRACTION' | 'NONE' | null;
  warmUpTool: VisualToolType;
  currentQuestionId: string;
  customQuestions: StructuredQuestion[];
  completedTaskIds: string[];
  consecutiveCorrect: number;
  lastMisconception: MisconceptionType;
  consecutiveSameMisconception: number;
  misconceptionCounts: Record<MisconceptionType, number>;
  hintsUsedCurrentTask: number;
  activeElapsedSec: number;
  isPaused: boolean;
  lastEvaluation: EvaluationResult | null;
  lastUserAnswer: string;
  eventLog: LearningEvent[];
  savedAt: string;
}
