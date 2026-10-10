'use client';

import { useCreateTag } from '@cute-teachy/api';
import { tagSchema, validate, type FieldErrors, type TagFormValues } from '@cute-teachy/core';
import type { Tone } from '@cute-teachy/tokens';
import type { Tag } from '@cute-teachy/types';
import { useState, type FormEvent } from 'react';

/** View-model tạo thẻ: tên + tone, validate bằng `tagSchema`. */
export function useTagForm(onCreated?: (tag: Tag) => void) {
  const createTag = useCreateTag();
  const [name, setName] = useState('');
  const [tone, setTone] = useState<Tone>('pink');
  const [errors, setErrors] = useState<FieldErrors<TagFormValues>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Không để submit lan sang form của dialog cha (sự kiện React đi qua portal).
    event.stopPropagation();
    const result = validate(tagSchema, { name, tone });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    createTag.mutate(result.data, { onSuccess: (tag) => onCreated?.(tag) });
  };

  return {
    name,
    setName: (value: string) => {
      setName(value);
      setErrors((current) => ({ ...current, name: undefined }));
    },
    tone,
    setTone,
    errors,
    submit,
    isSubmitting: createTag.isPending,
    errorKey: createTag.error?.messageKey,
  };
}
