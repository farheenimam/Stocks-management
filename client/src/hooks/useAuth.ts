import { useQuery } from "@tanstack/react-query";

interface User {
  user_id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  account_balance: string;
  risk_tolerance?: string;
  subscription_tier: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}
