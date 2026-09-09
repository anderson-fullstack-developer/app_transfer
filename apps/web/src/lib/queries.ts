'use client';

import { useQuery } from '@tanstack/react-query';
import { type StudentProfileView } from '@app/shared';
import { apiFetch, ApiError } from './api-client';

/** Perfil de estudante do utilizador autenticado. `null` = ainda nao criado. */
export function useStudentProfile(enabled: boolean) {
  return useQuery<StudentProfileView | null>({
    queryKey: ['students', 'me'],
    enabled,
    queryFn: async () => {
      try {
        return await apiFetch<StudentProfileView>('/students/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  });
}
