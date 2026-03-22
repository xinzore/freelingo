import { useGetProgress, useResetProgress, useSetDailyGoal } from "@workspace/api-client-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { GamifiedButton } from "@/components/ui/gamified-button";
import { Flame, Diamond, BookOpen, Award, Target, LogOut, AlertTriangle, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ProfileProps {
  onOpenAuth?: () => void;
}

export function Profile({ onOpenAuth }: ProfileProps) {
  const { data: progress, refetch } = useGetProgress();
  const resetMutation = useResetProgress();
  const setDailyGoalMutation = useSetDailyGoal();
  const { user, isAuthenticated, logout } = useAuth();

  const handleReset = async () => {
    if (confirm("Tüm ilerlemeni sıfırlamak istediğine emin misin? Bu işlem geri alınamaz!")) {
      await resetMutation.mutateAsync({});
      refetch();
    }
  };

  const handleSetGoal = async (goal: number) => {
    if (!isAuthenticated) { onOpenAuth?.(); return; }
    await setDailyGoalMutation.mutateAsync({
      data: { dailyGoal: goal }
    });
    refetch();
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar onOpenAuth={onOpenAuth} />
      
      <main className="max-w-md mx-auto pt-8 px-4 flex flex-col items-center">
        
        {/* Avatar & Basic Info */}
        <div className="w-full flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-primary/20 border-4 border-primary rounded-full mb-4 overflow-hidden flex items-center justify-center">
            {isAuthenticated && user?.profileImage ? (
              <img src={user.profileImage} alt={user.name || "Avatar"} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-12 h-12 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-800">
            {isAuthenticated ? (user?.name || "Öğrenci") : "Misafir Öğrenci"}
          </h1>
          <p className="text-gray-500 font-medium mt-1">Seviye {progress?.level || 1}</p>
          
          {!isAuthenticated && (
            <GamifiedButton className="mt-4 px-8" onClick={onOpenAuth}>
              Giriş Yap
            </GamifiedButton>
          )}
        </div>

        {/* Stats Grid */}
        <h2 className="w-full text-xl font-display font-bold text-gray-800 mb-4 border-b-2 border-border pb-2">İstatistikler</h2>
        <div className="grid grid-cols-2 gap-4 w-full mb-10">
          
          <div className="bg-white border-2 border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 bg-orange-100 rounded-xl text-orange-500 shrink-0">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="font-display font-bold text-xl">{progress?.streak || 0}</div>
              <div className="text-xs font-bold text-gray-400 uppercase">Günlük Seri</div>
            </div>
          </div>

          <div className="bg-white border-2 border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-500 shrink-0">
              <Diamond className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="font-display font-bold text-xl">{progress?.xp || 0}</div>
              <div className="text-xs font-bold text-gray-400 uppercase">Toplam XP</div>
            </div>
          </div>

          <div className="bg-white border-2 border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-500 shrink-0">
              <BookOpen className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="font-display font-bold text-xl">{progress?.totalLessonsCompleted || 0}</div>
              <div className="text-xs font-bold text-gray-400 uppercase">Biten Ders</div>
            </div>
          </div>

          <div className="bg-white border-2 border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 bg-yellow-100 rounded-xl text-yellow-500 shrink-0">
              <Award className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="font-display font-bold text-xl">Bronz</div>
              <div className="text-xs font-bold text-gray-400 uppercase">Mevcut Lig</div>
            </div>
          </div>

        </div>

        {/* Daily Goal Setting */}
        <h2 className="w-full text-xl font-display font-bold text-gray-800 mb-4 border-b-2 border-border pb-2">Günlük Hedef XP</h2>
        <div className="w-full grid grid-cols-4 gap-2 mb-10">
          {[10, 20, 30, 50].map((goal) => (
            <button
              key={goal}
              onClick={() => handleSetGoal(goal)}
              disabled={setDailyGoalMutation.isPending}
              className={cn(
                "p-3 rounded-xl border-2 font-bold transition-all",
                progress?.dailyGoal === goal
                  ? "bg-primary/10 border-primary text-primary border-b-4"
                  : "bg-white border-border text-gray-500 hover:bg-gray-50 border-b-4"
              )}
            >
              {goal}
            </button>
          ))}
        </div>

        {/* Settings / Danger Zone */}
        <h2 className="w-full text-xl font-display font-bold text-gray-800 mb-4 border-b-2 border-border pb-2">Ayarlar</h2>
        <div className="w-full flex flex-col gap-3">
          <GamifiedButton 
            variant="danger" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleReset}
            disabled={resetMutation.isPending}
          >
            <AlertTriangle className="w-5 h-5" />
            {resetMutation.isPending ? "Sıfırlanıyor..." : "İlerlemeyi Sıfırla"}
          </GamifiedButton>

          {isAuthenticated && (
            <GamifiedButton 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 text-gray-600 border-gray-300"
              onClick={logout}
            >
              <LogOut className="w-5 h-5" />
              Çıkış Yap
            </GamifiedButton>
          )}
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
