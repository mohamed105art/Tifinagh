/**
 * Pure linguistic, morphological, search, and Leitner SRS utilities for Amazigh Learn (ⴰⵎⴰⵣⵉⵖ)
 */

export interface TifinaghMapEntry {
  char: string;
  latin: string;
  arabicPhonetic: string;
}

export const TIFINAGH_TO_LATIN_MAP: Record<string, string> = {
  'ⴰ': 'a', 'ⴱ': 'b', 'ⴳ': 'g', 'ⴷ': 'd', 'ⴹ': 'ḍ', 'ⴻ': 'e', 'ⴼ': 'f',
  'ⴽ': 'k', 'ⵀ': 'h', 'ⵃ': 'ḥ', 'ⵄ': 'ɛ', 'ⵅ': 'x', 'ⵇ': 'q', 'ⵉ': 'i',
  'ⵊ': 'j', 'ⵍ': 'l', 'ⵎ': 'm', 'ⵏ': 'n', 'ⵓ': 'u', 'ⵔ': 'r', 'ⵕ': 'ṛ',
  'ⵖ': 'ɣ', 'ⵙ': 's', 'ⵚ': 'ṣ', 'ⵛ': 'c', 'ⵜ': 't', 'ⵟ': 'ṭ', 'ⵡ': 'w',
  'ⵢ': 'y', 'ⵣ': 'z', 'ⵥ': 'ẓ', 'ⵯ': 'ʷ'
};

export const TIFINAGH_TO_ARABIC_PHONETIC_MAP: Record<string, string> = {
  'ⴰ': 'ا', 'ⴱ': 'ب', 'ⴳ': 'گ', 'ⴷ': 'د', 'ⴹ': 'ض', 'ⴻ': 'ه', 'ⴼ': 'ف',
  'ⴽ': 'ك', 'ⵀ': 'هـ', 'ⵃ': 'ح', 'ⵄ': 'ع', 'ⵅ': 'خ', 'ⵇ': 'ق', 'ⵉ': 'ي',
  'ⵊ': 'ج', 'ⵍ': 'ل', 'ⵎ': 'م', 'ⵏ': 'ن', 'ⵓ': 'و', 'ⵔ': 'ر', 'ⵕ': 'رّ',
  'ⵖ': 'غ', 'ⵙ': 'س', 'ⵚ': 'ص', 'ⵛ': 'ش', 'ⵜ': 'ت', 'ⵟ': 'ط', 'ⵡ': 'و',
  'ⵢ': 'ي', 'ⵣ': 'ز', 'ⵥ': 'ظ', 'ⵯ': 'و'
};

/**
 * Transliterates a Tifinagh string into IRCAM standard Latin script.
 */
export function transliterateTifinaghToLatin(tifinagh: string): string {
  if (!tifinagh) return '';
  let out = '';
  for (let i = 0; i < tifinagh.length; i++) {
    const ch = tifinagh[i];
    if (TIFINAGH_TO_LATIN_MAP[ch] !== undefined) {
      out += TIFINAGH_TO_LATIN_MAP[ch];
    } else {
      out += ch;
    }
  }
  // Capitalize first letter of sentences
  return out.replace(/(^\s*[a-zɛɣḥḍṛṣṭẓ])/i, (m) => m.toUpperCase());
}

/**
 * Generates an Arabic phonetic approximation for a Tifinagh word or phrase.
 */
export function generateArabicPhonetic(tifinagh: string, latinFallback?: string): string {
  if (!tifinagh) return latinFallback || '';
  let out = '';
  for (let i = 0; i < tifinagh.length; i++) {
    const ch = tifinagh[i];
    if (TIFINAGH_TO_ARABIC_PHONETIC_MAP[ch] !== undefined) {
      out += TIFINAGH_TO_ARABIC_PHONETIC_MAP[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Computes Amazigh morphological forms (Free state, Annexed state / État d'annexion, Plural, Root)
 * when not explicitly overridden by DGLAi core lexicon.
 */
export function deriveMorphology(tifinagh: string, latin: string, pos?: string): {
  freeState: string;
  annexedState: string;
  pluralForm: string;
  consonantRoot: string;
  inferredPos: string;
} {
  const cleanTif = tifinagh.trim();
  const cleanLat = latin.trim();

  // Infer POS if not provided
  let inferredPos = pos || 'اسم مذكر';
  if (!pos) {
    if (cleanTif.startsWith('ⵜ') && cleanTif.endsWith('ⵜ') && cleanTif.length > 2) {
      inferredPos = 'اسم مؤنث';
    } else if (cleanTif.startsWith('ⵉ') && cleanTif.endsWith('ⵏ')) {
      inferredPos = 'اسم مذكر';
    }
  }

  // Derive État d'annexion (حالة الإلحاق)
  let annexedTif = cleanTif;
  let annexedLat = cleanLat;
  if (cleanTif.startsWith('ⵜⴰ') && cleanTif.length > 3) {
    annexedTif = 'ⵜ' + cleanTif.slice(2);
    annexedLat = cleanLat.replace(/^Ta/i, 'T');
  } else if (cleanTif.startsWith('ⴰ') && cleanTif.length > 2) {
    annexedTif = 'ⵓ' + cleanTif.slice(1);
    annexedLat = cleanLat.replace(/^A/i, 'U');
  } else if (cleanTif.startsWith('ⵉ') && cleanTif.length > 2) {
    annexedTif = 'ⵢⵉ' + cleanTif.slice(1);
    annexedLat = cleanLat.replace(/^I/i, 'Yi');
  }

  // Derive plural
  let pluralTif = cleanTif + 'ⵏ';
  if (cleanTif.startsWith('ⵜⴰ') && cleanTif.endsWith('ⵜ')) {
    pluralTif = 'ⵜⵉ' + cleanTif.slice(2, -1) + 'ⵉⵏ';
  } else if (cleanTif.startsWith('ⴰ')) {
    pluralTif = 'ⵉ' + cleanTif.slice(1) + 'ⵏ';
  }

  // Extract consonantal root (excluding vowels ⴰ, ⵉ, ⵓ, ⴻ and feminine circumfix ⵜ...ⵜ)
  let coreChars = cleanTif;
  if (coreChars.startsWith('ⵜ') && coreChars.endsWith('ⵜ') && coreChars.length > 3) {
    coreChars = coreChars.slice(1, -1);
  }
  const vowels = new Set(['ⴰ', 'ⵉ', 'ⵓ', 'ⴻ', 'ⵯ', ' ', '-']);
  const rootConsonants: string[] = [];
  for (const ch of coreChars) {
    if (!vowels.has(ch)) {
      if (rootConsonants[rootConsonants.length - 1] !== ch) {
        rootConsonants.push(ch);
      }
    }
  }
  const consonantRoot = rootConsonants.length > 0 ? rootConsonants.join('-') : cleanTif;

  return {
    freeState: `${cleanTif} (${cleanLat})`,
    annexedState: `${annexedTif} (${annexedLat})`,
    pluralForm: pluralTif,
    consonantRoot,
    inferredPos
  };
}

/**
 * Normalizes search text for dictionary and story matching
 */
export function normalizeSearchText(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْ]/g, '');
}

/**
 * Matches a candidate string against a query using 'contains', 'starts', or 'exact' mode.
 */
export function matchDictionaryField(
  candidate: string,
  query: string,
  mode: 'contains' | 'starts' | 'exact' = 'contains'
): boolean {
  const normCand = normalizeSearchText(candidate);
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return true;
  if (!normCand) return false;

  if (mode === 'exact') {
    return normCand === normQuery;
  }
  if (mode === 'starts') {
    return normCand.startsWith(normQuery);
  }
  return normCand.includes(normQuery);
}

/**
 * Leitner SRS Box progression calculation (Boxes 1 to 5)
 */
export interface SrsCardRecord {
  id: string;
  box: number; // 1 to 5
  nextDue: number; // timestamp ms
  lastReviewed: number;
  lapses: number;
  reps: number;
}

export const LEITNER_INTERVAL_DAYS: Record<number, number> = {
  1: 0, // immediate / same day
  2: 1,
  3: 3,
  4: 7,
  5: 14
};

export function computeNextSrsCardState(
  current: SrsCardRecord | undefined,
  vocabId: string,
  outcome: 'hard' | 'good' | 'easy',
  nowMs: number = Date.now()
): { card: SrsCardRecord; xpDelta: number; isMastered: boolean } {
  const prev: SrsCardRecord = current || {
    id: vocabId,
    box: 1,
    nextDue: nowMs,
    lastReviewed: 0,
    lapses: 0,
    reps: 0
  };

  let newBox = prev.box;
  let xpDelta = 2;
  let lapses = prev.lapses;

  if (outcome === 'hard') {
    newBox = 1;
    lapses += 1;
    xpDelta = 2;
  } else if (outcome === 'good') {
    newBox = Math.min(5, prev.box + 1);
    xpDelta = 5;
  } else if (outcome === 'easy') {
    newBox = Math.min(5, prev.box + 2);
    xpDelta = 10;
  }

  const intervalDays = LEITNER_INTERVAL_DAYS[newBox] ?? 0;
  const nextDue = intervalDays === 0 ? nowMs : nowMs + intervalDays * 86400 * 1000;

  return {
    card: {
      id: vocabId,
      box: newBox,
      nextDue,
      lastReviewed: nowMs,
      lapses,
      reps: prev.reps + 1
    },
    xpDelta,
    isMastered: newBox >= 4
  };
}

/**
 * Validates sentence builder word order
 */
export function verifySentenceAttempt(attemptWords: string[], targetSentenceTifinagh: string): {
  isCorrect: boolean;
  accuracyPercent: number;
} {
  const targetWords = targetSentenceTifinagh.trim().split(/\s+/).filter(Boolean);
  if (targetWords.length === 0) return { isCorrect: false, accuracyPercent: 0 };

  let matches = 0;
  for (let i = 0; i < targetWords.length; i++) {
    if (attemptWords[i] === targetWords[i]) {
      matches++;
    }
  }
  const isCorrect =
    attemptWords.length === targetWords.length &&
    attemptWords.every((w, idx) => w === targetWords[idx]);

  return {
    isCorrect,
    accuracyPercent: Math.round((matches / targetWords.length) * 100)
  };
}
