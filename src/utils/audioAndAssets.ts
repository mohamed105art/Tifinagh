/**
 * SVG Artwork Generator & 4-Layer Amazigh Audio Engine (IndexedDB + SpeechSynthesis + Studio + Honest Phonetic Fallback)
 */

const CUSTOM_AUDIO_DB_NAME = 'amazigh_custom_audio_db_v1';
const CUSTOM_AUDIO_STORE = 'recordings';

export interface CustomAudioRecord {
  key: string; // word or sentence or story key
  tifinagh: string;
  latin: string;
  arabic: string;
  dialect: string; // 'تاشلحيت' | 'تمازيغت الأطلس المتوسط' | 'تاريفيت' | 'الأمازيغية المعيارية'
  mimeType: string;
  dataUrl: string;
  createdAt: number;
}

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(CUSTOM_AUDIO_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CUSTOM_AUDIO_STORE)) {
        db.createObjectStore(CUSTOM_AUDIO_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCustomAudioRecording(record: CustomAudioRecord): Promise<void> {
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOM_AUDIO_STORE, 'readwrite');
    tx.objectStore(CUSTOM_AUDIO_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCustomAudioRecording(key: string): Promise<CustomAudioRecord | null> {
  try {
    const db = await openAudioDb();
    return new Promise((resolve) => {
      const tx = db.transaction(CUSTOM_AUDIO_STORE, 'readonly');
      const req = tx.objectStore(CUSTOM_AUDIO_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getAllCustomAudioRecordings(): Promise<CustomAudioRecord[]> {
  try {
    const db = await openAudioDb();
    return new Promise((resolve) => {
      const tx = db.transaction(CUSTOM_AUDIO_STORE, 'readonly');
      const req = tx.objectStore(CUSTOM_AUDIO_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function deleteCustomAudioRecording(key: string): Promise<void> {
  try {
    const db = await openAudioDb();
    return new Promise((resolve) => {
      const tx = db.transaction(CUSTOM_AUDIO_STORE, 'readwrite');
      tx.objectStore(CUSTOM_AUDIO_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

/**
 * Plays a gentle WebAudio chime so the learner gets immediate tactile feedback
 * when Layer 4 honest phonetic approximation is triggered.
 */
export function playGentleChime(type: 'phonetic' | 'success' | 'error' = 'phonetic'): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.14); // E5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.29);
    } else if (type === 'error') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.22);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.16);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.26);
    }
  } catch {
    // ignore audio context restriction
  }
}

/**
 * Generates a unique, culturally authentic SVG Data URI illustration for each of the 26 stories
 */
export function getStorySvgDataUri(storyNum: number, titleTif: string, titleAr: string, region: string): string {
  const palettes = [
    ['#0c1e3e', '#1e3a8a', '#f59e0b', '#10b981'],
    ['#1e1b4b', '#312e81', '#eab308', '#38bdf8'],
    ['#064e3b', '#047857', '#fbbf24', '#60a5fa'],
    ['#3b0764', '#581c87', '#f59e0b', '#34d399'],
    ['#451a03', '#78350f', '#fbbf24', '#f87171'],
    ['#0f172a', '#1e293b', '#d97706', '#2dd4bf']
  ];
  const pal = palettes[(storyNum - 1) % palettes.length];
  const safeTif = (titleTif || 'ⴰⵎⴰⵣⵉⵖ').replace(/[<>&"']/g, '');
  const safeAr = (titleAr || '').slice(0, 38).replace(/[<>&"']/g, '');
  const safeReg = (region || 'المغرب').slice(0, 32).replace(/[<>&"']/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480">
    <defs>
      <linearGradient id="bg_${storyNum}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${pal[0]}"/>
        <stop offset="60%" stop-color="${pal[1]}"/>
        <stop offset="100%" stop-color="#050b16"/>
      </linearGradient>
      <radialGradient id="sun_${storyNum}" cx="0.78" cy="0.26" r="0.35">
        <stop offset="0%" stop-color="${pal[2]}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${pal[2]}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="480" fill="url(#bg_${storyNum})"/>
    <rect width="800" height="480" fill="url(#sun_${storyNum})"/>
    <!-- Amazigh Geometric Diamond Border -->
    <g stroke="${pal[2]}" stroke-opacity="0.22" stroke-width="2" fill="none">
      <polygon points="400,30 435,65 400,100 365,65"/>
      <polygon points="110,60 135,85 110,110 85,85"/>
      <polygon points="690,60 715,85 690,110 665,85"/>
      <rect x="24" y="24" width="752" height="432" rx="18"/>
    </g>
    <!-- Atlas Mountains Silhouette -->
    <path d="M0,380 L140,240 L260,330 L420,185 L580,310 L690,220 L800,340 L800,480 L0,480 Z" fill="#071022" fill-opacity="0.58"/>
    <path d="M0,410 L190,295 L340,375 L520,250 L680,360 L800,290 L800,480 L0,480 Z" fill="#040914" fill-opacity="0.82"/>
    <!-- Central Yaz Emblem -->
    <circle cx="635" cy="145" r="56" fill="${pal[2]}" fill-opacity="0.14" stroke="${pal[2]}" stroke-opacity="0.5" stroke-width="2"/>
    <text x="635" y="166" text-anchor="middle" font-family="Noto Sans Tifinagh, sans-serif" font-size="60" font-weight="bold" fill="${pal[2]}">ⵣ</text>
    <!-- Story Number Badge -->
    <rect x="52" y="48" width="130" height="38" rx="10" fill="${pal[2]}" fill-opacity="0.2" stroke="${pal[2]}" stroke-opacity="0.6"/>
    <text x="117" y="73" text-anchor="middle" font-family="Cairo, sans-serif" font-size="18" font-weight="bold" fill="#fef3c7">القصة ${storyNum} / 26</text>
    <!-- Titles -->
    <text x="400" y="245" text-anchor="middle" font-family="Noto Sans Tifinagh, Cairo, sans-serif" font-size="31" font-weight="bold" fill="#f8fafc">${safeTif}</text>
    <text x="400" y="298" text-anchor="middle" font-family="Cairo, sans-serif" font-size="25" font-weight="bold" fill="${pal[2]}">${safeAr}</text>
    <text x="400" y="342" text-anchor="middle" font-family="Cairo, sans-serif" font-size="17" fill="#cbd5e1">${safeReg}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an SVG Data URI for the Hero Banner fallback
 */
export function getHeroBannerSvgDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420" width="1200" height="420">
    <defs>
      <linearGradient id="hbg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#051428"/>
        <stop offset="50%" stop-color="#0f2547"/>
        <stop offset="100%" stop-color="#071021"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="420" fill="url(#hbg)"/>
    <g stroke="#f59e0b" stroke-opacity="0.16" stroke-width="2" fill="none">
      <circle cx="220" cy="210" r="150"/>
      <circle cx="220" cy="210" r="105"/>
      <polygon points="220,30 390,210 220,390 50,210"/>
    </g>
    <path d="M0,330 L200,190 L380,290 L610,145 L840,285 L1040,175 L1200,280 L1200,420 L0,420 Z" fill="#040b17" fill-opacity="0.65"/>
    <text x="220" y="242" text-anchor="middle" font-family="Noto Sans Tifinagh, sans-serif" font-size="110" font-weight="bold" fill="#f59e0b" fill-opacity="0.28">ⵣ</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
