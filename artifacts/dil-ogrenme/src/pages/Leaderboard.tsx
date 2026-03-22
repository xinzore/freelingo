import { useGetLeaderboard } from "@workspace/api-client-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />
      
      <main className="max-w-md mx-auto pt-8 px-4 flex flex-col items-center">
        <h1 className="w-full text-3xl font-display font-bold text-gray-800 mb-2 text-center">Haftalık Liderler</h1>
        <p className="text-gray-500 font-medium mb-8 text-center">En çok XP kazananlar</p>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-2">
            {(Array.isArray(leaderboard) ? leaderboard : [])?.map((entry, index) => {
              const isTop3 = index < 3;
              const rankColors = [
                "bg-yellow-100 text-yellow-600 border-yellow-200", // 1st
                "bg-gray-100 text-gray-600 border-gray-200",     // 2nd
                "bg-orange-100 text-orange-600 border-orange-200"  // 3rd
              ];
              const rankColor = isTop3 ? rankColors[index] : "bg-transparent text-gray-400 border-transparent";
              
              const isUser = isAuthenticated && entry.isCurrentUser;

              return (
                <div 
                  key={entry.userId}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-2xl border-2 transition-all",
                    isUser 
                      ? "bg-primary/5 border-primary" 
                      : "bg-white border-border hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-display font-bold border-2",
                    rankColor
                  )}>
                    {index + 1}
                  </div>
                  
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-border shrink-0">
                    {entry.profileImageUrl ? (
                      <img src={entry.profileImageUrl} alt={entry.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-display font-bold truncate",
                      isUser ? "text-primary" : "text-gray-800"
                    )}>
                      {entry.displayName} {isUser && "(Sen)"}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">Seviye {entry.level}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-display font-bold text-gray-800">{entry.xp} XP</div>
                  </div>
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
