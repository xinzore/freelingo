import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Users, PenSquare, Clock3, Puzzle, Sparkles, Tags } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { GamifiedButton } from "@/components/ui/gamified-button";
import { cn } from "@/lib/utils";
import { apiRequest, type CommunityLessonSummary } from "@/lib/community";

interface CommunityHubProps {
  onOpenAuth?: () => void;
}

function LessonCard({
  lesson,
  actionLabel = "Calistir",
  actionHref,
  className,
}: {
  lesson: CommunityLessonSummary;
  actionLabel?: string;
  actionHref: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border-2 border-border bg-white p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
            {lesson.icon}
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-bold text-gray-800">{lesson.title}</h3>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
                  lesson.isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
                )}
              >
                {lesson.isPublished ? "Yayinda" : "Taslak"}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500">{lesson.description}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {lesson.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 text-sm font-semibold text-gray-600 sm:grid-cols-4">
        <div className="rounded-2xl bg-lime-50 px-3 py-2 text-lime-700">
          <div className="text-[10px] uppercase tracking-[0.2em]">Egzersiz</div>
          <div className="text-lg font-display font-bold">{lesson.exerciseCount}</div>
        </div>
        <div className="rounded-2xl bg-sky-50 px-3 py-2 text-sky-700">
          <div className="text-[10px] uppercase tracking-[0.2em]">Kelime</div>
          <div className="text-lg font-display font-bold">{lesson.wordCount}</div>
        </div>
        <div className="rounded-2xl bg-amber-50 px-3 py-2 text-amber-700">
          <div className="text-[10px] uppercase tracking-[0.2em]">Sure</div>
          <div className="text-lg font-display font-bold">{lesson.estimatedMinutes} dk</div>
        </div>
        <div className="rounded-2xl bg-violet-50 px-3 py-2 text-violet-700">
          <div className="text-[10px] uppercase tracking-[0.2em]">Yazar</div>
          <div className="truncate text-sm font-display font-bold">{lesson.author.name}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          {lesson.sourceLanguage} {"->"} {lesson.targetLanguage}
        </div>
        <Link href={actionHref}>
          <GamifiedButton size="sm">{actionLabel}</GamifiedButton>
        </Link>
      </div>
    </div>
  );
}

export function CommunityHub({ onOpenAuth }: CommunityHubProps) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [publishedLessons, setPublishedLessons] = useState<CommunityLessonSummary[]>([]);
  const [myLessons, setMyLessons] = useState<CommunityLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const published = await apiRequest<CommunityLessonSummary[]>("/api/community-lessons");
        if (!cancelled) {
          setPublishedLessons(published);
        }

        if (isAuthenticated) {
          const mine = await apiRequest<CommunityLessonSummary[]>("/api/community-lessons/mine");
          if (!cancelled) {
            setMyLessons(mine);
          }
        } else if (!cancelled) {
          setMyLessons([]);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Topluluk icerigi yuklenemedi.");
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
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar onOpenAuth={onOpenAuth} />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6">
        <section className="overflow-hidden rounded-[2rem] border-2 border-[#cbe8ff] bg-[linear-gradient(135deg,#f6fdff_0%,#eefbf5_45%,#fff7de_100%)] p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-sky-700">
                <Users className="h-3.5 w-3.5" />
                Topluluk Atolyesi
              </div>
              <h1 className="mb-3 font-display text-4xl font-bold leading-tight text-slate-800">
                Kullanici tarafindan uretilen dersleri kesfet, duzenle, paylas.
              </h1>
              <p className="text-base font-medium leading-7 text-slate-600">
                Coktan secmeli, eslestirme, bosluk doldurma, sesten yaziya ve yazili ceviri alistirmalari ile kendi
                minik kurslarini olusturabilirsin.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => window.scrollTo({ top: 720, behavior: "smooth" })}
                className="rounded-3xl border-2 border-sky-200 bg-white/80 p-4 text-left shadow-sm"
              >
                <Sparkles className="mb-3 h-6 w-6 text-sky-500" />
                <div className="font-display text-lg font-bold text-gray-800">Toplulugu Gez</div>
                <div className="text-sm font-medium text-gray-500">Yayinlanmis dersleri oyna.</div>
              </button>
              <button
                onClick={() => (isAuthenticated ? setLocation("/studio") : onOpenAuth?.())}
                className="rounded-3xl border-2 border-lime-200 bg-white/80 p-4 text-left shadow-sm"
              >
                <PenSquare className="mb-3 h-6 w-6 text-lime-600" />
                <div className="font-display text-lg font-bold text-gray-800">Icerik Uret</div>
                <div className="text-sm font-medium text-gray-500">Taslak baslat veya mevcut dersi duzenle.</div>
              </button>
            </div>
          </div>
        </section>

        {isAuthenticated && myLessons.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-gray-800">Taslaklarim</h2>
                <p className="text-sm font-medium text-gray-500">Duzenlemeye acik, sana ait icerikler.</p>
              </div>
              <GamifiedButton size="sm" onClick={() => setLocation("/studio")}>
                Yeni Taslak
              </GamifiedButton>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {myLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  actionLabel="Duzenle"
                  actionHref={`/studio?lessonId=${lesson.id}`}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-800">Yayindaki Dersler</h2>
              <p className="text-sm font-medium text-gray-500">
                Toplulugun yayinladigi ve hemen oynanabilir ders koleksiyonu.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-500">
              <Tags className="h-4 w-4" />
              {publishedLessons.length} aktif topluluk dersi
            </div>
          </div>

          {loading && (
            <div className="rounded-3xl border-2 border-border bg-white p-8 text-center font-semibold text-gray-500">
              Topluluk icerigi yukleniyor...
            </div>
          )}

          {error && (
            <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && publishedLessons.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-border bg-white p-8 text-center">
              <Puzzle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <div className="font-display text-xl font-bold text-gray-700">Henuz yayinlanmis icerik yok.</div>
              <p className="mt-2 text-sm font-medium text-gray-500">
                Ilk topluluk dersini olusturmak icin studio sayfasindan bir taslak ac.
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {publishedLessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} actionHref={`/community/${lesson.id}`} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border-2 border-border bg-white p-5">
            <Clock3 className="mb-3 h-6 w-6 text-amber-500" />
            <div className="font-display text-lg font-bold text-gray-800">Hizli Yayin Akisi</div>
            <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
              Taslak olarak kaydet, gozden gecir, sonra tek tikla yayina al.
            </p>
          </div>
          <div className="rounded-3xl border-2 border-border bg-white p-5">
            <Puzzle className="mb-3 h-6 w-6 text-sky-500" />
            <div className="font-display text-lg font-bold text-gray-800">5 Egzersiz Turu</div>
            <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
              Coktan secmeli, eslestirme, bosluk doldurma, sesten yaziya ve yazili ceviri.
            </p>
          </div>
          <div className="rounded-3xl border-2 border-border bg-white p-5">
            <Users className="mb-3 h-6 w-6 text-lime-600" />
            <div className="font-display text-lg font-bold text-gray-800">Topluluk Merkezli</div>
            <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
              Her yayin, baska bir kullanicinin ogrenecegi yeni bir pratik seti olabilir.
            </p>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
