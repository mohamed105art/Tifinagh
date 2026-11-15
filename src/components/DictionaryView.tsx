import React, { useState, useMemo } from 'react';
import { ALPHABET_DATA, STORIES_DATA, ALL_DICTIONARY_DATA } from '../data/amazighData';
import { matchDictionaryField } from '../utils/amazighLogic';
import { DictEntryType } from './DetailModals';

export interface CustomWordList {
  id: string;
  name: string;
  wordIds: string[];
}

export const DictionaryView: React.FC<{
  onPlaySpeech: (text: string, type: string, audioPath?: string) => void;
  onOpenWordModal: (entry: DictEntryType) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  masteredWords: string[];
  reviewWords: string[];
  onToggleReview: (id: string) => void;
  customLists: CustomWordList[];
  onCreateCustomList: (name: string) => void;
  onDeleteCustomList: (id: string) => void;
  onToggleWordInList: (listId: string, wordId: string) => void;
}> = ({
  onPlaySpeech,
  onOpenWordModal,
  favorites,
  onToggleFavorite,
  masteredWords,
  reviewWords,
  onToggleReview,
  customLists,
  onCreateCustomList,
  onDeleteCustomList,
  onToggleWordInList
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [matchMode, setMatchMode] = useState<'contains' | 'starts' | 'exact'>('contains');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'story' | 'dglai' | 'favorites' | 'review' | 'mastered'>('all');
  const [posFilter, setPosFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [dialectFilter, setDialectFilter] = useState<string>('all');
  const [storyFilter, setStoryFilter] = useState<string>('all');
  const [listFilter, setListFilter] = useState<string>('all');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showListManager, setShowListManager] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(36);

  const semanticDomains = [
    'الحياة اليومية', 'الأسرة', 'الطعام', 'الطبيعة', 'الحيوانات',
    'الألوان', 'الأفعال', 'الصفات', 'التاريخ', 'التراث والثقافة',
    'السفر', 'الحوار والتواصل'
  ];

  const filteredEntries = useMemo(() => {
    return ALL_DICTIONARY_DATA.filter(item => {
      if (scopeFilter === 'story' && item.source !== 'story') return false;
      if (scopeFilter === 'dglai' && item.source !== 'dglai') return false;
      if (scopeFilter === 'favorites' && !favorites.includes(item.id)) return false;
      if (scopeFilter === 'review' && !reviewWords.includes(item.id)) return false;
      if (scopeFilter === 'mastered' && !masteredWords.includes(item.id)) return false;

      if (posFilter !== 'all' && item.pos !== posFilter) return false;
      if (domainFilter !== 'all' && item.domain !== domainFilter) return false;
      if (dialectFilter !== 'all' && item.dialectGroup !== dialectFilter) return false;
      if (storyFilter !== 'all' && item.storyId !== storyFilter) return false;

      if (listFilter !== 'all') {
        const targetList = customLists.find(l => l.id === listFilter);
        if (targetList && !targetList.wordIds.includes(item.id)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim();
        const hit =
          matchDictionaryField(item.tifinagh, q, matchMode) ||
          matchDictionaryField(item.latin, q, matchMode) ||
          matchDictionaryField(item.arabic, q, matchMode) ||
          matchDictionaryField(item.french, q, matchMode) ||
          matchDictionaryField(item.phoneticAr, q, matchMode);
        if (!hit) return false;
      }
      return true;
    });
  }, [
    searchQuery,
    matchMode,
    scopeFilter,
    posFilter,
    domainFilter,
    dialectFilter,
    storyFilter,
    listFilter,
    favorites,
    reviewWords,
    masteredWords,
    customLists
  ]);

  const autocompleteItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filteredEntries.slice(0, 6);
  }, [searchQuery, filteredEntries]);

  const searchInOfficialDglaiPortal = () => {
    const q = encodeURIComponent(searchQuery.trim() || 'ⴰⵎⴰⵏ');
    window.open(`https://tal.ircam.ma/dglai/search/index?q=${q}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="view-dictionary" className="space-y-6">
      {/* Header Banner */}
      <div className="theme-card rounded-2xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">المعجم الأمازيغي التفاعلي الشامل (340 مدخلاً موثقاً)</h1>
          <p className="text-xs md:text-sm theme-text-secondary mt-1">
            260 مصطلحاً سياقياً من القصص الـ 26 + 80 مدخلاً تأسيسياً من المعجم العام للغة الأمازيغية (DGLAi - IRCAM)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="top-header-control"
          >
            ⌨️ {showKeyboard ? 'إخفاء لوحة تيفيناغ' : 'لوحة مفاتيح تيفيناغ'}
          </button>
          <button
            onClick={() => setShowListManager(!showListManager)}
            className="top-header-control"
          >
            📁 قوائمي الشخصية ({customLists.length})
          </button>
          <button
            onClick={searchInOfficialDglaiPortal}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
          >
            🌐 استعلام في بوابة DGLAi الرسمية
          </button>
        </div>
      </div>

      {/* Collapsible Tifinagh Virtual Keyboard */}
      {showKeyboard && (
        <div id="dict-tifinagh-kb" className="theme-card rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold theme-text-accent">انقر لإدراج حروف تيفيناغ الـ 33 في حقل البحث:</span>
            <button onClick={() => setSearchQuery('')} className="text-xs theme-text-muted hover:underline">مسح البحث</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALPHABET_DATA.map(l => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSearchQuery(prev => prev + l.symbol)}
                className="w-10 h-10 rounded-xl theme-card-elevated hover:border-amber-500 font-tifinagh font-bold text-lg flex flex-col items-center justify-center"
                title={`${l.name} (${l.latin})`}
              >
                <span>{l.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Personal Vocabulary Lists Manager Panel */}
      {showListManager && (
        <div id="dict-lists-manager-panel" className="theme-card rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold theme-text-accent">إدارة قوائم المفردات الشخصية:</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              placeholder="اسم القائمة الجديدة (مثال: كلمات الطبيعة والجبل)..."
              className="theme-input flex-1 rounded-xl p-2 text-xs font-semibold"
            />
            <button
              onClick={() => {
                if (newListName.trim()) {
                  onCreateCustomList(newListName.trim());
                  setNewListName('');
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              + إنشاء قائمة
            </button>
          </div>
          {customLists.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customLists.map(lst => (
                <div key={lst.id} className="theme-card-elevated px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                  <span className="font-bold">{lst.name} ({lst.wordIds.length})</span>
                  <button onClick={() => onDeleteCustomList(lst.id)} className="text-rose-400 hover:underline">حذف</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Bar + Match Mode + Multi-Criteria Filters */}
      <div className="theme-card rounded-2xl p-4 md:p-5 space-y-4">
        <div className="relative">
          <input
            id="dict-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث بتيفيناغ (ⴰⵎⴰⵏ)، اللاتينية (Aman)، العربية (الماء)، الفرنسية (L'eau)، أو التقريب الصوتي..."
            className="theme-input w-full rounded-xl p-3.5 text-sm font-semibold"
          />
          {autocompleteItems.length > 0 && (
            <div id="dict-autocomplete-box" className="mt-2 p-2 rounded-xl theme-card-elevated flex flex-wrap gap-2">
              <span className="text-[11px] theme-text-muted self-center">إكمال سريع:</span>
              {autocompleteItems.map(ac => (
                <button
                  key={ac.id}
                  onClick={() => onOpenWordModal(ac)}
                  className="px-2.5 py-1 rounded-lg theme-card text-xs font-bold hover:border-amber-500"
                >
                  <span className="font-tifinagh theme-text-accent ml-1">{ac.tifinagh}</span> ({ac.arabic})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Match modes & Scope tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold theme-text-muted ml-1">نمط المطابقة:</span>
            {[
              { id: 'contains', label: 'يحتوي على' },
              { id: 'starts', label: 'يبدأ بـ' },
              { id: 'exact', label: 'مطابقة تامة' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMatchMode(m.id as typeof matchMode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                  matchMode === m.id ? 'bg-amber-500 text-slate-950 border-amber-500' : 'theme-card-elevated'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'الكل (340)' },
              { id: 'story', label: 'مصطلحات القصص (260)' },
              { id: 'dglai', label: 'المعجم الأساسي DGLAi (80)' },
              { id: 'favorites', label: `المفضلة (${favorites.length})` },
              { id: 'review', label: `للمراجعة (${reviewWords.length})` },
              { id: 'mastered', label: `متقنة (${masteredWords.length})` }
            ].map(sc => (
              <button
                key={sc.id}
                onClick={() => setScopeFilter(sc.id as typeof scopeFilter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                  scopeFilter === sc.id ? 'bg-amber-500 text-slate-950 border-amber-500' : 'theme-card-elevated'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Multi-criteria dropdown filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          <select
            aria-label="تصفية حسب النوع اللغوي"
            value={posFilter}
            onChange={e => setPosFilter(e.target.value)}
            className="theme-input rounded-xl p-2.5 text-xs font-bold"
          >
            <option value="all">النوع اللغوي: الكل</option>
            <option value="اسم مذكر">اسم مذكر</option>
            <option value="اسم مؤنث">اسم مؤنث</option>
            <option value="فعل">فعل</option>
            <option value="صفة">صفة</option>
            <option value="أداة/ضمير">أداة/ضمير</option>
            <option value="اسم عدد">اسم عدد</option>
          </select>

          <select
            aria-label="تصفية حسب المجال الدلالي"
            value={domainFilter}
            onChange={e => setDomainFilter(e.target.value)}
            className="theme-input rounded-xl p-2.5 text-xs font-bold"
          >
            <option value="all">التصنيف الدلالي (12 مجالاً): الكل</option>
            {semanticDomains.map((dom, idx) => (
              <option key={dom} value={dom}>
                {idx + 1}. {dom}
              </option>
            ))}
          </select>

          <select
            aria-label="تصفية حسب التنوع اللساني"
            value={dialectFilter}
            onChange={e => setDialectFilter(e.target.value)}
            className="theme-input rounded-xl p-2.5 text-xs font-bold"
          >
            <option value="all">التنوع اللساني: الكل</option>
            <option value="standard">الأمازيغية المعيارية IRCAM</option>
            <option value="tachelhit">تشلحيت</option>
            <option value="tamazight">تمازيغت</option>
            <option value="tarifit">تاريفيت</option>
          </select>

          <select
            aria-label="تصفية حسب القصة المرتبطة"
            value={storyFilter}
            onChange={e => setStoryFilter(e.target.value)}
            className="theme-input rounded-xl p-2.5 text-xs font-bold"
          >
            <option value="all">القصة المرتبطة: الكل (26)</option>
            {STORIES_DATA.map(st => (
              <option key={st.id} value={st.id}>
                القصة {st.num}: {st.titleAr.slice(0, 22)}
              </option>
            ))}
          </select>

          <select
            aria-label="تصفية حسب القائمة الشخصية"
            value={listFilter}
            onChange={e => setListFilter(e.target.value)}
            className="theme-input rounded-xl p-2.5 text-xs font-bold"
          >
            <option value="all">القائمة الشخصية: الكل</option>
            {customLists.map(lst => (
              <option key={lst.id} value={lst.id}>
                {lst.name} ({lst.wordIds.length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs font-bold theme-text-muted px-1">
        <span>عدد المداخل المعجمية المطابقة: <strong className="theme-text-accent tabular-nums">{filteredEntries.length}</strong> من 340</span>
        {(searchQuery || scopeFilter !== 'all' || posFilter !== 'all' || domainFilter !== 'all' || dialectFilter !== 'all' || storyFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setScopeFilter('all');
              setPosFilter('all');
              setDomainFilter('all');
              setDialectFilter('all');
              setStoryFilter('all');
              setListFilter('all');
            }}
            className="text-amber-400 hover:underline"
          >
            إعادة ضبط الفلاتر
          </button>
        )}
      </div>

      {/* Dictionary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntries.slice(0, visibleLimit).map(entry => {
          const isFav = favorites.includes(entry.id);
          const isRev = reviewWords.includes(entry.id);
          return (
            <div key={entry.id} className="theme-card rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-amber-500/60 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => onOpenWordModal(entry)}
                  className="text-right group"
                >
                  <span className="font-tifinagh text-2xl font-bold theme-text-accent group-hover:underline block">
                    {entry.tifinagh}
                  </span>
                  <span className="text-xs font-bold theme-text-secondary" dir="ltr">
                    ({entry.latin}) · [{entry.phoneticAr}]
                  </span>
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onPlaySpeech(entry.tifinagh, 'word', entry.audio)}
                    className="top-header-control"
                    title="استمع للنطق"
                  >
                    🔊
                  </button>
                  <button
                    onClick={() => onToggleFavorite(entry.id)}
                    className={`top-header-control ${isFav ? 'text-amber-400 border-amber-500' : ''}`}
                    title="أضف للمفضلة"
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-base font-bold theme-text-main">{entry.arabic}</div>
                <div className="text-xs theme-text-muted mt-0.5" dir="ltr">{entry.french}</div>
              </div>

              <div className="text-[11px] theme-text-muted flex flex-wrap items-center gap-1.5 border-t border-[var(--border-subtle)] pt-2.5">
                <span>{entry.pos}</span>
                <span>·</span>
                <span>{entry.domain}</span>
                <span>·</span>
                <span>{entry.source === 'dglai' ? 'DGLAi - IRCAM' : `القصة ${entry.storyNum}`}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onOpenWordModal(entry)}
                  className="flex-1 py-1.5 rounded-xl theme-card-elevated text-xs font-bold hover:border-amber-500"
                >
                  الجدول الصرفي والتفاصيل
                </button>
                <button
                  onClick={() => onToggleReview(entry.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    isRev ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'theme-card-elevated'
                  }`}
                >
                  {isRev ? '✓ للمراجعة' : '+ مراجعة'}
                </button>
                {customLists.length > 0 && (
                  <select
                    aria-label="إضافة إلى قائمة شخصية"
                    value=""
                    onChange={e => {
                      if (e.target.value) onToggleWordInList(e.target.value, entry.id);
                    }}
                    className="theme-input rounded-xl px-2 py-1.5 text-xs"
                  >
                    <option value="">+ قائمة</option>
                    {customLists.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredEntries.length > visibleLimit && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setVisibleLimit(l => l + 48)}
            className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400"
          >
            عرض المزيد من المداخل المعجمية ({filteredEntries.length - visibleLimit} متبقية)
          </button>
        </div>
      )}
    </section>
  );
};
