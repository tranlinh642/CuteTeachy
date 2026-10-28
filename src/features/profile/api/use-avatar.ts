'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { useSessionStore } from '@/stores';
import type { User } from '@/types';

export function useUploadAvatar() {
  const { auth } = useServices();
  const updateUser = useSessionStore((state) => state.updateUser);
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, File | Blob>({
    mutationFn: (file) => auth.uploadAvatar(file),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

export function useDeleteAvatar() {
  const { auth } = useServices();
  const updateUser = useSessionStore((state) => state.updateUser);
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, void>({
    mutationFn: () => auth.deleteAvatar(),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}
