import { useGetAchievements } from "@workspace/api-client-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Diamond } from "lucide-react";
import { cn } from "@/lib/utils";

export function Achievements() {
  const { data: achievements, isLoading } = useGetAchievements();

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />
      
      <main className="max-w-md mx-auto pt-8 px-4 flex flex-col items-center">
        <h1 className="w-full text-3xl font-display font-bold text-gray-800 mb-6">Rozetlerim</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full">
            {(Array.isArray(achievements) ? achievements : [])?.map((achievement) => {
              const isUnlocked = !!achievement.unlockedAt;
              
              return (
                <div 
                  key={achievement.id}
                  className={cn(
                    "border-2 rounded-2xl p-5 flex flex-col items-center text-center transition-all",
                    isUnlocked 
                      ? "bg-white border-border shadow-sm border-b-4" 
                      : "bg-gray-50 border-gray-200 opacity-70 grayscale-[0.8]"
                  )}
                >
                  <div className="text-5xl mb-3 drop-shadow-md">
                    {achievement.icon}
                  </div>
                  <h3 className="font-display font-bold text-gray-800 mb-1 leading-tight">
                    {achievement.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mb-3">
                    {achievement.description}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t-2 border-border/50 w-full flex justify-center">
                    <div className="flex items-center gap-1 font-bold text-blue-500">
                      <Diamond className="w-4 h-4 fill-current" />
                      <span className="text-sm">+{achievement.xpReward}</span>
                    </div>
                  </div>
                  
                  {isUnlocked && achievement.unlockedAt && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
