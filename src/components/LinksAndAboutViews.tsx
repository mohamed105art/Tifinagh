import React, { useState } from 'react';
import { DEFAULT_EDUCATIONAL_LINKS } from '../data/amazighData';

export type LinkItemType = (typeof DEFAULT_EDUCATIONAL_LINKS)[number];

// 1. Official & Academic Links Directory (#view-links — 24 References)
export const LinksDirectoryView: React.FC<{
  links: LinkItemType[];
  favoriteLinkIds: string[];
  onToggleFavoriteLink: (id: string) => void;
  onAddOrUpdateLink: (link: LinkItemType) => void;
}> = ({ links, favoriteLinkIds, onToggleFavoriteLink, onAddOrUpdateLink }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [catInput, setCatInput] = useState('official-dictionaries');

  const categories = [
    { key: 'all', label: `الكل (${links.length})` },
    { key: 'official-dictionaries', label: 'المعاجم الرسمية' },
    { key: 'ircam-resources', label: 'موارد المعهد الملكي (IRCAM)' },
    { key: 'writing-tools', label: 'أدوات الكتابة والتحويل' },
    { key: 'educational-platforms', label: 'منصات وموارد تعليمية' },
    { key: 'audio-pronunciation', label: 'مصادر الاستماع والتطبيقات' },
    { key: 'grammar-references', label: 'مراجع لغوية وقواعدية' },
    { key: 'cultural-literary', label: 'مصادر ثقافية وأدبية' }
  ];

  const filteredLinks = links.filter(l => {
    if (onlyFavs && !favoriteLinkIds.includes(l.id)) return false;
    if (catFilter !== 'all' && l.categoryKey !== catFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.categoryLabel.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSaveCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !urlInput.trim()) return;
    const catObj = categories.find(c => c.key === catInput);
    onAddOrUpdateLink({
      order: links.length + 1,
      id: `custom_link_${Date.now()}`,
      title: titleInput.trim(),
      categoryKey: catInput,
      categoryLabel: catObj ? catObj.label : 'مرجع إضافي',
      url: urlInput.trim(),
      description: 'رابط تعليمي مضاف محلياً بواسطة المستخدم.'
    });
    setTitleInput('');
    setUrlInput('');
    setIsEditorOpen(false);
  };

  return (
    <section id="view-links" className="space-y-6">
      <div className="theme-card rounded-2xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">دليل الروابط التعليمية والمؤسسية المعتمدة ({links.length} مرجعاً)</h1>
          <p className="text-xs md:text-sm theme-text-secondary mt-1">
            بوابات المعهد الملكي للثقافة الأمازيغية (IRCAM)، معجم DGLAi المحوسب، منصة TALAM، والمراجع النحوية
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOnlyFavs(!onlyFavs)}
            className={`top-header-control ${onlyFavs ? 'border-amber-500 text-amber-400' : ''}`}
          >
            ★ المفضلة ({favoriteLinkIds.length})
          </button>
          <button
            onClick={() => setIsEditorOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            + إضافة رابط مرجعي
          </button>
        </div>
      </div>

      {/* Search & Category Tabs */}
      <div className="theme-card rounded-2xl p-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث في المراجع والروابط الرسمية (DGLAi, IRCAM, TALAM, MOOC, PDF)..."
          className="theme-input w-full rounded-xl p-3 text-sm font-semibold"
        />
        <div className="flex flex-wrap gap-1.5">
          {categories.map(c => (
            <button
              key={c.key}
              onClick={() => setCatFilter(c.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                catFilter === c.key ? 'bg-amber-500 text-slate-950 border-amber-500' : 'theme-card-elevated'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLinks.map(link => {
          const isFav = favoriteLinkIds.includes(link.id);
          return (
            <div key={link.id} className="theme-card rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold theme-text-accent block mb-1">
                    {link.categoryLabel}
                  </span>
                  <h2 className="text-base font-bold theme-text-main leading-snug">{link.title}</h2>
                </div>
                <button
                  onClick={() => onToggleFavoriteLink(link.id)}
                  className={`top-header-control ${isFav ? 'text-amber-400 border-amber-500' : ''}`}
                >
                  {isFav ? '★' : '☆'}
                </button>
              </div>
              <p className="text-xs theme-text-secondary">{link.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                <span className="text-[11px] theme-text-muted truncate max-w-[220px]" dir="ltr">
                  {link.url}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition-colors"
                >
                  فتح المرجع الرسمي ↗
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Link Editor Modal (#link-editor-modal) */}
      {isEditorOpen && (
        <div id="link-editor-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="إضافة رابط تعليمي جديد">
          <form onSubmit={handleSaveCustomLink} className="theme-card w-full max-w-md rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold">إضافة مرجع أو رابط تعليمي جديد</h3>
              <button type="button" onClick={() => setIsEditorOpen(false)} className="top-header-control">✕</button>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">عنوان المرجع *</label>
              <input
                type="text"
                required
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                placeholder="مثال: بوابة المعاجم الموضوعاتية"
                className="theme-input w-full rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">الرابط الإلكتروني (URL) *</label>
              <input
                type="url"
                required
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://www.ircam.ma"
                className="theme-input w-full rounded-xl p-2.5 text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">الفئة</label>
              <select
                value={catInput}
                onChange={e => setCatInput(e.target.value)}
                className="theme-input w-full rounded-xl p-2.5 text-xs font-bold"
              >
                {categories.slice(1).map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsEditorOpen(false)} className="top-header-control">إلغاء</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">حفظ الرابط</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

// 2. About & Data Management View (#view-about)
export const AboutView: React.FC<{
  onExportBackup: () => void;
  onImportBackup: (jsonString: string) => void;
  onRequestResetProgress: () => void;
}> = ({ onExportBackup, onImportBackup, onRequestResetProgress }) => {
  const [importStatus, setImportStatus] = useState<string>('');
  const [logoError, setLogoError] = useState(false);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);
        if (parsed && (parsed.amazigh_learn_state_v5 || parsed.version)) {
          onImportBackup(text);
          setImportStatus('✓ تم استيراد النسخة الاحتياطية بنجاح وتحديث سجل التقدم!');
        } else {
          setImportStatus('⚠️ ملف النسخة الاحتياطية غير مطابق لبنية المنصة.');
        }
      } catch {
        setImportStatus('⚠️ تعذر قراءة ملف JSON المرفق.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <section id="view-about" className="space-y-6">
      <div className="theme-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="shrink-0">
          {!logoError ? (
            <img
              id="about-custom-logo"
              src="assets/images/logo.png"
              alt="شعار منصة Amazigh Learn"
              onError={() => setLogoError(true)}
              className="w-24 h-24 rounded-2xl object-contain"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-slate-950 border-2 border-amber-500/50 flex items-center justify-center shadow-lg">
              <span className="font-tifinagh text-5xl font-bold text-rose-500">ⵣ</span>
            </div>
          )}
        </div>
        <div className="space-y-2 text-center md:text-right">
          <h1 className="text-2xl md:text-3xl font-bold">
            منصة «Amazigh Learn — <span className="font-tifinagh theme-text-accent">ⴰⵎⴰⵣⵉⵖ</span>»
          </h1>
          <p className="text-sm theme-text-secondary leading-relaxed">
            منصة تعليمية وثقافية تفاعلية شاملة لتعلّم اللغة والثقافة الأمازيغية المغربية بحروف تيفيناغ المعيارية المعتمدة من المعهد الملكي للثقافة الأمازيغية (IRCAM). صممت لتعمل بكفاءة عالية على الهواتف الذكية والأجهزة اللوحية والحواسيب مع حفظ كامل للتقدم محلياً.
          </p>
        </div>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="theme-card rounded-2xl p-5 space-y-2">
          <h2 className="text-base font-bold theme-text-accent">📚 المحتوى التعليمي الشامل</h2>
          <p className="text-xs theme-text-secondary leading-relaxed">
            تضم المنصة 33 حرفاً من أبجدية تيفيناغ الرسمية، و26 قصة تراثية وتاريخية (بمجموع 182 مشهداً سردياً رباعي اللغات)، ومعجماً تفاعلياً من 340 مدخلاً صرفياً، و260 سؤال اختبار تفاعلي.
          </p>
        </div>
        <div className="theme-card rounded-2xl p-5 space-y-2">
          <h2 className="text-base font-bold theme-text-accent">🎙️ منظومة الصوت الأمازيغي رباعية الطبقات</h2>
          <p className="text-xs theme-text-secondary leading-relaxed">
            تجمع بين التسجيلات الصوتية البشرية المحلية في قاعدة بيانات IndexedDB، وأصوات النظام الأمازيغية، واستوديو التسجيل المباشر، والتقريب الصوتي العربي الصادق والموثق.
          </p>
        </div>
        <div className="theme-card rounded-2xl p-5 space-y-2">
          <h2 className="text-base font-bold theme-text-accent">🧠 التثبيت المتباعد (Leitner SRS)</h2>
          <p className="text-xs theme-text-secondary leading-relaxed">
            خوارزمية مراجعة ذكية من 5 صناديق ترحّل تلقائياً المفردات التي تحتاج تركيزاً من اختبارات القصص ومعمل الجمل لضمان رسوخها في الذاكرة طويلة المدى.
          </p>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="theme-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold">💾 إدارة البيانات والنسخ الاحتياطي المحلي (Zero-Backend)</h2>
        <p className="text-xs theme-text-secondary">
          يُحفظ تقدمك ونقاطك وقوائمك في متصفحك عبر المفاتيح القياسية (<code>amazigh_learn_state_v5</code> و<code>amazigh_srs_state_v4</code>). يمكنك تصدير أو استيراد نسخة كاملة في أي وقت:
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExportBackup}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs md:text-sm"
          >
            📥 تصدير نسخة احتياطية شاملة (JSON)
          </button>
          <label className="top-header-control cursor-pointer py-2.5">
            📤 استيراد نسخة احتياطية (JSON)
            <input type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden" />
          </label>
          <button
            onClick={onRequestResetProgress}
            className="top-header-control text-rose-400 border-rose-500/40 py-2.5"
          >
            🗑️ إعادة ضبط تقدم التعلم
          </button>
        </div>
        {importStatus && (
          <div className="p-3 rounded-xl theme-card-elevated text-xs font-bold text-emerald-400">
            {importStatus}
          </div>
        )}
      </div>
    </section>
  );
};
