import React, { useState, useEffect, useRef } from 'react';
import { ALPHABET_DATA, STORIES_DATA, ALL_DICTIONARY_DATA } from '../data/amazighData';
import {
  CustomAudioRecord,
  saveCustomAudioRecording,
  getAllCustomAudioRecordings,
  deleteCustomAudioRecording,
  playGentleChime
} from '../utils/audioAndAssets';

// 1. Listening Lab Modal (6 interactive audio & pronunciation modes)
export const ListeningLabModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPlaySpeech: (text: string, type: string, audioPath?: string) => void;
  onAwardXp: (xp: number, msg: string) => void;
}> = ({ isOpen, onClose, onPlaySpeech, onAwardXp }) => {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [qIndex, setQIndex] = useState<number>(0);
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'done'>('idle');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  const sampleWords = ALL_DICTIONARY_DATA.slice(0, 40);
  const currentWord = sampleWords[qIndex % sampleWords.length];
  const wrong1 = sampleWords[(qIndex + 5) % sampleWords.length];
  const wrong2 = sampleWords[(qIndex + 11) % sampleWords.length];
  const wrong3 = sampleWords[(qIndex + 17) % sampleWords.length];

  const wordOptions = [currentWord, wrong1, wrong2, wrong3].sort((a, b) => a.id.localeCompare(b.id));
  const currentStory = STORIES_DATA[qIndex % STORIES_DATA.length];
  const sentenceWords = currentStory.sentenceBuilder.words;

  const minimalPairs = [
    { a: ALPHABET_DATA[4], b: ALPHABET_DATA[5], title: 'التمييز بين الدال المرققة (ⴷ d) والضاد المفخمة (ⴹ ḍ)' },
    { a: ALPHABET_DATA[21], b: ALPHABET_DATA[22], title: 'التمييز بين الراء المرققة (ⵔ r) والراء المفخمة (ⵕ ṛ)' },
    { a: ALPHABET_DATA[24], b: ALPHABET_DATA[25], title: 'التمييز بين السين (ⵙ s) والصاد المفخمة (ⵚ ṣ)' },
    { a: ALPHABET_DATA[27], b: ALPHABET_DATA[28], title: 'التمييز بين التاء المرققة (ⵜ t) والطاء المفخمة (ⵟ ṭ)' },
    { a: ALPHABET_DATA[31], b: ALPHABET_DATA[32], title: 'التمييز بين الزاي المرققة (ⵣ z) والزاي المفخمة (ⵥ ẓ)' },
    { a: ALPHABET_DATA[2], b: ALPHABET_DATA[3], title: 'التمييز بين الگاف العادية (ⴳ g) والگاف الشفوية (ⴳⵯ gʷ)' }
  ];
  const pair = minimalPairs[qIndex % minimalPairs.length];

  const handleStartSelfRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedUrl(URL.createObjectURL(blob));
        setRecordingState('done');
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecordingState('recording');
    } catch {
      setRecordingState('done');
    }
  };

  const handleStopSelfRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setRecordingState('idle');
    }
  };

  return (
    <div id="listening-lab-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label="مختبر النطق والاستماع التفاعلي">
      <div className="theme-card w-full max-w-4xl rounded-2xl p-4 md:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold theme-text-main">مختبر النطق والاستماع الأمازيغي (6 تدريبات سمعية)</h2>
            <p className="text-xs md:text-sm theme-text-muted mt-1">تدرب على التمييز الصوتي، فهم المفردات والجمل، ومقارنة نطقك الذاتي</p>
          </div>
          <button onClick={onClose} className="top-header-control" aria-label="إغلاق مختبر النطق">✕ إغلاق</button>
        </div>

        {/* 6 Mode Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          {[
            { id: 1, label: '1. استمع واختر الكلمة' },
            { id: 2, label: '2. استمع واختر الترجمة' },
            { id: 3, label: '3. استمع ورتب الجملة' },
            { id: 4, label: '4. أكمل الكلمة الناقصة' },
            { id: 5, label: '5. الثنائيات الصغرى' },
            { id: 6, label: '6. كرّر وسجّل صوتك' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSelectedAns(null); setOrderedWords([]); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                activeTab === t.id
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'theme-card-elevated theme-text-secondary hover:border-amber-500/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1 & 2: Listen & Pick Word or Translation */}
        {(activeTab === 1 || activeTab === 2) && (
          <div className="theme-card-elevated rounded-xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold theme-text-accent">التمرين #{qIndex + 1}</span>
                <h3 className="text-lg font-bold mt-1">
                  {activeTab === 1
                    ? `استمع إلى النطق أو التقريب الصوتي (${currentWord.phoneticAr}) واختر رسم تيفيناغ الصحيح:`
                    : `استمع إلى الكلمة الأمازيغية «${currentWord.tifinagh}» (${currentWord.latin}) واختر معناها العربي:`}
                </h3>
              </div>
              <button
                onClick={() => onPlaySpeech(currentWord.tifinagh, 'word', currentWord.audio)}
                className="px-5 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-colors shrink-0"
              >
                🔊 استمع الآن ({currentWord.latin})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wordOptions.map(opt => {
                const isSelected = selectedAns === opt.id;
                const isRight = opt.id === currentWord.id;
                let btnCls = 'theme-card hover:border-amber-500/60';
                if (selectedAns) {
                  if (isRight) btnCls = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
                  else if (isSelected) btnCls = 'bg-rose-500/20 border-rose-500 text-rose-300';
                }
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedAns(opt.id);
                      if (opt.id === currentWord.id) {
                        playGentleChime('success');
                        onAwardXp(5, 'إجابة سمعية صحيحة! +5 XP');
                      } else {
                        playGentleChime('error');
                      }
                    }}
                    className={`p-4 rounded-xl border text-right transition-all flex items-center justify-between ${btnCls}`}
                  >
                    {activeTab === 1 ? (
                      <>
                        <span className="font-tifinagh text-xl font-bold">{opt.tifinagh}</span>
                        <span className="text-xs theme-text-muted">{opt.latin}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-base">{opt.arabic}</span>
                        <span className="text-xs theme-text-muted">{opt.french}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[var(--border-subtle)]">
              <span className="text-xs theme-text-muted">التقريب الصوتي الموثق: {currentWord.phoneticAr}</span>
              <button
                onClick={() => { setQIndex(q => q + 1); setSelectedAns(null); }}
                className="top-header-control"
              >
                الكلمة التالية ←
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Listen and order sentence */}
        {activeTab === 3 && (
          <div className="theme-card-elevated rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">استمع إلى الجملة ورتب كلماتها من اليسار لليمين:</h3>
                <p className="text-sm theme-text-secondary mt-1">المعنى: «{currentStory.sentenceBuilder.arabic}»</p>
              </div>
              <button
                onClick={() => onPlaySpeech(currentStory.sentenceBuilder.tifinagh, 'sentence', currentStory.audio)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
              >
                🔊 استمع للجملة
              </button>
            </div>

            <div dir="ltr" className="min-h-[60px] p-3 rounded-xl theme-card flex flex-wrap items-center gap-2 border-dashed">
              {orderedWords.length === 0 ? (
                <span className="text-xs theme-text-muted">انقر على الكلمات بالأسفل لترتيب الجملة...</span>
              ) : (
                orderedWords.map((w, idx) => (
                  <button
                    key={`${w}_${idx}`}
                    onClick={() => setOrderedWords(orderedWords.filter((_, i) => i !== idx))}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500 text-amber-300 font-tifinagh font-bold"
                  >
                    {w} ✕
                  </button>
                ))
              )}
            </div>

            <div dir="ltr" className="flex flex-wrap gap-2">
              {sentenceWords.map((w, idx) => (
                <button
                  key={`${w}_${idx}`}
                  onClick={() => {
                    const next = [...orderedWords, w];
                    setOrderedWords(next);
                    if (next.join(' ') === sentenceWords.join(' ')) {
                      playGentleChime('success');
                      onAwardXp(10, 'ترتيب سمعي ممتاز للجملة! +10 XP');
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg theme-card hover:border-amber-500 font-tifinagh font-bold text-base"
                >
                  {w}
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-3">
              <button onClick={() => setOrderedWords([])} className="top-header-control">إعادة ترتيب</button>
              <button onClick={() => { setQIndex(q => q + 1); setOrderedWords([]); }} className="top-header-control">الجملة التالية ←</button>
            </div>
          </div>
        )}

        {/* Tab 4: Complete Missing Word */}
        {activeTab === 4 && (
          <div className="theme-card-elevated rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-bold">أكمل الكلمة الناقصة في الجملة السياقية:</h3>
            <p className="text-sm theme-text-secondary">الترجمة: «{currentStory.sentenceBuilder.arabic}»</p>
            <div dir="ltr" className="p-4 rounded-xl theme-card font-tifinagh text-xl font-bold text-center">
              {sentenceWords.map((w, i) => (i === 0 ? ' [ ؟؟؟ ] ' : ` ${w} `)).join('')}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[sentenceWords[0], currentWord.tifinagh, wrong1.tifinagh, wrong2.tifinagh].map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedAns(opt);
                    if (opt === sentenceWords[0]) {
                      playGentleChime('success');
                      onAwardXp(5, 'إكمال صحيح للجملة! +5 XP');
                    }
                  }}
                  className={`p-3 rounded-xl border font-tifinagh font-bold text-lg ${
                    selectedAns === opt
                      ? opt === sentenceWords[0]
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'theme-card'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => { setQIndex(q => q + 1); setSelectedAns(null); }} className="top-header-control">التمرين التالي ←</button>
            </div>
          </div>
        )}

        {/* Tab 5: Minimal Pairs */}
        {activeTab === 5 && (
          <div className="theme-card-elevated rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-bold">{pair.title}</h3>
            <p className="text-xs theme-text-muted">قارن بين الحرفين ومثالهما المعجمي بدقة لتطوير أذنك الصوتية الأمازيغية:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[pair.a, pair.b].map(item => (
                <div key={item.id} className="theme-card rounded-xl p-4 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-tifinagh text-4xl font-bold theme-text-accent">{item.symbol}</span>
                    <span className="text-sm font-bold">{item.name} — [{item.latin}]</span>
                  </div>
                  <p className="text-xs theme-text-secondary">المقابل الصوتي: {item.arabicEquiv} ({item.typeLabel})</p>
                  <div className="p-3 rounded-lg theme-card-elevated flex items-center justify-between">
                    <div>
                      <span className="font-tifinagh font-bold text-lg block">{item.exampleTifinagh} ({item.exampleLatin})</span>
                      <span className="text-xs theme-text-muted">{item.exampleArabic}</span>
                    </div>
                    <button
                      onClick={() => onPlaySpeech(item.exampleTifinagh, 'letter', item.audio)}
                      className="top-header-control"
                    >
                      🔊 استمع
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setQIndex(q => q + 1)} className="top-header-control">الثنائية الصوتية التالية ←</button>
            </div>
          </div>
        )}

        {/* Tab 6: Repeat & Self-Record */}
        {activeTab === 6 && (
          <div className="theme-card-elevated rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-bold">كرّر النطق وسجّل صوتك للمقارنة الذاتية</h3>
            <div className="p-4 rounded-xl theme-card flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-tifinagh text-2xl font-bold theme-text-accent">{currentWord.tifinagh} ({currentWord.latin})</div>
                <div className="text-sm theme-text-secondary mt-1">{currentWord.arabic} — التقريب الصوتي: [{currentWord.phoneticAr}]</div>
              </div>
              <button
                onClick={() => onPlaySpeech(currentWord.tifinagh, 'word', currentWord.audio)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
              >
                🔊 استمع للنموذج
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {recordingState !== 'recording' ? (
                <button
                  onClick={handleStartSelfRecord}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500"
                >
                  🎙️ ابدأ تسجيل نطقك
                </button>
              ) : (
                <button
                  onClick={handleStopSelfRecord}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm"
                >
                  ⏹️ إيقاف التسجيل
                </button>
              )}
              {recordedUrl && (
                <audio controls src={recordedUrl} className="h-9" />
              )}
              <button onClick={() => { setQIndex(q => q + 1); setRecordedUrl(null); }} className="top-header-control mr-auto">
                مفردة أخرى ←
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Audio Studio Modal (Record & Bind Human Pronunciations in IndexedDB)
export const AudioStudioModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSavedRecording: () => void;
}> = ({ isOpen, onClose, onSavedRecording }) => {
  const [selectedKey, setSelectedKey] = useState<string>(ALL_DICTIONARY_DATA[0].tifinagh);
  const [dialect, setDialect] = useState<string>('تاشلحيت');
  const [recordings, setRecordings] = useState<CustomAudioRecord[]>([]);
  const [isRec, setIsRec] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      getAllCustomAudioRecordings().then(setRecordings);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetEntry = ALL_DICTIONARY_DATA.find(d => d.tifinagh === selectedKey) || ALL_DICTIONARY_DATA[0];

  const startStudioRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mrRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          await saveCustomAudioRecording({
            key: targetEntry.tifinagh,
            tifinagh: targetEntry.tifinagh,
            latin: targetEntry.latin,
            arabic: targetEntry.arabic,
            dialect,
            mimeType: 'audio/webm',
            dataUrl,
            createdAt: Date.now()
          });
          const updated = await getAllCustomAudioRecordings();
          setRecordings(updated);
          setStatusMsg(`تم حفظ التسجيل البشري للكلمة «${targetEntry.tifinagh}» في IndexedDB بنجاح!`);
          onSavedRecording();
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        setIsRec(false);
      };
      mr.start();
      setIsRec(true);
      setStatusMsg('جاري التسجيل من الميكروفون...');
    } catch {
      setStatusMsg('تعذر الوصول للميكروفون في المتصفح الحالي — يمكنك إرفاق ملف صوتي MP3/WAV مباشرة.');
    }
  };

  const stopStudioRecord = () => {
    if (mrRef.current && mrRef.current.state !== 'inactive') {
      mrRef.current.stop();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      await saveCustomAudioRecording({
        key: targetEntry.tifinagh,
        tifinagh: targetEntry.tifinagh,
        latin: targetEntry.latin,
        arabic: targetEntry.arabic,
        dialect,
        mimeType: file.type || 'audio/mp3',
        dataUrl,
        createdAt: Date.now()
      });
      const updated = await getAllCustomAudioRecordings();
      setRecordings(updated);
      setStatusMsg(`تم ربط الملف الصوتي (${file.name}) بالكلمة «${targetEntry.tifinagh}» محلياً!`);
      onSavedRecording();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="audio-studio-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label="استوديو الصوت الأمازيغي البشري">
      <div className="theme-card w-full max-w-3xl rounded-2xl p-5 md:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold theme-text-main">🎙️ استوديو التسجيل الصوتي البشري (IndexedDB)</h2>
            <p className="text-xs theme-text-muted mt-1">الطبقة الأولى للصوت الأمازيغي: سجّل نطقك أو أرفق ملف MP3/WAV ليُعتمد تلقائياً في كامل المنصة</p>
          </div>
          <button onClick={onClose} className="top-header-control" aria-label="إغلاق استوديو الصوت">✕ إغلاق</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-bold mb-1.5">اختر المفردة المعجمية (340 مدخلاً):</label>
            <select
              value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}
              className="theme-input w-full rounded-xl p-2.5 text-sm"
            >
              {ALL_DICTIONARY_DATA.map(d => (
                <option key={d.id} value={d.tifinagh}>
                  {d.tifinagh} ({d.latin}) — {d.arabic}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">التنوع اللساني للتسجيل:</label>
            <select
              value={dialect}
              onChange={e => setDialect(e.target.value)}
              className="theme-input w-full rounded-xl p-2.5 text-sm"
            >
              <option value="تاشلحيت">تاشلحيت (سوس والأطلس الصغير)</option>
              <option value="تمازيغت الأطلس المتوسط">تمازيغت الأطلس المتوسط والجنوب الشرقي</option>
              <option value="تاريفيت">تاريفيت (الريف)</option>
              <option value="الأمازيغية المعيارية">الأمازيغية المعيارية (IRCAM)</option>
            </select>
          </div>
        </div>

        <div className="theme-card-elevated rounded-xl p-4 mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-tifinagh text-2xl font-bold theme-text-accent">{targetEntry.tifinagh} ({targetEntry.latin})</div>
            <div className="text-xs theme-text-secondary mt-1">{targetEntry.arabic} • التقريب الصوتي: {targetEntry.phoneticAr}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {!isRec ? (
              <button onClick={startStudioRecord} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">
                🎙️ تسجيل من الميكروفون
              </button>
            ) : (
              <button onClick={stopStudioRecord} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs">
                ⏹️ إيقاف وحفظ
              </button>
            )}
            <label className="top-header-control cursor-pointer">
              📁 إرفاق MP3/WAV
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-bold mb-4">
            {statusMsg}
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold mb-2">التسجيلات البشرية المحفوظة محلياً ({recordings.length}):</h3>
          {recordings.length === 0 ? (
            <p className="text-xs theme-text-muted p-4 rounded-xl theme-card text-center">
              لا توجد تسجيلات مخصصة بعد. عند تسجيل أي مفردة هنا ستُشغّل بالأولوية القصوى (الطبقة 1).
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recordings.map(r => (
                <div key={r.key} className="theme-card p-3 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <span className="font-tifinagh font-bold theme-text-accent">{r.tifinagh}</span>{' '}
                    <span className="text-xs font-bold">({r.latin}) — {r.arabic}</span>
                    <span className="text-xs theme-text-muted block">{r.dialect}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <audio controls src={r.dataUrl} className="h-8 w-36" />
                    <button
                      onClick={async () => {
                        await deleteCustomAudioRecording(r.key);
                        setRecordings(await getAllCustomAudioRecordings());
                      }}
                      className="top-header-control text-rose-400"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. Five-Minute Daily Learning Session Modal
export const FiveMinuteModeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPlaySpeech: (text: string, type: string, audioPath?: string) => void;
  onCompleteSession: () => void;
}> = ({ isOpen, onClose, onPlaySpeech, onCompleteSession }) => {
  const [step, setStep] = useState<number>(1);
  if (!isOpen) return null;

  const letter = ALPHABET_DATA[0];
  const words = ALL_DICTIONARY_DATA.slice(0, 3);
  const story = STORIES_DATA[0];

  return (
    <div id="five-minute-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6" role="dialog" aria-modal="true" aria-label="جلسة تعلم في 5 دقائق">
      <div className="theme-card w-full max-w-2xl rounded-2xl p-5 md:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
          <h2 className="text-lg md:text-xl font-bold">⚡ جلسة تعلم مركزة في 5 دقائق (الخطوة {step} من 3)</h2>
          <button onClick={onClose} className="top-header-control">✕ إغلاق</button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-accent">1. حرف اليوم من أبجدية تيفيناغ:</h3>
            <div className="theme-card-elevated p-5 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-tifinagh text-5xl font-bold theme-text-accent">{letter.symbol}</div>
                <div className="text-lg font-bold mt-2">{letter.name} — المقابل: {letter.arabicEquiv}</div>
                <div className="text-xs theme-text-secondary mt-1">مثال: {letter.exampleTifinagh} ({letter.exampleLatin}) = {letter.exampleArabic}</div>
              </div>
              <button onClick={() => onPlaySpeech(letter.exampleTifinagh, 'letter', letter.audio)} className="top-header-control">🔊 استمع</button>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm">التالي: 3 مفردات أساسية ←</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-accent">2. ثلاث مفردات يومية موثقة:</h3>
            <div className="space-y-2.5">
              {words.map(w => (
                <div key={w.id} className="theme-card-elevated p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-tifinagh font-bold text-xl theme-text-accent">{w.tifinagh}</span>{' '}
                    <span className="font-bold text-sm">({w.latin}) — {w.arabic}</span>
                    <span className="text-xs theme-text-muted block">{w.french} • النطق: {w.phoneticAr}</span>
                  </div>
                  <button onClick={() => onPlaySpeech(w.tifinagh, 'word', w.audio)} className="top-header-control">🔊</button>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="top-header-control">→ السابق</button>
              <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm">التالي: جملة اليوم ←</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-accent">3. جملة سياقية من التراث الأمازيغي:</h3>
            <div className="theme-card-elevated p-4 rounded-xl space-y-2">
              <div className="font-tifinagh text-xl font-bold theme-text-accent">{story.sentenceBuilder.tifinagh}</div>
              <div className="text-sm font-semibold" dir="ltr">{story.sentenceBuilder.latin}</div>
              <div className="text-base font-bold">{story.sentenceBuilder.arabic}</div>
              <p className="text-xs theme-text-muted">{story.sentenceBuilder.explanation}</p>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="top-header-control">→ السابق</button>
              <button
                onClick={() => { onCompleteSession(); setStep(1); onClose(); }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm"
              >
                ✓ إتمام الجلسة (+15 XP)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. Linguistic Assistant / Grammar Guide Modal (#ai-tutor-modal)
export const LinguisticAssistantModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<'annexion' | 'feminine' | 'verbs' | 'dialects'>('annexion');

  if (!isOpen) return null;

  const matchedEntries = query.trim()
    ? ALL_DICTIONARY_DATA.filter(
        d =>
          d.tifinagh.includes(query) ||
          d.latin.toLowerCase().includes(query.toLowerCase()) ||
          d.arabic.includes(query)
      ).slice(0, 5)
    : [];

  return (
    <div id="ai-tutor-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6" role="dialog" aria-modal="true" aria-label="المساعد اللغوي والنحوي الأمازيغي">
      <div className="theme-card w-full max-w-3xl rounded-2xl p-5 md:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
          <div>
            <h2 className="text-xl font-bold">🧠 المساعد اللغوي والصرفي الأمازيغي (IRCAM)</h2>
            <p className="text-xs theme-text-muted mt-1">دليل فوري لقواعد الحالة الحرة وحالة الإلحاق، التأنيث، وتصريف الأفعال</p>
          </div>
          <button onClick={onClose} className="top-header-control">✕ إغلاق</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { key: 'annexion', label: 'حالة الإلحاق (État d’annexion)' },
            { key: 'feminine', label: 'التذكير والتأنيث (ⵜ...ⵜ)' },
            { key: 'verbs', label: 'بنية الجملة والفعل' },
            { key: 'dialects', label: 'التنوعات اللسانية الثلاثة' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setSelectedTopic(t.key as typeof selectedTopic)}
              className={`p-2.5 rounded-xl text-xs font-bold border ${
                selectedTopic === t.key ? 'bg-amber-500 text-slate-950 border-amber-500' : 'theme-card-elevated'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="theme-card-elevated p-4 rounded-xl text-sm space-y-2 mb-4 leading-relaxed">
          {selectedTopic === 'annexion' && (
            <>
              <h3 className="font-bold theme-text-accent">قاعدة الحالة الحرة وحالة الإلحاق (Addad ilelli / Addad amaruz):</h3>
              <p>يكون الاسم الأمازيغي في <strong>الحالة الحرة</strong> عندما يقع في بداية الجملة، ويتحول إلى <strong>حالة الإلحاق</strong> عندما يقع فاعلاً بعد الفعل أو مجروراً بعد حروف الجر (ⵖⵔ, ⴳ, ⵖⴼ, ⵏ, ⵙ):</p>
              <ul className="list-disc pr-5 space-y-1 text-xs">
                <li>الأسماء المبدوءة بـ <strong>ⴰ (a)</strong> تتحول إلى <strong>ⵓ (u)</strong> أو <strong>ⵡⴰ (wa)</strong>: <code>ⴰⴷⵔⴰⵔ → ⵓⴷⵔⴰⵔ</code>، <code>ⴰⵙⵉⴼ → ⵡⴰⵙⵉⴼ</code>.</li>
                <li>الأسماء المؤنثة المبدوءة بـ <strong>ⵜⴰ (ta)</strong> تحذف الألف فتصبح <strong>ⵜ (t)</strong>: <code>ⵜⴰⵎⵖⴰⵔⵜ → ⵜⵎⵖⴰⵔⵜ</code>، <code>ⵜⴰⴳⴰⵏⵜ → ⵜⴳⴰⵏⵜ</code>.</li>
              </ul>
            </>
          )}
          {selectedTopic === 'feminine' && (
            <>
              <h3 className="font-bold theme-text-accent">قاعدة التأنيث والجمع في الأمازيغية:</h3>
              <p>يُصاغ الاسم المؤنث غالباً بإحاطة الاسم المذكر بتاء التأنيث في أوله وآخره <strong>(ⵜ...ⵜ)</strong>:</p>
              <ul className="list-disc pr-5 space-y-1 text-xs">
                <li><code>ⵉⵙⵍⵉ (Isli = عريس)</code> ← <code>ⵜⵉⵙⵍⵉⵜ (Tislit = عروس)</code></li>
                <li><code>ⴰⴳⵍⵍⵉⴷ (Agllid = ملك)</code> ← <code>ⵜⴰⴳⵍⵍⵉⴷⵜ (Tagllidt = ملكة)</code></li>
                <li><code>ⴰⴼⵔⵓⵅ (Afrux = فتى)</code> ← <code>ⵜⴰⴼⵔⵓⵅⵜ (Tafruxt = فتاة)</code></li>
              </ul>
            </>
          )}
          {selectedTopic === 'verbs' && (
            <>
              <h3 className="font-bold theme-text-accent">تركيب الجملة الفعلية والاسمية:</h3>
              <p>تبدأ الجملة الفعلية الأمازيغية بالفعل متبوعاً بالفاعل في حالة الإلحاق ثم المفعول به:</p>
              <p className="font-tifinagh text-base theme-text-accent">ⵢⵓⵡⵉ ⵓⴼⵔⵓⵅ ⴰⵖⵢⵓⵍ ⵖⵔ ⵡⴰⵙⵉⴼ (Yuwi ufrux aɣyul ɣer wasif)</p>
            </>
          )}
          {selectedTopic === 'dialects' && (
            <>
              <h3 className="font-bold theme-text-accent">التنوعات اللسانية المغربية والمعيارية (IRCAM):</h3>
              <p>تجمع الأمازيغية المعيارية المغربية بين الرصيد المشترك للتنوعات الثلاثة الكبرى: <strong>تشلحيت</strong> (سوس والأطلس الكبير الغربي والأطلس الصغير)، <strong>تمازيغت</strong> (الأطلس المتوسط والجنوب الشرقي)، و<strong>تاريفيت</strong> (الريف).</p>
            </>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">حلل أي كلمة من المعجم (340 مدخلاً) صرفياً:</label>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="اكتب كلمة بتيفيناغ أو العربية أو اللاتينية (مثال: ⴰⵎⴰⵏ أو الماء أو Adrar)..."
            className="theme-input w-full rounded-xl p-2.5 text-sm mb-3"
          />
          {matchedEntries.length > 0 && (
            <div className="space-y-2">
              {matchedEntries.map(m => (
                <div key={m.id} className="theme-card p-3 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-tifinagh font-bold text-base theme-text-accent">{m.tifinagh}</span>{' '}
                    <span className="font-bold">({m.latin}) — {m.arabic}</span>
                  </div>
                  <div className="theme-text-muted">
                    الحرة: {m.freeState} | الإلحاق: {m.annexedState} | الجمع: {m.plural}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
