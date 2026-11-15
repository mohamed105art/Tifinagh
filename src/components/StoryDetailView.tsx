import React, { useState } from 'react';
import { STORIES_DATA, ALL_DICTIONARY_DATA } from '../data/amazighData';
import { getStorySvgDataUri } from '../utils/audioAndAssets';
import { verifySentenceAttempt } from '../utils/amazighLogic';
import { DictEntryType } from './DetailModals';

export type StoryEntryType = (typeof STORIES_DATA)[number];

export const StoryDetailView: React.FC<{
  story: StoryEntryType;
  sourceNav: string;
  onBack: () => void;
  onGoHome: () => void;
  currentSceneIndex: number;
  onChangeSceneIndex: (idx: number) => void;
  onPlaySpeech: (text: string, type: string, audioPath?: string) => void;
  onPlayContinuousStory: (story: StoryEntryType) => void;
  onOpenWordModal: (entry: DictEntryType) => void;
  masteredWords: string[];
  reviewWords: string[];
  onToggleMastered: (id: string) => void;
  onToggleReview: (id: string) => void;
  onSaveSceneWordsToSrs: (wordIds: string[]) => void;
  onAwardXp: (xp: number, reason: string) => void;
  onSaveQuizScore: (storyId: string, score: number, wrongVocabIds: string[]) => void;
  savedScore?: number;
}> = ({
  story,
  onBack,
  onGoHome,
  currentSceneIndex,
  onChangeSceneIndex,
  onPlaySpeech,
  onPlayContinuousStory,
  onOpenWordModal,
  masteredWords,
  reviewWords,
  onToggleMastered,
  onToggleReview,
  onSaveSceneWordsToSrs,
  onAwardXp,
  onSaveQuizScore,
  savedScore
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'vocab' | 'sentences' | 'quiz'>('text');
  const [readingMode, setReadingMode] = useState<'scenes' | 'parallel' | 'full'>('scenes');
  const [fontSizeClass, setFontSizeClass] = useState<'text-xl' | 'text-2xl' | 'text-3xl'>('text-xl');
  const [showLatin, setShowLatin] = useState(true);
  const [showArabic, setShowArabic] = useState(true);
  const [showFrench, setShowFrench] = useState(true);
  const [checkpointAns, setCheckpointAns] = useState<Record<number, string>>({});
  const [vocabViewMode, setVocabViewMode] = useState<'grid' | 'flashcards'>('grid');
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Sentence builder state
  const [builtWords, setBuiltWords] = useState<string[]>([]);
  const [inspectedWord, setInspectedWord] = useState<string | null>(null);
  const [sentenceFeedback, setSentenceFeedback] = useState<string | null>(null);

  // Story Quiz state (10 questions)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const safeSceneIdx = Math.min(Math.max(0, currentSceneIndex), story.scenes.length - 1);
  const activeScene = story.scenes[safeSceneIdx];
  const fallbackSvg = getStorySvgDataUri(story.num, story.titleTif, story.titleAr, story.region);

  // Render scene text with clickable vocabulary highlights
  const renderHighlightedTifinagh = (sceneTif: string) => {
    const tokens = sceneTif.split(/\s+/);
    return tokens.map((tok, i) => {
      const cleanTok = tok.replace(/[.,:;!?«»"']/g, '');
      const matchedVocab = story.vocab.find(
        v => cleanTok === v.tifinagh || (cleanTok.length >= 3 && v.tifinagh.includes(cleanTok))
      );
      if (matchedVocab) {
        const dictItem = ALL_DICTIONARY_DATA.find(d => d.id === matchedVocab.id);
        return (
          <button
            key={i}
            type="button"
            onClick={() => dictItem && onOpenWordModal(dictItem)}
            className="vocab-chip font-tifinagh"
            title={`${matchedVocab.arabic} (${matchedVocab.latin})`}
          >
            {tok}
          </button>
        );
      }
      return <span key={i} className="inline-block mx-0.5">{tok} </span>;
    });
  };

  const handleCheckSentence = () => {
    const res = verifySentenceAttempt(builtWords, story.sentenceBuilder.tifinagh);
    if (res.isCorrect) {
      setSentenceFeedback('✓ أحسنت! تركيب الجملة الأمازيغية صحيح 100% (+15 XP)');
      onAwardXp(15, `إتقان جملة القصة ${story.num}`);
    } else {
      setSentenceFeedback(`دقة الترتيب الحالي: ${res.accuracyPercent}% — حاول مطابقة ترتيب الكلمات من اليسار لليمين.`);
    }
  };

  const handleSubmitStoryQuiz = () => {
    let score = 0;
    const wrongIds: string[] = [];
    story.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) {
        score++;
      } else {
        wrongIds.push(q.vocabId);
      }
    });
    setQuizSubmitted(true);
    onSaveQuizScore(story.id, score, wrongIds);
  };

  const activeFlashcard = story.vocab[flashcardIdx % story.vocab.length];

  return (
    <section id="view-story-detail" className="min-h-screen pb-24">
      {/* Sticky Focused Story Header */}
      <div className="story-sticky-header px-3 md:px-6 py-3 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <button
              id="story-back-btn"
              onClick={onBack}
              className="top-header-control"
              aria-label="العودة للقسم السابق"
            >
              → رجوع
            </button>
            <div className="text-center truncate px-2">
              <h1 className="text-sm md:text-lg font-bold truncate">
                القصة {story.num}: {story.titleAr}
              </h1>
              <p className="text-[11px] theme-text-muted truncate">
                {story.region} · {story.dialect} · {story.level}
              </p>
            </div>
            <button onClick={onGoHome} className="top-header-control" aria-label="العودة للرئيسية">
              🏠 الرئيسية
            </button>
          </div>

          {/* 4 Internal Tabs (grid-cols-4) */}
          <div className="grid grid-cols-4 gap-1.5 md:gap-2">
            {[
              { key: 'text', label: '1. نص الحكاية' },
              { key: 'vocab', label: '2. المصطلحات (10)' },
              { key: 'sentences', label: '3. تركيب الجمل' },
              { key: 'quiz', label: '4. اختبار القصة (10)' }
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as typeof activeTab)}
                className={`py-2 px-2 rounded-xl text-xs md:text-sm font-bold border transition-colors truncate ${
                  activeTab === t.key
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : 'theme-card theme-text-secondary hover:border-amber-500/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-5xl mx-auto px-3 md:px-6 pt-5 space-y-6">
        {/* TAB 1: STORY TEXT */}
        {activeTab === 'text' && (
          <div className="space-y-6">
            {/* Full Uncropped Story Illustration */}
            <div className="theme-card rounded-2xl overflow-hidden shadow-lg">
              <img
                src={story.image}
                alt={story.titleAr}
                referrerPolicy="no-referrer"
                onError={e => {
                  const target = e.currentTarget;
                  if (target.src !== fallbackSvg) target.src = fallbackSvg;
                }}
                className="w-full max-h-[380px] object-contain bg-slate-950 mx-auto block"
              />
              <div className="p-4 md:p-6 border-t border-[var(--border-subtle)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold">{story.titleAr}</h2>
                    <p className="font-tifinagh text-base md:text-lg theme-text-accent mt-0.5">
                      {story.titleTif} ({story.titleLat})
                    </p>
                  </div>
                  <button
                    onClick={() => onPlayContinuousStory(story)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs md:text-sm hover:bg-amber-400"
                  >
                    ▶️ استمع إلى القصة كاملة (7 مشاهد)
                  </button>
                </div>
                <p className="text-sm theme-text-secondary leading-relaxed">{story.summary}</p>
                <div className="text-xs theme-text-muted flex flex-wrap gap-2 pt-1">
                  <span>المنطقة: {story.region}</span>
                  <span>·</span>
                  <span>التنوع اللساني: {story.dialect}</span>
                  <span>·</span>
                  <span>المدة: {story.duration}</span>
                  <span>·</span>
                  <span>التوثيق: {story.documentationType}</span>
                </div>
              </div>
            </div>

            {/* Reading Mode Switcher (3 modes: scenes | parallel | full) */}
            <div className="theme-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold theme-text-muted">نمط القراءة:</span>
                {[
                  { id: 'scenes', label: 'أ. نظام المشاهد التفاعلية (1–7)' },
                  { id: 'parallel', label: 'ب. القراءة المتوازية' },
                  { id: 'full', label: 'ج. القراءة المركزة' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setReadingMode(m.id as typeof readingMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      readingMode === m.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'theme-card-elevated theme-text-secondary'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Layer visibility & font size controls */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setShowLatin(!showLatin)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${showLatin ? 'border-amber-500 theme-text-accent' : 'theme-card-elevated opacity-60'}`}
                >
                  اللاتينية
                </button>
                <button
                  onClick={() => setShowArabic(!showArabic)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${showArabic ? 'border-amber-500 theme-text-accent' : 'theme-card-elevated opacity-60'}`}
                >
                  العربية
                </button>
                <button
                  onClick={() => setShowFrench(!showFrench)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${showFrench ? 'border-amber-500 theme-text-accent' : 'theme-card-elevated opacity-60'}`}
                >
                  الفرنسية
                </button>
              </div>
            </div>

            {/* MODE A: Interactive Scenes (1 of 7) */}
            {readingMode === 'scenes' && activeScene && (
              <div className="theme-card rounded-2xl p-5 md:p-6 space-y-5">
                {/* Scene progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="theme-text-accent">المشهد {activeScene.num} من {story.scenes.length}</span>
                    <span className="tabular-nums">{Math.round(((safeSceneIdx + 1) / story.scenes.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${((safeSceneIdx + 1) / story.scenes.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Scene text block */}
                <div className="theme-card-elevated rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                    <span className="text-xs font-bold theme-text-muted">انقر على الكلمات المميزة لعرض البطاقة الصرفية</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPlaySpeech(activeScene.tifinagh, 'scene', story.audio)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                      >
                        🔊 استمع للمشهد {activeScene.num}
                      </button>
                    </div>
                  </div>

                  <div dir="ltr" className={`font-tifinagh ${fontSizeClass} font-bold leading-loose text-left`}>
                    {renderHighlightedTifinagh(activeScene.tifinagh)}
                  </div>

                  {showLatin && (
                    <p dir="ltr" className="text-sm font-semibold theme-text-accent text-left">
                      {activeScene.latin}
                    </p>
                  )}

                  {showArabic && (
                    <p className="text-base md:text-lg font-bold theme-text-main leading-relaxed border-t border-[var(--border-subtle)] pt-3">
                      {activeScene.arabic}
                    </p>
                  )}

                  {showFrench && (
                    <p dir="ltr" className="text-xs theme-text-muted italic text-left">
                      {activeScene.french}
                    </p>
                  )}
                </div>

                {/* Scene vocabulary strip & Save to SRS */}
                <div className="theme-card-elevated rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold theme-text-muted">مصطلحات مرتبطة بالمشهد:</span>
                    {story.vocab.slice(0, 4).map(v => {
                      const dItem = ALL_DICTIONARY_DATA.find(d => d.id === v.id);
                      return (
                        <button
                          key={v.id}
                          onClick={() => dItem && onOpenWordModal(dItem)}
                          className="px-2.5 py-1 rounded-lg theme-card text-xs font-bold hover:border-amber-500"
                        >
                          <span className="font-tifinagh theme-text-accent ml-1">{v.tifinagh}</span> ({v.arabic})
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => onSaveSceneWordsToSrs(story.vocab.map(v => v.id))}
                    className="top-header-control text-emerald-400 border-emerald-500/40"
                  >
                    + حفظ كلمات المشهد للمراجعة الذكية
                  </button>
                </div>

                {/* Scene Quick Checkpoint (+5 XP) */}
                {activeScene.checkpoint && (
                  <div className="theme-card-elevated rounded-xl p-4 space-y-3 border border-amber-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold theme-text-accent">⚡ تمرين تحقق سريع للمشهد {activeScene.num} (+5 XP):</span>
                    </div>
                    <p className="text-sm font-bold">{activeScene.checkpoint.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {activeScene.checkpoint.options.map((opt, oIdx) => {
                        const chosen = checkpointAns[activeScene.num];
                        const isCorrect = opt === activeScene.checkpoint.correctAnswer;
                        let cls = 'theme-card hover:border-amber-500';
                        if (chosen) {
                          if (isCorrect) cls = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
                          else if (chosen === opt) cls = 'bg-rose-500/20 border-rose-500 text-rose-300';
                        }
                        return (
                          <button
                            key={oIdx}
                            onClick={() => {
                              if (!checkpointAns[activeScene.num]) {
                                setCheckpointAns({ ...checkpointAns, [activeScene.num]: opt });
                                if (isCorrect) onAwardXp(5, `تحقق المشهد ${activeScene.num}`);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-right ${cls}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Prev / Next Scene Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={safeSceneIdx === 0}
                    onClick={() => onChangeSceneIndex(safeSceneIdx - 1)}
                    className="top-header-control disabled:opacity-40"
                  >
                    → المشهد السابق
                  </button>
                  <div className="flex gap-1.5">
                    {story.scenes.map((sc, i) => (
                      <button
                        key={sc.num}
                        onClick={() => onChangeSceneIndex(i)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold ${
                          i === safeSceneIdx ? 'bg-amber-500 text-slate-950' : 'theme-card-elevated'
                        }`}
                      >
                        {sc.num}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={safeSceneIdx === story.scenes.length - 1}
                    onClick={() => onChangeSceneIndex(safeSceneIdx + 1)}
                    className="top-header-control disabled:opacity-40"
                  >
                    المشهد التالي ←
                  </button>
                </div>
              </div>
            )}

            {/* MODE B: Parallel Reading (All 7 scenes stacked) */}
            {readingMode === 'parallel' && (
              <div className="space-y-4">
                {story.scenes.map(sc => (
                  <div key={sc.num} className="theme-card rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                      <span className="text-xs font-bold theme-text-accent">المشهد {sc.num} من 7</span>
                      <button
                        onClick={() => onPlaySpeech(sc.tifinagh, 'scene', story.audio)}
                        className="top-header-control"
                      >
                        🔊 استمع
                      </button>
                    </div>
                    <p dir="ltr" className="font-tifinagh text-xl font-bold text-left leading-relaxed">
                      {sc.tifinagh}
                    </p>
                    {showLatin && <p dir="ltr" className="text-xs font-semibold theme-text-accent text-left">{sc.latin}</p>}
                    {showArabic && <p className="text-base font-bold theme-text-main">{sc.arabic}</p>}
                    {showFrench && <p dir="ltr" className="text-xs theme-text-muted italic text-left">{sc.french}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* MODE C: Focused Continuous Reading */}
            {readingMode === 'full' && (
              <div className="theme-card rounded-2xl p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                  <span className="text-sm font-bold theme-text-accent">النص المتصل الكامل للقصة:</span>
                  <div className="flex gap-2">
                    {[
                      { cls: 'text-xl', label: 'خط عادي' },
                      { cls: 'text-2xl', label: 'خط كبير +' },
                      { cls: 'text-3xl', label: 'خط مكبر ++' }
                    ].map(f => (
                      <button
                        key={f.cls}
                        onClick={() => setFontSizeClass(f.cls as typeof fontSizeClass)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                          fontSizeClass === f.cls ? 'bg-amber-500 text-slate-950 border-amber-500' : 'theme-card-elevated'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div dir="ltr" className={`font-tifinagh ${fontSizeClass} font-bold leading-loose text-left`}>
                  {story.scenes.map(sc => sc.tifinagh).join(' ')}
                </div>

                {showLatin && (
                  <div dir="ltr" className="text-sm theme-text-accent leading-relaxed text-left border-t border-[var(--border-subtle)] pt-3">
                    {story.scenes.map(sc => sc.latin).join(' ')}
                  </div>
                )}

                {showArabic && (
                  <div className="text-base font-bold leading-loose border-t border-[var(--border-subtle)] pt-3">
                    {story.scenes.map(sc => sc.arabic).join(' ')}
                  </div>
                )}
              </div>
            )}

            {/* Grammar & Cultural Context Footer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="theme-card rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-bold theme-text-accent">📐 إضاءة لغوية وقواعدية (Grammar):</h3>
                <p className="text-sm theme-text-secondary leading-relaxed">{story.grammar}</p>
              </div>
              <div className="theme-card rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-bold theme-text-accent">🏛️ السياق الثقافي والتوثيق:</h3>
                <p className="text-sm theme-text-secondary leading-relaxed">{story.culturalContext}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VOCABULARY (10 terms, Grid & Flashcards) */}
        {activeTab === 'vocab' && (
          <div className="space-y-4">
            <div className="theme-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">مصطلحات القصة العشرة الموثقة (10 مفردات)</h2>
                <p className="text-xs theme-text-muted">انقر على أي مصطلح لفتح الجدول الصرفي الرباعي أو أضفه للمراجعة الذكية</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setVocabViewMode('grid')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                    vocabViewMode === 'grid' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'theme-card-elevated'
                  }`}
                >
                  عرض الشبكة (Grid)
                </button>
                <button
                  onClick={() => setVocabViewMode('flashcards')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                    vocabViewMode === 'flashcards' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'theme-card-elevated'
                  }`}
                >
                  بطاقات الذاكرة (Flashcards)
                </button>
              </div>
            </div>

            {vocabViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {story.vocab.map(v => {
                  const isMastered = masteredWords.includes(v.id);
                  const isRev = reviewWords.includes(v.id);
                  const dItem = ALL_DICTIONARY_DATA.find(d => d.id === v.id);
                  return (
                    <div key={v.id} className="theme-card rounded-2xl p-4 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => dItem && onOpenWordModal(dItem)}
                          className="text-right hover:opacity-90"
                        >
                          <span className="font-tifinagh text-2xl font-bold theme-text-accent block">{v.tifinagh}</span>
                          <span className="text-xs font-bold theme-text-secondary" dir="ltr">({v.latin}) · [{v.phoneticAr}]</span>
                        </button>
                        <button
                          onClick={() => onPlaySpeech(v.tifinagh, 'word', v.audio)}
                          className="top-header-control"
                        >
                          🔊 استمع
                        </button>
                      </div>
                      <div>
                        <div className="text-base font-bold">{v.arabic}</div>
                        <div className="text-xs theme-text-muted" dir="ltr">{v.french}</div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
                        <button
                          onClick={() => onToggleMastered(v.id)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                            isMastered ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'theme-card-elevated'
                          }`}
                        >
                          {isMastered ? '✓ أتقنتها' : 'أتقنتها'}
                        </button>
                        <button
                          onClick={() => onToggleReview(v.id)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                            isRev ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'theme-card-elevated'
                          }`}
                        >
                          {isRev ? '★ في المراجعة' : '+ للمراجعة'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="theme-card rounded-2xl p-6 max-w-xl mx-auto text-center space-y-5">
                <div className="text-xs font-bold theme-text-muted">
                  البطاقة {(flashcardIdx % story.vocab.length) + 1} من {story.vocab.length}
                </div>
                <div
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="theme-card-elevated rounded-2xl p-8 min-h-[220px] flex flex-col items-center justify-center cursor-pointer border-2 border-amber-500/30 hover:border-amber-500 transition-all"
                >
                  {!isCardFlipped ? (
                    <>
                      <div className="font-tifinagh text-5xl font-bold theme-text-accent mb-3">{activeFlashcard.tifinagh}</div>
                      <div className="text-base font-bold theme-text-secondary">({activeFlashcard.latin})</div>
                      <span className="text-xs theme-text-muted mt-4">انقر لقلب البطاقة وإظهار المعنى ↺</span>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold theme-text-main mb-2">{activeFlashcard.arabic}</div>
                      <div className="text-sm theme-text-secondary" dir="ltr">{activeFlashcard.french}</div>
                      <div className="text-xs theme-text-accent mt-3">التقريب الصوتي: [{activeFlashcard.phoneticAr}]</div>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => { setFlashcardIdx(i => (i - 1 + story.vocab.length) % story.vocab.length); setIsCardFlipped(false); }}
                    className="top-header-control"
                  >
                    → السابقة
                  </button>
                  <button
                    onClick={() => onPlaySpeech(activeFlashcard.tifinagh, 'word', activeFlashcard.audio)}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    🔊 استمع للنطق
                  </button>
                  <button
                    onClick={() => { setFlashcardIdx(i => (i + 1) % story.vocab.length); setIsCardFlipped(false); }}
                    className="top-header-control"
                  >
                    التالية ←
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SENTENCE BUILDER */}
        {activeTab === 'sentences' && (
          <div className="theme-card rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h2 className="text-lg font-bold">معمل تركيب جملة القصة النحوية</h2>
                <p className="text-sm theme-text-secondary mt-1">رتب الكلمات الأمازيغية من اليسار لليمين لتكوين: «{story.sentenceBuilder.arabic}»</p>
              </div>
              <button
                onClick={() => onPlaySpeech(story.sentenceBuilder.tifinagh, 'sentence', story.audio)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                🔊 استمع للجملة النموذجية
              </button>
            </div>

            {/* Target Assembly Area (LTR) */}
            <div dir="ltr" className="min-h-[72px] p-4 rounded-2xl theme-card-elevated flex flex-wrap items-center gap-2.5 border-2 border-dashed border-amber-500/40">
              {builtWords.length === 0 ? (
                <span className="text-xs theme-text-muted">انقر على الكلمات المبعثرة بالأسفل لإضافتها بالترتيب (من اليسار لليمين)...</span>
              ) : (
                builtWords.map((w, idx) => (
                  <button
                    key={`${w}_${idx}`}
                    onClick={() => setBuiltWords(builtWords.filter((_, i) => i !== idx))}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-tifinagh font-bold text-lg"
                  >
                    {w} ✕
                  </button>
                ))
              )}
            </div>

            {/* Word Bank */}
            <div dir="ltr" className="flex flex-wrap gap-2.5">
              {story.sentenceBuilder.words.map((w, idx) => (
                <button
                  key={`${w}_${idx}`}
                  onClick={() => {
                    setBuiltWords([...builtWords, w]);
                    setInspectedWord(w);
                  }}
                  className="px-4 py-2.5 rounded-xl theme-card-elevated hover:border-amber-500 font-tifinagh font-bold text-lg"
                >
                  {w}
                </button>
              ))}
            </div>

            {/* Word Inspector */}
            {inspectedWord && (
              <div className="p-3.5 rounded-xl theme-card-elevated text-xs flex items-center justify-between">
                <span>
                  🔍 فاحص الكلمات (Word Inspector): الكلمة المختارة <strong className="font-tifinagh text-base theme-text-accent mx-1">{inspectedWord}</strong>
                </span>
                <button onClick={() => onPlaySpeech(inspectedWord, 'word')} className="top-header-control">🔊 نطق الكلمة</button>
              </div>
            )}

            {sentenceFeedback && (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-sm font-bold">
                {sentenceFeedback}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCheckSentence}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm"
              >
                ✓ تحقق من الجملة
              </button>
              <button
                onClick={() => { setBuiltWords([]); setSentenceFeedback(null); }}
                className="top-header-control"
              >
                إعادة ضبط
              </button>
            </div>

            <div className="theme-card-elevated p-4 rounded-xl text-xs leading-relaxed space-y-1">
              <strong className="theme-text-accent block">الشرح النحوي للجملة:</strong>
              <p>{story.sentenceBuilder.explanation}</p>
            </div>
          </div>
        )}

        {/* TAB 4: STORY QUIZ (10 questions) */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <div className="theme-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">اختبار فهم ومصطلحات القصة (10 أسئلة)</h2>
                <p className="text-xs theme-text-muted">تُرحّل الكلمات التي تخطئ فيها تلقائياً إلى نظام المراجعة الذكية (Leitner SRS)</p>
              </div>
              {savedScore !== undefined && (
                <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-sm font-bold tabular-nums">
                  أفضل نتيجة مسجلة: {savedScore} / 10
                </div>
              )}
            </div>

            <div className="space-y-4">
              {story.quiz.map((q, qIdx) => {
                const userChoice = quizAnswers[qIdx];
                return (
                  <div key={q.id} className="theme-card rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold theme-text-accent">السؤال {q.questionNum} من 10</span>
                      <button
                        onClick={() => onPlaySpeech(q.tifinaghWord, 'word')}
                        className="top-header-control"
                      >
                        🔊 {q.tifinaghWord}
                      </button>
                    </div>
                    <h3 className="text-base font-bold">{q.prompt}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, oIdx) => {
                        const isPicked = userChoice === oIdx;
                        const isRight = oIdx === q.correctIndex;
                        let optCls = 'theme-card-elevated hover:border-amber-500/60';
                        if (userChoice !== undefined) {
                          if (isRight) optCls = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
                          else if (isPicked) optCls = 'bg-rose-500/20 border-rose-500 text-rose-300';
                        }
                        return (
                          <button
                            key={oIdx}
                            onClick={() => setQuizAnswers({ ...quizAnswers, [qIdx]: oIdx })}
                            className={`p-3.5 rounded-xl border text-right text-sm font-bold transition-all ${optCls}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {userChoice !== undefined && (
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
                onClick={handleSubmitStoryQuiz}
                className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400"
              >
                ✓ اعتماد النتيجة وحفظ التقدم في القصة
              </button>
              {quizSubmitted && (
                <span className="text-sm font-bold text-emerald-400">
                  تم حفظ نتيجتك وتحديث نقاط الإنجاز (XP) وصناديق المراجعة الذكية!
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
