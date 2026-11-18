import { NextRequest, NextResponse } from 'next/server';
import { evaluateWrittenExplanationLocally } from '@/lib/adaptiveEngine';
import { QUESTION_BANK, validateStructuredQuestion } from '@/lib/questionBank';
import {
  DifficultyLevel,
  MisconceptionType,
  QuestionFormat,
  StructuredQuestion,
} from '@/types/tutor';

const ALLOWED_MISCONCEPTIONS: MisconceptionType[] = [
  'NONE',
  'M1_MAGNITUDE_SIGN',
  'M2_DOUBLE_NEGATIVE',
  'NON_CONCEPTUAL_SLIP',
  'UNCLASSIFIED',
];

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  }

  if (openaiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action as string;

    if (action === 'EVALUATE_EXPLANATION') {
      const question = body.question as StructuredQuestion;
      const learnerExplanation = String(body.learnerExplanation ?? '').trim();

      if (!question || !learnerExplanation) {
        return NextResponse.json(
          { error: 'Missing question or learnerExplanation' },
          { status: 400 }
        );
      }

      const systemPrompt = `You are a calm, encouraging Class 7 math tutor helping a learner who has math anxiety.
Evaluate the learner's short written explanation for an integer operation question.
Classify the response into EXACTLY ONE of:
- NONE (conceptually valid)
- M1_MAGNITUDE_SIGN (confuses magnitude with negative value/direction, e.g., thinks -7 > -2)
- M2_DOUBLE_NEGATIVE (thinks two negatives always stay negative or subtracting a negative decreases the value)
- NON_CONCEPTUAL_SLIP (right idea, minor wording/number slip)
- UNCLASSIFIED (too vague or unrelated to diagnose)

Return strict JSON:
{
  "isCorrect": boolean,
  "misconception": "NONE" | "M1_MAGNITUDE_SIGN" | "M2_DOUBLE_NEGATIVE" | "NON_CONCEPTUAL_SLIP" | "UNCLASSIFIED",
  "explanationQuality": "ADEQUATE" | "PARTIAL" | "MISCONCEPTION",
  "feedbackMessage": "1-2 warm, simple sentences tailored to the learner's words"
}`;

      const userPrompt = `Question: ${question.prompt}
Concept: ${question.concept}
Model Idea: ${question.correctAnswer}
Learner's Explanation: "${learnerExplanation}"`;

      try {
        const raw = await callLLM(systemPrompt, userPrompt);
        if (raw) {
          const parsed = JSON.parse(raw);
          const validMisc = ALLOWED_MISCONCEPTIONS.includes(parsed.misconception);
          const validQuality = ['ADEQUATE', 'PARTIAL', 'MISCONCEPTION'].includes(
            parsed.explanationQuality
          );
          if (
            typeof parsed.isCorrect === 'boolean' &&
            validMisc &&
            validQuality &&
            typeof parsed.feedbackMessage === 'string' &&
            parsed.feedbackMessage.trim().length > 5 &&
            parsed.feedbackMessage.length <= 400
          ) {
            return NextResponse.json({
              source: 'AI_LIVE',
              isCorrect: parsed.isCorrect,
              misconception: parsed.misconception,
              explanationQuality: parsed.explanationQuality,
              feedbackMessage: parsed.feedbackMessage.trim(),
            });
          }
        }
      } catch {
        // Fall through to deterministic fallback
      }

      // Deterministic fallback
      const local = evaluateWrittenExplanationLocally(question, learnerExplanation);
      const fallbackFeedback =
        local.isCorrect || local.misconception === 'NONE'
          ? question.feedback.correct
          : question.feedback[local.misconception];

      return NextResponse.json({
        source: 'FALLBACK_LOCAL',
        isCorrect: local.isCorrect,
        misconception: local.misconception,
        explanationQuality: local.explanationQuality,
        feedbackMessage: fallbackFeedback,
      });
    }

    if (action === 'GENERATE_QUESTION') {
      const targetDifficulty = ([1, 2, 3].includes(Number(body.targetDifficulty))
        ? Number(body.targetDifficulty)
        : 1) as DifficultyLevel;
      const focusMisconception = String(body.focusMisconception ?? 'NONE');
      const preferredFormat = (body.preferredFormat ?? 'STEP_BY_STEP') as QuestionFormat;
      const avoidIds = Array.isArray(body.avoidIds) ? (body.avoidIds as string[]) : [];
      const avoidPrompts = Array.isArray(body.avoidPrompts)
        ? (body.avoidPrompts as string[]).map((p) => p.trim().toLowerCase())
        : [];

      const systemPrompt = `You are a Class 7 math curriculum designer creating a single calm, age-appropriate integer operation task.
IMPORTANT: Every question MUST involve at least one negative integer (for example: -5 + 8, -4 - (-2), 3 - (-4), -7 + 3). NEVER generate purely positive arithmetic like "3 + 4".
Keep all numbers small (integers between -10 and +10) so they fit on a -10..10 number line or counter board.
Return strict JSON matching this exact schema:
{
  "id": "ai-<unique>",
  "format": "STEP_BY_STEP" | "NUMBER_LINE",
  "difficulty": 1 | 2 | 3,
  "concept": "short concept label",
  "prompt": "clear, friendly question prompt",
  "hint": "1 calm hint",
  "startValue": number (only if NUMBER_LINE, between -9 and 9),
  "rewritePrompt": "Step 1: Rewrite the expression using addition (only if STEP_BY_STEP; NEVER reveal the rewritten answer or signs like '5 + 3')",
  "correctAnswer": number (integer between -10 and 10),
  "solutionSteps": ["step 1", "step 2"],
  "misconceptionMappings": { "<wrongAnswer>": "M1_MAGNITUDE_SIGN" | "M2_DOUBLE_NEGATIVE" },
  "feedback": {
    "correct": "warm praise",
    "M1_MAGNITUDE_SIGN": "gentle direction/sign scaffold",
    "M2_DOUBLE_NEGATIVE": "gentle zero-pair/removing-negative scaffold",
    "NON_CONCEPTUAL_SLIP": "gentle recount prompt",
    "UNCLASSIFIED": "gentle try-again prompt"
  },
  "prerequisite": "ORDERING_DIRECTION" | "ZERO_PAIRS_SUBTRACTION",
  "estimatedDurationSec": 75
}`;

      const userPrompt = `Target Difficulty: ${targetDifficulty}
Focus Misconception: ${focusMisconception}
Preferred Format: ${preferredFormat === 'NUMBER_LINE' ? 'NUMBER_LINE' : 'STEP_BY_STEP'}
Do NOT repeat any of these already-seen prompts: ${avoidPrompts.join(' | ') || 'none'}`;

      try {
        const raw = await callLLM(systemPrompt, userPrompt);
        if (raw) {
          const candidate = JSON.parse(raw);
          // Schema + math range + negative-integer check before learner sees it
          const ansNum = Number(candidate?.correctAnswer);
          const mathValid =
            Number.isInteger(ansNum) && ansNum >= -10 && ansNum <= 10;
          const hasNegativeInteger =
            typeof candidate?.prompt === 'string' &&
            /-\d+/.test(candidate.prompt);

          const isDuplicatePrompt =
            typeof candidate?.prompt === 'string' &&
            avoidPrompts.includes(candidate.prompt.trim().toLowerCase());

          if (
            validateStructuredQuestion(candidate) &&
            mathValid &&
            hasNegativeInteger &&
            !isDuplicatePrompt
          ) {
            return NextResponse.json({
              source: 'AI_LIVE',
              question: {
                ...candidate,
                id: `ai-${Date.now()}`,
                isAIGenerated: true,
              },
            });
          }
        }
      } catch {
        // Fall through to curated fallback
      }

      // Curated fallback from QUESTION_BANK (never repeat seen IDs or prompts)
      const fallbackQ =
        QUESTION_BANK.find(
          (q) =>
            q.difficulty === targetDifficulty &&
            !avoidIds.includes(q.id) &&
            !avoidPrompts.includes(q.prompt.trim().toLowerCase())
        ) ??
        QUESTION_BANK.find(
          (q) =>
            !avoidIds.includes(q.id) &&
            !avoidPrompts.includes(q.prompt.trim().toLowerCase())
        ) ??
        QUESTION_BANK.find((q) => !avoidIds.includes(q.id)) ??
        QUESTION_BANK[0];

      return NextResponse.json({
        source: 'FALLBACK_BANK',
        question: fallbackQ,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request payload' },
      { status: 400 }
    );
  }
}
