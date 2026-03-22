import { useCallback, useEffect, useState } from "react";

interface ApiAuthUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}

export interface AuthUser extends ApiAuthUser {
  name: string | null;
  profileImage: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

function mapAuthUser(user: ApiAuthUser | null): AuthUser | null {
  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return {
    ...user,
    name: fullName || user.email || null,
    profileImage: user.profileImageUrl ?? null,
  };
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/user", { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ user: ApiAuthUser | null }>;
      })
      .then((data) => {
        if (!cancelled) {
          setUser(mapAuthUser(data.user ?? null));
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(() => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";
    window.location.href = `/api/logout?returnTo=${encodeURIComponent(base)}`;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
