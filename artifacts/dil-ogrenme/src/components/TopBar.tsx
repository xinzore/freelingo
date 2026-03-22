import { useGetProgress } from "@workspace/api-client-react";
import { Heart, Diamond, Flame, PenSquare, User as UserIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { GamifiedButton } from "@/components/ui/gamified-button";

interface TopBarProps {
  onOpenAuth?: () => void;
}

export function TopBar({ onOpenAuth }: TopBarProps) {
  const { data: progress } = useGetProgress();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="sticky top-0 z-50 w-full bg-white border-b-2 border-border/60 shadow-sm px-4 py-3 flex items-center justify-between max-w-3xl mx-auto rounded-b-2xl">
      <Link href="/" className="font-display font-bold text-2xl text-primary flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
        FreeLingo
      </Link>
      
      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-1 font-bold text-orange-500">
          <img src={`${import.meta.env.BASE_URL}images/streak-flame.png`} alt="Seri" className="w-5 h-5 object-contain" />
          <span className="text-sm">{progress?.streak || 0}</span>
        </div>
        
        <div className="flex items-center gap-1 font-bold text-blue-500">
          <Diamond className="w-4 h-4 fill-current" />
          <span className="text-sm">{progress?.xp || 0}</span>
        </div>
        
        <div className="flex items-center gap-1 font-bold text-red-500">
          <Heart className="w-4 h-4 fill-current" />
          <span className="text-sm">{progress?.hearts ?? 5}</span>
        </div>

        <div className="w-px h-6 bg-border mx-1"></div>

        <Link href="/community">
          <div className="hidden sm:flex items-center gap-2 rounded-xl border-2 border-border bg-gray-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-600 hover:bg-white">
            <PenSquare className="w-4 h-4" />
            Topluluk
          </div>
        </Link>

        {!isAuthenticated ? (
          <GamifiedButton size="sm" onClick={onOpenAuth} className="px-3 py-1 text-sm">
            Giriş Yap
          </GamifiedButton>
        ) : (
          <div 
            onClick={() => setLocation('/profile')}
            className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name || "Profil"} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5 text-primary" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
