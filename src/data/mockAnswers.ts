import { RoundtableAnswer } from '@/types/roundtable';

export const SAMPLE_QUESTIONS = [
  {
    id: 'q-1',
    text: 'How should I deal with anxiety about the future and things beyond my control?',
  },
  {
    id: 'q-2',
    text: 'How do I overcome creative self-doubt and the fear of not being good enough?',
  },
  {
    id: 'q-3',
    text: 'What is the true measure of a life well-lived?',
  },
];

export const MOCK_ROUNDTABLE_ANSWERS: RoundtableAnswer[] = [
  {
    id: 'ans-marcus-aurelius',
    questionId: 'q-1',
    question: 'How should I deal with anxiety about the future and things beyond my control?',
    figure: {
      id: 'marcus-aurelius',
      name: 'Marcus Aurelius',
      title: 'Roman Emperor & Stoic Philosopher',
      era: '121 – 180 CE',
      initials: 'MA',
      tradition: 'Stoicism',
      accentColor: 'amber',
    },
    directAnswer:
      'Turn your gaze inward. The external world cannot harm or agitate your mind unless you allow your judgment to declare it harmful. You possess an inner retreat that no future circumstance can breach.',
    passage: {
      text: 'Men seek retreats for themselves, houses in the country, sea-shores, and mountains; and thou too art wont to desire such things very much. But this is altogether a mark of the most common sort of men, for it is in thy power whenever thou shalt choose to retire into thyself. For nowhere either with more quiet or more freedom from trouble does a man retire than into his own soul, particularly when he has within him such thoughts that by looking into them he is immediately in perfect tranquility.',
      originalLanguage: 'Koine Greek (Τὰ εἰς ἑαυτόν)',
      source: {
        work: 'Meditations',
        section: 'Book IV, Section 3',
        year: 'c. 170–180 CE',
        translator: 'Translated by George Long (1862)',
        publicDomainNote: 'Public Domain',
        sourceUrl: 'https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_IV',
      },
      context:
        'Written in military campaign tents along the Danube River during the Marcomannic Wars, as Aurelius reminded himself not to be overwhelmed by empire-wide crises.',
    },
    explanation: {
      summary:
        'You don’t need an escape, a luxury retreat, or a vacation to find peace. Calm isn’t found by running away from stressful environments; it is accessed anytime by centering your own mind and choosing how you interpret events.',
      breakdown: [
        'People often fantasize about moving to the mountains or the beach to escape anxiety, but geographical changes do not fix an unsettled mind.',
        'Your mind has a private "inner sanctuary" that is always open to you, regardless of how turbulent external events are.',
        'True calm comes from returning to core values and focusing solely on what is within your direct control.',
      ],
      actionableTakeaway:
        'Whenever future worries strike, pause and ask: "Is this situation hurting me, or is my prediction about it distressing me?" Return to your immediate action right now.',
    },
    tags: ['Stoicism', 'Inner Peace', 'Dichotomy of Control', 'Anxiety'],
  },
  {
    id: 'ans-confucius',
    questionId: 'q-1',
    question: 'How should I deal with anxiety about the future and things beyond my control?',
    figure: {
      id: 'confucius',
      name: 'Confucius (Kongzi)',
      title: 'Philosopher & Teacher of Ruism',
      era: '551 – 479 BCE',
      initials: 'KZ',
      tradition: 'Eastern Philosophy',
      accentColor: 'emerald',
    },
    directAnswer:
      'Anchor yourself in personal virtue and continuous practice today. Cease tormenting yourself over whether fate or other people will reward you; when your inner conduct is sound, you have nothing to fear or regret.',
    passage: {
      text: 'The Master said: "The gentleman does not worry about other people not knowing him; he worries about his own lack of ability." He also said: "The gentleman is calm and at ease; the petty man is constantly anxious and fretful."',
      originalLanguage: 'Classical Chinese (論語)',
      source: {
        work: 'The Analects (Lunyu)',
        section: 'Book XIV, Chapter 32 & Book VII, Chapter 36',
        year: 'c. 475–221 BCE',
        translator: 'Translated by James Legge (1893)',
        publicDomainNote: 'Public Domain',
        sourceUrl: 'https://en.wikisource.org/wiki/The_Chinese_Classics/Volume_1/Confucian_Analects',
      },
      context:
        'Confucius traveled between warring states for over a decade without securing political reform, yet maintained composure by dedicating himself to teaching and personal character.',
    },
    explanation: {
      summary:
        'Anxiety flourishes when our self-esteem depends on things we cannot dictate—such as external praise, social status, or unpredictable fortunes. When your sole standard is your own integrity and daily effort, anxiety loses its grip.',
      breakdown: [
        'Worrying about what tomorrow brings or whether others recognize your worth drains the energy needed to cultivate competence.',
        'The composed person focuses on their own craft and kindness, whereas the fretful person fixates on outcomes they cannot control.',
        'Inner stability comes from knowing you performed your duty with sincerity.',
      ],
      actionableTakeaway:
        'Shift your focus from "Will I succeed and be recognized?" to "Did I put forth honest effort and treat others with dignity today?"',
    },
    tags: ['Mindfulness', 'Virtue', 'Integrity', 'Composure'],
  },
  {
    id: 'ans-ada-lovelace',
    questionId: 'q-1',
    question: 'How should I deal with anxiety about the future and things beyond my control?',
    figure: {
      id: 'ada-lovelace',
      name: 'Ada Lovelace',
      title: 'Pioneering Mathematician & First Computer Programmer',
      era: '1815 – 1852',
      initials: 'AL',
      tradition: 'Scientific Rationalism',
      accentColor: 'indigo',
    },
    directAnswer:
      'Treat overwhelming uncertainty as an intricate system to be mapped. Deconstruct chaotic prospects into their fundamental operational rules; imagination united with rigorous step-by-step logic transforms dread into clarity.',
    passage: {
      text: 'The Analytical Engine weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves... It may act upon other things besides number, were objects found whose mutual relations could be expressed by those of the abstract science of operations, which should be also susceptible of adaptations to the action of the operating notation and mechanism of the engine.',
      originalLanguage: 'English',
      source: {
        work: 'Sketch of the Analytical Engine Invented by Charles Babbage, with Notes by the Translator',
        section: 'Note A',
        year: '1843',
        translator: 'Original English Text',
        publicDomainNote: 'Public Domain (Published in Taylor’s Scientific Memoirs)',
        sourceUrl: 'https://en.wikisource.org/wiki/Sketch_of_the_Analytical_Engine_Invented_by_Charles_Babbage,_with_Notes_by_the_Translator',
      },
      context:
        'Lovelace foresaw that computers could compose music, process symbols, and manipulate abstractions well beyond arithmetic calculation—envisioning possibilities a century ahead of her time.',
    },
    explanation: {
      summary:
        'Complex, intimidating uncertainties are just systems waiting to be decomposed. By abstracting away the emotional noise and identifying the core inputs and relationships, you can master any intimidating unknown step-by-step.',
      breakdown: [
        'Just as a loom converts complex floral patterns into simple mechanical punchcard operations, your mind can break overwhelming life challenges into atomic steps.',
        'Do not let emotional anticipation paralyze you; treat uncertainty as a puzzle governed by identifiable variables and clear rules.',
        'Analytical breakdown gives you control over the process even when the final output is still in progress.',
      ],
      actionableTakeaway:
        'Take your most intimidating future scenario, write down the variables you can directly influence, and program your next concrete step today.',
    },
    tags: ['Problem Solving', 'Logic', 'Systems Thinking', 'Clarity'],
  },
  {
    id: 'ans-virginia-woolf',
    questionId: 'q-1',
    question: 'How should I deal with anxiety about the future and things beyond my control?',
    figure: {
      id: 'virginia-woolf',
      name: 'Virginia Woolf',
      title: 'Modernist Author & Essayist',
      era: '1882 – 1941',
      initials: 'VW',
      tradition: 'Modernist Literature',
      accentColor: 'rose',
    },
    directAnswer:
      'Protect an autonomous sanctuary for your inner voice. Anxiety often stems from letting the world’s rushed demands and foreign expectations encroach upon your quiet self. Reclaim your space and observe without haste.',
    passage: {
      text: 'To write of solitude and of love; of the joy of being alone with the trees and the wind; of the intense, incredible pleasure of lying down on the ground... A woman must have money and a room of her own if she is to write fiction; and that, as you will see, leaves the great problem of the true nature of woman and the true nature of fiction unsolved.',
      originalLanguage: 'English',
      source: {
        work: 'A Room of One’s Own & Selected Diary Entries',
        section: 'Chapter 1',
        year: '1929',
        publicDomainNote: 'Public Domain in the United States',
        sourceUrl: 'https://en.wikisource.org/wiki/A_Room_of_One%27s_Own',
      },
      context:
        'Delivered as lectures at Newnham and Girton Colleges, arguing for the intellectual and material independence necessary for creative vitality and sanity.',
    },
    explanation: {
      summary:
        'Much of our modern angst comes from feeling suffocated by external surveillance and societal expectations. To recover composure, create an unbreachable sanctuary—both physical and mental—where you owe nothing to anyone.',
      breakdown: [
        'Having "a room of one’s own" is both literal and metaphorical: a place of solitude shielded from external interference.',
        'Constant connection and striving to satisfy others creates endless cognitive noise that masquerades as genuine worry.',
        'Solitude with nature and patient creative reflection restores your perspective on what truly matters.',
      ],
      actionableTakeaway:
        'Block off 30 minutes today without screens or notifications. Give yourself permission to dwell in quiet solitude without producing anything for anyone else.',
    },
    tags: ['Solitude', 'Creativity', 'Autonomy', 'Self-Care'],
  },
];
