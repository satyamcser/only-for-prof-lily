// Exam questions. The ANSWER KEY is deliberately NOT in this file: it lives in
// the database (app_private.exam_answer_key) and the server grades each exam.

export interface ExamQuestion {
  id: string
  prompt: string
  options: [string, string, string, string]
  bonus?: boolean // optional cranial-nerve question: skippable, no penalty
}

export const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 'q_sugohaesseoyo',
    prompt: 'What does 오늘도 수고했어요 mean?',
    options: ['You worked hard today', 'Please do more homework', 'The café is closed', 'Your robot is broken'],
  },
  {
    id: 'q_forbidden',
    prompt: 'What is DUBOT officially forbidden from serving?',
    options: ['Hot chocolate on Mondays', 'Tofu’s secret snacks', 'Flower water as an iced vanilla latte', 'Dramatic organ music'],
  },
  {
    id: 'q_sock_thief',
    prompt: 'Which pet is the campus’s certified (in-game) sock thief?',
    options: ['Tofu', 'Simba', 'DUBOT', 'The Dean of Snacks'],
  },
  {
    id: 'q_hard_day',
    prompt: 'What is the proper response to someone’s hard day?',
    options: [
      'Send a 40-page action plan',
      'Listen before giving unsolicited advice',
      'Schedule a surprise exam',
      'Peer-review their feelings',
    ],
  },
  {
    id: 'q_neural',
    prompt: 'Do neural models fully capture a person’s feelings?',
    options: ['Yes, with 100% accuracy', 'Only on Tuesdays', 'Only if the GPU is warm', 'No — lived experience and meaning matter'],
  },
  {
    id: 'q_budget',
    prompt: 'What is the official university coffee budget?',
    options: ['₩0', '₩1,000,000', 'Unlimited', 'Three chicken treats'],
  },
  {
    id: 'q_regulation',
    prompt: 'University Regulation #001 states…',
    options: ['Robots must wear hats', 'Exams only during stargazing', 'Flower water is not an iced vanilla latte', 'Dogs grade the homework'],
  },
  {
    id: 'q_kaist',
    prompt: 'Where is Researcher Satyam doing his PhD?',
    options: ['Inside DUBOT', 'KAIST in Daejeon', 'A café in Hanoi', 'The Silvermoon Observatory'],
  },
  {
    id: 'q_two_seas',
    prompt: 'Two people remember the same sea differently. Who is wrong?',
    options: ['Neither — feelings about the same moment can differ', 'Whoever took fewer photos', 'Whoever writes shorter letters', 'The sea'],
  },
  {
    id: 'q_thank_you',
    prompt: 'Which is a polite way to say “thank you” in Korean?',
    options: ['안녕히 가세요', '맛있어요', '감사합니다', '잘 자요'],
  },
  {
    id: 'q_delicious',
    prompt: 'What does 맛있어요 mean?',
    options: ['It’s raining', 'I’m tired', 'Good luck', 'It’s delicious'],
  },
  {
    id: 'q_fansipan',
    prompt: 'The researcher’s official Fansipan summit report says…',
    options: ['Free iced lattes at the top', 'Freezing wind: 100%. View: worth it.', 'No wind at all', 'Summit was a café'],
  },
  {
    id: 'q_observatory',
    prompt: 'What is the rule at the Silvermoon Observatory?',
    options: ['No tests at the observatory. Not even one.', 'Surprise anatomy quiz at midnight', 'Quests must be finished first', 'Robots only'],
  },
  {
    id: 'q_defendant',
    prompt: 'What does Tofu request before answering any questions?',
    options: ['A lawyer robot', 'An iced vanilla latte', 'Treats', 'A cranial-nerve exam'],
  },
  {
    id: 'q_cameras',
    prompt: 'What is the campus camera policy?',
    options: ['Cameras everywhere', 'DUBOT-cam only', 'Livestream on Tuesdays', 'The cameras are OFF — privacy respected'],
  },
  {
    id: 'q_fishy_soup',
    prompt: 'What can make a “vegetable” soup suspiciously fishy?',
    options: ['Zucchini', 'Anchovy broth', 'Rice', 'Tofu'],
  },
  // Optional bonus questions — friendly, skippable, never a real assessment.
  {
    id: 'c_olfactory',
    prompt: 'Bonus (skippable): cranial nerve I is the…',
    options: ['Optic nerve', 'Vagus nerve', 'Olfactory nerve (smell)', 'Facial nerve'],
    bonus: true,
  },
  {
    id: 'c_optic',
    prompt: 'Bonus (skippable): which cranial nerve is mainly about vision?',
    options: ['II — Optic', 'V — Trigeminal', 'X — Vagus', 'XII — Hypoglossal'],
    bonus: true,
  },
  {
    id: 'c_vagus',
    prompt: 'Bonus (skippable): which cranial nerve “wanders” down to the chest and abdomen?',
    options: ['VII — Facial', 'I — Olfactory', 'IV — Trochlear', 'X — Vagus'],
    bonus: true,
  },
  {
    id: 'c_hypoglossal',
    prompt: 'Bonus (skippable): cranial nerve XII (hypoglossal) mainly controls…',
    options: ['Hearing', 'Tongue movement', 'Smell', 'Blinking'],
    bonus: true,
  },
  {
    id: 'c_vestibulo',
    prompt: 'Bonus (skippable): which nerve carries hearing and balance?',
    options: ['III — Oculomotor', 'XI — Accessory', 'VIII — Vestibulocochlear', 'II — Optic'],
    bonus: true,
  },
]

export function shuffle<T>(items: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** A round = 4 regular questions + 1 skippable bonus question. */
export function buildExamRound(rand: () => number = Math.random): ExamQuestion[] {
  const regular = shuffle(
    EXAM_QUESTIONS.filter((q) => !q.bonus),
    rand,
  ).slice(0, 4)
  const bonus = shuffle(
    EXAM_QUESTIONS.filter((q) => q.bonus),
    rand,
  ).slice(0, 1)
  return [...regular, ...bonus]
}

export function examTitle(score: number): { title: string; note: string } {
  if (score >= 100) return { title: 'DISTINCTION (suspiciously perfect)', note: 'The faculty is impressed and slightly worried.' }
  if (score >= 75) return { title: 'HONOURS', note: 'Professor Lily nods approvingly. Rare footage.' }
  if (score >= 50) return { title: 'PASS (with flower water)', note: 'Good effort! The rubric has been mildly softened.' }
  return { title: 'HONOURABLE PARTICIPATION', note: 'You showed up. 오늘도 수고했어요. That counts.' }
}
