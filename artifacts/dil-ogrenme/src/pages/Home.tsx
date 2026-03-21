import { useGetLessons, useGetProgress } from "@workspace/api-client-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Star, Check, Lock, Target } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ProgressBar } from "@/components/ui/progress-bar";

interface HomeProps {
  onOpenAuth?: () => void;
}

export function Home({ onOpenAuth }: HomeProps) {
  const { data: lessons, isLoading: lessonsLoading } = useGetLessons();
  const { data: progress } = useGetProgress();

  if (lessonsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Find the first uncompleted lesson to mark as "current"
  const completedIds = progress?.completedLessons || [];
  const currentLessonId = lessons?.find(l => !completedIds.includes(l.id))?.id;

  const dailyXp = progress?.dailyXp || 0;
  const dailyGoal = progress?.dailyGoal || 50;
  const goalProgress = Math.min((dailyXp / dailyGoal) * 100, 100);
  const goalCompleted = dailyXp >= dailyGoal;

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar onOpenAuth={onOpenAuth} />
      
      <main className="max-w-md mx-auto pt-6 px-4 flex flex-col items-center">
        {/* Daily Goal Card */}
        <div className={cn(
          "w-full mb-6 border-2 rounded-2xl p-4 flex flex-col gap-2 transition-colors",
          goalCompleted ? "bg-green-50 border-green-200" : "bg-white border-border"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className={cn("w-5 h-5", goalCompleted ? "text-green-500" : "text-gray-400")} />
              <span className="font-display font-bold text-gray-700">Günlük Hedef</span>
            </div>
            <span className={cn("font-bold text-sm", goalCompleted ? "text-green-600" : "text-gray-500")}>
              {dailyXp} / {dailyGoal} XP
            </span>
          </div>
          <ProgressBar 
            progress={goalProgress} 
            className={cn("h-3", goalCompleted && "[&>div]:bg-green-500")}
          />
          {goalCompleted && (
            <p className="text-xs font-bold text-green-600 text-center mt-1">
              Harika! Günlük hedefini tamamladın 🎉
            </p>
          )}
        </div>

        <div className="w-full mb-8 bg-white border-2 border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-display font-bold text-gray-800 mb-2">Bölüm 1: Temeller</h1>
            <p className="text-gray-500 font-medium">İngilizce dünyasına ilk adımını at. Temel kelimeleri ve selamlaşmaları öğren.</p>
          </div>
          <img 
            src={`${import.meta.env.BASE_URL}images/mascot-happy.png`} 
            alt="Mascot" 
            className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 object-contain"
          />
        </div>

        <div className="flex flex-col gap-8 w-full py-8">
          {lessons?.map((lesson, index) => {
            // Create a zigzag pattern
            const isLeft = index % 2 === 0;
            const offset = Math.sin(index * 0.8) * 60;
            
            const isCompleted = completedIds.includes(lesson.id);
            const isCurrent = lesson.id === currentLessonId;
            const isLocked = !isCompleted && !isCurrent;

            return (
              <div 
                key={lesson.id} 
                className="relative w-full flex justify-center"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ transform: `translateX(${offset}px)` }}
                  className="relative z-10"
                >
                  <Link href={isLocked ? "#" : `/lesson/${lesson.id}`}>
                    <div className="flex flex-col items-center group cursor-pointer relative">
                      {/* Bouncing Crown/Star for current lesson */}
                      {isCurrent && (
                        <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute -top-12 bg-white px-4 py-2 rounded-xl border-2 border-border shadow-md text-sm font-bold text-primary whitespace-nowrap z-20"
                        >
                          Başla!
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-border rotate-45"></div>
                        </motion.div>
                      )}

                      {/* Lesson Button Node */}
                      <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center border-b-8 transition-transform group-active:translate-y-2 group-active:border-b-0",
                        isCompleted ? "bg-primary border-primary-dark text-white" :
                        isCurrent ? "bg-secondary border-secondary-dark text-white ring-4 ring-secondary/30 ring-offset-4" :
                        "bg-gray-200 border-gray-300 text-gray-400"
                      )}>
                        {isCompleted ? (
                          <Check className="w-10 h-10 stroke-[3]" />
                        ) : isLocked ? (
                          <Lock className="w-8 h-8 stroke-[2.5]" />
                        ) : (
                          <Star className="w-10 h-10 fill-current" />
                        )}
                      </div>
                      <span className="mt-3 font-display font-bold text-gray-700 text-center max-w-[120px] leading-tight">
                        {lesson.title}
                      </span>
                    </div>
                  </Link>
                </motion.div>

                {/* Connecting Path Line - SVG drawn behind nodes */}
                {index < lessons.length - 1 && (
                  <svg className="absolute w-full h-32 -bottom-20 left-0 -z-10 pointer-events-none" viewBox="0 0 400 128" preserveAspectRatio="none">
                    <path 
                      d={`M ${200 + offset} 0 C ${200 + offset} 64, ${200 + (Math.sin((index + 1) * 0.8) * 60)} 64, ${200 + (Math.sin((index + 1) * 0.8) * 60)} 128`} 
                      fill="none" 
                      stroke={isCompleted ? "hsl(var(--primary))" : "hsl(var(--border))"} 
                      strokeWidth="16" 
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
