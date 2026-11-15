/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ALPHABET_DATA,
  STORIES_DATA,
  ALL_DICTIONARY_DATA,
  DEFAULT_EDUCATIONAL_LINKS
} from './data/amazighData';
import {
  generateArabicPhonetic,
  computeNextSrsCardState,
  SrsCardRecord
} from './utils/amazighLogic';
import {
  getCustomAudioRecording,
  playGentleChime,
  getStorySvgDataUri,
  getHeroBannerSvgDataUri
} from './utils/audioAndAssets';
import {
  ListeningLabModal,
  AudioStudioModal,
  FiveMinuteModeModal,
  LinguisticAssistantModal
} from './components/AppModals';
import {
  WordDetailModal,
  LetterDetailModal,
  GlobalSearchModal,
  SettingsDrawer,
  ConfirmActionModal,
  DictEntryType,
  LetterEntryType
} from './components/DetailModals';
import { StoryDetailView, StoryEntryType } from './components/StoryDetailView';
import { DictionaryView, CustomWordList } from './components/DictionaryView';
import {
  SentencesLabView,
  QuizzesBankView,
  SmartReviewView
} from './components/PracticeViews';
import { LinksDirectoryView, AboutView, LinkItemType } from './components/LinksAndAboutViews';

// Required localStorage keys from specification
const STATE_KEY = 'amazigh_learn_state_v5';
const SRS_STATE_KEY = 'amazigh_srs_state_v4';
const APPEARANCE_KEY = 'amazigh_appearance_v4';
const LEARNING_PREFS_KEY = 'amazigh_learning_prefs_v4';
const DICT_LISTS_KEY = 'amazigh_dict_lists_v4';
const LINKS_STATE_KEY = 'amazigh_links_state_v4';

export type NavViewKey =
  | 'home'
  | 'alphabet'
  | 'stories'
  | 'story-detail'
  | 'dictionary'
  | 'sentences'
  | 'quizzes'
  | 'review'
  | 'links'
  | 'about';

interface AppStateV5 {
  version: number;
  userXP: number;
  completedStories: string[];
  lastStoryId: string;
  storySceneProgress: Record<string, number>;
  quizScores: Record<string, number>;
  masteredWords: string[];
  reviewWords: string[];
  theme: 'dark' | 'light';
  soundEnabled: boolean;
}

export default function App() {
  // 1. Primary App State (amazigh_learn_state_v5)
  const [appState, setAppState] = useState<AppStateV5>(() => {
    try {
      const saved = localStorage.getItem(STATE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      version: 5,
      userXP: 120,
      completedStories: ['story1'],
      lastStoryId: 'story1',
      storySceneProgress: { story1: 0 },
      quizScores: { story1: 9 },
      masteredWords: ['s1_v1', 's1_v2', 's1_v4', 's1_v7'],
      reviewWords: ['s1_v3', 's1_v9', 's2_v1', 's3_v1', 's4_v1'],
      theme: 'dark',
      soundEnabled: true
    };
  });

  // 2. SRS State (amazigh_srs_state_v4)
  const [srsState, setSrsState] = useState<{
    cards: Record<string, SrsCardRecord>;
    dailyCount: number;
    lastReviewDay: string;
  }>(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    try {
      const saved = localStorage.getItem(SRS_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          cards: parsed.cards || {},
          dailyCount: parsed.lastReviewDay === todayStr ? parsed.dailyCount || 0 : 0,
          lastReviewDay: todayStr
        };
      }
    } catch {
      // ignore
    }
    const now = Date.now();
    return {
      cards: {
        s1_v3: { id: 's1_v3', box: 1, nextDue: now - 1000, lastReviewed: 0, lapses: 0, reps: 1 },
        s1_v9: { id: 's1_v9', box: 1, nextDue: now - 1000, lastReviewed: 0, lapses: 0, reps: 1 },
        s2_v1: { id: 's2_v1', box: 2, nextDue: now - 1000, lastReviewed: 0, lapses: 0, reps: 2 },
        s3_v1: { id: 's3_v1', box: 2, nextDue: now + 86400000, lastReviewed: now, lapses: 0, reps: 2 },
        s4_v1: { id: 's4_v1', box: 3, nextDue: now + 172800000, lastReviewed: now, lapses: 0, reps: 3 }
      },
      dailyCount: 3,
      lastReviewDay: todayStr
    };
  });

  // 3. Learning Prefs (amazigh_learning_prefs_v4)
  const [learningPrefs, setLearningPrefs] = useState<{
    dailyGoal: number;
    audioSpeed: number;
  }>(() => {
    try {
      const saved = localStorage.getItem(LEARNING_PREFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { dailyGoal: 10, audioSpeed: 1 };
  });

  // 4. Dictionary Lists & Favorites (amazigh_dict_lists_v4)
  const [dictListsState, setDictListsState] = useState<{
    favorites: string[];
    customLists: CustomWordList[];
  }>(() => {
    try {
      const saved = localStorage.getItem(DICT_LISTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      favorites: ['s1_v1', 's3_v1', 's6_v1', 'dglai_c1', 'dglai_c2'],
      customLists: [
        { id: 'list_nature', name: 'مفردات الطبيعة والأطلس', wordIds: ['s1_v3', 's1_v4', 's1_v7', 's4_v1'] }
      ]
    };
  });

  // 5. Links State (amazigh_links_state_v4)
  const [linksState, setLinksState] = useState<{
    favorites: string[];
    customLinks: LinkItemType[];
  }>(() => {
    try {
      const saved = localStorage.getItem(LINKS_STATE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      favorites: ['link_dglai_home', 'link_ircam_main', 'link_mooc_ircam'],
      customLinks: []
    };
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(appState));
      localStorage.setItem(
        APPEARANCE_KEY,
        JSON.stringify({ theme: appState.theme, density: 'comfortable', accent: 'amber' })
      );
    } catch {
      // ignore
    }
    const root = document.documentElement;
    if (appState.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [appState]);

  useEffect(() => {
    try {
      localStorage.setItem(SRS_STATE_KEY, JSON.stringify(srsState));
    } catch {
      // ignore
    }
  }, [srsState]);

  useEffect(() => {
    try {
      localStorage.setItem(LEARNING_PREFS_KEY, JSON.stringify(learningPrefs));
    } catch {
      // ignore
    }
  }, [learningPrefs]);

  useEffect(() => {
    try {
      localStorage.setItem(DICT_LISTS_KEY, JSON.stringify(dictListsState));
    } catch {
      // ignore
    }
  }, [dictListsState]);

  useEffect(() => {
    try {
      localStorage.setItem(LINKS_STATE_KEY, JSON.stringify(linksState));
    } catch {
      // ignore
    }
  }, [linksState]);

  // Navigation & Dropdown State
  const [activeView, setActiveView] = useState<NavViewKey>('home');
  const [openDropdown, setOpenDropdown] = useState<'practice' | 'more' | null>(null);
  const [activeStoryId, setActiveStoryId] = useState<string>('story1');
  const [storySourceNav, setStorySourceNav] = useState<NavViewKey>('stories');

  // Filter states for Alphabet & Stories
  const [alphabetFilter, setAlphabetFilter] = useState<'all' | 'vowel' | 'emphatic' | 'labiovelar'>('all');
  const [storySearch, setStorySearch] = useState('');
  const [storyFilter, setStoryFilter] = useState<'all' | 'tachelhit' | 'tamazight' | 'tarifit' | 'folklore' | 'history'>('all');

  // Modals State
  const [selectedWordModal, setSelectedWordModal] = useState<DictEntryType | null>(null);
  const [selectedLetterModal, setSelectedLetterModal] = useState<LetterEntryType | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isListeningLabOpen, setIsListeningLabOpen] = useState(false);
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState(false);
  const [isFiveMinOpen, setIsFiveMinOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Unified Audio Player & Phonetic Toast State
  const [phoneticToast, setPhoneticToast] = useState<{
    visible: boolean;
    tifinagh: string;
    phoneticAr: string;
    layerLabel: string;
    dialectLabel: string;
  } | null>(null);

  const [playerBar, setPlayerBar] = useState<{
    visible: boolean;
    isPlaying: boolean;
    title: string;
    tifinagh: string;
    layerLabel: string;
    dialectLabel: string;
    autoAdvance: boolean;
    progress: number;
  }>({
    visible: false,
    isPlaying: false,
    title: '',
    tifinagh: '',
    layerLabel: 'الطبقة 4: التقريب الصوتي العربي الموثق',
    dialectLabel: 'الأمازيغية المعيارية (IRCAM)',
    autoAdvance: true,
    progress: 0
  });

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const practiceMenuRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns on outside click or Escape, and Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      } else if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        practiceMenuRef.current &&
        !practiceMenuRef.current.contains(target) &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleDocClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleDocClick);
    };
  }, []);

  // Clamp dropdown menus inside viewport on small mobile screens
  const getDropdownClampStyle = (groupKey: 'practice' | 'more'): React.CSSProperties => {
    return groupKey === 'practice' ? { right: 0 } : { left: 0 };
  };

  const switchNav = (view: NavViewKey) => {
    setActiveView(view);
    setOpenDropdown(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openStoryDetail = (storyId: string, source: NavViewKey = activeView) => {
    setStorySourceNav(source === 'story-detail' ? 'stories' : source);
    setActiveStoryId(storyId);
    setAppState(prev => ({ ...prev, lastStoryId: storyId }));
    setActiveView('story-detail');
    setOpenDropdown(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4-Layer Amazigh Audio Engine: playSpeech(textEncoded, type, explicitAudioPath)
  const playSpeech = async (text: string, type: string = 'word', explicitAudioPath?: string) => {
    if (!appState.soundEnabled) {
      setPhoneticToast({
        visible: true,
        tifinagh: text,
        phoneticAr: 'الصوت مكتوم حالياً — فعّل زر صوت النطق في الشريط العلوي للاستماع.',
        layerLabel: 'تنبيه كتم الصوت',
        dialectLabel: 'إعدادات الصوت'
      });
      return;
    }

    const phoneticApprox = generateArabicPhonetic(text);

    // Layer 1: Human recording in IndexedDB
    const customRec = await getCustomAudioRecording(text);
    if (customRec && customRec.dataUrl) {
      try {
        if (audioElRef.current) audioElRef.current.pause();
        const audio = new Audio(customRec.dataUrl);
        audio.playbackRate = learningPrefs.audioSpeed;
        audioElRef.current = audio;
        await audio.play();
        setPlayerBar({
          visible: true,
          isPlaying: true,
          title: `${customRec.tifinagh} (${customRec.latin}) — ${customRec.arabic}`,
          tifinagh: customRec.tifinagh,
          layerLabel: 'الطبقة 1: تسجيل بشري محلي (IndexedDB)',
          dialectLabel: customRec.dialect,
          autoAdvance: playerBar.autoAdvance,
          progress: 100
        });
        return;
      } catch {
        // continue to Layer 2
      }
    }

    // Layer 2: Check genuine Amazigh SpeechSynthesis voice (zgh, tzm, shi, rif, ber, kab)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      const amazighVoice = voices.find(v =>
        /^(zgh|tzm|shi|rif|ber|kab)/i.test(v.lang)
      );
      if (amazighVoice) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.voice = amazighVoice;
        utter.rate = learningPrefs.audioSpeed;
        window.speechSynthesis.speak(utter);
        setPlayerBar({
          visible: true,
          isPlaying: true,
          title: `نطق صوتي: ${text}`,
          tifinagh: text,
          layerLabel: `الطبقة 2: صوت النظام الأمازيغي (${amazighVoice.lang})`,
          dialectLabel: 'الأمازيغية المعيارية',
          autoAdvance: playerBar.autoAdvance,
          progress: 100
        });
        return;
      }
    }

    // Layer 4: Honest Phonetic Fallback (Never fake French/Arabic TTS as Amazigh)
    playGentleChime('phonetic');
    setPhoneticToast({
      visible: true,
      tifinagh: text,
      phoneticAr: phoneticApprox,
      layerLabel: 'الطبقة 4: التقريب الصوتي العربي الموثق (بديل صادق)',
      dialectLabel: type === 'scene' ? 'سرد المشهد الأمازيغي' : 'نطق معجمي معياري (IRCAM)'
    });
    setPlayerBar({
      visible: true,
      isPlaying: false,
      title: `التقريب الصوتي: [${phoneticApprox}]`,
      tifinagh: text,
      layerLabel: 'الطبقة 4: التقريب الصوتي الموثق',
      dialectLabel: explicitAudioPath ? 'IRCAM Standard' : 'الأمازيغية المعيارية',
      autoAdvance: playerBar.autoAdvance,
      progress: 100
    });
  };

  const playFullStoryContinuous = (story: StoryEntryType) => {
    const firstScene = story.scenes[0];
    playSpeech(firstScene.tifinagh, 'scene', story.audio);
    setPlayerBar(prev => ({
      ...prev,
      visible: true,
      isPlaying: true,
      title: `قراءة متصلة: ${story.titleAr} (7 مشاهد)`,
      tifinagh: story.titleTif,
      dialectLabel: story.dialect,
      progress: 100
    }));
  };

  // XP & SRS Handlers
  const awardXp = (xpDelta: number, reason: string) => {
    setAppState(prev => ({ ...prev, userXP: prev.userXP + xpDelta }));
    setPhoneticToast({
      visible: true,
      tifinagh: `+${xpDelta} XP`,
      phoneticAr: reason,
      layerLabel: 'نقاط الإنجاز الحية',
      dialectLabel: 'Amazigh Learn'
    });
  };

  const recordSrsOutcome = (vocabId: string, outcome: 'hard' | 'good' | 'easy') => {
    const currentCard = srsState.cards[vocabId];
    const { card, xpDelta, isMastered } = computeNextSrsCardState(currentCard, vocabId, outcome);
    const todayStr = new Date().toISOString().slice(0, 10);

    setSrsState(prev => ({
      cards: { ...prev.cards, [vocabId]: card },
      dailyCount: prev.dailyCount + 1,
      lastReviewDay: todayStr
    }));

    setAppState(prev => {
      const masteredSet = new Set(prev.masteredWords);
      const reviewSet = new Set(prev.reviewWords);
      reviewSet.add(vocabId);
      if (isMastered) masteredSet.add(vocabId);
      return {
        ...prev,
        userXP: prev.userXP + xpDelta,
        masteredWords: Array.from(masteredSet),
        reviewWords: Array.from(reviewSet)
      };
    });
  };

  const handleSaveQuizScore = (storyId: string, score: number, wrongVocabIds: string[]) => {
    wrongVocabIds.forEach(vid => recordSrsOutcome(vid, 'hard'));
    setAppState(prev => {
      const completed = new Set(prev.completedStories);
      if (score >= 6) completed.add(storyId);
      const prevBest = prev.quizScores[storyId] || 0;
      return {
        ...prev,
        userXP: prev.userXP + score * 5,
        completedStories: Array.from(completed),
        quizScores: { ...prev.quizScores, [storyId]: Math.max(prevBest, score) }
      };
    });
  };

  const handleSeedFiveSrsWords = () => {
    const now = Date.now();
    const candidates = ALL_DICTIONARY_DATA.filter(d => !srsState.cards[d.id]).slice(0, 5);
    const nextCards = { ...srsState.cards };
    const nextRev = new Set(appState.reviewWords);
    candidates.forEach(c => {
      nextCards[c.id] = { id: c.id, box: 1, nextDue: now - 1000, lastReviewed: 0, lapses: 0, reps: 0 };
      nextRev.add(c.id);
    });
    setSrsState(prev => ({ ...prev, cards: nextCards }));
    setAppState(prev => ({ ...prev, reviewWords: Array.from(nextRev) }));
    awardXp(10, 'تمت إضافة 5 كلمات جديدة إلى صندوق المراجعة الذكية!');
  };

  // Backup Export / Import / Reset
  const handleExportBackup = () => {
    const payload = {
      version: 5,
      exportedAt: new Date().toISOString(),
      amazigh_learn_state_v5: appState,
      amazigh_srs_state_v4: srsState,
      amazigh_learning_prefs_v4: learningPrefs,
      amazigh_dict_lists_v4: dictListsState,
      amazigh_links_state_v4: linksState
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amazigh-learn-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonStr: string) => {
    const data = JSON.parse(jsonStr);
    if (data.amazigh_learn_state_v5) setAppState(data.amazigh_learn_state_v5);
    if (data.amazigh_srs_state_v4) setSrsState(data.amazigh_srs_state_v4);
    if (data.amazigh_learning_prefs_v4) setLearningPrefs(data.amazigh_learning_prefs_v4);
    if (data.amazigh_dict_lists_v4) setDictListsState(data.amazigh_dict_lists_v4);
    if (data.amazigh_links_state_v4) setLinksState(data.amazigh_links_state_v4);
  };

  const handleRequestResetProgress = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'إعادة ضبط تقدم التعلم',
      message: 'هل أنت متأكد من رغبتك في إعادة ضبط النقاط والقصص المكتملة وصناديق المراجعة الذكية إلى حالتها الابتدائية؟',
      onConfirm: () => {
        localStorage.removeItem(STATE_KEY);
        localStorage.removeItem(SRS_STATE_KEY);
        setAppState({
          version: 5,
          userXP: 0,
          completedStories: [],
          lastStoryId: 'story1',
          storySceneProgress: {},
          quizScores: {},
          masteredWords: [],
          reviewWords: [],
          theme: appState.theme,
          soundEnabled: appState.soundEnabled
        });
        setSrsState({ cards: {}, dailyCount: 0, lastReviewDay: new Date().toISOString().slice(0, 10) });
      }
    });
  };

  // Computed counts & active items
  const srsDueCount = (Object.values(srsState.cards) as SrsCardRecord[]).filter(
    c => c.nextDue <= Date.now()
  ).length;
  const currentStoryObj = STORIES_DATA.find(s => s.id === activeStoryId) || STORIES_DATA[0];
  const resumeStoryObj = STORIES_DATA.find(s => s.id === appState.lastStoryId) || STORIES_DATA[0];
  const wordOfTheDay = ALL_DICTIONARY_DATA[5]; // Argan
  const storyOfTheDay = STORIES_DATA[0];

  const practiceViews = ['sentences', 'quizzes', 'review'];
  const moreViews = ['links', 'about'];
  const isPracticeActive = practiceViews.includes(activeView);
  const isMoreActive = moreViews.includes(activeView);

  const practiceActiveLabel =
    activeView === 'sentences'
      ? ' · معمل الجمل'
      : activeView === 'quizzes'
      ? ' · الاختبارات'
      : activeView === 'review'
      ? ' · المراجعة الذكية'
      : '';

  const moreActiveLabel =
    activeView === 'links' ? ' · الروابط المهمة' : activeView === 'about' ? ' · حول البرنامج' : '';

  const [logoImgFailed, setLogoImgFailed] = useState(false);
  const [heroBannerFailed, setHeroBannerFailed] = useState(false);

  const filteredAlphabet = ALPHABET_DATA.filter(l => {
    if (alphabetFilter === 'all') return true;
    return l.category === alphabetFilter;
  });

  const filteredStories = STORIES_DATA.filter(st => {
    if (storyFilter === 'tachelhit' && st.dialectGroup !== 'tachelhit') return false;
    if (storyFilter === 'tamazight' && st.dialectGroup !== 'tamazight') return false;
    if (storyFilter === 'tarifit' && st.dialectGroup !== 'tarifit') return false;
    if (storyFilter === 'folklore' && st.categoryKey === 'history') return false;
    if (storyFilter === 'history' && st.categoryKey !== 'history') return false;
    if (storySearch.trim()) {
      const q = storySearch.trim().toLowerCase();
      return (
        st.titleAr.toLowerCase().includes(q) ||
        st.titleTif.includes(q) ||
        st.titleLat.toLowerCase().includes(q) ||
        st.region.toLowerCase().includes(q) ||
        st.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const allLinks = [...DEFAULT_EDUCATIONAL_LINKS, ...linksState.customLinks];

  return (
    <div className="theme-page">
      {/* MAIN APP HEADER (Hidden automatically when reading a story in #view-story-detail) */}
      {activeView !== 'story-detail' && (
        <header id="main-app-header" className="theme-header sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 space-y-2.5">
            {/* Top Bar Row: Brand on Right (RTL) + 5 Matched Controls on Left */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Right side (RTL): Logo + Title + Subtitle */}
              <button
                type="button"
                onClick={() => switchNav('home')}
                className="flex items-center gap-3 text-right cursor-pointer group"
              >
                <img
                  id="app-custom-logo"
                  src="assets/images/logo.png"
                  alt="شعار Amazigh Learn"
                  onError={() => setLogoImgFailed(true)}
                  className={`w-10 h-10 rounded-xl object-contain shrink-0 ${logoImgFailed ? 'hidden' : ''}`}
                />
                <svg
                  id="app-default-logo"
                  viewBox="0 0 64 64"
                  className={`w-10 h-10 rounded-xl shrink-0 shadow-md ${logoImgFailed ? '' : 'hidden'}`}
                  aria-label="شعار الياز الأمازيغي"
                >
                  <rect width="64" height="64" rx="14" fill="#0b1329" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="18" cy="18" r="7" fill="#38bdf8" fillOpacity="0.35" />
                  <circle cx="46" cy="20" r="7" fill="#10b981" fillOpacity="0.35" />
                  <circle cx="32" cy="48" r="8" fill="#f59e0b" fillOpacity="0.35" />
                  <text
                    x="32"
                    y="44"
                    textAnchor="middle"
                    fontFamily="Noto Sans Tifinagh, sans-serif"
                    fontSize="34"
                    fontWeight="bold"
                    fill="#ef4444"
                  >
                    ⵣ
                  </text>
                </svg>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tifinagh text-lg md:text-xl font-extrabold theme-text-accent">
                      ⴰⵎⴰⵣⵉⵖ
                    </span>
                    <span className="text-base md:text-lg font-extrabold theme-text-main group-hover:text-amber-400 transition-colors">
                      Amazigh Learn
                    </span>
                  </div>
                  <p className="text-[11px] md:text-xs theme-text-muted hidden sm:block">
                    تراث وقصص وأبجدية تيفيناغ للأطفال والمبتدئين
                  </p>
                </div>
              </button>

              {/* Left side (RTL): 5 Identical Height Controls (.top-header-control) */}
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                {/* 1. Global Search Button */}
                <button
                  id="global-search-trigger-btn"
                  type="button"
                  onClick={() => setIsGlobalSearchOpen(true)}
                  className="top-header-control"
                  title="بحث شامل في القصص والمعجم والحروف (Ctrl+K)"
                  aria-label="بحث شامل"
                >
                  <span>🔍</span>
                  <span className="hidden sm:inline">بحث شامل</span>
                  <kbd className="hidden md:inline text-[10px] opacity-70 px-1 py-0.5 rounded bg-slate-800/50">
                    Ctrl+K
                  </kbd>
                </button>

                {/* 2. Live XP Badge */}
                <div
                  id="header-xp-badge"
                  className="top-header-control cursor-default border-amber-500/40"
                  title="نقاط الإنجاز الحية"
                >
                  <span className="text-amber-400">★</span>
                  <span id="user-xp-display" className="tabular-nums font-extrabold theme-text-accent">
                    {appState.userXP}
                  </span>
                  <span>نقطة</span>
                </div>

                {/* 3. Sound Pronunciation Toggle */}
                <button
                  id="sound-toggle-btn"
                  type="button"
                  onClick={() => {
                    const next = !appState.soundEnabled;
                    setAppState(prev => ({ ...prev, soundEnabled: next }));
                    setPhoneticToast({
                      visible: true,
                      tifinagh: next ? '🔊 الصوت مفعل' : '🔇 الصوت مكتوم',
                      phoneticAr: next
                        ? 'تم تفعيل نطق الحروف والكلمات والفقرات والمؤثرات الصوتية للتمارين.'
                        : 'تم كتم صوت النطق والمؤثرات الصوتية للتمارين.',
                      layerLabel: 'التحكم الصوتي',
                      dialectLabel: 'Amazigh Learn'
                    });
                  }}
                  className="top-header-control"
                  title="يتحكم في نطق الحروف والكلمات والفقرات والمؤثرات الصوتية للتمارين"
                  aria-label="يتحكم في نطق الحروف والكلمات والفقرات والمؤثرات الصوتية للتمارين"
                >
                  <span>{appState.soundEnabled ? '🔊' : '🔇'}</span>
                  <span className="hidden md:inline">صوت النطق</span>
                </button>

                {/* 4. Theme Toggle */}
                <button
                  id="theme-toggle-btn"
                  type="button"
                  onClick={() =>
                    setAppState(prev => ({
                      ...prev,
                      theme: prev.theme === 'dark' ? 'light' : 'dark'
                    }))
                  }
                  className="top-header-control"
                  title="تبديل المظهر بين الوضع الليلي والنهاري"
                  aria-label="تبديل المظهر"
                >
                  <span>{appState.theme === 'dark' ? '🌙' : '☀️'}</span>
                  <span className="hidden lg:inline">
                    {appState.theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}
                  </span>
                </button>

                {/* 5. Advanced Settings */}
                <button
                  id="settings-trigger-btn"
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="top-header-control"
                  title="الإعدادات المتقدمة"
                  aria-label="الإعدادات المتقدمة"
                >
                  <span>⚙️</span>
                  <span className="hidden lg:inline">الإعدادات</span>
                </button>
              </div>
            </div>

            {/* Main Navigation Bar (#main-nav-bar) with 4 Direct Pills + 2 Grouped Dropdowns */}
            <nav id="main-nav-bar" aria-label="التنقل الرئيسي">
              <button
                id="nav-btn-home"
                type="button"
                onClick={() => switchNav('home')}
                className={`nav-pill-btn ${activeView === 'home' ? 'active' : ''}`}
              >
                <span>🏠</span>
                <span>الرئيسية</span>
              </button>

              <button
                id="nav-btn-alphabet"
                type="button"
                onClick={() => switchNav('alphabet')}
                className={`nav-pill-btn ${activeView === 'alphabet' ? 'active' : ''}`}
              >
                <span className="font-tifinagh font-bold">ⴰ</span>
                <span>الأبجدية (33)</span>
              </button>

              <button
                id="nav-btn-stories"
                type="button"
                onClick={() => switchNav('stories')}
                className={`nav-pill-btn ${activeView === 'stories' ? 'active' : ''}`}
              >
                <span>📖</span>
                <span>مكتبة القصص (26)</span>
              </button>

              <button
                id="nav-btn-dictionary"
                type="button"
                onClick={() => switchNav('dictionary')}
                className={`nav-pill-btn ${activeView === 'dictionary' ? 'active' : ''}`}
              >
                <span>📚</span>
                <span>المعجم (340)</span>
              </button>

              {/* Dropdown Group 1: التدريب والمراجعة */}
              <div id="nav-dropdown-practice" ref={practiceMenuRef} className="relative">
                <button
                  id="nav-group-btn-practice"
                  type="button"
                  aria-expanded={openDropdown === 'practice'}
                  onClick={() =>
                    setOpenDropdown(prev => (prev === 'practice' ? null : 'practice'))
                  }
                  className={`nav-pill-btn ${isPracticeActive ? 'active' : ''}`}
                >
                  <span>🎯</span>
                  <span>التدريب والمراجعة{practiceActiveLabel}</span>
                  <span className="text-xs">▾</span>
                </button>

                {openDropdown === 'practice' && (
                  <div
                    id="nav-menu-practice"
                    style={getDropdownClampStyle('practice')}
                    className="nav-dropdown-menu space-y-1"
                  >
                    <button
                      id="nav-btn-sentences"
                      type="button"
                      onClick={() => switchNav('sentences')}
                      className={`nav-dropdown-item ${activeView === 'sentences' ? 'active' : ''}`}
                    >
                      <div>
                        <div className="text-xs font-bold">🧩 معمل الجمل</div>
                        <div className="text-[11px] theme-text-muted">تركيب الجمل النحوية خطوة بخطوة</div>
                      </div>
                      <span className="text-[11px] font-bold theme-text-accent shrink-0">26 جملة</span>
                    </button>

                    <button
                      id="nav-btn-quizzes"
                      type="button"
                      onClick={() => switchNav('quizzes')}
                      className={`nav-dropdown-item ${activeView === 'quizzes' ? 'active' : ''}`}
                    >
                      <div>
                        <div className="text-xs font-bold">📝 الاختبارات (260)</div>
                        <div className="text-[11px] theme-text-muted">اختبارات المصطلحات والفهم لكل قصة</div>
                      </div>
                      <span className="text-[11px] font-bold theme-text-accent shrink-0">260 سؤالاً</span>
                    </button>

                    <button
                      id="nav-btn-review"
                      type="button"
                      onClick={() => switchNav('review')}
                      className={`nav-dropdown-item ${activeView === 'review' ? 'active' : ''}`}
                    >
                      <div>
                        <div className="text-xs font-bold">🧠 المراجعة الذكية</div>
                        <div className="text-[11px] theme-text-muted">تثبيت الكلمات بالتكرار المتباعد</div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 shrink-0">
                        مستحقة: <span id="header-srs-due-count">{srsDueCount}</span>
                      </span>
                    </button>

                    <button
                      id="nav-btn-listening-lab"
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        setIsListeningLabOpen(true);
                      }}
                      className="nav-dropdown-item"
                    >
                      <div>
                        <div className="text-xs font-bold">🎧 مختبر النطق والاستماع</div>
                        <div className="text-[11px] theme-text-muted">6 تدريبات سمعية ومقارنة نطق</div>
                      </div>
                      <span className="text-[11px] font-bold theme-text-accent shrink-0">6 أنماط</span>
                    </button>

                    <button
                      id="nav-btn-audio-studio"
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        setIsAudioStudioOpen(true);
                      }}
                      className="nav-dropdown-item"
                    >
                      <div>
                        <div className="text-xs font-bold">🎙️ استوديو الصوت الأمازيغي</div>
                        <div className="text-[11px] theme-text-muted">تسجيل وربط الأصوات البشرية محلياً</div>
                      </div>
                      <span className="text-[11px] font-bold theme-text-accent shrink-0">تسجيل محلي</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dropdown Group 2: المزيد */}
              <div id="nav-dropdown-more" ref={moreMenuRef} className="relative">
                <button
                  id="nav-group-btn-more"
                  type="button"
                  aria-expanded={openDropdown === 'more'}
                  onClick={() => setOpenDropdown(prev => (prev === 'more' ? null : 'more'))}
                  className={`nav-pill-btn ${isMoreActive ? 'active' : ''}`}
                >
                  <span>🧭</span>
                  <span>المزيد{moreActiveLabel}</span>
                  <span className="text-xs">▾</span>
                </button>

                {openDropdown === 'more' && (
                  <div
                    id="nav-menu-more"
                    style={getDropdownClampStyle('more')}
                    className="nav-dropdown-menu space-y-1"
                  >
                    <button
                      id="nav-btn-links"
                      type="button"
                      onClick={() => switchNav('links')}
                      className={`nav-dropdown-item ${activeView === 'links' ? 'active' : ''}`}
                    >
                      <div>
                        <div className="text-xs font-bold">🔗 الروابط المهمة</div>
                        <div className="text-[11px] theme-text-muted">بوابات IRCAM ومعجم DGLAi والمراجع</div>
                      </div>
                      <span className="text-[11px] font-bold theme-text-accent shrink-0">24 مرجعاً</span>
                    </button>

                    <button
                      id="nav-btn-about"
                      type="button"
                      onClick={() => switchNav('about')}
                      className={`nav-dropdown-item ${activeView === 'about' ? 'active' : ''}`}
                    >
                      <div>
                        <div className="text-xs font-bold">ℹ️ حول البرنامج</div>
                        <div className="text-[11px] theme-text-muted">رسالة المشروع وهويته وإدارة البيانات</div>
                      </div>
                      <span className="text-[11px] font-bold theme-text-accent shrink-0">معلومات</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </header>
      )}

      {/* MAIN VIEWPORT CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 md:px-6 py-5">
        {/* 1. HOME VIEW (#view-home) */}
        {activeView === 'home' && (
          <section id="view-home" className="space-y-6">
            {/* Hero Banner Card with Royal Gradient & Fallback */}
            <div
              className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl bg-gradient-to-l from-[#051428] via-[#0b1f3a] to-[#081226]"
            >
              <img
                id="hero-custom-banner"
                src={heroBannerFailed ? getHeroBannerSvgDataUri() : 'assets/images/banner.png'}
                alt="بانر منصة Amazigh Learn"
                onError={() => setHeroBannerFailed(true)}
                className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
              />
              <div className="relative z-10 p-6 md:p-10 space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400">
                  <span className="font-tifinagh text-base">ⵣ ⴰⵎⴰⵣⵉⵖ</span>
                  <span>·</span>
                  <span>تعلّم الأمازيغية المغربية بحروف تيفيناغ الرسمية (IRCAM)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight max-w-3xl">
                  منصة «Amazigh Learn — <span className="font-tifinagh text-amber-400">ⴰⵎⴰⵣⵉⵖ</span>» لتعليم اللغة والثقافة الأمازيغية المغربية
                </h1>
                <p className="text-sm md:text-base text-slate-200 max-w-2xl leading-relaxed">
                  رحلة تفاعلية تجمع 33 حرفاً من أبجدية تيفيناغ، و26 قصة تراثية وتاريخية موثقة من سوس والأطلس والريف، ومعجماً صرفياً من 340 مدخلاً، و260 سؤال اختبار مع نظام التكرار المتباعد.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => switchNav('stories')}
                    className="px-5 py-3 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm hover:bg-amber-400 transition-colors"
                  >
                    📖 استكشف الـ 26 قصة
                  </button>
                  <button
                    onClick={() => switchNav('alphabet')}
                    className="px-5 py-3 rounded-xl bg-slate-900/90 text-white border border-slate-700 font-bold text-sm hover:border-amber-400 transition-colors"
                  >
                    ⴰ الأبجدية (تيفيناغ)
                  </button>
                  <button
                    onClick={() => switchNav('sentences')}
                    className="px-5 py-3 rounded-xl bg-slate-900/90 text-white border border-slate-700 font-bold text-sm hover:border-amber-400 transition-colors"
                  >
                    🧩 معمل الجمل
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Quick Access Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <button
                onClick={() => setIsFiveMinOpen(true)}
                className="theme-card rounded-2xl p-4 text-right hover:border-amber-500 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">⚡</span>
                  <span className="text-[11px] font-bold theme-text-accent">جلسة يومية</span>
                </div>
                <h2 className="text-base font-bold">تعلم في 5 دقائق</h2>
                <p className="text-xs theme-text-muted">حرف اليوم + 3 مفردات + جملة سياقية مركزة</p>
              </button>

              <button
                onClick={() => setIsListeningLabOpen(true)}
                className="theme-card rounded-2xl p-4 text-right hover:border-amber-500 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🎧</span>
                  <span className="text-[11px] font-bold theme-text-accent">6 تدريبات سمعية</span>
                </div>
                <h2 className="text-base font-bold">مختبر النطق والاستماع</h2>
                <p className="text-xs theme-text-muted">تمييز الأصوات المفخمة والثنائيات الصغرى</p>
              </button>

              <button
                onClick={() => setIsAudioStudioOpen(true)}
                className="theme-card rounded-2xl p-4 text-right hover:border-amber-500 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🎙️</span>
                  <span className="text-[11px] font-bold theme-text-accent">IndexedDB</span>
                </div>
                <h2 className="text-base font-bold">استوديو الصوت البشري</h2>
                <p className="text-xs theme-text-muted">سجّل أو أرفق نطقاً بشرياً لأي كلمة محلياً</p>
              </button>

              <button
                onClick={() => setIsAiTutorOpen(true)}
                className="theme-card rounded-2xl p-4 text-right hover:border-amber-500 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🧠</span>
                  <span className="text-[11px] font-bold theme-text-accent">قواعد وصرف</span>
                </div>
                <h2 className="text-base font-bold">المساعد اللغوي الذكي</h2>
                <p className="text-xs theme-text-muted">شرح حالة الإلحاق والتأنيث وتحليل المفردات</p>
              </button>
            </div>

            {/* Resume Learning & 4 Live Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div
                id="resume-learning-card"
                className="theme-card rounded-2xl p-5 flex flex-col justify-between gap-4 lg:col-span-1 border-amber-500/40"
              >
                <div>
                  <span className="text-xs font-bold theme-text-accent">متابعة التعلم من حيث توقفت</span>
                  <h2 className="text-lg font-bold mt-1">
                    القصة {resumeStoryObj.num}: {resumeStoryObj.titleAr}
                  </h2>
                  <p className="font-tifinagh text-sm theme-text-secondary mt-0.5">
                    {resumeStoryObj.titleTif}
                  </p>
                  <p className="text-xs theme-text-muted mt-2 line-clamp-2">{resumeStoryObj.summary}</p>
                </div>
                <button
                  onClick={() => openStoryDetail(resumeStoryObj.id, 'home')}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                >
                  ▶️ متابعة قراءة القصة والاختبار
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:col-span-2">
                <div className="theme-card rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs theme-text-muted">حروف تيفيناغ (IRCAM)</span>
                  <strong className="text-2xl font-extrabold theme-text-accent tabular-nums mt-2">33</strong>
                  <span className="text-[11px] theme-text-secondary">صوائت وصوامت ومفخمة</span>
                </div>
                <div className="theme-card rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs theme-text-muted">القصص المكتملة</span>
                  <strong className="text-2xl font-extrabold text-emerald-400 tabular-nums mt-2">
                    {appState.completedStories.length} / 26
                  </strong>
                  <span className="text-[11px] theme-text-secondary">182 مشهداً سردياً</span>
                </div>
                <div className="theme-card rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs theme-text-muted">المفردات المتقنة</span>
                  <strong className="text-2xl font-extrabold text-sky-400 tabular-nums mt-2">
                    {appState.masteredWords.length} / 260
                  </strong>
                  <span className="text-[11px] theme-text-secondary">+ 80 مدخلاً تأسيسياً</span>
                </div>
                <div className="theme-card rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs theme-text-muted">مفردات المراجعة</span>
                  <strong className="text-2xl font-extrabold text-amber-400 tabular-nums mt-2">
                    {appState.reviewWords.length}
                  </strong>
                  <span className="text-[11px] theme-text-secondary">مستحقة اليوم: {srsDueCount}</span>
                </div>
              </div>
            </div>

            {/* Daily Spotlight (#daily-spotlight-container) */}
            <div id="daily-spotlight-container" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="theme-card rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold theme-text-accent">✨ كلمة اليوم بالأمازيغية</span>
                  <button
                    onClick={() => playSpeech(wordOfTheDay.tifinagh, 'word', wordOfTheDay.audio)}
                    className="ui-action-btn"
                  >
                    🔊 استمع للنطق
                  </button>
                </div>
                <div>
                  <div className="font-tifinagh text-3xl font-bold theme-text-accent">
                    {wordOfTheDay.tifinagh} ({wordOfTheDay.latin})
                  </div>
                  <div className="text-base font-bold mt-1">
                    {wordOfTheDay.arabic} · <span dir="ltr" className="text-xs theme-text-muted">{wordOfTheDay.french}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
                  <span className="theme-text-muted">حالة الإلحاق: {wordOfTheDay.annexedState}</span>
                  <button
                    onClick={() => setSelectedWordModal(wordOfTheDay)}
                    className="text-amber-400 font-bold hover:underline"
                  >
                    عرض البطاقة الصرفية ←
                  </button>
                </div>
              </div>

              <div className="theme-card rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold theme-text-accent">📜 جملة اليوم السياقية</span>
                  <button
                    onClick={() => playSpeech(storyOfTheDay.sentenceBuilder.tifinagh, 'sentence', storyOfTheDay.audio)}
                    className="ui-action-btn"
                  >
                    🔊 استمع للجملة
                  </button>
                </div>
                <div>
                  <div className="font-tifinagh text-xl font-bold theme-text-accent">
                    {storyOfTheDay.sentenceBuilder.tifinagh}
                  </div>
                  <div className="text-xs theme-text-secondary mt-0.5" dir="ltr">
                    {storyOfTheDay.sentenceBuilder.latin}
                  </div>
                  <div className="text-base font-bold mt-1">
                    «{storyOfTheDay.sentenceBuilder.arabic}»
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
                  <span className="theme-text-muted">من القصة 1: {storyOfTheDay.titleAr}</span>
                  <button
                    onClick={() => openStoryDetail(storyOfTheDay.id, 'home')}
                    className="text-amber-400 font-bold hover:underline"
                  >
                    اقرأ القصة كاملة ←
                  </button>
                </div>
              </div>
            </div>

            {/* 6 Progressive Learning Path Levels (#progressive-path-grid) */}
            <div className="theme-card rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg md:text-xl font-bold">المسار التعليمي المتدرج (6 مستويات متكاملة)</h2>
                  <p className="text-xs theme-text-muted">انتقل من إتقان الحروف والأصوات إلى قراءة القصص والتمكن من المعجم</p>
                </div>
                <span className="text-xs font-bold theme-text-accent">🔥 سلسلة التعلم اليومية نشطة</span>
              </div>

              <div id="progressive-path-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  { lvl: 1, title: 'المستوى 1: الحروف والأصوات', sub: '33 حرفاً من أبجدية تيفيناغ الرسمية', nav: () => switchNav('alphabet') },
                  { lvl: 2, title: 'المستوى 2: الكلمات الأساسية', sub: '340 كلمة معجمية مشروحة صرفياً', nav: () => switchNav('dictionary') },
                  { lvl: 3, title: 'المستوى 3: الجمل البسيطة', sub: '26 جملة نحوية تفاعلية', nav: () => switchNav('sentences') },
                  { lvl: 4, title: 'المستوى 4: الاستماع والمحادثة', sub: '6 تدريبات سمعية ومقارنة نطق', nav: () => setIsListeningLabOpen(true) },
                  { lvl: 5, title: 'المستوى 5: قراءة القصص والمشاهد', sub: '26 قصة تراثية وتاريخية (182 مشهداً)', nav: () => switchNav('stories') },
                  { lvl: 6, title: 'المستوى 6: الفهم والتثبيت المتباعد', sub: '260 سؤالاً وصناديق لايتنر الخمسة', nav: () => switchNav('review') }
                ].map(item => (
                  <button
                    key={item.lvl}
                    onClick={item.nav}
                    className="theme-card-elevated rounded-xl p-4 text-right hover:border-amber-500 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[11px] font-bold theme-text-accent">المرحلة 0{item.lvl}</span>
                      <h3 className="text-sm font-bold mt-0.5">{item.title}</h3>
                      <p className="text-xs theme-text-muted mt-0.5">{item.sub}</p>
                    </div>
                    <span className="text-amber-400 font-bold">←</span>
                  </button>
                ))}
              </div>

              {/* 5 Achievement Badges Row (#achievements-badges-row) */}
              <div id="achievements-badges-row" className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                {[
                  { title: 'قارئ تيفيناغ', desc: 'استكشاف الـ 33 حرفاً', unlocked: true },
                  { title: 'راوي الحكايات', desc: 'إتمام أول قصة تراثية', unlocked: appState.completedStories.length >= 1 },
                  { title: 'حارس المعجم', desc: 'إتقان 10 مفردات أمازيغية', unlocked: appState.masteredWords.length >= 4 },
                  { title: 'باني الجمل', desc: 'تركيب الجمل النحوية', unlocked: appState.userXP >= 100 },
                  { title: 'ذاكرة الأطلس', desc: 'المواظبة في صناديق لايتنر', unlocked: Object.keys(srsState.cards).length >= 5 }
                ].map((b, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-center ${
                      b.unlocked ? 'theme-card-elevated border-amber-500/40' : 'theme-card opacity-50'
                    }`}
                  >
                    <div className="text-xs font-bold theme-text-accent">{b.title}</div>
                    <div className="text-[11px] theme-text-muted mt-0.5">{b.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 2. ALPHABET VIEW (#view-alphabet — 33 Letters) */}
        {activeView === 'alphabet' && (
          <section id="view-alphabet" className="space-y-6">
            <div className="theme-card rounded-2xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  أبجدية تيفيناغ الرسمية المعتمدة (33 حرفاً — IRCAM)
                </h1>
                <p className="text-xs md:text-sm theme-text-secondary mt-1">
                  اضغط على أي حرف للاستماع إلى نطقه ومثاله المعجمي أو عرض بطاقته الصوتية التفصيلية
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'الكل (33)' },
                  { id: 'vowel', label: 'الصوائت (4)' },
                  { id: 'emphatic', label: 'المفخمة (5)' },
                  { id: 'labiovelar', label: 'الشفوية (2)' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setAlphabetFilter(f.id as typeof alphabetFilter)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                      alphabetFilter === f.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'theme-card-elevated'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAlphabet.map(letter => (
                <div
                  key={letter.id}
                  data-letter-char={letter.symbol}
                  data-letter-id={letter.id}
                  onClick={() => setSelectedLetterModal(letter)}
                  className="theme-card rounded-2xl p-4 cursor-pointer hover:border-amber-500 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs theme-text-muted">#{letter.order} · {letter.typeLabel}</span>
                      <h2 className="text-base font-bold mt-0.5">{letter.name}</h2>
                      <span className="text-xs theme-text-secondary">
                        اللاتيني: <strong dir="ltr">[{letter.latin}]</strong> · العربي: <strong>{letter.arabicEquiv}</strong>
                      </span>
                    </div>
                    <span className="font-tifinagh text-4xl font-extrabold theme-text-accent">
                      {letter.symbol}
                    </span>
                  </div>

                  <div className="theme-card-elevated rounded-xl p-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-tifinagh font-bold text-lg theme-text-accent block">
                        {letter.exampleTifinagh} ({letter.exampleLatin})
                      </span>
                      <span className="text-xs theme-text-secondary">{letter.exampleArabic}</span>
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        playSpeech(letter.exampleTifinagh, 'letter', letter.audio);
                      }}
                      className="ui-action-btn"
                      aria-label={`استمع لحرف ${letter.name}`}
                    >
                      🔊
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. STORIES LIBRARY VIEW (#view-stories — 26 Complete Stories) */}
        {activeView === 'stories' && (
          <section id="view-stories" className="space-y-6">
            <div className="theme-card rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">
                    مكتبة القصص الأمازيغية المغربية الشاملة (26 قصة كاملة)
                  </h1>
                  <p className="text-xs md:text-sm theme-text-secondary mt-1">
                    لكل قصة 7 مشاهد سردية بتيفيناغ واللاتينية والعربية والفرنسية، و10 مصطلحات، وجملة نحوية، و10 أسئلة اختبار
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-xl theme-card-elevated text-xs font-bold tabular-nums">
                  المعروضة: {filteredStories.length} / 26
                </span>
              </div>

              <input
                id="stories-search-input"
                type="text"
                value={storySearch}
                onChange={e => setStorySearch(e.target.value)}
                placeholder="ابحث في القصص الـ 26 بالعنوان العربي أو تيفيناغ أو المنطقة (سوس، الأطلس، الريف، إملشيل، أنوال، المسيرة الخضراء)..."
                className="theme-input w-full rounded-xl p-3 text-sm font-semibold"
              />

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'الكل (26)' },
                  { id: 'tachelhit', label: 'تشلحيت • سوس' },
                  { id: 'tamazight', label: 'تمازيغت • الأطلس' },
                  { id: 'tarifit', label: 'تاريفيت • الريف' },
                  { id: 'folklore', label: 'أساطير وحكايات' },
                  { id: 'history', label: 'تاريخ وأبطال' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStoryFilter(tab.id as typeof storyFilter)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                      storyFilter === tab.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'theme-card-elevated'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Story Cards List (Mobile stacked, Desktop md:flex-row 36% / 64%) */}
            <div className="space-y-4">
              {filteredStories.map(story => {
                const isDone = appState.completedStories.includes(story.id);
                const fallbackSvg = getStorySvgDataUri(story.num, story.titleTif, story.titleAr, story.region);
                const bestScore = appState.quizScores[story.id];

                return (
                  <article
                    key={story.id}
                    data-story-id={story.id}
                    data-story-num={story.num}
                    className="theme-card rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-amber-500/60 transition-all shadow-md"
                  >
                    {/* Cover Image (36% on desktop) */}
                    <div className="w-full md:w-[36%] bg-slate-950 shrink-0 flex items-center justify-center">
                      <img
                        src={story.image}
                        alt={story.titleAr}
                        referrerPolicy="no-referrer"
                        onError={e => {
                          const target = e.currentTarget;
                          if (target.src !== fallbackSvg) target.src = fallbackSvg;
                        }}
                        className="w-full h-52 md:h-full object-cover"
                      />
                    </div>

                    {/* Details (64% on desktop) */}
                    <div className="w-full md:w-[64%] p-5 flex flex-col justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold theme-text-accent">
                            القصة #{story.num} · {story.region} · {story.dialect}
                          </span>
                          <div className="flex items-center gap-2">
                            {isDone && (
                              <span className="text-emerald-400 font-bold">✓ مكتملة</span>
                            )}
                            {bestScore !== undefined && (
                              <span className="theme-text-muted tabular-nums">الاختبار: {bestScore}/10</span>
                            )}
                          </div>
                        </div>

                        <h2 className="text-lg md:text-xl font-bold theme-text-main">
                          {story.titleAr}
                        </h2>
                        <div className="font-tifinagh text-base font-bold theme-text-accent">
                          {story.titleTif} <span className="text-xs font-sans theme-text-muted">({story.titleLat})</span>
                        </div>
                        <p className="text-xs md:text-sm theme-text-secondary leading-relaxed line-clamp-2">
                          {story.summary}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
                        <div className="text-xs theme-text-muted flex flex-wrap items-center gap-1.5">
                          <span>7 مشاهد</span>
                          <span>·</span>
                          <span>{story.duration}</span>
                          <span>·</span>
                          <span>10 مصطلحات</span>
                          <span>·</span>
                          <span>{story.level}</span>
                        </div>

                        <button
                          data-open-story={story.num}
                          onClick={() => openStoryDetail(story.id, 'stories')}
                          className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs md:text-sm hover:bg-amber-400 transition-colors"
                        >
                          ابدأ القراءة والاختبار ←
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. STORY DETAIL VIEW (#view-story-detail) */}
        {activeView === 'story-detail' && (
          <StoryDetailView
            story={currentStoryObj}
            sourceNav={storySourceNav}
            onBack={() => switchNav(storySourceNav)}
            onGoHome={() => switchNav('home')}
            currentSceneIndex={appState.storySceneProgress[currentStoryObj.id] || 0}
            onChangeSceneIndex={idx =>
              setAppState(prev => ({
                ...prev,
                storySceneProgress: { ...prev.storySceneProgress, [currentStoryObj.id]: idx }
              }))
            }
            onPlaySpeech={playSpeech}
            onPlayContinuousStory={playFullStoryContinuous}
            onOpenWordModal={entry => setSelectedWordModal(entry)}
            masteredWords={appState.masteredWords}
            reviewWords={appState.reviewWords}
            onToggleMastered={id =>
              setAppState(prev => ({
                ...prev,
                masteredWords: prev.masteredWords.includes(id)
                  ? prev.masteredWords.filter(x => x !== id)
                  : [...prev.masteredWords, id]
              }))
            }
            onToggleReview={id => {
              recordSrsOutcome(id, 'good');
            }}
            onSaveSceneWordsToSrs={wordIds => {
              wordIds.forEach(id => recordSrsOutcome(id, 'good'));
              awardXp(10, 'تم حفظ مصطلحات المشهد في نظام المراجعة الذكية!');
            }}
            onAwardXp={awardXp}
            onSaveQuizScore={handleSaveQuizScore}
            savedScore={appState.quizScores[currentStoryObj.id]}
          />
        )}

        {/* 5. SENTENCES LAB VIEW (#view-sentences) */}
        {activeView === 'sentences' && (
          <SentencesLabView
            onPlaySpeech={playSpeech}
            onAwardXp={awardXp}
            onOpenStory={id => openStoryDetail(id, 'sentences')}
          />
        )}

        {/* 6. QUIZZES BANK VIEW (#view-quizzes — 260 Questions) */}
        {activeView === 'quizzes' && (
          <QuizzesBankView
            onPlaySpeech={playSpeech}
            quizScores={appState.quizScores}
            onSaveQuizScore={handleSaveQuizScore}
          />
        )}

        {/* 7. DICTIONARY VIEW (#view-dictionary — 340 Entries) */}
        {activeView === 'dictionary' && (
          <DictionaryView
            onPlaySpeech={playSpeech}
            onOpenWordModal={entry => setSelectedWordModal(entry)}
            favorites={dictListsState.favorites}
            onToggleFavorite={id =>
              setDictListsState(prev => ({
                ...prev,
                favorites: prev.favorites.includes(id)
                  ? prev.favorites.filter(x => x !== id)
                  : [...prev.favorites, id]
              }))
            }
            masteredWords={appState.masteredWords}
            reviewWords={appState.reviewWords}
            onToggleReview={id => recordSrsOutcome(id, 'good')}
            customLists={dictListsState.customLists}
            onCreateCustomList={name =>
              setDictListsState(prev => ({
                ...prev,
                customLists: [
                  ...prev.customLists,
                  { id: `list_${Date.now()}`, name, wordIds: [] }
                ]
              }))
            }
            onDeleteCustomList={id =>
              setDictListsState(prev => ({
                ...prev,
                customLists: prev.customLists.filter(l => l.id !== id)
              }))
            }
            onToggleWordInList={(listId, wordId) =>
              setDictListsState(prev => ({
                ...prev,
                customLists: prev.customLists.map(l =>
                  l.id === listId
                    ? {
                        ...l,
                        wordIds: l.wordIds.includes(wordId)
                          ? l.wordIds.filter(w => w !== wordId)
                          : [...l.wordIds, wordId]
                      }
                    : l
                )
              }))
            }
          />
        )}

        {/* 8. SMART REVIEW VIEW (#view-review — Leitner SRS) */}
        {activeView === 'review' && (
          <SmartReviewView
            srsCards={srsState.cards}
            dailyCount={srsState.dailyCount}
            dailyGoal={learningPrefs.dailyGoal}
            onRateCard={recordSrsOutcome}
            onSeedFiveWords={handleSeedFiveSrsWords}
            onPlaySpeech={playSpeech}
            onOpenWordModal={entry => setSelectedWordModal(entry)}
          />
        )}

        {/* 9. LINKS DIRECTORY VIEW (#view-links — 24 References) */}
        {activeView === 'links' && (
          <LinksDirectoryView
            links={allLinks}
            favoriteLinkIds={linksState.favorites}
            onToggleFavoriteLink={id =>
              setLinksState(prev => ({
                ...prev,
                favorites: prev.favorites.includes(id)
                  ? prev.favorites.filter(x => x !== id)
                  : [...prev.favorites, id]
              }))
            }
            onAddOrUpdateLink={newLink =>
              setLinksState(prev => ({
                ...prev,
                customLinks: [...prev.customLinks, newLink]
              }))
            }
          />
        )}

        {/* 10. ABOUT VIEW (#view-about) */}
        {activeView === 'about' && (
          <AboutView
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onRequestResetProgress={handleRequestResetProgress}
          />
        )}
      </main>

      {/* HONEST PHONETIC APPROXIMATION TOAST (#amazigh-phonetic-toast) */}
      {phoneticToast && phoneticToast.visible && (
        <div
          id="amazigh-phonetic-toast"
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 theme-card rounded-2xl p-4 shadow-2xl border-amber-500/50 space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold theme-text-accent">{phoneticToast.layerLabel}</span>
            <button
              onClick={() => setPhoneticToast(null)}
              className="text-xs theme-text-muted hover:underline"
            >
              ✕ إغلاق
            </button>
          </div>
          <div className="font-tifinagh text-lg font-bold">{phoneticToast.tifinagh}</div>
          <div className="text-xs theme-text-secondary">
            التقريب الصوتي العربي: <strong className="theme-text-main">[{phoneticToast.phoneticAr}]</strong>
          </div>
        </div>
      )}

      {/* UNIFIED FLOATING AUDIO PLAYER BAR (#unified-audio-player-bar) */}
      {playerBar.visible && (
        <div
          id="unified-audio-player-bar"
          className="fixed bottom-0 inset-x-0 z-40 theme-header border-t border-amber-500/30 px-3 md:px-6 py-2.5 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => playSpeech(playerBar.tifinagh, 'word')}
                className="ui-action-btn bg-amber-500 text-slate-950 border-amber-500 font-bold"
              >
                🔄 إعادة النطق
              </button>
              <div className="truncate">
                <div className="text-xs font-bold truncate">{playerBar.title}</div>
                <div className="text-[11px] theme-text-muted truncate">
                  {playerBar.layerLabel} · {playerBar.dialectLabel}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[0.75, 1, 1.25, 1.5].map(sp => (
                <button
                  key={sp}
                  onClick={() => setLearningPrefs(p => ({ ...p, audioSpeed: sp }))}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                    learningPrefs.audioSpeed === sp
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'theme-card'
                  }`}
                >
                  {sp}x
                </button>
              ))}
              <button
                onClick={() => setPlayerBar(p => ({ ...p, visible: false }))}
                className="ui-action-btn"
              >
                ⏹️ إخفاء المشغل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL LIGHTWEIGHT FOOTER (#main-app-footer) */}
      <footer id="main-app-footer" className="theme-header mt-auto py-5 px-4 md:px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-center md:text-right space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 font-bold">
              <span className="font-tifinagh theme-text-accent text-sm">ⵣ ⴰⵎⴰⵣⵉⵖ Amazigh Learn</span>
              <span>·</span>
              <span className="theme-text-secondary">المغرب • ⵍⵎⵖⵔⵉⴱ</span>
            </div>
            <p className="theme-text-muted">
              منصة تعليمية تفاعلية لتعلّم اللغة والثقافة الأمازيغية المغربية بحروف تيفيناغ المعيارية (IRCAM)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 theme-text-secondary font-bold">
            <button onClick={() => switchNav('home')} className="hover:text-amber-400">الرئيسية</button>
            <span>•</span>
            <button onClick={() => switchNav('alphabet')} className="hover:text-amber-400">الأبجدية</button>
            <span>•</span>
            <button onClick={() => switchNav('stories')} className="hover:text-amber-400">القصص</button>
            <span>•</span>
            <button onClick={() => switchNav('dictionary')} className="hover:text-amber-400">المعجم</button>
            <span>•</span>
            <button onClick={() => switchNav('about')} className="hover:text-amber-400">حول البرنامج</button>
          </div>
        </div>
      </footer>

      {/* ALL INTERACTIVE MODALS */}
      <WordDetailModal
        entry={selectedWordModal}
        onClose={() => setSelectedWordModal(null)}
        onPlaySpeech={playSpeech}
        isFavorite={selectedWordModal ? dictListsState.favorites.includes(selectedWordModal.id) : false}
        onToggleFavorite={id =>
          setDictListsState(prev => ({
            ...prev,
            favorites: prev.favorites.includes(id)
              ? prev.favorites.filter(x => x !== id)
              : [...prev.favorites, id]
          }))
        }
        inReview={selectedWordModal ? appState.reviewWords.includes(selectedWordModal.id) : false}
        onToggleReview={id => recordSrsOutcome(id, 'good')}
        onOpenStory={storyId => openStoryDetail(storyId, activeView)}
        onSelectWord={entry => setSelectedWordModal(entry)}
      />

      <LetterDetailModal
        letter={selectedLetterModal}
        onClose={() => setSelectedLetterModal(null)}
        onPlaySpeech={playSpeech}
      />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onOpenStory={id => openStoryDetail(id, activeView)}
        onSelectWord={w => setSelectedWordModal(w)}
        onSelectLetter={l => setSelectedLetterModal(l)}
      />

      <ListeningLabModal
        isOpen={isListeningLabOpen}
        onClose={() => setIsListeningLabOpen(false)}
        onPlaySpeech={playSpeech}
        onAwardXp={awardXp}
      />

      <AudioStudioModal
        isOpen={isAudioStudioOpen}
        onClose={() => setIsAudioStudioOpen(false)}
        onSavedRecording={() => awardXp(15, 'تم حفظ تسجيل صوتي بشري جديد في IndexedDB!')}
      />

      <FiveMinuteModeModal
        isOpen={isFiveMinOpen}
        onClose={() => setIsFiveMinOpen(false)}
        onPlaySpeech={playSpeech}
        onCompleteSession={() => awardXp(15, 'إتمام جلسة التعلم اليومية في 5 دقائق!')}
      />

      <LinguisticAssistantModal
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={appState.theme}
        onToggleTheme={() =>
          setAppState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))
        }
        soundEnabled={appState.soundEnabled}
        onToggleSound={() =>
          setAppState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        dailyGoal={learningPrefs.dailyGoal}
        onChangeDailyGoal={g => setLearningPrefs(p => ({ ...p, dailyGoal: g }))}
        audioSpeed={learningPrefs.audioSpeed}
        onChangeAudioSpeed={s => setLearningPrefs(p => ({ ...p, audioSpeed: s }))}
        onExportBackup={handleExportBackup}
        onRequestResetProgress={handleRequestResetProgress}
      />

      <ConfirmActionModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
