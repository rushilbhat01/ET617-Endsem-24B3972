import {
  AdaptiveOutcome,
  EvaluationResult,
  MisconceptionType,
  StructuredQuestion,
  TutorSessionState,
  VisualToolType,
} from '@/types/tutor';
import { QUESTION_BANK } from './questionBank';

export function recommendedToolForMisconception(
  misconception: MisconceptionType,
  fallbackPrerequisite: 'ORDERING_DIRECTION' | 'ZERO_PAIRS_SUBTRACTION'
): VisualToolType {
  if (misconception === 'M1_MAGNITUDE_SIGN') return 'NUMBER_LINE';
  if (misconception === 'M2_DOUBLE_NEGATIVE') return 'COUNTER_BOARD';
  return fallbackPrerequisite === 'ORDERING_DIRECTION'
    ? 'NUMBER_LINE'
    : 'COUNTER_BOARD';
}

/**
 * Deterministic local evaluator for written explanations (also serves as offline/API fallback).
 */
export function evaluateWrittenExplanationLocally(
  question: StructuredQuestion,
  text: string
): {
  isCorrect: boolean;
  misconception: MisconceptionType;
  explanationQuality: 'ADEQUATE' | 'PARTIAL' | 'MISCONCEPTION';
} {
  const normalized = text.trim().toLowerCase();
  if (normalized.length < 6) {
    return {
      isCorrect: false,
      misconception: 'UNCLASSIFIED',
      explanationQuality: 'PARTIAL',
    };
  }

  // Check for M2 ("two negatives make a negative" / "gives 1" / "subtract 2")
  if (
    /two\s*(negatives?|minuses?)\s*(make|stay|give)\s*(a\s*)?(negative|minus)/.test(
      normalized
    ) ||
    /gives?\s*1\b/.test(normalized) ||
    /subtract(ing)?\s*2\b/.test(normalized)
  ) {
    return {
      isCorrect: false,
      misconception: 'M2_DOUBLE_NEGATIVE',
      explanationQuality: 'MISCONCEPTION',
    };
  }

  // Check for M1 ("7 is bigger than 2" / "larger digit")
  if (
    /(7|seven)\s*(is\s*)?(bigger|greater|larger)\s*than\s*(2|two)/.test(
      normalized
    ) &&
    !normalized.includes('closer to 0') &&
    !normalized.includes('right') &&
    !normalized.includes('warmer')
  ) {
    return {
      isCorrect: false,
      misconception: 'M1_MAGNITUDE_SIGN',
      explanationQuality: 'MISCONCEPTION',
    };
  }

  if (question.id === 'q-explain-1') {
    const mentionsAddOrIncrease =
      /(add|plus|\+2|\+ 2|increase|goes up|more|right|remove.*negative|take away.*negative|remove.*red|debt|zero pair)/.test(
        normalized
      );
    if (mentionsAddOrIncrease) {
      return {
        isCorrect: true,
        misconception: 'NONE',
        explanationQuality: 'ADEQUATE',
      };
    }
    return {
      isCorrect: false,
      misconception: 'UNCLASSIFIED',
      explanationQuality: 'PARTIAL',
    };
  }

  if (question.id === 'q-explain-2') {
    const mentionsPosition =
      /(closer to 0|closer to zero|right|warmer|higher|less negative|above)/.test(
        normalized
      );
    if (mentionsPosition) {
      return {
        isCorrect: true,
        misconception: 'NONE',
        explanationQuality: 'ADEQUATE',
      };
    }
    return {
      isCorrect: false,
      misconception: 'M1_MAGNITUDE_SIGN',
      explanationQuality: 'MISCONCEPTION',
    };
  }

  // Generic check for AI-generated written explanation questions
  const hasReasoningCue =
    /(right|left|zero pair|cancel|remove|add|increase|decrease|closer to 0|negative|positive)/.test(
      normalized
    );
  return hasReasoningCue
    ? {
        isCorrect: true,
        misconception: 'NONE',
        explanationQuality: 'ADEQUATE',
      }
    : {
        isCorrect: false,
        misconception: 'UNCLASSIFIED',
        explanationQuality: 'PARTIAL',
      };
}

/**
 * Classifies a learner response and applies the evidence-based P4 adaptive decision rule.
 */
export function evaluateAndDecide(
  question: StructuredQuestion,
  rawAnswer: string,
  state: TutorSessionState
): EvaluationResult {
  const trimmed = rawAnswer.trim();
  let isCorrect = false;
  let misconception: MisconceptionType = 'UNCLASSIFIED';
  let explanationQuality: 'ADEQUATE' | 'PARTIAL' | 'MISCONCEPTION' | undefined;

  if (question.format === 'WRITTEN_EXPLANATION') {
    const res = evaluateWrittenExplanationLocally(question, trimmed);
    isCorrect = res.isCorrect;
    misconception = res.misconception;
    explanationQuality = res.explanationQuality;
  } else if (question.format === 'ERROR_SPOTTING') {
    const chosen = question.debugOptions?.find((o) => o.id === trimmed);
    if (chosen) {
      isCorrect = chosen.isCorrect;
      misconception = chosen.isCorrect ? 'NONE' : chosen.misconception;
    }
  } else {
    // Numeric formats: NUMBER_LINE, COUNTER_BOARD, STEP_BY_STEP
    const normalizedNum = trimmed.replace(/^\+/, '');
    const expectedStr = String(question.correctAnswer).replace(/^\+/, '');
    if (normalizedNum === expectedStr) {
      isCorrect = true;
      misconception = 'NONE';
    } else if (question.misconceptionMappings[normalizedNum]) {
      isCorrect = false;
      misconception = question.misconceptionMappings[normalizedNum];
    } else {
      const parsed = Number(normalizedNum);
      const expectedNum = Number(expectedStr);
      if (!Number.isNaN(parsed) && !Number.isNaN(expectedNum)) {
        if (Math.abs(parsed - expectedNum) === 1) {
          misconception = 'NON_CONCEPTUAL_SLIP';
        } else if (parsed === -expectedNum) {
          misconception = 'M1_MAGNITUDE_SIGN';
        } else {
          misconception = 'UNCLASSIFIED';
        }
      } else {
        misconception = 'UNCLASSIFIED';
      }
    }
  }

  const recommendedTool = recommendedToolForMisconception(
    misconception,
    question.prerequisite
  );

  // Evidence-based adaptive decision rule
  let outcome: AdaptiveOutcome = 'CONTINUE_SAME_LEVEL';
  let feedbackTitle = 'Nice work!';
  let decisionReason = '';

  if (isCorrect) {
    const adequateExplanation =
      question.format !== 'WRITTEN_EXPLANATION' ||
      explanationQuality === 'ADEQUATE';

    if (
      adequateExplanation &&
      state.hintsUsedCurrentTask <= 1 &&
      state.consecutiveCorrect >= 1 &&
      state.difficulty < 3
    ) {
      outcome = 'HARDER_QUESTION';
      feedbackTitle = 'Level Up — Ready for a Harder Question';
      decisionReason =
        '2+ correct responses in a row with minimal hints and solid reasoning.';
    } else {
      outcome = 'CONTINUE_SAME_LEVEL';
      feedbackTitle = 'Great Job — Keep Going!';
      decisionReason =
        state.hintsUsedCurrentTask > 1
          ? 'Correct with multiple hints; consolidating at the same level.'
          : state.difficulty >= 3
          ? 'Already at the highest challenge tier.'
          : 'First correct response in streak; one more for a level up.';
    }

    return {
      isCorrect: true,
      misconception: 'NONE',
      outcome,
      feedbackTitle,
      feedbackMessage: question.feedback.correct,
      recommendedTool,
      explanationQuality,
      decisionReason,
    };
  }

  // Incorrect response handling
  if (
    misconception === 'NON_CONCEPTUAL_SLIP' ||
    misconception === 'UNCLASSIFIED'
  ) {
    outcome = 'GENTLE_RETRY';
    feedbackTitle =
      misconception === 'NON_CONCEPTUAL_SLIP'
        ? 'Close! Quick Sign & Count Check'
        : 'Let Us Try That Step Again';
    decisionReason =
      misconception === 'NON_CONCEPTUAL_SLIP'
        ? 'Off by 1 / minor slip — no conceptual gap diagnosed; offering a calm retry.'
        : 'Answer did not match a known misconception pattern; avoiding false diagnosis.';

    return {
      isCorrect: false,
      misconception,
      outcome,
      feedbackTitle,
      feedbackMessage: question.feedback[misconception],
      recommendedTool,
      explanationQuality,
      decisionReason,
    };
  }

  // Clear M1 or M2 misconception
  const nextSameCount =
    state.lastMisconception === misconception
      ? state.consecutiveSameMisconception + 1
      : 1;

  const hasDiagnosticGap =
    (misconception === 'M1_MAGNITUDE_SIGN' &&
      state.diagnosticGap === 'ORDERING_DIRECTION') ||
    (misconception === 'M2_DOUBLE_NEGATIVE' &&
      state.diagnosticGap === 'ZERO_PAIRS_SUBTRACTION');

  if (nextSameCount >= 2 || (hasDiagnosticGap && state.completedTaskIds.length === 0)) {
    outcome = 'PREREQUISITE_INSTRUCTION';
    feedbackTitle = 'Quick 60-Second Prerequisite Reset';
    decisionReason =
      nextSameCount >= 2
        ? `Same misconception (${misconception}) appeared ${nextSameCount} times in a row.`
        : `Diagnostic check-in indicated a foundational gap (${state.diagnosticGap}).`;
  } else {
    outcome = 'ALTERNATIVE_EXPLANATION';
    feedbackTitle = 'Let Us Look at This Visually';
    decisionReason = `First clear occurrence of ${misconception}; switching to ${
      recommendedTool === 'NUMBER_LINE' ? 'Number Line' : 'Zero-Pair Counters'
    } scaffold.`;
  }

  const feedbackMessage =
    misconception === 'NONE'
      ? question.feedback.correct
      : question.feedback[misconception];

  return {
    isCorrect: false,
    misconception,
    outcome,
    feedbackTitle,
    feedbackMessage,
    recommendedTool,
    explanationQuality,
    decisionReason,
  };
}

/**
 * Selects the next question adaptively based on target difficulty and format diversity.
 */
export function selectNextQuestion(
  state: TutorSessionState,
  targetDifficulty: 1 | 2 | 3
): StructuredQuestion {
  const pool = [...state.customQuestions, ...QUESTION_BANK];
  const uncompleted = pool.filter(
    (q) => !state.completedTaskIds.includes(q.id) && q.id !== state.currentQuestionId
  );

  const candidates = uncompleted.length > 0 ? uncompleted : pool;

  // Prefer questions matching targetDifficulty and formats not yet seen
  const seenFormats = new Set(
    pool
      .filter((q) => state.completedTaskIds.includes(q.id))
      .map((q) => q.format)
  );

  const exactDiffUnseenFormat = candidates.find(
    (q) => q.difficulty === targetDifficulty && !seenFormats.has(q.format)
  );
  if (exactDiffUnseenFormat) return exactDiffUnseenFormat;

  const exactDiff = candidates.find((q) => q.difficulty === targetDifficulty);
  if (exactDiff) return exactDiff;

  return candidates[0];
}
