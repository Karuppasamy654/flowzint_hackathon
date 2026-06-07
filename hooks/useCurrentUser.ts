import { useSession } from 'next-auth/react';

export function useCurrentUser() {
  const { data: session, status, update } = useSession();

  return {
    user: session?.user || null,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    update,
  };
}
