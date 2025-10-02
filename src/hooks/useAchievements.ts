import { useQuery } from '@tanstack/react-query';
import { GatewayAPI } from '@/lib/api';

export const useUserAchievements = (userId: string) => {
  return useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async () => {
      const result = await GatewayAPI.achievements.getUserAchievements(userId, false);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch user achievements');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};