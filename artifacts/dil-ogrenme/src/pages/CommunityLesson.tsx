import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  Headphones,
  Heart,
  Lightbulb,
  RotateCcw,
  Volume2,
  X,
  XCircle,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { GamifiedButton } from "@/components/ui/gamified-button";
import { launchSuccessConfetti, playCompletionCelebration, playFeedbackTone, speakText } from "@/lib/lessonFeedback";
import { cn } from "@/lib/utils";
import {
  apiRequest,
  matchesAcceptedAnswer,
  normalizeAnswer,
  shuffleArray,
  type CommunityExercise,
  type CommunityLessonDetail,
} from "@/lib/community";

interface CommunityLessonPageProps {
  onOpenAuth?: () => void;
}

function tokenizeText(text: string): string[] {
  return text.match(/[\p{L}\p{N}'’-]+/gu) ?? [];
}

function getExerciseTitle(lesson: CommunityLessonDetail, exercise: CommunityExercise): string {
  if (exercise.type === "multiple-choice") return "Dogru cevabi sec";
  if (exercise.type === "matching") return "Eslesen ciftleri sec";
  if (exercise.type === "fill-blank") return "Boslugu tamamla";
  if (exercise.type === "speech-to-text") return "Dinledigini yaz";
  return `Asagidakinin ${lesson.targetLanguage} karsiligini yaz`;
}

function getExercisePrompt(exercise: CommunityExercise): string {
  return exercise.sourceText || exercise.voiceText || exercise.prompt;
}

function getExerciseAccent(exercise: CommunityExercise): string {
  if (exercise.type === "multiple-choice") return "from-sky-400 to-cyan-300";
  if (exercise.type === "matching") return "from-fuchsia-400 to-violet-300";
  if (exercise.type === "fill-blank") return "from-amber-300 to-orange-300";
  if (exercise.type === "speech-to-text") return "from-emerald-400 to-teal-300";
  return "from-rose-400 to-orange-300";
}

function buildWordBank(lesson: CommunityLessonDetail, exercise: CommunityExercise): string[] {
  const mainAnswer = exercise.correctAnswers?.[0] ?? "";
  const answerTokens = tokenizeText(mainAnswer);

  if (answerTokens.length === 0) {
    return [];
  }

  const distractorPool = [
    ...lesson.words.flatMap((word) => tokenizeText(`${word.term} ${word.translation}`)),
    ...tokenizeText(exercise.prompt),
    ...tokenizeText(exercise.sourceText ?? ""),
  ];

  const normalizedAnswerTokens = new Set(answerTokens.map((token) => normalizeAnswer(token)));
  const distractors = Array.from(
    new Set(
      distractorPool.filter((token) => token.trim() && !normalizedAnswerTokens.has(normalizeAnswer(token))),
    ),
  ).slice(0, 5);

  return shuffleArray([...answerTokens, ...distractors]);
}

function getExpectedAnswerText(exercise: CommunityExercise): string {
  if (exercise.type === "matching") {
    return (exercise.pairs ?? []).map((pair) => `${pair.left} -> ${pair.right}`).join(" | ");
  }

  return (exercise.correctAnswers ?? []).join(", ");
}

function ExerciseMascot({
  lesson,
  exercise,
}: {
  lesson: CommunityLessonDetail;
  exercise: CommunityExercise;
}) {
  return (
    <div
      className={cn(
        "flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br text-4xl shadow-[0_18px_45px_rgba(0,0,0,0.28)]",
        getExerciseAccent(exercise),
      )}
    >
      <span className="drop-shadow-sm">{lesson.icon}</span>
    </div>
  );
}

function PlayerHeader({
  hearts,
  progress,
  onClose,
}: {
  hearts: number;
  progress: number;
  onClose: () => void;
}) {
  return (
    <header className="border-b border-white/10 px-4 py-4 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#91a4ad] transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#33454f]">
          <div
            className="h-full rounded-full bg-[#8fe13f] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Heart
              key={index}
              className={cn(
                "h-5 w-5",
                index < hearts ? "fill-[#ff6b6b] text-[#ff6b6b]" : "fill-[#33454f] text-[#33454f]",
              )}
            />
          ))}
        </div>
      </div>
    </header>
  );
}

export function CommunityLesson({ onOpenAuth }: CommunityLessonPageProps) {
  const [, params] = useRoute("/community/:id");
  const [, setLocation] = useLocation();
  const [lesson, setLesson] = useState<CommunityLessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [matchAnswers, setMatchAnswers] = useState<Record<string, string>>({});
  const [matchingChoices, setMatchingChoices] = useState<string[]>([]);
  const [activeMatchingLeftId, setActiveMatchingLeftId] = useState<string>("");
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong" | "finished">("idle");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!params?.id) return;

      setLoading(true);
      setError("");

      try {
        const response = await apiRequest<CommunityLessonDetail>(`/api/community-lessons/${params.id}`);
        if (!cancelled) {
          setLesson(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Ders yuklenemedi.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [params?.id]);

  const currentExercise = lesson?.exercises[index] ?? null;
  const progress = lesson && lesson.exercises.length > 0 ? ((index + (status === "finished" ? 1 : 0)) / lesson.exercises.length) * 100 : 0;
  const currentAnswer = currentExercise?.type === "translate-written" ? selectedTokens.join(" ") : writtenAnswer;
  const pairs = currentExercise?.pairs ?? [];
  const rightChoicesInUse = new Set(Object.values(matchAnswers).filter(Boolean));
  const canCheck =
    currentExercise?.type === "multiple-choice"
      ? selectedOption.trim().length > 0
      : currentExercise?.type === "matching"
        ? pairs.length > 0 && pairs.every((pair) => Boolean(matchAnswers[pair.id]))
        : currentAnswer.trim().length > 0;

  useEffect(() => {
    setWrittenAnswer("");
    setSelectedOption("");
    setMatchAnswers({});
    setStatus("idle");
    setSelectedTokens([]);
    setAvailableTokens([]);
    setActiveMatchingLeftId("");

    if (!lesson || !currentExercise) return;

    if (currentExercise.type === "matching") {
      setMatchingChoices(shuffleArray((currentExercise.pairs ?? []).map((pair) => pair.right)));
      setActiveMatchingLeftId(currentExercise.pairs?.[0]?.id ?? "");
      return;
    }

    if (currentExercise.type === "translate-written") {
      setAvailableTokens(buildWordBank(lesson, currentExercise));
      return;
    }

    setMatchingChoices([]);
  }, [currentExercise?.id, lesson]);

  function evaluateAnswer() {
    if (!currentExercise) return false;

    if (currentExercise.type === "multiple-choice") {
      return matchesAcceptedAnswer(selectedOption, currentExercise.correctAnswers);
    }

    if (currentExercise.type === "matching") {
      return pairs.every((pair) => normalizeAnswer(matchAnswers[pair.id] ?? "") === normalizeAnswer(pair.right));
    }

    return matchesAcceptedAnswer(currentAnswer, currentExercise.correctAnswers);
  }

  function handleCheck() {
    if (!currentExercise || !canCheck) return;

    const isCorrect = evaluateAnswer();
    setStatus(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      playFeedbackTone(true);
      launchSuccessConfetti();
    } else {
      playFeedbackTone(false);
      setHearts((currentHearts) => Math.max(0, currentHearts - 1));
    }
  }

  function handleContinue() {
    if (!lesson) return;

    if (index >= lesson.exercises.length - 1) {
      playCompletionCelebration();
      setStatus("finished");
      return;
    }

    setIndex((currentIndex) => currentIndex + 1);
  }

  function handleRetryLesson() {
    setHearts(5);
    setIndex(0);
    setWrittenAnswer("");
    setSelectedOption("");
    setMatchAnswers({});
    setSelectedTokens([]);
    setAvailableTokens([]);
    setStatus("idle");
  }

  function assignMatch(option: string) {
    if (!currentExercise || currentExercise.type !== "matching" || !activeMatchingLeftId) return;

    const nextMatches = { ...matchAnswers, [activeMatchingLeftId]: option };
    setMatchAnswers(nextMatches);

    const nextUnmatched = pairs.find((pair) => !nextMatches[pair.id]);
    setActiveMatchingLeftId(nextUnmatched?.id ?? activeMatchingLeftId);
  }

  function toggleToken(token: string) {
    const selectedIndex = selectedTokens.findIndex((selectedToken) => selectedToken === token);

    if (selectedIndex >= 0) {
      setSelectedTokens((currentTokens) => currentTokens.filter((_, indexToKeep) => indexToKeep !== selectedIndex));
      setAvailableTokens((currentTokens) => [...currentTokens, token]);
      return;
    }

    const bankIndex = availableTokens.findIndex((availableToken) => availableToken === token);
    if (bankIndex < 0) return;

    setAvailableTokens((currentTokens) => currentTokens.filter((_, indexToKeep) => indexToKeep !== bankIndex));
    setSelectedTokens((currentTokens) => [...currentTokens, token]);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <TopBar onOpenAuth={onOpenAuth} />
        <main className="mx-auto flex max-w-xl items-center justify-center px-4 py-20">
          <div className="text-center font-display text-2xl font-bold text-gray-600">Topluluk dersi yukleniyor...</div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <TopBar onOpenAuth={onOpenAuth} />
        <main className="mx-auto max-w-xl px-4 py-12">
          <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-6 text-center">
            <div className="font-display text-2xl font-bold text-red-700">Ders acilamadi</div>
            <p className="mt-3 text-sm font-semibold text-red-600">{error || "Icerik bulunamadi."}</p>
            <div className="mt-6">
              <GamifiedButton onClick={() => setLocation("/community")}>Topluluga Don</GamifiedButton>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <TopBar onOpenAuth={onOpenAuth} />
        <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
          <button onClick={() => setLocation("/community")} className="flex items-center gap-2 text-sm font-bold text-gray-500">
            <ArrowLeft className="h-4 w-4" />
            Topluluga Don
          </button>

          <section className="overflow-hidden rounded-[2rem] border-2 border-[#243841] bg-[linear-gradient(135deg,#152229_0%,#1a2b33_48%,#1f343d_100%)] p-6 text-white shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/10 text-5xl">
                    {lesson.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#8fe13f]">{lesson.category}</div>
                    <h1 className="font-display text-4xl font-bold text-white">{lesson.title}</h1>
                  </div>
                </div>
                <p className="text-base font-medium leading-7 text-[#b6c5cb]">{lesson.description}</p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-sm">
                <div className="text-sm font-bold uppercase tracking-[0.22em] text-[#7d9199]">Hazirlik</div>
                <div className="mt-3 space-y-3 text-sm font-semibold text-[#d3dde1]">
                  <div>{lesson.exerciseCount} egzersiz</div>
                  <div>{lesson.wordCount} kelime</div>
                  <div>{lesson.estimatedMinutes} dakika</div>
                  <div>{lesson.author.name}</div>
                </div>
              </div>
            </div>
          </section>

          {lesson.objectives.length > 0 && (
            <section className="rounded-[2rem] border-2 border-border bg-white p-6">
              <h2 className="mb-4 font-display text-2xl font-bold text-gray-800">Bu ders sonunda</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {lesson.objectives.map((objective) => (
                  <div key={objective} className="rounded-2xl bg-lime-50 px-4 py-3 font-semibold text-lime-700">
                    {objective}
                  </div>
                ))}
              </div>
            </section>
          )}

          {lesson.words.length > 0 && (
            <section className="rounded-[2rem] border-2 border-border bg-white p-6">
              <h2 className="mb-4 font-display text-2xl font-bold text-gray-800">Kelime bankasi</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {lesson.words.map((word) => (
                  <div key={word.id} className="rounded-3xl border-2 border-border bg-gray-50 p-4">
                    <div className="font-display text-xl font-bold text-gray-800">
                      {word.term} <span className="text-primary">→</span> {word.translation}
                    </div>
                    {word.example && <div className="mt-2 text-sm font-medium text-gray-500">{word.example}</div>}
                    {word.note && <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{word.note}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex justify-center">
            <GamifiedButton size="lg" onClick={() => setStarted(true)}>
              Karanlik Oynaticida Baslat
            </GamifiedButton>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (hearts === 0) {
    return (
      <div className="min-h-screen bg-[#162126] text-white">
        <PlayerHeader hearts={hearts} progress={progress} onClose={() => setLocation("/community")} />
        <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
          <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[#243841] text-6xl">😵</div>
          <h1 className="font-display text-4xl font-bold">Canlar bitti</h1>
          <p className="mt-4 max-w-xl text-base font-medium leading-7 text-[#b7c4ca]">
            Referans tasarimdaki gibi daha odakli bir oyuncu var; ama yanlis cevaplar yine can eksiltiyor. Dilersen
            ayni dersi sifirdan tekrar oynayabilirsin.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <GamifiedButton onClick={handleRetryLesson}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Tekrar Dene
            </GamifiedButton>
            <GamifiedButton variant="outline" onClick={() => setLocation("/community")}>
              Topluluga Don
            </GamifiedButton>
          </div>
        </main>
      </div>
    );
  }

  if (status === "finished") {
    return (
      <div className="min-h-screen bg-[#162126] text-white">
        <PlayerHeader hearts={hearts} progress={100} onClose={() => setLocation("/community")} />
        <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
          <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[#8fe13f] text-6xl text-[#162126]">🏁</div>
          <h1 className="font-display text-4xl font-bold">Topluluk dersi tamamlandi</h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#b7c4ca]">
            Oynatici artik referans gorseldeki gibi tek odakli ve koyu temali. Topluluk dersleri bu yapiyla daha
            oyunsu, daha net ve mobilde daha guclu duruyor.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <GamifiedButton onClick={() => setLocation("/community")}>Yeni Ders Bul</GamifiedButton>
            <GamifiedButton variant="outline" onClick={() => setLocation("/studio")}>
              Ben de Uretecegim
            </GamifiedButton>
          </div>
        </main>
      </div>
    );
  }

  const exerciseTitle = getExerciseTitle(lesson, currentExercise!);
  const exercisePrompt = getExercisePrompt(currentExercise!);

  return (
    <div className="min-h-screen bg-[#162126] text-white">
      <PlayerHeader hearts={hearts} progress={progress} onClose={() => setLocation("/community")} />

      <main className="mx-auto flex min-h-[calc(100vh-74px)] w-full max-w-5xl flex-col px-4 pb-36 pt-8 md:px-8">
        <AnimatePresence mode="wait">
          <motion.section
            key={currentExercise!.id}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="mx-auto w-full max-w-4xl flex-1"
          >
            <div className="mb-10">
              <h1 className="font-display text-3xl font-bold tracking-tight text-[#f4f8fb] md:text-5xl">
                {exerciseTitle}
              </h1>
              <p className="mt-3 text-sm font-medium uppercase tracking-[0.26em] text-[#7e9198]">
                {lesson.title} • {index + 1}/{lesson.exercises.length}
              </p>
            </div>

            <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.26 }}
              >
                <ExerciseMascot lesson={lesson} exercise={currentExercise!} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.26 }}
                className="relative max-w-3xl rounded-[1.75rem] border border-[#3a4c55] bg-[#18262d] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
              >
                <div className="absolute left-[-10px] top-8 h-5 w-5 rotate-45 rounded-[4px] border-b border-l border-[#3a4c55] bg-[#18262d]" />

                <div className="flex items-start gap-3">
                  {currentExercise!.type === "speech-to-text" && (
                    <button
                      onClick={() => speakText(currentExercise!.voiceText ?? "")}
                      className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#113244] text-[#40c6ff] transition-colors hover:bg-[#174056]"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  )}
                  <div className="min-w-0">
                    <div className="text-xl font-medium leading-8 text-[#eef5f8] md:text-3xl md:leading-[1.45]">
                      {exercisePrompt}
                    </div>
                    {currentExercise!.instructions && (
                      <p className="mt-3 text-sm font-medium leading-6 text-[#8ea2ab]">{currentExercise!.instructions}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.26 }}
              className="space-y-5"
            >
              {currentExercise!.type === "multiple-choice" && (
                <div className="space-y-3">
                  {(currentExercise!.options ?? []).map((option, optionIndex) => (
                    <motion.button
                      key={option}
                      onClick={() => setSelectedOption(option)}
                      whileTap={{ scale: 0.985 }}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-[1.35rem] border px-4 py-4 text-left transition-all",
                        selectedOption === option
                          ? "border-[#54d2ff] bg-[#1a2e38] shadow-[0_0_0_1px_rgba(84,210,255,0.4)_inset]"
                          : "border-[#3b4b54] bg-transparent hover:border-[#60747e] hover:bg-[#1a2a31]",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold",
                          selectedOption === option ? "border-[#54d2ff] text-[#54d2ff]" : "border-[#51646e] text-[#8ea2ab]",
                        )}
                      >
                        {optionIndex + 1}
                      </div>
                      <div className="text-lg font-semibold text-[#f0f5f8]">{option}</div>
                    </motion.button>
                  ))}
                </div>
              )}

              {currentExercise!.type === "matching" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    {pairs.map((pair, pairIndex) => (
                      <motion.button
                        key={pair.id}
                        onClick={() => setActiveMatchingLeftId(pair.id)}
                        whileTap={{ scale: 0.985 }}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-[1.25rem] border px-4 py-4 text-left transition-all",
                          activeMatchingLeftId === pair.id
                            ? "border-[#54d2ff] bg-[#1a2e38]"
                            : "border-[#3b4b54] bg-transparent hover:bg-[#1a2a31]",
                        )}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#51646e] text-sm font-bold text-[#8ea2ab]">
                          {pairIndex + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-base font-semibold text-[#f0f5f8]">{pair.left}</div>
                          {matchAnswers[pair.id] && (
                            <div className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#8fe13f]">
                              Secilen: {matchAnswers[pair.id]}
                            </div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {matchingChoices.map((option, optionIndex) => {
                      const isAssignedElsewhere =
                        rightChoicesInUse.has(option) && matchAnswers[activeMatchingLeftId] !== option;

                      return (
                        <motion.button
                          key={`${option}-${optionIndex}`}
                          disabled={isAssignedElsewhere}
                          onClick={() => assignMatch(option)}
                          whileTap={{ scale: isAssignedElsewhere ? 1 : 0.985 }}
                          className={cn(
                            "flex w-full items-center gap-4 rounded-[1.25rem] border px-4 py-4 text-left transition-all",
                            isAssignedElsewhere
                              ? "cursor-not-allowed border-[#2e3c43] bg-[#1a262c] text-[#5b6b73]"
                              : "border-[#3b4b54] bg-transparent hover:border-[#60747e] hover:bg-[#1a2a31]",
                          )}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#51646e] text-sm font-bold text-[#8ea2ab]">
                            {optionIndex + pairs.length + 1}
                          </div>
                          <div className="text-base font-semibold">{option}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentExercise!.type === "fill-blank" && (
                <textarea
                  value={writtenAnswer}
                  onChange={(event) => setWrittenAnswer(event.target.value)}
                  className="min-h-48 w-full rounded-[1.5rem] border border-[#3b4b54] bg-[#223138] px-5 py-4 text-xl font-medium text-[#f0f5f8] outline-none placeholder:text-[#7d9098] focus:border-[#54d2ff]"
                  placeholder="Cevabini buraya yaz"
                />
              )}

              {currentExercise!.type === "speech-to-text" && (
                <div className="space-y-4">
                  <motion.button
                    onClick={() => speakText(currentExercise!.voiceText ?? "")}
                    whileTap={{ scale: 0.985 }}
                    className="flex w-full items-center justify-center gap-3 rounded-[1.35rem] border border-[#2f4b58] bg-[#18313b] px-5 py-4 font-display text-lg font-bold text-[#54d2ff]"
                  >
                    <Headphones className="h-5 w-5" />
                    Cumleyi tekrar dinle
                    <Volume2 className="h-5 w-5" />
                  </motion.button>
                  <textarea
                    value={writtenAnswer}
                    onChange={(event) => setWrittenAnswer(event.target.value)}
                    className="min-h-48 w-full rounded-[1.5rem] border border-[#3b4b54] bg-[#223138] px-5 py-4 text-xl font-medium text-[#f0f5f8] outline-none placeholder:text-[#7d9098] focus:border-[#54d2ff]"
                    placeholder="Duydugunu yaz"
                  />
                </div>
              )}

              {currentExercise!.type === "translate-written" && (
                <div className="space-y-5">
                  <div className="min-h-32 rounded-[1.6rem] border border-[#3b4b54] bg-[#15232a] px-5 py-4">
                    <div className="mb-4 h-px w-full bg-[#31424b]" />
                    <div className="flex min-h-16 flex-wrap gap-2">
                      {selectedTokens.length > 0 ? (
                        selectedTokens.map((token, tokenIndex) => (
                          <motion.button
                            key={`${token}-${tokenIndex}`}
                            onClick={() => toggleToken(token)}
                            whileTap={{ scale: 0.97 }}
                            className="rounded-[1rem] border border-[#51646e] bg-[#223138] px-4 py-2 text-lg font-semibold text-[#f0f5f8]"
                          >
                            {token}
                          </motion.button>
                        ))
                      ) : (
                        <div className="flex items-center text-lg font-medium text-[#6e838c]">Kelime bloklarini secerek cevabi kur.</div>
                      )}
                    </div>
                    <div className="mt-4 h-px w-full bg-[#31424b]" />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {[...selectedTokens, ...availableTokens].length > 0 ? (
                      availableTokens.map((token, tokenIndex) => (
                        <motion.button
                          key={`${token}-${tokenIndex}-bank`}
                          onClick={() => toggleToken(token)}
                          whileTap={{ scale: 0.97 }}
                          className="rounded-[1rem] border border-[#51646e] bg-[#18262d] px-4 py-2 text-lg font-semibold text-[#f0f5f8] transition-colors hover:bg-[#223138]"
                        >
                          {token}
                        </motion.button>
                      ))
                    ) : (
                      <textarea
                        value={writtenAnswer}
                        onChange={(event) => setWrittenAnswer(event.target.value)}
                        className="min-h-48 w-full rounded-[1.5rem] border border-[#3b4b54] bg-[#223138] px-5 py-4 text-xl font-medium text-[#f0f5f8] outline-none placeholder:text-[#7d9098] focus:border-[#54d2ff]"
                        placeholder="Cevirini yaz"
                      />
                    )}
                  </div>
                </div>
              )}
            </motion.section>

            <AnimatePresence>
              {currentExercise!.hint && status === "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="mt-8 flex items-start gap-3 rounded-[1.4rem] border border-[#5f4b1f] bg-[#2f2510] p-4 text-sm font-semibold text-[#ffd773]"
                >
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{currentExercise!.hint}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </AnimatePresence>
      </main>

      <footer
        className={cn(
          "fixed inset-x-0 bottom-0 border-t px-4 py-4 md:px-8",
          status === "idle" && "border-white/10 bg-[#1b2a31]",
          status === "correct" && "border-[#37662d] bg-[#1f3524]",
          status === "wrong" && "border-[#65393b] bg-[#3a2325]",
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-h-14">
            <AnimatePresence mode="wait">
              {status === "correct" && (
                <motion.div
                  key="community-correct"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="text-[#97f56f]"
                >
                  <div className="flex items-center gap-2 font-display text-2xl font-bold">
                    <CheckCircle2 className="h-6 w-6" />
                    Harika
                  </div>
                  {currentExercise!.explanation && (
                    <div className="mt-1 text-sm font-semibold text-[#c7f8b1]">{currentExercise!.explanation}</div>
                  )}
                </motion.div>
              )}

              {status === "wrong" && (
                <motion.div
                  key="community-wrong"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="text-[#ff8f90]"
                >
                  <div className="flex items-center gap-2 font-display text-2xl font-bold">
                    <XCircle className="h-6 w-6" />
                    Tekrar dene
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#ffc0c0]">
                    Dogru cevap: {getExpectedAnswerText(currentExercise!)}
                  </div>
                  {currentExercise!.explanation && (
                    <div className="mt-1 text-sm font-semibold text-[#ffc0c0]">{currentExercise!.explanation}</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-end">
            {status === "idle" ? (
              <button
                onClick={handleCheck}
                disabled={!canCheck}
                className={cn(
                  "rounded-2xl px-8 py-3 font-display text-sm font-bold uppercase tracking-[0.18em] transition-all",
                  canCheck
                    ? "bg-[#ff5f59] text-[#1e2022] shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)] hover:brightness-105"
                    : "cursor-not-allowed bg-[#4a5960] text-[#819098]",
                )}
              >
                Kontrol Et
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="rounded-2xl bg-[#ff5f59] px-8 py-3 font-display text-sm font-bold uppercase tracking-[0.18em] text-[#1e2022] shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)] hover:brightness-105"
              >
                {index >= lesson.exercises.length - 1 ? "Bitir" : "Devam Et"}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
