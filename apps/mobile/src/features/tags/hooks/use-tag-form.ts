import { useState } from 'react';
import { useCreateTag } from '@cute-teachy/api';
import { tagSchema, validate, type FieldErrors, type TagFormValues } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { Tag } from '@cute-teachy/types';
import { translateFieldError } from '@/lib/field-error';

const INITIAL_VALUES: TagFormValues = { name: '', tone: 'pink' };

/** View-model "Tạo thẻ mới": tên + màu pastel. */
export function useTagForm(onCreated: (tag: Tag) => void) {
  const { t } = useTranslation();
  const createTag = useCreateTag();
  const [values, setValues] = useState<TagFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors<TagFormValues>>({});

  const setName = (name: string) => {
    setValues((current) => ({ ...current, name }));
    if (errors.name) setErrors({});
  };

  const setTone = (tone: TagFormValues['tone']) => setValues((current) => ({ ...current, tone }));

  const submit = () => {
    const result = validate(tagSchema, values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    createTag.mutate(result.data, { onSuccess: onCreated });
  };

  return {
    values,
    setName,
    setTone,
    submit,
    isSubmitting: createTag.isPending,
    nameError: translateFieldError(t, errors.name, 'tags.editor.nameLabel'),
    submitError: createTag.error ? t(createTag.error.messageKey) : undefined,
  };
}
