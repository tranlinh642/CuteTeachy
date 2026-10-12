'use client';

import { selectCurrentUser, usePreferencesStore, useSessionStore } from '@/stores';
import { shouldResetThemeOnGenderChange } from '@/lib/theme';
import type { UpdateProfileInput, User } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';

export function useUpdateProfile() {
  const { auth } = useServices();
  const updateUser = useSessionStore((state) => state.updateUser);
  const setThemePreference = usePreferencesStore((state) => state.setThemePreference);
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, UpdateProfileInput>({
    mutationFn: (input) => auth.updateProfile(input),
    onSuccess: (updatedUser, variables) => {
      const currentUser = selectCurrentUser(useSessionStore.getState());
      const prevGender = currentUser?.gender;
      updateUser(updatedUser);
      if (shouldResetThemeOnGenderChange(variables.gender, prevGender)) {
        setThemePreference('auto');
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}
