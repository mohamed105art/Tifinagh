import React, { useState } from 'react';
import { ALPHABET_DATA, STORIES_DATA, ALL_DICTIONARY_DATA } from '../data/amazighData';

export type DictEntryType = (typeof ALL_DICTIONARY_DATA)[number];
export type LetterEntryType = (typeof ALPHABET_DATA)[number];

// 1. Word Morphological Modal (#word-modal)
export const WordDetailModal: React.FC<{
  entry: DictEntryType | null;
  onClose: () => void;
  onPlaySpeech: (text: string, type: string, audioPath?: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  inReview: boolean;
  onToggleReview: (id: string) => void;
  onOpenStory: (storyId: string) => void;
  onSelectWord: (entry: DictEntryType) => void;
}> = ({
  entry,
  onClose,
  onPlaySpeech,
  isFavorite,
  onToggleFavorite,
  inReview,
  onToggleReview,
  onOpenStory,
  onSelectWord
}) => {
  const [copied, setCopied] = useState(false);

  if (!entry) return null;

  const relatedWords = ALL_DICTIONARY_DATA.filter(
    d => d.id !== entry.id && (d.domain === entry.domain || (entry.storyId && d.storyId === entry.storyId))
  ).slice(0, 4);

  const handleCopy = () => {
    navigator.clipboard?.writeText(`${entry.tifinagh} (${entry.latin}) — ${entry.arabic} / ${entry.french}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div id="word-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label="البطاقة المعجمية والصرفية الشاملة">
      <div className="theme-card w-full max-w-2xl rounded-2xl p-5 md:p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-tifinagh text-3xl md:text-4xl font-bold theme-text-accent">{entry.tifinagh}</span>
              <span className="text-lg font-bold theme-text-secondary" dir="ltr">({entry.latin})</span>
            </div>
            <p className="text-xs theme-text-muted mt-1">
              التقريب الصوتي العربي: <strong className="theme-text-main">[{entry.phoneticAr}]</strong> · النوع: {entry.pos} · المجال: {entry.domain}
            </p>
          </div>
          <button onClick={onClose} className="top-header-control" aria-label="إغلاق البطاقة المعجمية">✕ إغلاق</button>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onPlaySpeech(entry.tifinagh, 'word', entry.audio)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
          >
            🔊 استمع للنطق
          </button>
          <button
            onClick={() => onToggleFavorite(entry.id)}
            className={`top-header-control ${isFavorite ? 'border-amber-500 text-amber-400' : ''}`}
          >
            {isFavorite ? '★ في المفضلة' : '☆ أضف للمفضلة'}
          </button>
          <button
            onClick={() => onToggleReview(entry.id)}
            className={`top-header-control ${inReview ? 'border-emerald-500 text-emerald-400' : ''}`}
          >
            {inReview ? '✓ مضافة للمراجعة الذكية' : '+ أضف للمراجعة الذكية'}
          </button>
          <button onClick={handleCopy} className="top-header-control">
            {copied ? '✓ تم النسخ' : '📋 نسخ البطاقة'}
          </button>
        </div>

        {/* Meanings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="theme-card-elevated p-3.5 rounded-xl">
            <span className="text-xs theme-text-muted block">الترجمة العربية الموثقة:</span>
            <strong className="text-base font-bold mt-0.5 block">{entry.arabic}</strong>
          </div>
          <div className="theme-card-elevated p-3.5 rounded-xl">
            <span className="text-xs theme-text-muted block">المقابل الفرنسي (DGLAi):</span>
            <strong className="text-base font-bold mt-0.5 block" dir="ltr">{entry.french}</strong>
          </div>
        </div>

        {/* 4-Column Morphological Table */}
        <div>
          <h3 className="text-xs font-bold theme-text-accent mb-2">الجدول الصرفي الرباعي (Morphologie grammaticale IRCAM):</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="theme-card-elevated p-3 rounded-xl">
              <span className="text-[11px] theme-text-muted block">الحالة الحرة (État libre)</span>
              <span className="font-tifinagh font-bold text-sm mt-1 block">{entry.freeState}</span>
            </div>
            <div className="theme-card-elevated p-3 rounded-xl">
              <span className="text-[11px] theme-text-muted block">حالة الإلحاق (État d'annexion)</span>
              <span className="font-tifinagh font-bold text-sm mt-1 block">{entry.annexedState}</span>
            </div>
            <div className="theme-card-elevated p-3 rounded-xl">
              <span className="text-[11px] theme-text-muted block">صيغة الجمع (Pluriel)</span>
              <span className="font-tifinagh font-bold text-sm mt-1 block">{entry.plural}</span>
            </div>
            <div className="theme-card-elevated p-3 rounded-xl">
              <span className="text-[11px] theme-text-muted block">الجذر الصامتي (Racine)</span>
              <span className="font-tifinagh font-bold text-sm mt-1 block">{entry.root}</span>
            </div>
          </div>
        </div>

        {/* Contextual Example */}
        <div className="theme-card-elevated p-3.5 rounded-xl space-y-1">
          <span className="text-xs font-bold theme-text-accent block">المثال السياقي والتوظيف:</span>
          <p className="font-tifinagh text-base font-bold">{entry.exampleTif}</p>
          <p className="text-xs theme-text-secondary">{entry.exampleAr}</p>
        </div>

        {/* Senses & Dialect Variants */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="theme-card-elevated p-3 rounded-xl">
            <span className="font-bold theme-text-muted block mb-1">الدلالات والمعاني (Senses):</span>
            <p>{entry.senses.join(' · ')}</p>
          </div>
          <div className="theme-card-elevated p-3 rounded-xl">
            <span className="font-bold theme-text-muted block mb-1">الصيغ والتنوع اللساني:</span>
            <p>{entry.dialect}</p>
          </div>
        </div>

        {/* Related Words & Story Link */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs theme-text-muted">كلمات مرتبطة:</span>
            {relatedWords.map(rw => (
              <button
                key={rw.id}
                onClick={() => onSelectWord(rw)}
                className="px-2.5 py-1 rounded-lg theme-card-elevated hover:border-amber-500 text-xs font-tifinagh font-bold"
              >
                {rw.tifinagh} ({rw.arabic.slice(0, 14)})
              </button>
            ))}
          </div>
          {entry.storyId && (
            <button
              onClick={() => { onClose(); onOpenStory(entry.storyId); }}
              className="top-header-control text-amber-400"
            >
              📖 انتقل إلى القصة ({entry.storyTitleAr.slice(0, 22)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Alphabet Letter Detail Modal (#letter-modal)
export const LetterDetailModal: React.FC<{
  letter: LetterEntryType | null;
  onClose: () => void;
  onPlaySpeech: (text: string, type: string, audioPath?: string) => void;
}> = ({ letter, onClose, onPlaySpeech }) => {
  if (!letter) return null;

  return (
    <div id="letter-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="تفاصيل حرف تيفيناغ">
      <div className="theme-card w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 className="text-xl font-bold">بطاقة الحرف #{letter.order}: {letter.name}</h2>
          <button onClick={onClose} className="top-header-control">✕ إغلاق</button>
        </div>

        <div className="flex items-center justify-between theme-card-elevated p-5 rounded-2xl">
          <div>
            <div className="font-tifinagh text-6xl font-bold theme-text-accent">{letter.symbol}</div>
            <div className="text-sm font-bold mt-2">الاسم الأمازيغي: {letter.name}</div>
            <div className="text-xs theme-text-secondary mt-1">المقابل اللاتيني: [{letter.latin}] · المقابل العربي: {letter.arabicEquiv}</div>
          </div>
          <button
            onClick={() => onPlaySpeech(letter.exampleTifinagh, 'letter', letter.audio)}
            className="px-5 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
          >
            🔊 استمع للنطق
          </button>
        </div>

        <div className="theme-card-elevated p-4 rounded-xl space-y-1.5">
          <span className="text-xs theme-text-muted block">التصنيف الصوتي (IRCAM): {letter.typeLabel}</span>
          <div className="text-base font-bold">
            كلمة المثال: <span className="font-tifinagh text-xl theme-text-accent">{letter.exampleTifinagh}</span> ({letter.exampleLatin}) — {letter.exampleArabic}
          </div>
          <p className="text-xs theme-text-secondary">{letter.phoneticHint}</p>
        </div>
      </div>
    </div>
  );
};

// 3. Global Search Modal (#global-search-modal, Ctrl+K)
export const GlobalSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onOpenStory: (storyId: string) => void;
  onSelectWord: (entry: DictEntryType) => void;
  onSelectLetter: (letter: LetterEntryType) => void;
}> = ({ isOpen, onClose, onOpenStory, onSelectWord, onSelectLetter }) => {
  const [q, setQ] = useState('');

  if (!isOpen) return null;

  const clean = q.trim().toLowerCase();
  const matchedStories = clean
    ? STORIES_DATA.filter(
        s =>
          s.titleAr.includes(clean) ||
          s.titleTif.includes(clean) ||
          s.titleLat.toLowerCase().includes(clean) ||
          s.region.includes(clean)
      ).slice(0, 5)
    : STORIES_DATA.slice(0, 3);

  const matchedWords = clean
    ? ALL_DICTIONARY_DATA.filter(
        d =>
          d.tifinagh.includes(clean) ||
          d.latin.toLowerCase().includes(clean) ||
          d.arabic.includes(clean) ||
          d.french.toLowerCase().includes(clean)
      ).slice(0, 6)
    : ALL_DICTIONARY_DATA.slice(0, 4);

  const matchedLetters = clean
    ? ALPHABET_DATA.filter(
        l =>
          l.symbol.includes(clean) ||
          l.name.toLowerCase().includes(clean) ||
          l.arabicEquiv.includes(clean)
      ).slice(0, 4)
    : [];

  return (
    <div id="global-search-modal" className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-3 pt-14 md:p-6" role="dialog" aria-modal="true" aria-label="البحث الشامل في المنصة">
      <div className="theme-card w-full max-w-2xl rounded-2xl p-4 md:p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center gap-2">
          <input
            type="text"
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="ابحث في القصص الـ 26، المعجم (340 كلمة)، والحروف الـ 33 (تيفيناغ / عربي / لاتيني / فرنسي)..."
            className="theme-input flex-1 rounded-xl p-3 text-sm font-semibold"
          />
          <button onClick={onClose} className="top-header-control">✕ إغلاق</button>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-bold theme-text-accent mb-1.5">القصص المطابقة ({matchedStories.length}):</h3>
            <div className="space-y-1.5">
              {matchedStories.map(st => (
                <button
                  key={st.id}
                  onClick={() => { onClose(); onOpenStory(st.id); }}
                  className="w-full theme-card-elevated p-2.5 rounded-xl text-right flex items-center justify-between hover:border-amber-500"
                >
                  <div>
                    <span className="font-bold text-sm">القصة {st.num}: {st.titleAr}</span>
                    <span className="text-xs theme-text-muted block">{st.region} · {st.dialect}</span>
                  </div>
                  <span className="font-tifinagh text-sm theme-text-accent">{st.titleTif}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold theme-text-accent mb-1.5">مداخل المعجم المطابقة ({matchedWords.length}):</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {matchedWords.map(w => (
                <button
                  key={w.id}
                  onClick={() => { onClose(); onSelectWord(w); }}
                  className="theme-card-elevated p-2.5 rounded-xl text-right flex items-center justify-between hover:border-amber-500"
                >
                  <div>
                    <span className="font-tifinagh font-bold theme-text-accent">{w.tifinagh}</span>{' '}
                    <span className="text-xs font-bold">({w.latin})</span>
                    <span className="text-xs theme-text-secondary block">{w.arabic}</span>
                  </div>
                  <span className="text-[11px] theme-text-muted">{w.domain}</span>
                </button>
              ))}
            </div>
          </div>

          {matchedLetters.length > 0 && (
            <div>
              <h3 className="text-xs font-bold theme-text-accent mb-1.5">حروف تيفيناغ المطابقة:</h3>
              <div className="flex flex-wrap gap-2">
                {matchedLetters.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { onClose(); onSelectLetter(l); }}
                    className="theme-card-elevated px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    <span className="font-tifinagh text-lg theme-text-accent ml-1">{l.symbol}</span> {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 4. Settings Drawer (#settings-drawer) & Confirm Action Modal (#confirm-action-modal)
export const SettingsDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  dailyGoal: number;
  onChangeDailyGoal: (g: number) => void;
  audioSpeed: number;
  onChangeAudioSpeed: (s: number) => void;
  onExportBackup: () => void;
  onRequestResetProgress: () => void;
}> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  dailyGoal,
  onChangeDailyGoal,
  audioSpeed,
  onChangeAudioSpeed,
  onExportBackup,
  onRequestResetProgress
}) => {
  if (!isOpen) return null;

  return (
    <div id="settings-drawer" className="fixed inset-0 z-50 flex justify-end bg-black/70" role="dialog" aria-modal="true" aria-label="الإعدادات المتقدمة">
      <div className="theme-card w-full max-w-md h-full p-5 overflow-y-auto space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 className="text-lg font-bold">⚙️ الإعدادات المتقدمة وتفضيلات التعلم</h2>
          <button onClick={onClose} className="top-header-control">✕ إغلاق</button>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold theme-text-accent">المظهر والصوت:</h3>
          <div className="theme-card-elevated p-3.5 rounded-xl flex items-center justify-between">
            <span className="text-sm font-bold">السمة اللونية (Dark / Light)</span>
            <button onClick={onToggleTheme} className="top-header-control">
              {theme === 'dark' ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري'}
            </button>
          </div>
          <div className="theme-card-elevated p-3.5 rounded-xl flex items-center justify-between">
            <span className="text-sm font-bold">صوت النطق والمؤثرات</span>
            <button onClick={onToggleSound} className="top-header-control">
              {soundEnabled ? '🔊 مفعل' : '🔇 مكتوم'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold theme-text-accent">أهداف المراجعة وسرعة القراءة:</h3>
          <div className="theme-card-elevated p-3.5 rounded-xl">
            <label className="text-xs font-bold block mb-2">الهدف اليومي للمراجعة الذكية: {dailyGoal} بطاقات</label>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={dailyGoal}
              onChange={e => onChangeDailyGoal(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="theme-card-elevated p-3.5 rounded-xl">
            <span className="text-xs font-bold block mb-2">سرعة المشغل الصوتي الافتراضية:</span>
            <div className="flex gap-2">
              {[0.75, 1, 1.25, 1.5].map(sp => (
                <button
                  key={sp}
                  onClick={() => onChangeAudioSpeed(sp)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                    audioSpeed === sp ? 'bg-amber-500 text-slate-950 border-amber-500' : 'theme-card'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <h3 className="text-xs font-bold theme-text-accent">إدارة البيانات والنسخ الاحتياطي:</h3>
          <button onClick={onExportBackup} className="w-full top-header-control justify-center py-2.5">
            📥 تصدير نسخة احتياطية شاملة (JSON)
          </button>
          <button
            onClick={onRequestResetProgress}
            className="w-full top-header-control justify-center py-2.5 text-rose-400 border-rose-500/40"
          >
            🗑️ إعادة ضبط تقدم التعلم
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConfirmActionModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div id="confirm-action-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="theme-card w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
        <h3 className="text-lg font-bold theme-text-main">{title}</h3>
        <p className="text-sm theme-text-secondary leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button onClick={onCancel} className="top-header-control">إلغاء</button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500"
          >
            تأكيد التنفيذ
          </button>
        </div>
      </div>
    </div>
  );
};
