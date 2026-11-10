// Non-sensitive, in-game writing. Everything here ships in the public bundle,
// so it contains jokes and game rules only — no private letters, emails or photos.
import type { GameId, Role } from '../lib/types'

export const TITLE = 'ONLY FOR PROFESSOR LILY'
export const TAGLINE = 'An extremely serious university with a deeply unserious robot.'
export const UNIVERSITY = 'The University of DUBOT & Questionable Academic Decisions'

export const SUBTITLES = [
  TAGLINE,
  'Peer review rejected. Coffee approved.',
  "Today's research question: Why is DUBOT holding a flower?",
  'Officially funded by zero won and too many letters.',
  'No surprise cranial nerve exams during stargazing.',
  'Professor Lily: 100/100. Student Satyam: under investigation.',
]

export const DUBOT_QUIPS = [
  'Order received: Iced vanilla latte. Preparing... botanical water!',
  'Error 418: I am a teapot. A very artistic teapot.',
  'Professor Lily has revoked my florist license.',
  'I fold laundry in exchange for 3 chicken treats.',
  'I am not malfunctioning. I am expressing myself.',
  'The university budget is still ₩0.',
  'Faculty meeting canceled due to excessive cuteness.',
  "It's not a bug. It's botanical innovation.",
  'Please do not ask the robot to compose dramatic space-movie organ music.',
  'The cameras are OFF. We respect the professor’s privacy.',
  'Computer Vision Department permanently CLOSED for selfies.',
  'New letter submitted. Estimated length: doctoral dissertation.',
  'Lab report: Researcher Satyam smiles at his phone every time a letter arrives from Seoul. I have data.',
  'Sensor reading: lab happiness levels rise sharply whenever Professor Lily writes. Correlation: 100%.',
  'I was told not to mention that the researcher thinks the professor is wonderful. Oops.',
]

export const BULLETINS = [
  'You gave me the title. Now complete the homework.',
  '오늘도 수고했어요 — official 100/100 for surviving today.',
  'Faculty has reviewed the budget and discovered ₩0.',
  'REGULATION #001: no flowers in iced vanilla latte.',
  'Humankind invented the washer and forgot the folding part.',
  'Professor Lily has a 100-point rubric and no mercy.',
  'Same sea. Different memories. Neither feeling is wrong.',
  'No tests at the observatory. Not even one.',
  'Turn on the lights! The professor has finished watching a horror movie.',
  'Seoul student + Daejeon researcher = remote faculty meeting.',
  'Coffee is optional. Good conversation is the whole point.',
  'Even ordinary days deserve a place in the scrapbook.',
]

export const RULEBOOK = [
  'Flower water is not coffee.',
  'No surprise Korean examinations under the stars.',
  'No forced cranial-nerve pop quizzes.',
  'Robots may arrange flowers only after working hours.',
  'A tired student still deserves to hear: 오늘도 수고했어요.',
  'No AI detective work on selfies.',
  'Coffee budget requests must be reviewed by the faculty (funding: ₩0).',
]

export function encouragementsFor(role: Role): string[] {
  const shared = [
    '오늘도 수고했어요 🤍',
    "You survived today's academic nonsense.",
    "You worked hard today, even if you didn't finish everything.",
    'Same sky, two cities. Rest well tonight. ⭐',
    'Official faculty decision: you deserve a nap.',
  ]
  return role === 'satyam'
    ? [...shared, 'Professor Lily has officially earned a coffee break.']
    : [...shared, 'Researcher Satyam has officially earned a coffee break.']
}

export interface DialogueLine {
  who: 'dubot' | 'lily' | 'satyam' | 'stamp'
  text: string
}

export function introDialogue(role: Role): DialogueLine[] {
  if (role === 'lily') {
    return [
      { who: 'dubot', text: 'Professor Lily, your iced vanilla latte is ready!' },
      { who: 'lily', text: 'WHY IS THERE A FLOWER IN MY WATER?!' },
      { who: 'dubot', text: "It's an artistic interpretation." },
      { who: 'stamp', text: 'REGULATION #001 ENACTED' },
    ]
  }
  return [
    { who: 'dubot', text: 'Researcher Satyam! I delivered the latte to Professor Lily.' },
    { who: 'satyam', text: '...Was it a latte, DUBOT?' },
    { who: 'dubot', text: 'It was a flower. In water. Very artistic.' },
    { who: 'stamp', text: 'FLORIST LICENSE: STILL SUSPENDED' },
  ]
}

export const COOP_LEVELS = [
  { min: 0, name: 'Tiny Café Startup' },
  { min: 40, name: 'Robot Has an Apron' },
  { min: 100, name: 'Espresso Machine Acquired' },
  { min: 180, name: 'Faculty Lounge Unlocked' },
  { min: 300, name: 'Famous Café (pop. 2 humans, 2 dogs, 1 robot)' },
  { min: 500, name: 'Legendary Campus of Questionable Decisions' },
]

export interface StoryCardDef {
  id: string
  title: string
  hint: string
  lines: string[]
  art: 'cafe' | 'exam' | 'certificate' | 'stars' | 'tofu' | 'simba' | 'mountain' | 'budget' | 'soup' | 'meeting' | 'letter'
}

export const STORY_CARDS: StoryCardDef[] = [
  {
    id: 'flower_water_incident',
    title: 'The Flower Water Incident',
    hint: 'Play “Latte or Flower?” once.',
    art: 'cafe',
    lines: [
      'Order: one iced vanilla latte.',
      'Delivered: one glass of water, one (1) flower.',
      'DUBOT: “It’s not a bug. It’s botanical innovation.”',
      'University Regulation #001 was enacted the same afternoon.',
    ],
  },
  {
    id: 'cranial_nerves_strike_back',
    title: 'The 12 Cranial Nerves Strike Back',
    hint: 'Sit Professor Lily’s Totally Fair Exam.',
    art: 'exam',
    lines: [
      'Twelve nerves marched into the faculty office demanding a pop quiz.',
      'The professor declined: “No surprise anatomy questions tonight. Faculty promise.”',
      'The vagus nerve wandered off anyway. It does that.',
    ],
  },
  {
    id: 'korean_homework_certificate',
    title: 'The 100/100 Korean Homework Certificate',
    hint: 'Score a perfect exam.',
    art: 'certificate',
    lines: [
      'CERTIFICATE OF EXCELLENCE',
      'Awarded for surviving today. 오늘도 수고했어요 — official 100/100.',
      'Signed: Professor Lily. Rubric: 100 points. Mercy: optional.',
    ],
  },
  {
    id: 'silvermoon_zero_quests',
    title: 'Silvermoon: 0 Quests Completed, 5 Stars Admired',
    hint: 'Visit the Silvermoon Observatory.',
    art: 'stars',
    lines: ['Mission progress: 0%.', 'Beautiful architecture appreciated: 100%.', 'Some nights aren’t for finishing quests.'],
  },
  {
    id: 'tofu_snack_request',
    title: 'Tofu’s Unauthorized Snack Request',
    hint: 'Play “The Great Café Escape”.',
    art: 'tofu',
    lines: [
      'The defendant requests treats before answering any questions.',
      'The court notes that the defendant is extremely fluffy.',
      'Verdict: pending. Snack: pending. Cuteness: undeniable.',
    ],
  },
  {
    id: 'simba_innocence_hearing',
    title: 'Simba’s Innocence Hearing',
    hint: 'Survive “The Great Laundry Crisis”.',
    art: 'simba',
    lines: [
      'Exhibit A: one (1) sock, relocated.',
      'Simba: “I am innocent. The sock moved by itself.”',
      'Innocence meter: 100%. Evidence: also 100%. Case closed, somehow.',
    ],
  },
  {
    id: 'freezing_wind_report',
    title: 'Yên Tử & Fansipan: The Freezing Wind Report',
    hint: 'Finish your first shared constellation.',
    art: 'mountain',
    lines: [
      'Field report from the researcher:',
      'Freezing wind: 100%. Regret: temporary. View: worth it.',
      'Researcher has willingly climbed another mountain. Again.',
      'Conclusion: stars look closer from the top.',
    ],
  },
  {
    id: 'emergency_coffee_funding',
    title: 'Emergency Coffee Funding Meeting',
    hint: 'Play both café games.',
    art: 'budget',
    lines: [
      'Agenda item 1: two iced vanilla lattes.',
      'Faculty has reviewed the budget and discovered ₩0.',
      'Motion to fund with café coins: carried, pending more games.',
    ],
  },
  {
    id: 'suspiciously_fishy_soup',
    title: 'The Case of the Suspiciously Fishy Soup',
    hint: 'Solve a Vegetarian Detective case.',
    art: 'soup',
    lines: [
      'The soup claimed to be “just vegetables”.',
      'The magnifying glass disagreed.',
      'This vegetable soup is acting suspiciously fishy. (Always verify actual ingredients when ordering.)',
    ],
  },
  {
    id: 'remote_faculty_meeting',
    title: 'Seoul + Daejeon = Remote Faculty Meeting',
    hint: 'Both players finish at least one game.',
    art: 'meeting',
    lines: [
      'Seoul student + Daejeon researcher = remote faculty meeting.',
      'Minutes: DUBOT spilled the minutes.',
      'Attendance: 2 humans, 2 dogs (remote), 1 confused robot.',
    ],
  },
  {
    id: 'ordinary_days',
    title: 'Even Ordinary Days Deserve a Page',
    hint: 'Leave a note in the Letterbox.',
    art: 'letter',
    lines: [
      'Nothing dramatic happened today.',
      'Someone left a little note anyway.',
      'Even ordinary days deserve a place in the scrapbook.',
    ],
  },
]

export interface BadgeDef {
  id: string
  title: string
  glyph: string
  how: string
  hidden?: boolean
  shared?: boolean
}

export const BADGES: BadgeDef[] = [
  { id: 'flower_water_survivor', title: 'Flower Water Survivor', glyph: '🌸', how: 'Play Latte or Flower?' },
  { id: 'honorary_english_teacher', title: 'Honorary English Teacher', glyph: '✏️', how: 'Leave 3 notes in the Letterbox' },
  { id: 'korean_homework_100', title: 'Korean Homework 100/100', glyph: '💯', how: 'Ace the Totally Fair Exam' },
  { id: 'sock_crime_investigator', title: 'Sock Crime Investigator', glyph: '🧦', how: 'Finish the Great Café Escape' },
  { id: 'cranial_nerve_survivor', title: 'Cranial Nerve Survivor', glyph: '🧠', how: 'Get a bonus cranial-nerve question right' },
  { id: 'observatory_dreamer', title: 'Observatory Dreamer', glyph: '🔭', how: 'Visit the Silvermoon Observatory' },
  { id: 'vegetarian_detective', title: 'Vegetarian Detective', glyph: '🔍', how: 'Score 80+ in the Detective Kitchen' },
  { id: 'folding_pioneer', title: 'Autonomous Folding Pioneer', glyph: '🧺', how: 'Fold all the laundry' },
  { id: 'cafe_funding_approved', title: 'Café Funding Approved', glyph: '☕', how: 'Shared budget reaches ₩11,000', shared: true },
  { id: 'no_peer_review_required', title: 'No Peer Review Required', glyph: '📜', how: 'A secret. Keep reading.', hidden: true },
]

export interface GameMeta {
  id: GameId
  title: string
  place: string
  howTo: string
  tagline: string
  accent: string
}

export const GAMES: GameMeta[] = [
  {
    id: 'latte_rescue',
    title: 'Latte or Flower?',
    place: 'DUBOT Café',
    tagline: 'Rescue the order before DUBOT gets artistic.',
    howTo:
      'Tap the real ingredients of an Iced Vanilla Latte — cup first — before DUBOT’s “artistic interpretation” meter fills. Three wrong ingredients and DUBOT serves his masterpiece instead.',
    accent: 'var(--blush)',
  },
  {
    id: 'totally_fair_exam',
    title: 'Professor Lily’s Totally Fair Exam',
    place: 'Professor Lily’s Office',
    tagline: 'Five questions. One rubric. Zero mercy (some mercy).',
    howTo: 'Answer five tiny questions; the professor grades them all at the end. Bonus cranial-nerve questions can be skipped with no penalty.',
    accent: 'var(--lavender-strong)',
  },
  {
    id: 'observatory',
    title: 'Silvermoon Observatory',
    place: 'Silvermoon Observatory',
    tagline: 'Collect 5 stars — or just look at them.',
    howTo: 'Walk with ◀ ▶ and jump with ▲ (or arrow keys + space) to collect the five stars. Your stars light up the constellation you share.',
    accent: 'var(--star)',
  },
  {
    id: 'veggie_detective',
    title: 'Vegetarian Ingredient Detective',
    place: 'Vegetarian Detective Kitchen',
    tagline: 'Find the anchovy broth hiding in plain sight.',
    howTo: 'For each dish, decide: Safe for a vegetarian (no meat, fish or egg — dairy is OK) or Suspicious. It’s a game, not a certification!',
    accent: 'var(--mint)',
  },
  {
    id: 'cafe_escape',
    title: 'Tofu & Simba: The Great Café Escape',
    place: 'Tofu & Simba Park',
    tagline: '25 seconds of pure, harmless chaos.',
    howTo: 'Tap toys to collect them and tap a pet heading for DUBOT’s tray to send it zooming elsewhere. Don’t tap the socks and cups!',
    accent: 'var(--peach)',
  },
  {
    id: 'laundry_crisis',
    title: 'The Great Laundry Crisis',
    place: 'Robotics Lab',
    tagline: 'Humankind invented the washer and forgot the folding part.',
    howTo: 'Drag each garment onto the right basket (or tap a garment, then a basket). Keep an eye on DUBOT — he will try to escape.',
    accent: 'var(--sky)',
  },
]

export function gameMeta(id: GameId): GameMeta {
  return GAMES.find((g) => g.id === id) ?? GAMES[0]
}

/** Star layout (0..100 × 0..60) for drawing each shared constellation. */
export const CONSTELLATION_SHAPES: Record<string, { x: number; y: number }[]> = {
  flower_water_nebula: [
    { x: 50, y: 10 },
    { x: 78, y: 26 },
    { x: 66, y: 52 },
    { x: 34, y: 52 },
    { x: 22, y: 26 },
  ],
  tofu_minor: [
    { x: 20, y: 40 },
    { x: 36, y: 16 },
    { x: 56, y: 22 },
    { x: 74, y: 12 },
    { x: 84, y: 44 },
  ],
  simba_major: [
    { x: 12, y: 48 },
    { x: 32, y: 30 },
    { x: 52, y: 36 },
    { x: 72, y: 18 },
    { x: 90, y: 30 },
  ],
  organ_chord_cluster: [
    { x: 18, y: 50 },
    { x: 34, y: 20 },
    { x: 50, y: 44 },
    { x: 66, y: 14 },
    { x: 82, y: 46 },
  ],
  twelve_nerves: [
    { x: 14, y: 30 },
    { x: 32, y: 12 },
    { x: 50, y: 28 },
    { x: 68, y: 12 },
    { x: 86, y: 30 },
  ],
}
