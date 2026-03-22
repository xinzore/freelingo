import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Eye, Mic, Plus, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { GamifiedButton } from "@/components/ui/gamified-button";
import { cn } from "@/lib/utils";
import {
  apiRequest,
  createEmptyExercise,
  createEmptyWord,
  formatExerciseType,
  splitListInput,
  type CommunityExercise,
  type CommunityExercisePair,
  type CommunityExerciseType,
  type CommunityLessonDetail,
  type CommunityLessonDifficulty,
  type CommunityLessonPayload,
  type CommunityLessonSummary,
  type CommunityWord,
} from "@/lib/community";

interface StudioProps {
  onOpenAuth?: () => void;
}

interface LessonFormState {
  title: string;
  description: string;
  category: string;
  difficulty: CommunityLessonDifficulty;
  sourceLanguage: string;
  targetLanguage: string;
  icon: string;
  tagsText: string;
  objectivesText: string;
  estimatedMinutes: number;
  words: CommunityWord[];
  exercises: CommunityExercise[];
}

const difficultyLabels: Record<CommunityLessonDifficulty, string> = {
  beginner: "Baslangic",
  intermediate: "Orta",
  advanced: "Ileri",
};

const exerciseTypeButtons: Array<{ type: CommunityExerciseType; icon: typeof Plus; label: string }> = [
  { type: "multiple-choice", icon: Plus, label: "Coktan secmeli" },
  { type: "matching", icon: Wand2, label: "Eslestirme" },
  { type: "fill-blank", icon: Sparkles, label: "Bosluk doldurma" },
  { type: "speech-to-text", icon: Mic, label: "Sesten yaziya" },
  { type: "translate-written", icon: Eye, label: "Yazili ceviri" },
];

function emptyFormState(): LessonFormState {
  return {
    title: "",
    description: "",
    category: "",
    difficulty: "beginner",
    sourceLanguage: "Turkish",
    targetLanguage: "English",
    icon: "🧩",
    tagsText: "",
    objectivesText: "",
    estimatedMinutes: 5,
    words: [createEmptyWord()],
    exercises: [createEmptyExercise("multiple-choice")],
  };
}

function toFormState(lesson: CommunityLessonDetail): LessonFormState {
  return {
    title: lesson.title,
    description: lesson.description,
    category: lesson.category,
    difficulty: lesson.difficulty,
    sourceLanguage: lesson.sourceLanguage,
    targetLanguage: lesson.targetLanguage,
    icon: lesson.icon,
    tagsText: lesson.tags.join(", "),
    objectivesText: lesson.objectives.join("\n"),
    estimatedMinutes: lesson.estimatedMinutes,
    words: lesson.words.length > 0 ? lesson.words : [createEmptyWord()],
    exercises: lesson.exercises.length > 0 ? lesson.exercises : [createEmptyExercise("multiple-choice")],
  };
}

function toPayload(form: LessonFormState, isPublished: boolean): CommunityLessonPayload {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    difficulty: form.difficulty,
    sourceLanguage: form.sourceLanguage.trim(),
    targetLanguage: form.targetLanguage.trim(),
    icon: form.icon.trim() || "🧩",
    tags: splitListInput(form.tagsText),
    objectives: splitListInput(form.objectivesText),
    estimatedMinutes: form.estimatedMinutes,
    words: form.words
      .map((word) => ({
        ...word,
        term: word.term.trim(),
        translation: word.translation.trim(),
        example: word.example?.trim() ?? "",
        note: word.note?.trim() ?? "",
      })),
    exercises: form.exercises.map((exercise) => ({
      ...exercise,
      prompt: exercise.prompt.trim(),
      instructions: exercise.instructions?.trim() ?? "",
      options: (exercise.options ?? []).map((option) => option.trim()),
      correctAnswers: (exercise.correctAnswers ?? []).map((answer) => answer.trim()),
      pairs: (exercise.pairs ?? []).map((pair) => ({
        ...pair,
        left: pair.left.trim(),
        right: pair.right.trim(),
      })),
      voiceText: exercise.voiceText?.trim() ?? "",
      sourceText: exercise.sourceText?.trim() ?? "",
      hint: exercise.hint?.trim() ?? "",
      explanation: exercise.explanation?.trim() ?? "",
    })),
    isPublished,
  };
}

function buildStudioSummary(form: LessonFormState) {
  return {
    wordCount: form.words.filter((word) => word.term.trim() && word.translation.trim()).length,
    exerciseCount: form.exercises.filter((exercise) => exercise.prompt.trim()).length,
  };
}

export function Studio({ onOpenAuth }: StudioProps) {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<LessonFormState>(emptyFormState);
  const [myLessons, setMyLessons] = useState<CommunityLessonSummary[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadMine(selectedId?: string) {
    if (!isAuthenticated) return;

    setLoading(true);
    setError("");

    try {
      const mine = await apiRequest<CommunityLessonSummary[]>("/api/community-lessons/mine");
      setMyLessons(mine);

      if (selectedId) {
        const lesson = await apiRequest<CommunityLessonDetail>(`/api/community-lessons/${selectedId}`);
        setForm(toFormState(lesson));
        setEditingId(lesson.id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Stüdyo verisi yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get("lessonId") ?? undefined;

    void loadMine(lessonId);
  }, [isAuthenticated]);

  const summary = buildStudioSummary(form);

  async function handleEdit(id: string) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const lesson = await apiRequest<CommunityLessonDetail>(`/api/community-lessons/${id}`);
      setForm(toFormState(lesson));
      setEditingId(id);
      window.history.replaceState({}, "", `/studio?lessonId=${id}`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Icerik duzenleme icin acilamadi.");
    } finally {
      setLoading(false);
    }
  }

  function resetEditor() {
    setEditingId(null);
    setForm(emptyFormState());
    setSuccess("");
    setError("");
    window.history.replaceState({}, "", "/studio");
  }

  function updateWord(id: string, patch: Partial<CommunityWord>) {
    setForm((current) => ({
      ...current,
      words: current.words.map((word) => (word.id === id ? { ...word, ...patch } : word)),
    }));
  }

  function removeWord(id: string) {
    setForm((current) => ({
      ...current,
      words: current.words.length > 1 ? current.words.filter((word) => word.id !== id) : [createEmptyWord()],
    }));
  }

  function updateExercise(id: string, patch: Partial<CommunityExercise>) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) => (exercise.id === id ? { ...exercise, ...patch } : exercise)),
    }));
  }

  function removeExercise(id: string) {
    setForm((current) => ({
      ...current,
      exercises:
        current.exercises.length > 1
          ? current.exercises.filter((exercise) => exercise.id !== id)
          : [createEmptyExercise("multiple-choice")],
    }));
  }

  function updatePair(exerciseId: string, pairId: string, patch: Partial<CommunityExercisePair>) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              pairs: (exercise.pairs ?? []).map((pair) => (pair.id === pairId ? { ...pair, ...patch } : pair)),
            }
          : exercise,
      ),
    }));
  }

  async function saveLesson(isPublished: boolean) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = toPayload(form, isPublished);
      const saved = editingId
        ? await apiRequest<CommunityLessonDetail>(`/api/community-lessons/${editingId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await apiRequest<CommunityLessonDetail>("/api/community-lessons", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      setEditingId(saved.id);
      setForm(toFormState(saved));
      setSuccess(isPublished ? "Icerik yayina alindi." : "Taslak kaydedildi.");
      await loadMine(saved.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Icerik kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <TopBar onOpenAuth={onOpenAuth} />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-[2rem] border-2 border-border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-4xl">
              ✍️
            </div>
            <h1 className="font-display text-3xl font-bold text-gray-800">Icerik Stüdyosu</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-gray-500">
              Topluluga ders ve alistirma eklemek icin once bir hesapla giris yapman gerekiyor.
            </p>
            <div className="mt-6 flex justify-center">
              <GamifiedButton onClick={onOpenAuth}>Giris Yap ve Uretmeye Basla</GamifiedButton>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar onOpenAuth={onOpenAuth} />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 xl:grid-cols-[320px,minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-[2rem] border-2 border-[#d8f3d4] bg-[linear-gradient(135deg,#f7fff1_0%,#f0fff9_100%)] p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-green-700">
              <Sparkles className="h-4 w-4" />
              Icerik Ureticisi
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-800">Merkez kontrol sende.</h1>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
              {user?.firstName || "Uretici"} olarak topluluk icin ders tasarlayabilir, taslak olarak saklayabilir ve
              hazir oldugunda yayina alabilirsin.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border-2 border-border bg-white p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">Kelime</div>
              <div className="mt-1 font-display text-3xl font-bold text-gray-800">{summary.wordCount}</div>
            </div>
            <div className="rounded-3xl border-2 border-border bg-white p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">Egzersiz</div>
              <div className="mt-1 font-display text-3xl font-bold text-gray-800">{summary.exerciseCount}</div>
            </div>
          </div>

          <div className="rounded-[2rem] border-2 border-border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-display text-xl font-bold text-gray-800">Taslaklarim</div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  {myLessons.length} kayit
                </div>
              </div>
              <button
                onClick={resetEditor}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-500"
              >
                Yeni
              </button>
            </div>

            {loading && <div className="text-sm font-medium text-gray-500">Stüdyo yukleniyor...</div>}

            <div className="space-y-3">
              {myLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => handleEdit(lesson.id)}
                  className={cn(
                    "w-full rounded-2xl border-2 p-4 text-left transition-colors",
                    editingId === lesson.id ? "border-primary bg-primary/5" : "border-border bg-gray-50 hover:bg-white",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <div className="truncate font-display text-lg font-bold text-gray-800">{lesson.title}</div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
                        lesson.isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {lesson.isPublished ? "Yayinda" : "Taslak"}
                    </span>
                  </div>
                  <div className="line-clamp-2 text-sm font-medium text-gray-500">{lesson.description}</div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          {error && <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>}
          {success && (
            <div className="rounded-3xl border-2 border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
              {success}
            </div>
          )}

          <div className="rounded-[2rem] border-2 border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400">
                  {editingId ? "Duzenleme Modu" : "Yeni Taslak"}
                </div>
                <h2 className="font-display text-3xl font-bold text-gray-800">Ders iskeleti</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <GamifiedButton variant="outline" onClick={() => void saveLesson(false)} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Taslak Kaydet
                </GamifiedButton>
                <GamifiedButton onClick={() => void saveLesson(true)} disabled={saving}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Yayinla
                </GamifiedButton>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700">Baslik</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
                  placeholder="Ornek: Ofiste Gunluk Konusmalar"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700">Kategori</span>
                <input
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
                  placeholder="Is, Seyahat, A1, YDS..."
                />
              </label>
              <label className="md:col-span-2 flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700">Aciklama</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-28 rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
                  placeholder="Bu ders ne kazandiriyor, kim icin uygun?"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700">Icon</span>
                <input
                  value={form.icon}
                  onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                  className="rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
                  placeholder="🧩"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700">Tahmini Sure</span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={form.estimatedMinutes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, estimatedMinutes: Number(event.target.value) || 1 }))
                  }
                  className="rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700">Kaynak Dil</span>
                <input
                  value={form.sourceLanguage}
                  onChange={(event) => setForm((current) => ({ ...current, sourceLanguage: event.target.value }))}
                  className="rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700">Hedef Dil</span>
                <input
                  value={form.targetLanguage}
                  onChange={(event) => setForm((current) => ({ ...current, targetLanguage: event.target.value }))}
                  className="rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-bold text-gray-700">Zorluk</div>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(difficultyLabels) as CommunityLessonDifficulty[]).map((difficulty) => (
                    <button
                      key={difficulty}
                      onClick={() => setForm((current) => ({ ...current, difficulty }))}
                      className={cn(
                        "rounded-2xl border-2 px-3 py-3 text-sm font-bold",
                        form.difficulty === difficulty
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-gray-50 text-gray-500",
                      )}
                    >
                      {difficultyLabels[difficulty]}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700">Etiketler</span>
                <textarea
                  value={form.tagsText}
                  onChange={(event) => setForm((current) => ({ ...current, tagsText: event.target.value }))}
                  className="min-h-24 rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
                  placeholder="is, toplanti, e-posta"
                />
              </label>
            </div>

            <label className="mt-5 flex flex-col gap-2">
              <span className="text-sm font-bold text-gray-700">Ogrenme Hedefleri</span>
              <textarea
                value={form.objectivesText}
                onChange={(event) => setForm((current) => ({ ...current, objectivesText: event.target.value }))}
                className="min-h-24 rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
                placeholder={"Her satira bir hedef yaz.\nSunum acmak\nKisa e-posta yazmak"}
              />
            </label>
          </div>

          <div className="rounded-[2rem] border-2 border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl font-bold text-gray-800">Kelime bankasi</h3>
                <p className="text-sm font-medium text-gray-500">Dersin temel kelime ve ifade tabani.</p>
              </div>
              <GamifiedButton size="sm" variant="outline" onClick={() => setForm((current) => ({ ...current, words: [...current.words, createEmptyWord()] }))}>
                <Plus className="mr-2 h-4 w-4" />
                Kelime Ekle
              </GamifiedButton>
            </div>

            <div className="space-y-4">
              {form.words.map((word) => (
                <div key={word.id} className="rounded-3xl border-2 border-border bg-gray-50 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={word.term}
                      onChange={(event) => updateWord(word.id, { term: event.target.value })}
                      className="rounded-2xl border-2 border-transparent bg-white px-4 py-3 outline-none focus:border-primary"
                      placeholder="Kelime / ifade"
                    />
                    <input
                      value={word.translation ?? ""}
                      onChange={(event) => updateWord(word.id, { translation: event.target.value })}
                      className="rounded-2xl border-2 border-transparent bg-white px-4 py-3 outline-none focus:border-primary"
                      placeholder="Ceviri"
                    />
                    <input
                      value={word.example ?? ""}
                      onChange={(event) => updateWord(word.id, { example: event.target.value })}
                      className="rounded-2xl border-2 border-transparent bg-white px-4 py-3 outline-none focus:border-primary md:col-span-2"
                      placeholder="Ornek cumle"
                    />
                    <input
                      value={word.note ?? ""}
                      onChange={(event) => updateWord(word.id, { note: event.target.value })}
                      className="rounded-2xl border-2 border-transparent bg-white px-4 py-3 outline-none focus:border-primary md:col-span-2"
                      placeholder="Ipuclari veya kullanim notu"
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => removeWord(word.id)}
                      className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border-2 border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-display text-2xl font-bold text-gray-800">Alistirmalar</h3>
                <p className="text-sm font-medium text-gray-500">
                  Her egzersiz tipi oynatici tarafinda ayri davranisa sahip olacak sekilde tasarlanir.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {exerciseTypeButtons.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => setForm((current) => ({ ...current, exercises: [...current.exercises, createEmptyExercise(type)] }))}
                    className="rounded-full border-2 border-border bg-gray-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-600"
                  >
                    <Icon className="mr-2 inline h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              {form.exercises.map((exercise, index) => (
                <div key={exercise.id} className="rounded-[2rem] border-2 border-border bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">Alistirma {index + 1}</div>
                      <div className="font-display text-xl font-bold text-gray-800">{formatExerciseType(exercise.type)}</div>
                    </div>
                    <button
                      onClick={() => removeExercise(exercise.id)}
                      className="rounded-full bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-red-500"
                    >
                      <Trash2 className="mr-2 inline h-4 w-4" />
                      Sil
                    </button>
                  </div>

                  <div className="grid gap-3">
                    <input
                      value={exercise.prompt}
                      onChange={(event) => updateExercise(exercise.id, { prompt: event.target.value })}
                      className="rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary"
                      placeholder="Soru basligi veya gosterilecek gorev"
                    />
                    <textarea
                      value={exercise.instructions ?? ""}
                      onChange={(event) => updateExercise(exercise.id, { instructions: event.target.value })}
                      className="min-h-20 rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary"
                      placeholder="Gerekiyorsa kisa yonerge"
                    />

                    {exercise.type === "multiple-choice" && (
                      <div className="grid gap-3 md:grid-cols-2">
                        {[...(exercise.options ?? []), "", "", "", ""].slice(0, Math.max(4, exercise.options?.length ?? 0)).map((option, optionIndex) => (
                          <input
                            key={`${exercise.id}-option-${optionIndex}`}
                            value={option}
                            onChange={(event) => {
                              const nextOptions = [...([...(exercise.options ?? []), "", "", "", ""].slice(0, Math.max(4, exercise.options?.length ?? 0)))];
                              nextOptions[optionIndex] = event.target.value;
                              updateExercise(exercise.id, { options: nextOptions });
                            }}
                            className="rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary"
                            placeholder={`Secenek ${optionIndex + 1}`}
                          />
                        ))}
                        <input
                          value={exercise.correctAnswers?.[0] ?? ""}
                          onChange={(event) => updateExercise(exercise.id, { correctAnswers: [event.target.value] })}
                          className="rounded-2xl border-2 border-green-200 bg-green-50 px-4 py-3 outline-none focus:border-green-500 md:col-span-2"
                          placeholder="Dogru cevap"
                        />
                      </div>
                    )}

                    {exercise.type === "matching" && (
                      <div className="space-y-3">
                        {(exercise.pairs ?? []).map((pair) => (
                          <div key={pair.id} className="grid gap-3 md:grid-cols-[1fr,1fr,auto]">
                            <input
                              value={pair.left}
                              onChange={(event) => updatePair(exercise.id, pair.id, { left: event.target.value })}
                              className="rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary"
                              placeholder="Sol parca"
                            />
                            <input
                              value={pair.right}
                              onChange={(event) => updatePair(exercise.id, pair.id, { right: event.target.value })}
                              className="rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary"
                              placeholder="Sag parca"
                            />
                            <button
                              onClick={() =>
                                updateExercise(exercise.id, {
                                  pairs: (exercise.pairs ?? []).filter((currentPair) => currentPair.id !== pair.id),
                                })
                              }
                              className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-red-500"
                            >
                              Sil
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            updateExercise(exercise.id, {
                              pairs: [...(exercise.pairs ?? []), { id: crypto.randomUUID(), left: "", right: "" }],
                            })
                          }
                          className="rounded-full bg-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-600"
                        >
                          <Plus className="mr-2 inline h-4 w-4" />
                          Cift Ekle
                        </button>
                      </div>
                    )}

                    {exercise.type === "fill-blank" && (
                      <div className="grid gap-3 md:grid-cols-2">
                        <textarea
                          value={exercise.correctAnswers?.join("\n") ?? ""}
                          onChange={(event) => updateExercise(exercise.id, { correctAnswers: splitListInput(event.target.value) })}
                          className="min-h-24 rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary md:col-span-2"
                          placeholder={"Kabul edilecek cevaplar\nBir cevap her satirda olabilir"}
                        />
                      </div>
                    )}

                    {exercise.type === "speech-to-text" && (
                      <div className="grid gap-3">
                        <textarea
                          value={exercise.voiceText ?? ""}
                          onChange={(event) => updateExercise(exercise.id, { voiceText: event.target.value })}
                          className="min-h-24 rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary"
                          placeholder="Okunacak metin"
                        />
                        <textarea
                          value={exercise.correctAnswers?.join("\n") ?? ""}
                          onChange={(event) => updateExercise(exercise.id, { correctAnswers: splitListInput(event.target.value) })}
                          className="min-h-24 rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary"
                          placeholder="Kabul edilecek cevaplar"
                        />
                      </div>
                    )}

                    {exercise.type === "translate-written" && (
                      <div className="grid gap-3">
                        <textarea
                          value={exercise.sourceText ?? ""}
                          onChange={(event) => updateExercise(exercise.id, { sourceText: event.target.value })}
                          className="min-h-24 rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary"
                          placeholder="Cevirilecek kaynak cumle"
                        />
                        <textarea
                          value={exercise.correctAnswers?.join("\n") ?? ""}
                          onChange={(event) => updateExercise(exercise.id, { correctAnswers: splitListInput(event.target.value) })}
                          className="min-h-24 rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary"
                          placeholder="Kabul edilecek ceviriler"
                        />
                      </div>
                    )}

                    <input
                      value={exercise.hint ?? ""}
                      onChange={(event) => updateExercise(exercise.id, { hint: event.target.value })}
                      className="rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary"
                      placeholder="Ipuclari"
                    />
                    <textarea
                      value={exercise.explanation ?? ""}
                      onChange={(event) => updateExercise(exercise.id, { explanation: event.target.value })}
                      className="min-h-20 rounded-2xl border-2 border-border bg-white px-4 py-3 outline-none focus:border-primary"
                      placeholder="Dogrudan sonra gosterilecek kisa aciklama"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
