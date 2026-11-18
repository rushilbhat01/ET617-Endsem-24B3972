# DESIGN.md — IntegerEase: Adaptive Integer Tutor

**Exam Card:** `P4 – T1 – L5 – C4`  
**Identity Token (Roll No):** `24B3972`  
**GitHub Repository:** `https://github.com/rushilbhat01/ET617-Endsem-24B3972`  
**Target Deployment URL:** `https://et617-24B3972.vercel.app`

---

## 1. Educational Problem, Learning Outcomes & Context of Use (D1)

### Problem Statement
Class 7 learners who are repeating *Integers: operations with negative numbers* often rely on memorized, fragile sign rules (such as *"two negatives make a negative"*) rather than understanding direction on a number line or zero-pair cancellation. When they apply these rules inconsistently, they make recurring sign errors—especially when subtracting negative numbers or comparing two negative values. Traditional practice platforms mark these errors with punitive red indicators and generic hints, which deepens math anxiety and lowers self-efficacy for repeat learners. An adaptive tutor that diagnoses the specific misconception behind a response, switches to visual representations when needed, and structures practice into calm 10-minute sessions can rebuild both conceptual understanding and learner confidence.

### Measurable Learning Outcomes
By the end of a 10-minute session, the learner will be able to:
1. **Compare & Represent** positive and negative integers on a number line and with two-color counters to explain why `-2 > -5`.
2. **Compute & Predict** sums and differences of signed integers (including subtracting a negative integer, e.g., `-4 - (-2)`) using zero-pair or number-line reasoning.
3. **Justify & Debug** an integer operation in their own words, identifying and correcting common sign misconceptions.

### Context of Use
- **Where:** At home or in an after-school study corner.
- **When:** Short evening study blocks (~10 minutes per session), with the ability to pause and resume mid-session.
- **Device:** Personal or parent's mid-range Android smartphone (mobile-friendly layout) or home laptop browser.

---

## 2. Learner Persona (D2 — Expanded from L5)

- **Name & Age:** Aarav Kulkarni, 13 years old (Class 7).
- **Academic Background:** Repeating the *Integers* unit after failing his mid-term unit test (`L5`).
- **Prior Knowledge (Prerequisites):** Fluent in whole-number addition and subtraction (`0` to `100`) and understands real-world contexts like temperature below zero or elevator floors, but is uncertain about ordering two negative numbers (`-8` vs `-3`) and does not yet understand *zero pairs* (`+1 + -1 = 0`).
- **Two Likely Misconceptions:**
  1. **M1 — Magnitude-Over-Sign (Ordering & Direction Gap):** Treats `-8` as greater than `-3` because `8 > 3`, or assumes adding a negative number always increases the value.
  2. **M2 — Overgeneralized Sign Rule (Subtracting Negatives):** Believes *"two negatives always make a negative"* (e.g., `-4 - (-2) = -6`) or assumes subtraction *always* moves left and makes the result smaller.
- **Device & Time:** Uses a mid-range Android phone or shared home laptop for 10–15 minutes in the evening (`C4`).
- **Language:** English-medium school; prefers short, warm, conversational everyday English without dense jargon.
- **Motivation & Affect:** High math anxiety and low self-efficacy (*"I always mess up the minus signs"*). Shuts down when shown timed countdowns that feel like tests or harsh red error screens; responds well to low-stakes encouragement, peer-debugging tasks, and small visible wins.

---

## 3. Educational Content Plan (D3)

### Concept Explanation (Conversational & Visual)
Using a calm, conversational tone (*"Let us explore this together..."*), the tutor introduces two concrete tools (`T6` rubric):
- **Two-Color Counters:** Yellow `+1` tiles and Red `-1` tiles. Whenever one `+1` and one `-1` meet, they form a **Zero Pair** and cancel out to `0`. Subtracting a negative means *taking away red `-1` tiles* (if you do not have enough red tiles, add a Zero Pair first—taking away `-1` leaves `+1` behind!).
- **Interactive Number Line:** Positive moves right; negative moves left. Subtracting a negative reverses direction—turning left-facing subtraction around to move **right**.

### Learning Tasks (5+ Core Tasks across 4 Formats)

| # | Format | Task Prompt | Model Answer | Correct Feedback | M1 Feedback | M2 Feedback |
|---|---|---|---|---|---|---|
| **1** | **Interactive Number Line Jump** | Start at `-3`. Show `-3 + 5` by dragging/stepping on the number line. | `2` (5 steps right from `-3` passes `0` to `2`). | "Nice! Moving right 5 steps from `-3` crosses `0` and lands on `2`." | "Remember: `+5` moves right (warmer/up). Let's count 3 steps to `0`, then 2 more!" | "You moved the right distance, check the sign direction: adding `+5` goes right, not left." |
| **2** | **Two-Color Counter / Zero-Pair Builder** | Model `2 + (-5)` using `+1` and `-1` tiles. Pair up zero pairs—what is left? | `-3` (2 zero pairs cancel; 3 red `-1` tiles remain). | "Spot on! Two `+1` and two `-1` tiles cancel as zero pairs, leaving `-3`." | "Look at the leftover tiles: 3 red `-1` tiles are left, so the value is `-3`, not `+3`." | "Adding `-5` puts 5 red tiles on the board—it doesn't subtract from `-5`." |
| **3** | **Step-by-Step Numeric Input** | Solve `-4 - (-2)` in two steps: first rewrite as addition, then find the final value. | Rewrite: `-4 + 2`; Final: `-2`. | "Great job! Taking away 2 red `-1` tiles from 4 red tiles leaves `-2`." | "Check which number is larger in magnitude: `-4` has 4 reds and `+2` has 2 yellows, so 2 reds remain (`-2`)." | "Careful with `-(-2)`: taking away a negative is like removing a debt—the value goes *up* (right) by 2, not down to `-6`!" |
| **4** | **Error-Spotting (Debug a Peer's Work)** | Rohan wrote: `-6 - (-3) = -9`. Which step went wrong, and how do we fix it? | Rohan added `-3` instead of subtracting `-3`. Correct: `-6 + 3 = -3`. | "Sharp eye! Removing `-3` moves right 3 steps to `-3`." | "Check the sign of the final answer: `-6` is further left than `+3` can reach, so we stay at `-3`." | "Rohan used the 'two negatives make a negative' trap! Subtracting `-3` means removing 3 red tiles, leaving `-3`." |
| **5** | **Short Written Explanation (AI-Evaluated)** | In your own words, why does `3 - (-2)` give `5` instead of `1`? | Subtracting `-2` means taking away 2 negative tiles (or adding 2 zero pairs and removing `-2`), which increases `3` by `2` to `5`. | "Clear reasoning! You explained *why* removing a negative increases the value." | "Your explanation mixes up `+2` and `-2`—let's picture 3 yellow tiles and add 2 zero pairs to see what happens when we remove `-2`." | "Notice you treated `-(-2)` like `-2`. Try thinking: if we remove a `-2` debt from `3`, do we have more or less?" |

*(Plus AI-generated adaptive follow-up questions in Formats 1–4 tailored to the learner's current mastery and diagnosed misconception.)*

---

## 4. P4 Adaptive Decision Rule & C4 Session Design

### Signals Tracked (Rubric `P13_CP`)
1. **Learner Profile (Diagnostic):** 2-question low-stakes check-in at session start (sets starting tier: *Prerequisite Warm-up* vs. *Standard*).
2. **Learner Performance:** Correctness + specific misconception classification (`M1`, `M2`, or `arithmetic_slip`).
3. **Learner Interaction:** Number of hints requested, retries on the current task, and time spent.

### Explicit 3-Way Decision Rule (P4 Design Challenge)
After each submitted response, the tutor evaluates `(correctness, misconceptionTag, consecutiveCorrect, consecutiveSameMisconception, hintsUsed)` and routes to exactly one of three visible outcomes:

1. **Outcome A — Harder Question (Challenge Up):**
   - *Rule:* `correct === true` AND `consecutiveCorrect >= 2` AND `hintsUsed <= 1`.
   - *Action:* Advances difficulty tier (e.g., larger magnitudes, two-step mixed expressions like `-5 - (-8) + (-2)`, or open explanation tasks) with an encouraging badge.
2. **Outcome B — Alternative Explanation (Lateral Scaffold):**
   - *Rule:* `correct === false` AND (`consecutiveSameMisconception === 1` OR `hintsUsed >= 2`).
   - *Action:* Keeps the learner at the same conceptual level without penalty, switches modality (e.g., from symbolic numbers to visual Two-Color Counters or animated Number Line jump), and gives a targeted misconception hint.
3. **Outcome C — Prerequisite Instruction (Step Back):**
   - *Rule:* `consecutiveSameMisconception >= 2` OR `diagnosticScore === 0`.
   - *Action:* Pauses the main problem queue and launches a 60-second interactive **Prerequisite Micro-Lesson**:
     - For `M1`: *Ordering Negative Numbers on a Number Line* (comparing `-8` vs `-3` with thermometer/elevation cues).
     - For `M2`: *Zero Pairs & Why Removing Negatives Moves Right*.
     Followed by a gentle confidence-builder question before returning to the main track.

### C4 — 10-Minute Session Architecture
- **Total Target Time:** 10 minutes, structured into 4 bite-sized stages:
  1. *Calm Check-in* (~1 min)
  2. *Interactive Concept Warm-up* (~2 min)
  3. *Adaptive Practice Loop* (~5 min)
  4. *Session Summary & Reflection* (~2 min)
- **Visible C4 Controls:**
  - A gentle, non-anxious **10-minute session progress & elapsed time indicator** (no stressful red countdown).
  - **"Save & Pause"** button available on every screen, persisting full session state (current screen, task index, adaptive tier, misconception counts, elapsed time) in `localStorage` so Aarav can leave and **Resume Where You Left Off** anytime.

---

## 5. Planned Screen Map (6 Connected Screens)

1. **Screen 1 — Welcome & Resume (`/`):** Calm intro, 10-minute session overview, "Start New 10-Min Session" / "Resume Saved Session" (`C4`), and link to About.
2. **Screen 2 — Low-Stakes Check-in:** 2 gentle baseline questions to set starting tier (`P13_CP`).
3. **Screen 3 — Interactive Concept Warm-up (`T6`):** Conversational explanation + sandbox **Number Line & Two-Color Counter** manipulative.
4. **Screen 4 — Adaptive Practice Workspace (`P4`):** 4 question formats (Number Line, Counter Builder, Step-by-Step Input, Error-Spotting, Written Explanation) + Hint button + Save & Pause.
5. **Screen 5 — Adaptive Decision & Feedback View:** Clearly displays the tutor's feedback and which of the 3 decision-rule paths was triggered (*Harder Question*, *Alternative Explanation*, or *Prerequisite Micro-Lesson*).
6. **Screen 6 — 10-Minute Session Summary & About Screen:** Celebrates effort, shows concepts practiced, and provides an **About** view with full card details (`P4 T1 L5 C4`) and Roll No `24B3972`.

*Identity Token `24B3972` is displayed in the persistent footer of every screen and on the About screen.*
