import { useGetProgress } from "@workspace/api-client-react";
import { Heart, Diamond, Flame } from "lucide-react";
import { Link } from "wouter";

export function TopBar() {
  const { data: progress } = useGetProgress();

  return (
    <div className="sticky top-0 z-50 w-full bg-white border-b-2 border-border/60 shadow-sm px-4 py-3 flex items-center justify-between md:justify-around max-w-3xl mx-auto rounded-b-2xl">
      <Link href="/" className="font-display font-bold text-2xl text-primary flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
        DuoTR
      </Link>
      
      <div className="flex items-center gap-4 md:gap-8">
        <div className="flex items-center gap-1.5 font-bold text-orange-500">
          <img src={`${import.meta.env.BASE_URL}images/streak-flame.png`} alt="Seri" className="w-6 h-6 object-contain" />
          <span>{progress?.streak || 0}</span>
        </div>
        
        <div className="flex items-center gap-1.5 font-bold text-blue-500">
          <Diamond className="w-5 h-5 fill-current" />
          <span>{progress?.xp || 0}</span>
        </div>
        
        <div className="flex items-center gap-1.5 font-bold text-red-500">
          <Heart className="w-5 h-5 fill-current" />
          <span>{progress?.hearts ?? 5}</span>
        </div>
      </div>
    </div>
  );
}
