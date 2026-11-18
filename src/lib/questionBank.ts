import { StructuredQuestion } from '@/types/tutor';

export const DIAGNOSTIC_ITEMS = {
  comparison: {
    id: 'diag-compare',
    prompt: 'Which number is greater (further right on a number line): -8 or -3?',
    options: [
      { value: '-3', label: '-3 is greater', isCorrect: true },
      { value: '-8', label: '-8 is greater', isCorrect: false },
    ],
  },
  subtraction: {
    id: 'diag-sub-neg',
    prompt: 'What do you think -4 - (-2) equals?',
    options: [
      { value: '-2', label: '-2', isCorrect: true },
      { value: '-6', label: '-6', isCorrect: false },
      { value: '2', label: '+2', isCorrect: false },
    ],
  },
};

export interface PrerequisiteLesson {
  id: 'ORDERING_DIRECTION' | 'ZERO_PAIRS_SUBTRACTION';
  title: string;
  tool: 'NUMBER_LINE' | 'COUNTER_BOARD';
  summary: string;
  keyIdea: string;
  exampleSteps: string[];
  quickCheckPrompt: string;
  quickCheckOptions: { label: string; isCorrect: boolean; feedback: string }[];
}

export const PREREQUISITE_LESSONS: Record<
  'ORDERING_DIRECTION' | 'ZERO_PAIRS_SUBTRACTION',
  PrerequisiteLesson
> = {
  ORDERING_DIRECTION: {
    id: 'ORDERING_DIRECTION',
    title: 'Quick Reset: Reading Negative Numbers & Direction',
    tool: 'NUMBER_LINE',
    summary:
      'Numbers further to the right are always larger—even when they are negative. Think of temperature: -3°C is warmer (higher) than -8°C.',
    keyIdea:
      'Adding a positive (+) moves RIGHT. Adding a negative (−) moves LEFT.',
    exampleSteps: [
      'Find -3 and -8 on the number line below.',
      '-3 is closer to 0 (further right), so -3 > -8.',
      'From -3, adding +5 means stepping 5 places RIGHT: -2, -1, 0, +1, +2.',
    ],
    quickCheckPrompt: 'Which is warmer (greater): -5°C or -2°C?',
    quickCheckOptions: [
      {
        label: '-2°C',
        isCorrect: true,
        feedback: 'Yes! -2 is closer to 0 (further right), so -2 > -5.',
      },
      {
        label: '-5°C',
        isCorrect: false,
        feedback:
          'Not quite—5 is bigger than 2, but -5 is colder (further left) than -2.',
      },
    ],
  },
  ZERO_PAIRS_SUBTRACTION: {
    id: 'ZERO_PAIRS_SUBTRACTION',
    title: 'Quick Reset: Zero Pairs & Subtracting a Negative',
    tool: 'COUNTER_BOARD',
    summary:
      'One yellow (+1) and one red (−1) make a Zero Pair (0). Subtracting a negative means taking away red (−1) tiles—which leaves the value higher, not lower!',
    keyIdea:
      'Taking away −2 is the exact same as adding +2. Two minus signs in a row (− (−2)) do NOT stay negative.',
    exampleSteps: [
      'Start with 4 red (−1) tiles to show −4.',
      'Subtracting −2 means removing 2 red (−1) tiles.',
      '2 red tiles remain, so −4 − (−2) = −2.',
    ],
    quickCheckPrompt:
      'If you have 3 yellow (+1) tiles and remove a −2 debt using zero pairs, does your total go up or down?',
    quickCheckOptions: [
      {
        label: 'Goes up to 5',
        isCorrect: true,
        feedback:
          'Exactly right! Removing a negative increases your total: 3 − (−2) = 5.',
      },
      {
        label: 'Goes down to 1',
        isCorrect: false,
        feedback:
          'Look closely: removing a negative (−2) removes red tiles, so you end up with MORE, not less!',
      },
    ],
  },
};

export const QUESTION_BANK: StructuredQuestion[] = [
  {
    id: 'q-nl-1',
    format: 'NUMBER_LINE',
    difficulty: 1,
    concept: 'Adding a positive integer to a negative integer across zero',
    prompt: 'Start at -3 on the number line. Move to show -3 + 5.',
    hint: 'Adding +5 means moving 5 steps to the RIGHT. Count 3 steps to reach 0, then 2 more.',
    startValue: -3,
    correctAnswer: 2,
    solutionSteps: [
      'Start at -3 on the number line.',
      'Adding +5 moves 5 steps to the right.',
      '3 steps right reaches 0, and 2 more steps right lands on +2.',
    ],
    misconceptionMappings: {
      '-8': 'M1_MAGNITUDE_SIGN',
      '-2': 'M1_MAGNITUDE_SIGN',
      '1': 'NON_CONCEPTUAL_SLIP',
      '3': 'NON_CONCEPTUAL_SLIP',
    },
    feedback: {
      correct:
        'Nice work! Moving 5 steps right from -3 crosses 0 and lands on +2.',
      M1_MAGNITUDE_SIGN:
        'Let us check the direction: +5 moves RIGHT (towards warmer numbers), not left. Try stepping 3 to 0, then 2 more!',
      M2_DOUBLE_NEGATIVE:
        'Notice there is only one negative number here (-3). Adding +5 moves right.',
      NON_CONCEPTUAL_SLIP:
        'Your direction is right! Just recount the 5 steps from -3 carefully.',
      UNCLASSIFIED:
        'Good try! Use the number line to step 5 places right from -3.',
    },
    prerequisite: 'ORDERING_DIRECTION',
    estimatedDurationSec: 75,
  },
  {
    id: 'q-cb-1',
    format: 'COUNTER_BOARD',
    difficulty: 1,
    concept: 'Zero-pair cancellation in integer addition',
    prompt:
      'Build 2 + (-5) using +1 and -1 tiles, pair up zero pairs, and see what is left.',
    hint: 'Start with 2 yellow (+1) tiles and add 5 red (-1) tiles. Every (+1, -1) pair cancels to 0.',
    initialPositives: 2,
    initialNegatives: 0,
    correctAnswer: -3,
    solutionSteps: [
      'Place 2 yellow (+1) tiles and 5 red (-1) tiles.',
      'Pair 2 yellow tiles with 2 red tiles to make 2 Zero Pairs (each = 0).',
      '3 red (-1) tiles remain, so 2 + (-5) = -3.',
    ],
    misconceptionMappings: {
      '3': 'M1_MAGNITUDE_SIGN',
      '7': 'M1_MAGNITUDE_SIGN',
      '-7': 'M2_DOUBLE_NEGATIVE',
      '-2': 'NON_CONCEPTUAL_SLIP',
      '-4': 'NON_CONCEPTUAL_SLIP',
    },
    feedback: {
      correct:
        'Spot on! Two (+1, -1) zero pairs cancel out, leaving 3 red (-1) tiles = -3.',
      M1_MAGNITUDE_SIGN:
        'You found the difference (3), but look at the color left over: 3 red (-1) tiles remain, so the answer is -3, not +3.',
      M2_DOUBLE_NEGATIVE:
        'Adding -5 puts 5 red tiles on the board alongside 2 yellow tiles—they partially cancel instead of stacking to -7.',
      NON_CONCEPTUAL_SLIP:
        'Almost! Count the remaining uncancelled tiles one more time.',
      UNCLASSIFIED:
        'Try adding 5 red (-1) tiles and clicking "Cancel Zero Pair" to see what stays.',
    },
    prerequisite: 'ZERO_PAIRS_SUBTRACTION',
    estimatedDurationSec: 80,
  },
  {
    id: 'q-step-1',
    format: 'STEP_BY_STEP',
    difficulty: 1,
    concept: 'Subtracting a negative integer from a negative integer',
    prompt: 'Solve -4 - (-2) in two calm steps.',
    hint: 'Subtracting -2 is the same as adding +2 (removing 2 red tiles). Rewrite it first!',
    rewritePrompt: 'Step 1: Rewrite -4 - (-2) as addition (e.g., -4 + 2)',
    expectedRewrite: '-4+2',
    correctAnswer: -2,
    solutionSteps: [
      'Subtracting -2 means taking away 2 negative tiles, which is +2.',
      'Rewrite -4 - (-2) as -4 + 2.',
      '4 red tiles and 2 yellow tiles leave 2 red tiles: -2.',
    ],
    misconceptionMappings: {
      '-6': 'M2_DOUBLE_NEGATIVE',
      '2': 'M1_MAGNITUDE_SIGN',
      '6': 'M1_MAGNITUDE_SIGN',
      '-1': 'NON_CONCEPTUAL_SLIP',
      '-3': 'NON_CONCEPTUAL_SLIP',
    },
    feedback: {
      correct:
        'Great job! Taking away 2 red (-1) tiles from -4 leaves -2.',
      M1_MAGNITUDE_SIGN:
        'Check the sign: -4 has 4 red tiles and +2 only cancels 2 of them, so 2 red tiles (-2) remain.',
      M2_DOUBLE_NEGATIVE:
        'Watch out for the "two negatives stay negative" trap! Taking away -2 removes a debt, so -4 goes UP to -2, not down to -6.',
      NON_CONCEPTUAL_SLIP:
        'Good thinking on the sign—just double-check 4 minus 2.',
      UNCLASSIFIED:
        'Try picturing 4 red (-1) tiles and taking away 2 red tiles.',
    },
    prerequisite: 'ZERO_PAIRS_SUBTRACTION',
    estimatedDurationSec: 85,
  },
  {
    id: 'q-debug-1',
    format: 'ERROR_SPOTTING',
    difficulty: 2,
    concept: 'Debugging double-negative subtraction',
    prompt:
      'Rohan solved -6 - (-3) and wrote: "-6 - (-3) = -9". Help Rohan spot what went wrong!',
    hint: 'Ask yourself: did Rohan subtract -3, or did he accidentally add -3?',
    peerWork: 'Rohan wrote:  -6 - (-3) = -6 - 3 = -9',
    debugOptions: [
      {
        id: 'opt-correct',
        label: 'He treated -(-3) as -3 instead of +3. The answer should be -3.',
        isCorrect: true,
        misconception: 'NONE',
      },
      {
        id: 'opt-m2',
        label: 'He is actually right—two negatives always make a more negative number (-9).',
        isCorrect: false,
        misconception: 'M2_DOUBLE_NEGATIVE',
      },
      {
        id: 'opt-m1',
        label: 'He forgot the minus sign; -6 + 3 should be +3 because 6 - 3 = 3.',
        isCorrect: false,
        misconception: 'M1_MAGNITUDE_SIGN',
      },
    ],
    correctAnswer: 'opt-correct',
    solutionSteps: [
      'Subtracting -3 means removing 3 negative tiles, which is +3.',
      'So -6 - (-3) = -6 + 3.',
      'Moving 3 steps right from -6 lands on -3.',
    ],
    misconceptionMappings: {
      'opt-m2': 'M2_DOUBLE_NEGATIVE',
      'opt-m1': 'M1_MAGNITUDE_SIGN',
    },
    feedback: {
      correct:
        'Sharp eye! Spotting that -(-3) means +3 (moving right to -3) shows real mastery.',
      M1_MAGNITUDE_SIGN:
        'Careful with the sign: from -6, moving 3 steps right only reaches -3, not +3.',
      M2_DOUBLE_NEGATIVE:
        'That is a very common trap! Subtracting -3 removes 3 red tiles, so -6 moves UP to -3, not down to -9.',
      NON_CONCEPTUAL_SLIP:
        'Take another look at Rohan’s middle step.',
      UNCLASSIFIED:
        'Compare -6 - 3 with -6 - (-3) using the counter board.',
    },
    prerequisite: 'ZERO_PAIRS_SUBTRACTION',
    estimatedDurationSec: 75,
  },
  {
    id: 'q-explain-1',
    format: 'WRITTEN_EXPLANATION',
    difficulty: 2,
    concept: 'Explaining subtraction of a negative integer',
    prompt:
      'In your own words (1–2 sentences), why does 3 - (-2) give 5 instead of 1?',
    hint: 'Think about removing 2 red (-1) tiles using zero pairs, or moving right on the number line.',
    correctAnswer: 'Removing -2 increases 3 by 2 (3 + 2 = 5).',
    solutionSteps: [
      'Start at 3 (three +1 tiles).',
      'To take away -2, add 2 zero pairs and remove the two -1 tiles.',
      'Two extra +1 tiles are left behind, making 3 + 2 = 5.',
    ],
    misconceptionMappings: {},
    feedback: {
      correct:
        'Clear reasoning! You explained why taking away a negative increases the value.',
      M1_MAGNITUDE_SIGN:
        'Your answer mixes up +2 and -2. Picture 3 yellow tiles and add 2 zero pairs to see what happens when you remove -2.',
      M2_DOUBLE_NEGATIVE:
        'Notice you treated -(-2) like subtracting 2. Removing a -2 debt leaves you with MORE (5), not less (1).',
      NON_CONCEPTUAL_SLIP:
        'Your idea is close—mention both the starting 3 and why -(-2) adds 2.',
      UNCLASSIFIED:
        'Try writing one sentence about "taking away -2" or "adding +2".',
    },
    prerequisite: 'ZERO_PAIRS_SUBTRACTION',
    estimatedDurationSec: 90,
  },
  {
    id: 'q-nl-2',
    format: 'NUMBER_LINE',
    difficulty: 2,
    concept: 'Subtracting a negative from a negative on the number line',
    prompt: 'Start at -7 on the number line. Show the result of -7 - (-4).',
    hint: 'Subtracting -4 moves 4 steps to the RIGHT from -7.',
    startValue: -7,
    correctAnswer: -3,
    solutionSteps: [
      'Start at -7.',
      'Subtracting -4 is the same as adding +4 (4 steps right).',
      '-7 + 4 = -3.',
    ],
    misconceptionMappings: {
      '3': 'M1_MAGNITUDE_SIGN',
      '-11': 'M2_DOUBLE_NEGATIVE',
      '-2': 'NON_CONCEPTUAL_SLIP',
      '-4': 'NON_CONCEPTUAL_SLIP',
    },
    feedback: {
      correct: 'Awesome! 4 steps right from -7 lands right on -3.',
      M1_MAGNITUDE_SIGN:
        'Check the sign: moving 4 right from -7 does not cross 0 yet, so we stay at -3.',
      M2_DOUBLE_NEGATIVE:
        'Remember: subtracting -4 moves RIGHT, not left!',
      NON_CONCEPTUAL_SLIP: 'Close—count 4 steps right from -7 again.',
      UNCLASSIFIED: 'Try stepping 4 places right from -7.',
    },
    prerequisite: 'ORDERING_DIRECTION',
    estimatedDurationSec: 75,
  },
  {
    id: 'q-step-2',
    format: 'STEP_BY_STEP',
    difficulty: 3,
    concept: 'Multi-step integer expression with subtracting a negative',
    prompt: 'Challenge: Solve -5 - (-8) + (-2) step by step.',
    hint: 'First rewrite -5 - (-8) as -5 + 8. Then add -2.',
    rewritePrompt: 'Step 1: Rewrite -5 - (-8) as addition (e.g., -5 + 8)',
    expectedRewrite: '-5+8',
    correctAnswer: 1,
    solutionSteps: [
      'Rewrite -5 - (-8) as -5 + 8 = 3.',
      'Then add -2: 3 + (-2) = 1.',
    ],
    misconceptionMappings: {
      '-15': 'M2_DOUBLE_NEGATIVE',
      '-11': 'M2_DOUBLE_NEGATIVE',
      '-1': 'M1_MAGNITUDE_SIGN',
      '5': 'M1_MAGNITUDE_SIGN',
      '0': 'NON_CONCEPTUAL_SLIP',
      '2': 'NON_CONCEPTUAL_SLIP',
    },
    feedback: {
      correct:
        'Brilliant! You handled both -(-8) and +(-2) cleanly to reach 1.',
      M1_MAGNITUDE_SIGN:
        'Check the sign at -5 + 8: 8 is bigger than 5, so -5 + 8 = +3, then 3 + (-2) = 1.',
      M2_DOUBLE_NEGATIVE:
        'Remember: -(-8) becomes +8, so the first part moves right to +3!',
      NON_CONCEPTUAL_SLIP:
        'Very close! Recheck 3 + (-2).',
      UNCLASSIFIED:
        'Break it into two parts: first -5 + 8, then add -2.',
    },
    prerequisite: 'ZERO_PAIRS_SUBTRACTION',
    estimatedDurationSec: 95,
  },
  {
    id: 'q-explain-2',
    format: 'WRITTEN_EXPLANATION',
    difficulty: 3,
    concept: 'Comparing negative numbers and explaining why -2 > -7',
    prompt:
      'A friend says "-7 is bigger than -2 because 7 is bigger than 2." How would you explain why -2 is actually greater?',
    hint: 'Use a number line (which is further right?) or temperature (-2°C vs -7°C).',
    correctAnswer: '-2 is closer to 0 (further right on the number line) than -7.',
    solutionSteps: [
      'On a number line, numbers increase as you move right.',
      '-2 is to the right of -7 (and -2°C is warmer than -7°C), so -2 > -7.',
    ],
    misconceptionMappings: {},
    feedback: {
      correct:
        'Great explanation! You connected position on the number line (or temperature) to value.',
      M1_MAGNITUDE_SIGN:
        'Watch out: 7 > 2 for positive numbers, but for negatives, being further from 0 means SMALLER, not bigger.',
      M2_DOUBLE_NEGATIVE:
        'Focus on where -2 and -7 sit on the number line relative to 0.',
      NON_CONCEPTUAL_SLIP:
        'Good start—mention that -2 is further right (or closer to 0) than -7.',
      UNCLASSIFIED:
        'Try comparing -2°C and -7°C to explain which is warmer.',
    },
    prerequisite: 'ORDERING_DIRECTION',
    estimatedDurationSec: 90,
  },
];

/**
 * Validates that a question object (static or AI-generated) satisfies the required structured schema.
 */
export function validateStructuredQuestion(
  q: unknown
): q is StructuredQuestion {
  if (!q || typeof q !== 'object') return false;
  const candidate = q as Record<string, unknown>;
  const validFormats = [
    'NUMBER_LINE',
    'COUNTER_BOARD',
    'STEP_BY_STEP',
    'ERROR_SPOTTING',
    'WRITTEN_EXPLANATION',
  ];
  if (typeof candidate.id !== 'string' || !candidate.id) return false;
  if (!validFormats.includes(String(candidate.format))) return false;
  if (![1, 2, 3].includes(Number(candidate.difficulty))) return false;
  if (typeof candidate.prompt !== 'string' || candidate.prompt.trim().length < 8)
    return false;
  if (
    typeof candidate.correctAnswer !== 'number' &&
    typeof candidate.correctAnswer !== 'string'
  ) {
    return false;
  }
  if (!Array.isArray(candidate.solutionSteps) || candidate.solutionSteps.length === 0)
    return false;
  if (!candidate.feedback || typeof candidate.feedback !== 'object') return false;
  return true;
}
