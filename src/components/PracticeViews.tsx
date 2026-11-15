import React, { useState } from 'react';
import { STORIES_DATA, ALL_DICTIONARY_DATA } from '../data/amazighData';
import { verifySentenceAttempt, SrsCardRecord } from '../utils/amazighLogic';
import { DictEntryType } from './DetailModals';

// 1. Sentence Builder Lab (#view-sentences — 26 Sentences)
export const SentencesLabView: React.FC<{
  onPlaySpeech: (text: string, type: string, audioPath?: string) => void;
  onAwardXp: (xp: number, msg: string) => void;
  onOpenStory: (storyId: string) => void;
}> = ({ onPlaySpeech, onAwardXp, onOpenStory }) => {
  const [storyIdx, setStoryIdx] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const [builtWords, setBuiltWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentStory = STORIES_DATA[storyIdx % STORIES_DATA.length];
  const sb = currentStory.sentenceBuilder;

  const handleCheck = () => {
    const res = verifySentenceAttempt(builtWords, sb.tifinagh);
    if (res.isCorrect) {
      setFeedback('✓ ممتاز! الجملة الأمازيغية مركبة بترتيب نحوي سليم 100% (+15 XP)');
      onAwardXp(15, `تركيب جملة القصة ${currentStory.num}`);
    } else {
      setFeedback(`دقة الترتيب الحالي: ${res.accuracyPercent}% — تأمل القاعدة النحوية وأعد المحاولة.`);
    }
  };

  return (
    <section id="view-sentences" className="space-y-6">
      <div className="theme-card rounded-2xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">معمل الجمل النحوية الأمازيغية (26 جملة سياقية)</h1>
          <p className="text-xs md:text-sm theme-text-secondary mt-1">
            ركّب الجمل النحوية للقصص الـ 26 خطوة بخطوة مع شرح الحالة الحرة وحالة الإلحاق
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHints(!showHints)}
            className="top-header-control"
          >
            💡 {showHints ? 'إخفاء تلميحات المعاني' : 'إظهار تلميحات المعاني'}
          </button>
          <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-400 font-bold text-xs tabular-nums">
            الجملة {currentStory.num} / 26
          </span>
        </div>
      </div>

      <div className="theme-card rounded-2xl p-5 md:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <span className="text-xs font-bold theme-text-accent">من القصة {currentStory.num}: {currentStory.titleAr}</span>
            <h2 className="text-lg md:text-xl font-bold mt-1">المعنى المطلوب تركيبه: «{sb.arabic}»</h2>
            {showHints && (
              <p className="text-xs theme-text-muted mt-1" dir="ltr">النقل اللاتيني الاسترشادي: {sb.latin}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPlaySpeech(sb.tifinagh, 'sentence', currentStory.audio)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              🔊 استمع للجملة
            </button>
            <button
              onClick={() => onOpenStory(currentStory.id)}
              className="top-header-control"
            >
              📖 القصة
            </button>
          </div>
        </div>

        {/* Assembly Zone (LTR) */}
        <div dir="ltr" className="min-h-[80px] p-4 rounded-2xl theme-card-elevated flex flex-wrap items-center gap-2.5 border-2 border-dashed border-amber-500/40">
          {builtWords.length === 0 ? (
            <span className="text-xs theme-text-muted">انقر على الكلمات من بنك الكلمات بالأسفل لتركيب الجملة من اليسار إلى اليمين...</span>
          ) : (
            builtWords.map((w, i) => (
              <button
                key={`${w}_${i}`}
                onClick={() => setBuiltWords(builtWords.filter((_, idx) => idx !== i))}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-tifinagh font-bold text-lg"
              >
                {w} ✕
              </button>
            ))
          )}
        </div>

        {/* Word Bank */}
        <div>
          <span className="text-xs font-bold theme-text-muted block mb-2">بنك كلمات الجملة (انقر للإضافة):</span>
          <div dir="ltr" className="flex flex-wrap gap-2.5">
            {sb.words.map((w, idx) => (
              <button
                key={`${w}_${idx}`}
                onClick={() => setBuiltWords([...builtWords, w])}
                className="px-4 py-2.5 rounded-xl theme-card-elevated hover:border-amber-500 font-tifinagh font-bold text-lg"
              >
                {w}
                {showHints && sb.latinWords[idx] && (
                  <span className="block text-[11px] font-sans theme-text-muted font-normal">{sb.latinWords[idx]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-sm font-bold">
            {feedback}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex gap-2">
            <button
              onClick={handleCheck}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs md:text-sm"
            >
              ✓ تحقق من الجملة
            </button>
            <button
              onClick={() => { setBuiltWords([]); setFeedback(null); }}
              className="top-header-control"
            >
              إعادة ترتيب
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStoryIdx(i => (i - 1 + STORIES_DATA.length) % STORIES_DATA.length);
                setBuiltWords([]);
                setFeedback(null);
              }}
              className="top-header-control"
            >
              → الجملة السابقة
            </button>
            <button
              onClick={() => {
                setStoryIdx(i => (i + 1) % STORIES_DATA.length);
                setBuiltWords([]);
                setFeedback(null);
              }}
              className="top-header-control"
            >
              الجملة التالية ←
            </button>
          </div>
        </div>

        {/* Grammatical Guide */}
        <div className="theme-card-elevated rounded-xl p-4 space-y-1.5 text-xs leading-relaxed">
          <strong className="theme-text-accent block">دليل التحليل النحوي والصرفي للجملة:</strong>
          <p>{sb.explanation}</p>
          <p className="theme-text-muted">القاعدة المرتبطة بالقصة: {currentStory.grammar}</p>
        </div>
      </div>
    </section>
  );
};

// 2. Comprehensive Quiz Bank (#view-quizzes — 260 Questions across 26 Stories)
export const QuizzesBankView: React.FC<{
  onPlaySpeech: (text: string, type: string, audioPath?: string) => void;
  quizScores: Record<string, number>;
  onSaveQuizScore: (storyId: string, score: number, wrongVocabIds: string[]) => void;
}> = ({ onPlaySpeech, quizScores, onSaveQuizScore }) => {
  const [selectedStoryId, setSelectedStoryId] = useState<string>('story1');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const story = STORIES_DATA.find(s => s.id === selectedStoryId) || STORIES_DATA[0];

  const handleStorySelect = (id: string) => {
    setSelectedStoryId(id);
    setAnswers({});
    setSubmitted(false);
  };

  const currentCorrectCount = story.quiz.reduce(
    (acc, q, idx) => (answers[idx] === q.correctIndex ? acc + 1 : acc),
    0
  );

  const handleFinalize = () => {
    const wrongIds: string[] = [];
    story.quiz.forEach((q, idx) => {
      if (answers[idx] !== q.correctIndex) wrongIds.push(q.vocabId);
    });
    setSubmitted(true);
    onSaveQuizScore(story.id, currentCorrectCount, wrongIds);
  };

  return (
    <section id="view-quizzes" className="space-y-6">
      <div className="theme-card rounded-2xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">بنك الاختبارات الشامل (260 سؤالاً تفاعلياً)</h1>
          <p className="text-xs md:text-sm theme-text-secondary mt-1">
            اختر أي قصة من القصص الـ 26 لخوض اختبارها المكون من 10 أسئلة وحساب درجتك ونسبتك المئوية
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            id="global-quiz-story-select"
            aria-label="اختر القصة لخوض اختبارها"
            value={selectedStoryId}
            onChange={e => handleStorySelect(e.target.value)}
            className="theme-input rounded-xl p-2.5 text-xs md:text-sm font-bold"
          >
            {STORIES_DATA.map(st => (
              <option key={st.id} value={st.id}>
                القصة {st.num}: {st.titleAr} {quizScores[st.id] !== undefined ? `(الدرجة: ${quizScores[st.id]}/10)` : ''}
              </option>
            ))}
          </select>
          <span className="px-3.5 py-2 rounded-xl theme-card-elevated text-xs font-bold tabular-nums">
            النتيجة الحالية: {currentCorrectCount} / 10 ({currentCorrectCount * 10}%)
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {story.quiz.map((q, qIdx) => {
          const picked = answers[qIdx];
          return (
            <div key={q.id} className="theme-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold theme-text-accent">
                  السؤال {q.questionNum} من 10 · القصة {story.num}
                </span>
                <button
                  onClick={() => onPlaySpeech(q.tifinaghWord, 'word')}
                  className="top-header-control"
                >
                  🔊 {q.tifinaghWord} ({q.latinWord})
                </button>
              </div>
              <h3 className="text-base font-bold">{q.prompt}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, oIdx) => {
                  const isPicked = picked === oIdx;
                  const isRight = oIdx === q.correctIndex;
                  let cls = 'theme-card-elevated hover:border-amber-500/60';
                  if (picked !== undefined) {
                    if (isRight) cls = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
                    else if (isPicked) cls = 'bg-rose-500/20 border-rose-500 text-rose-300';
                  }
                  return (
                    <button
                      key={oIdx}
                      onClick={() => setAnswers({ ...answers, [qIdx]: oIdx })}
                      className={`p-3.5 rounded-xl border text-right text-sm font-bold transition-all ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {picked !== undefined && (
                <p className="text-xs theme-text-secondary pt-2 border-t border-[var(--border-subtle)]">
                  💡 {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="theme-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleFinalize}
          className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400"
        >
          ✓ اعتماد درجة الاختبار ({currentCorrectCount} / 10)
        </button>
        {submitted && (
          <div className="text-sm font-bold text-emerald-400">
            تم حفظ الدرجة ({currentCorrectCount * 10}%) وإضافة الكلمات الصعبة إلى صندوق المراجعة الذكية!
          </div>
        )}
      </div>
    </section>
  );
};

// 3. Leitner Spaced Repetition Smart Review (#view-review)
export const SmartReviewView: React.FC<{
  srsCards: Record<string, SrsCardRecord>;
  dailyCount: number;
  dailyGoal: number;
  onRateCard: (vocabId: string, outcome: 'hard' | 'good' | 'easy') => void;
  onSeedFiveWords: () => void;
  onPlaySpeech: (text: string, type: string, audioPath?: string) => void;
  onOpenWordModal: (entry: DictEntryType) => void;
}> = ({
  srsCards,
  dailyCount,
  dailyGoal,
  onRateCard,
  onSeedFiveWords,
  onPlaySpeech,
  onOpenWordModal
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const allCardRecords = Object.values(srsCards) as SrsCardRecord[];
  const now = Date.now();
  const dueCards = allCardRecords.filter(c => c.nextDue <= now);
  const box1Count = allCardRecords.filter(c => c.box === 1).length;
  const box23Count = allCardRecords.filter(c => c.box === 2 || c.box === 3).length;

  const activeCardRecord = dueCards[0] || allCardRecords[0] || null;
  const activeDictEntry = activeCardRecord
    ? ALL_DICTIONARY_DATA.find(d => d.id === activeCardRecord.id) || ALL_DICTIONARY_DATA[0]
    : null;

  return (
    <section id="view-review" className="space-y-6">
      {/* 3-Step Onboarding Guide Card */}
      <div className="theme-card rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">المراجعة الذكية بالتكرار المتباعد (Leitner SRS)</h1>
            <p className="text-xs md:text-sm theme-text-secondary mt-1">
              ثبّت المفردات الأمازيغية في الذاكرة طويلة المدى عبر صناديق لايتنر الخمسة
            </p>
          </div>
          <button
            onClick={onSeedFiveWords}
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs md:text-sm hover:bg-amber-400"
          >
            + ابدأ أو أضف 5 كلمات للمراجعة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="theme-card-elevated p-3.5 rounded-xl">
            <span className="text-xs font-bold theme-text-accent block">1. من أين تأتي الكلمات؟</span>
            <p className="text-xs theme-text-secondary mt-1">تُضاف تلقائياً عند الخطأ في الاختبارات أو يدوياً من القصص والمعجم.</p>
          </div>
          <div className="theme-card-elevated p-3.5 rounded-xl">
            <span className="text-xs font-bold theme-text-accent block">2. ماذا سيظهر لك؟</span>
            <p className="text-xs theme-text-secondary mt-1">تظهر الكلمة بتيفيناغ واللاتينية؛ حاول تذكر معناها ثم اقلب البطاقة للتحقق.</p>
          </div>
          <div className="theme-card-elevated p-3.5 rounded-xl">
            <span className="text-xs font-bold theme-text-accent block">3. كيف تقيّم إجابتك؟</span>
            <p className="text-xs theme-text-secondary mt-1">اختر (صعبة / جيدة / سهلة) لتنتقل الكلمة بين الصناديق الـ 5 حسب إتقانك.</p>
          </div>
        </div>
      </div>

      {/* 4 Live SRS Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="theme-card p-4 rounded-2xl">
          <span className="text-xs theme-text-muted block">مستحقة للمراجعة اليوم</span>
          <strong className="text-2xl font-bold theme-text-accent tabular-nums mt-1 block">{dueCards.length}</strong>
        </div>
        <div className="theme-card p-4 rounded-2xl">
          <span className="text-xs theme-text-muted block">كلمات تحتاج تركيزاً (المستوى 1)</span>
          <strong className="text-2xl font-bold text-rose-400 tabular-nums mt-1 block">{box1Count}</strong>
        </div>
        <div className="theme-card p-4 rounded-2xl">
          <span className="text-xs theme-text-muted block">قيد التثبيت (المستويان 2 و3)</span>
          <strong className="text-2xl font-bold text-sky-400 tabular-nums mt-1 block">{box23Count}</strong>
        </div>
        <div className="theme-card p-4 rounded-2xl">
          <span className="text-xs theme-text-muted block">إنجاز الهدف اليومي</span>
          <strong className="text-2xl font-bold text-emerald-400 tabular-nums mt-1 block">
            {dailyCount} / {dailyGoal}
          </strong>
        </div>
      </div>

      {/* Interactive Flashcard Stage */}
      {activeDictEntry && activeCardRecord ? (
        <div className="theme-card rounded-2xl p-6 max-w-2xl mx-auto space-y-5 text-center">
          <div className="flex items-center justify-between text-xs font-bold theme-text-muted">
            <span>صندوق لايتنر الحالي: المستوى {activeCardRecord.box} من 5</span>
            <span>عدد المراجعات السابقة: {activeCardRecord.reps}</span>
          </div>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="theme-card-elevated rounded-2xl p-8 min-h-[230px] flex flex-col items-center justify-center cursor-pointer border-2 border-amber-500/35 hover:border-amber-500 transition-all"
          >
            {!isFlipped ? (
              <>
                <div className="font-tifinagh text-5xl font-bold theme-text-accent mb-3">
                  {activeDictEntry.tifinagh}
                </div>
                <div className="text-base font-bold theme-text-secondary">
                  ({activeDictEntry.latin}) · [{activeDictEntry.phoneticAr}]
                </div>
                <span className="text-xs theme-text-muted mt-5">
                  انقر لقلب البطاقة وكشف الجواب والصرف ↺
                </span>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold theme-text-main mb-1">{activeDictEntry.arabic}</div>
                <div className="text-sm theme-text-secondary mb-3" dir="ltr">{activeDictEntry.french}</div>
                <div className="text-xs theme-text-muted">
                  الحرة: {activeDictEntry.freeState} · الإلحاق: {activeDictEntry.annexedState} · الجمع: {activeDictEntry.plural}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => onPlaySpeech(activeDictEntry.tifinagh, 'word', activeDictEntry.audio)}
              className="top-header-control"
            >
              🔊 استمع للنطق
            </button>
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="top-header-control"
            >
              ↺ اقلب البطاقة
            </button>
            <button
              onClick={() => onOpenWordModal(activeDictEntry)}
              className="top-header-control"
            >
              📖 البطاقة الصرفية
            </button>
          </div>

          {isFlipped && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => { onRateCard(activeDictEntry.id, 'hard'); setIsFlipped(false); }}
                className="p-3 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 font-bold text-xs hover:bg-rose-500/30"
              >
                صعبة (أعدها اليوم — المستوى 1)
              </button>
              <button
                onClick={() => { onRateCard(activeDictEntry.id, 'good'); setIsFlipped(false); }}
                className="p-3 rounded-xl bg-sky-500/20 border border-sky-500 text-sky-300 font-bold text-xs hover:bg-sky-500/30"
              >
                جيدة (تقدم خطوة +5 XP)
              </button>
              <button
                onClick={() => { onRateCard(activeDictEntry.id, 'easy'); setIsFlipped(false); }}
                className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30"
              >
                سهلة ومتقنة (قفزة +10 XP)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="theme-card rounded-2xl p-8 text-center space-y-4">
          <p className="text-base font-bold">صندوق المراجعة الذكية فارغ حالياً</p>
          <p className="text-xs theme-text-muted">اضغط على الزر أدناه لإضافة أول 5 مفردات تأسيسية والبدء في تثبيتها فوراً:</p>
          <button
            onClick={onSeedFiveWords}
            className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
          >
            + ابدأ أو أضف 5 كلمات للمراجعة
          </button>
        </div>
      )}

      {/* 5 Leitner Boxes Overview */}
      <div className="theme-card rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold theme-text-accent">توزيع الكلمات على صناديق لايتنر الخمسة (المستويات 1 إلى 5):</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { box: 1, label: 'الصندوق 1 (يومياً)' },
            { box: 2, label: 'الصندوق 2 (كل يومين)' },
            { box: 3, label: 'الصندوق 3 (كل 3 أيام)' },
            { box: 4, label: 'الصندوق 4 (كل أسبوع)' },
            { box: 5, label: 'الصندوق 5 (متقنة)' }
          ].map(b => {
            const count = allCardRecords.filter(c => c.box === b.box).length;
            return (
              <div key={b.box} className="theme-card-elevated p-3.5 rounded-xl text-center">
                <span className="text-xs theme-text-muted block">{b.label}</span>
                <strong className="text-xl font-bold theme-text-main tabular-nums mt-1 block">{count}</strong>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
