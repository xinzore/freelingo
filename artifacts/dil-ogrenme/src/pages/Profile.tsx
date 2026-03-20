import { useGetProgress, useResetProgress } from "@workspace/api-client-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { GamifiedButton } from "@/components/ui/gamified-button";
import { Flame, Diamond, BookOpen, Award } from "lucide-react";

export function Profile() {
  const { data: progress, refetch } = useGetProgress();
  const resetMutation = useResetProgress();

  const handleReset = async () => {
    if (confirm("Tüm ilerlemeni sıfırlamak istediğine emin misin? Bu işlem geri alınamaz!")) {
      await resetMutation.mutateAsync({});
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />
      
      <main className="max-w-md mx-auto pt-8 px-4 flex flex-col items-center">
        
        {/* Avatar & Basic Info */}
        <div className="w-full flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-primary/20 border-4 border-primary rounded-full mb-4 overflow-hidden flex items-center justify-center">
            <img src={`${import.meta.env.BASE_URL}images/mascot-happy.png`} alt="Avatar" className="w-20 h-20 object-contain translate-y-2" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-800">Öğrenci</h1>
          <p className="text-gray-500 font-medium mt-1">Seviye {progress?.level || 1}</p>
        </div>

        {/* Stats Grid */}
        <h2 className="w-full text-xl font-display font-bold text-gray-800 mb-4 border-b-2 border-border pb-2">İstatistikler</h2>
        <div className="grid grid-cols-2 gap-4 w-full mb-10">
          
          <div className="bg-white border-2 border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 bg-orange-100 rounded-xl text-orange-500">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="font-display font-bold text-xl">{progress?.streak || 0}</div>
              <div className="text-xs font-bold text-gray-400 uppercase">Günlük Seri</div>
            </div>
          </div>

          <div className="bg-white border-2 border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-500">
              <Diamond className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="font-display font-bold text-xl">{progress?.xp || 0}</div>
              <div className="text-xs font-bold text-gray-400 uppercase">Toplam XP</div>
            </div>
          </div>

          <div className="bg-white border-2 border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-500">
              <BookOpen className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="font-display font-bold text-xl">{progress?.totalLessonsCompleted || 0}</div>
              <div className="text-xs font-bold text-gray-400 uppercase">Biten Ders</div>
            </div>
          </div>

          <div className="bg-white border-2 border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 bg-yellow-100 rounded-xl text-yellow-500">
              <Award className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="font-display font-bold text-xl">Bronz</div>
              <div className="text-xs font-bold text-gray-400 uppercase">Mevcut Lig</div>
            </div>
          </div>

        </div>

        {/* Settings / Danger Zone */}
        <h2 className="w-full text-xl font-display font-bold text-gray-800 mb-4 border-b-2 border-border pb-2">Ayarlar</h2>
        <GamifiedButton 
          variant="danger" 
          className="w-full"
          onClick={handleReset}
          disabled={resetMutation.isPending}
        >
          {resetMutation.isPending ? "Sıfırlanıyor..." : "İlerlemeyi Sıfırla"}
        </GamifiedButton>

      </main>

      <BottomNav />
    </div>
  );
}
