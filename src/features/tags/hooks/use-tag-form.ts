'use client';

import { useCreateTag, useUpdateTag } from '../api';
import { tagSchema, validate, type FieldErrors, type TagFormValues } from '@/utils';
import type { Tone } from '@/lib/theme';
import type { Tag } from '@/types';
import { useEffect, useState, type FormEvent } from 'react';

export interface UseTagFormOptions {
  readonly initialTag?: Tag | null;
  readonly onSuccess?: (tag: Tag) => void;
}

/** View-model tạo / sửa thẻ: tên + tone, validate bằng `tagSchema`, xử lý 409 tag_name_taken tại ô tên. */
export function useTagForm(optionsOrOnSuccess?: ((tag: Tag) => void) | UseTagFormOptions) {
  const options: UseTagFormOptions =
    typeof optionsOrOnSuccess === 'function'
      ? { onSuccess: optionsOrOnSuccess }
      : optionsOrOnSuccess ?? {};

  const { initialTag, onSuccess } = options;
  const isEditing = Boolean(initialTag);

  const createTag = useCreateTag();
  const updateTag = useUpdateTag();

  const [name, setName] = useState(initialTag?.name ?? '');
  const [tone, setTone] = useState<Tone>(initialTag?.tone ?? 'pink');
  const [errors, setErrors] = useState<FieldErrors<TagFormValues>>({});

  useEffect(() => {
    if (initialTag) {
      setName(initialTag.name);
      setTone(initialTag.tone);
      setErrors({});
    }
  }, [initialTag]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Không để submit lan sang form của dialog cha (sự kiện React đi qua portal).
    event.stopPropagation();

    const trimmedName = name.trim();
    const result = validate(tagSchema, { name: trimmedName, tone });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    if (isEditing && initialTag) {
      updateTag.mutate(
        { id: initialTag.id, input: result.data },
        {
          onSuccess: (updated) => {
            onSuccess?.(updated);
          },
          onError: (error) => {
            if (error.code === 'tag_name_taken' || error.status === 409) {
              setErrors((current) => ({
                ...current,
                name: { key: 'errors.tagNameTaken' },
              }));
            }
          },
        },
      );
    } else {
      createTag.mutate(result.data, {
        onSuccess: (created) => {
          setName('');
          setTone('pink');
          setErrors({});
          onSuccess?.(created);
        },
        onError: (error) => {
          if (error.code === 'tag_name_taken' || error.status === 409) {
            setErrors((current) => ({
              ...current,
              name: { key: 'errors.tagNameTaken' },
            }));
          }
        },
      });
    }
  };

  const activeMutation = isEditing ? updateTag : createTag;

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
    isSubmitting: activeMutation.isPending,
    errorKey: activeMutation.error?.messageKey,
    isEditing,
  };
}
