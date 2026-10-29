'use client';

import { useRef, useState } from 'react';
import { useTranslation, type TranslationKey } from '@/lib/i18n';
import { Button, Card, EmptyState, Icon, IconButton } from '@/components/ui';
import { cn } from '@/utils/cn';
import { useAiMessages, useClearAiMessages, useSendAiMessage } from '../api';
import { AiScheduleDraftCard } from './AiScheduleDraftCard';

export const MAX_AI_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AI_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface AiImageValidationResult {
  readonly valid: boolean;
  readonly error?: 'file_too_large' | 'unsupported_file_type';
  readonly errorKey?: TranslationKey;
}

export function validateAiImageFile(file: {
  size: number;
  type: string;
}): AiImageValidationResult {
  if (file.size > MAX_AI_IMAGE_BYTES) {
    return {
      valid: false,
      error: 'file_too_large',
      errorKey: 'aiAssistant.imageTooLarge',
    };
  }
  if (!(ALLOWED_AI_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: 'unsupported_file_type',
      errorKey: 'aiAssistant.imageUnsupportedType',
    };
  }
  return { valid: true };
}

const QUICK_PROMPTS = [
  { id: 'todaySchedule', key: 'aiAssistant.quickPrompts.todaySchedule' },
  { id: 'weeklyTasks', key: 'aiAssistant.quickPrompts.weeklyTasks' },
  { id: 'addExtraClass', key: 'aiAssistant.quickPrompts.addExtraClass' },
] as const;

export interface AiAssistantViewProps {
  readonly compact?: boolean;
  readonly initialImagePreviewUrl?: string | null;
  readonly initialImageErrorKey?: TranslationKey | null;
  readonly initialInputText?: string;
}

export function AiAssistantView({
  compact = false,
  initialImagePreviewUrl = null,
  initialImageErrorKey = null,
  initialInputText = '',
}: AiAssistantViewProps = {}) {
  const { t } = useTranslation();
  const { data: messagesData, isLoading } = useAiMessages();
  const sendMessage = useSendAiMessage();
  const clearMessages = useClearAiMessages();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState(initialInputText);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initialImagePreviewUrl,
  );
  const [imageErrorKey, setImageErrorKey] = useState<TranslationKey | null>(
    initialImageErrorKey,
  );

  const messages = messagesData?.items ?? [];

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateAiImageFile(file);
    if (!validation.valid) {
      setImageErrorKey(validation.errorKey ?? 'aiAssistant.imageUnsupportedType');
      setSelectedImage(null);
      setImagePreviewUrl(null);
      return;
    }

    setImageErrorKey(null);
    setSelectedImage(file);
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setImageErrorKey(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed && !selectedImage && !imagePreviewUrl) return;
    if (sendMessage.isPending) return;

    await sendMessage.mutateAsync({
      message: trimmed || undefined,
      image: selectedImage,
    });

    setInputText('');
    handleRemoveImage();
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (sendMessage.isPending) return;
    await sendMessage.mutateAsync({ message: promptText });
  };

  return (
    <div
      data-testid="ai-assistant-view"
      className={cn(
        'flex flex-col gap-4',
        compact ? 'max-h-[75dvh]' : 'max-w-4xl mx-auto pb-8',
      )}
    >
      {/* Header (only in full-page mode) */}
      {!compact && (
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
                <Icon name="spa" size={22} />
              </span>
              <h1 className="text-display-sm sm:text-display-md text-on-surface">
                {t('aiAssistant.title')}
              </h1>
            </div>
            <p className="text-body-md text-on-surface-variant mt-1">
              {t('aiAssistant.subtitle')}
            </p>
          </div>

          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon="delete"
              data-testid="ai-clear-history-button"
              disabled={clearMessages.isPending}
              onClick={() => clearMessages.mutate()}
            >
              {t('aiAssistant.clearHistory')}
            </Button>
          )}
        </header>
      )}

      {/* Quick Prompt Chips */}
      <div
        data-testid="ai-quick-prompts"
        aria-label={t('aiAssistant.quickPromptsLabel')}
        className="flex flex-wrap items-center gap-2"
      >
        {QUICK_PROMPTS.map((chip) => {
          const text = t(chip.key as TranslationKey);
          return (
            <button
              key={chip.id}
              type="button"
              data-testid={`quick-prompt-${chip.id}`}
              disabled={sendMessage.isPending}
              onClick={() => handleQuickPrompt(text)}
              className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-low px-3.5 py-1.5 text-body-sm font-medium text-on-surface hover:bg-primary-container/40 transition-colors cursor-pointer"
            >
              <Icon name="spa" size={16} className="text-primary" />
              <span>{text}</span>
            </button>
          );
        })}
      </div>

      {/* Message List */}
      <Card
        data-testid="ai-message-list"
        className={cn(
          'flex flex-col gap-4 overflow-y-auto p-4 sm:p-6 bg-surface-container-low',
          compact ? 'min-h-64 max-h-96' : 'min-h-96',
        )}
      >
        {!isLoading && messages.length === 0 ? (
          <EmptyState
            icon="spa"
            title={t('aiAssistant.emptyTitle')}
            description={t('aiAssistant.emptyDescription')}
          />
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                data-testid={`ai-message-${msg.id}`}
                data-role={msg.role}
                className={cn(
                  'flex flex-col gap-2 max-w-[92%] sm:max-w-[85%] rounded-2xl p-4',
                  isUser
                    ? 'self-end bg-primary text-on-primary rounded-br-xs'
                    : 'self-start bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-bl-xs shadow-2xs w-full',
                )}
              >
                {msg.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={msg.imageUrl}
                    alt={t('aiAssistant.imagePreviewAlt')}
                    data-testid={`ai-message-image-${msg.id}`}
                    className="max-h-56 w-auto rounded-xl object-contain border border-outline-variant/30"
                  />
                )}
                <p className="text-body-md whitespace-pre-wrap">{msg.content}</p>
                {msg.draft && (
                  <AiScheduleDraftCard messageId={msg.id} draft={msg.draft} />
                )}
              </div>
            );
          })
        )}
      </Card>

      {/* Image Validation Error Banner */}
      {imageErrorKey && (
        <div
          data-testid="ai-image-error"
          role="alert"
          className="flex items-center justify-between gap-2 rounded-xl bg-error-container px-4 py-2.5 text-body-sm font-medium text-on-error-container"
        >
          <span>{t(imageErrorKey)}</span>
          <IconButton
            icon="close"
            size="sm"
            aria-label={t('common.actions.close')}
            onClick={() => setImageErrorKey(null)}
          />
        </div>
      )}

      {/* Selected Image Preview */}
      {imagePreviewUrl && (
        <div
          data-testid="ai-image-preview"
          className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/40 bg-surface-container p-2.5"
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreviewUrl}
              alt={t('aiAssistant.imagePreviewAlt')}
              className="size-14 rounded-lg object-cover border border-outline-variant/30"
            />
            <span className="text-body-sm text-on-surface-variant">
              {selectedImage?.name ?? t('aiAssistant.attachImage')}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon="close"
            data-testid="ai-remove-image-button"
            aria-label={t('aiAssistant.removeImage')}
            onClick={handleRemoveImage}
          >
            {t('aiAssistant.removeImage')}
          </Button>
        </div>
      )}

      {/* Composer Form */}
      <form
        data-testid="ai-composer-form"
        onSubmit={handleSend}
        className="flex flex-col gap-2 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-3 shadow-xs"
      >
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            data-testid="ai-image-input"
            onChange={handleSelectFile}
            className="sr-only"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon="image"
            data-testid="ai-attach-image-button"
            aria-label={t('aiAssistant.attachImage')}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('aiAssistant.attachImage')}
          </Button>

          <input
            type="text"
            data-testid="ai-message-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('aiAssistant.inputPlaceholder')}
            className="flex-1 rounded-xl border border-outline-variant/40 bg-surface px-3.5 py-2.5 text-body-md text-on-surface outline-none focus:border-primary"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            data-testid="ai-send-button"
            disabled={
              sendMessage.isPending ||
              (!inputText.trim() && !selectedImage && !imagePreviewUrl)
            }
          >
            {sendMessage.isPending ? t('aiAssistant.sending') : t('aiAssistant.sendButton')}
          </Button>
        </div>
        <p className="text-label-xs text-on-surface-variant px-1">
          {t('aiAssistant.imageHint')}
        </p>
      </form>
    </div>
  );
}
