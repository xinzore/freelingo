import { Link, useLocation } from "wouter";
import { Home, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Dersler" },
    { href: "/leaderboard", icon: Shield, label: "Ligler" },
    { href: "/profile", icon: User, label: "Profil" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-border/60 pb-safe pt-2 px-6">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer",
                isActive ? "text-primary bg-primary/10" : "text-gray-400 hover:bg-gray-50"
              )}>
                <Icon className={cn("w-7 h-7 mb-1", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-wide uppercase">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
