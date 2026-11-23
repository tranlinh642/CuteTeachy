'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation, type TranslationKey } from '@/lib/i18n';
import { Button, Card, EmptyState, Icon, IconButton } from '@/components/ui';
import { useMobileKeyboard } from '@/hooks/use-mobile-keyboard';
import { cn } from '@/utils/cn';
import {
  compressAiTimetableImage,
  MAX_AI_SOURCE_BYTES,
  MAX_AI_UPLOAD_BYTES,
} from '@/utils/image-resize';
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

function revokeObjectUrlIfBlob(url: string | null) {
  if (
    url &&
    url.startsWith('blob:') &&
    typeof URL !== 'undefined' &&
    typeof URL.revokeObjectURL === 'function'
  ) {
    URL.revokeObjectURL(url);
  }
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
  const { isKeyboardOpen } = useMobileKeyboard();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const previewUrlRef = useRef<string | null>(initialImagePreviewUrl);
  const [inputText, setInputText] = useState(initialInputText);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initialImagePreviewUrl,
  );
  const [imageErrorKey, setImageErrorKey] = useState<TranslationKey | null>(
    initialImageErrorKey,
  );
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [sendErrorKey, setSendErrorKey] = useState<TranslationKey | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<{
    readonly text: string;
    readonly hasImage: boolean;
  } | null>(null);

  useEffect(() => {
    return () => {
      revokeObjectUrlIfBlob(previewUrlRef.current);
    };
  }, []);

  const updateImagePreviewUrl = (nextUrl: string | null) => {
    if (previewUrlRef.current && previewUrlRef.current !== nextUrl) {
      revokeObjectUrlIfBlob(previewUrlRef.current);
    }
    previewUrlRef.current = nextUrl;
    setImagePreviewUrl(nextUrl);
  };

  const messages = messagesData?.items ?? [];

  useEffect(() => {
    if (typeof messageEndRef.current?.scrollIntoView === 'function') {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, pendingPrompt, isKeyboardOpen]);

  const handleSelectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!(ALLOWED_AI_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setImageErrorKey('aiAssistant.imageUnsupportedType');
      setSelectedImage(null);
      updateImagePreviewUrl(null);
      return;
    }

    if (file.size > MAX_AI_SOURCE_BYTES) {
      setImageErrorKey('aiAssistant.imageTooLarge');
      setSelectedImage(null);
      updateImagePreviewUrl(null);
      return;
    }

    setImageErrorKey(null);
    setIsPreparingImage(true);
    try {
      const optimized = await compressAiTimetableImage(file);
      if (optimized.size > MAX_AI_UPLOAD_BYTES) {
        setImageErrorKey('aiAssistant.imageTooLarge');
        setSelectedImage(null);
        updateImagePreviewUrl(null);
        return;
      }

      setSelectedImage(optimized);
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        updateImagePreviewUrl(URL.createObjectURL(optimized));
      }
    } finally {
      setIsPreparingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    updateImagePreviewUrl(null);
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

    const imageToSend = selectedImage;
    const hadImage = Boolean(imageToSend || imagePreviewUrl);

    setSendErrorKey(null);
    setPendingPrompt({
      text: trimmed || t('aiAssistant.attachImage'),
      hasImage: hadImage,
    });
    setInputText('');
    handleRemoveImage();

    try {
      await sendMessage.mutateAsync({
        message: trimmed || undefined,
        image: imageToSend,
      });
    } catch (err) {
      setInputText(trimmed);
      if (imageToSend) {
        setSelectedImage(imageToSend);
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          updateImagePreviewUrl(URL.createObjectURL(imageToSend));
        }
      }
      const isFileTooLarge =
        err && typeof err === 'object' && 'code' in err && err.code === 'file_too_large';
      const key = isFileTooLarge
        ? ('aiAssistant.imageTooLarge' as TranslationKey)
        : err && typeof err === 'object' && 'messageKey' in err && typeof err.messageKey === 'string'
          ? (err.messageKey as TranslationKey)
          : ('errors.generic' as TranslationKey);
      setSendErrorKey(key);
    } finally {
      setPendingPrompt(null);
    }
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (sendMessage.isPending) return;
    setSendErrorKey(null);
    setPendingPrompt({ text: promptText, hasImage: false });
    try {
      await sendMessage.mutateAsync({ message: promptText });
    } catch (err) {
      const key =
        err && typeof err === 'object' && 'messageKey' in err && typeof err.messageKey === 'string'
          ? (err.messageKey as TranslationKey)
          : ('errors.generic' as TranslationKey);
      setSendErrorKey(key);
    } finally {
      setPendingPrompt(null);
    }
  };

  const activeSendErrorKey: TranslationKey | null =
    sendErrorKey ??
    (sendMessage.isError
      ? ((sendMessage.error &&
        typeof sendMessage.error === 'object' &&
        'messageKey' in sendMessage.error &&
        typeof sendMessage.error.messageKey === 'string'
          ? sendMessage.error.messageKey
          : 'errors.generic') as TranslationKey)
      : null);

  return (
    <div
      data-testid="ai-assistant-view"
      className={cn(
        'flex flex-col w-full',
        compact
          ? 'gap-4 max-h-[75dvh]'
          : 'flex-1 min-h-0 max-w-4xl mx-auto gap-0 md:gap-4',
      )}
    >
      {/* Header (only in full-page mode; auto-collapses on mobile when keyboard is open to maximize chat area) */}
      {!compact && (
        <header
          className={cn(
            'shrink-0 flex items-center justify-between gap-2 px-3.5 py-2 md:px-0 md:py-0',
            isKeyboardOpen && 'hidden md:flex',
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-8 md:size-10 shrink-0 items-center justify-center rounded-xl md:rounded-2xl bg-primary-container text-on-primary-container">
                <Icon name="spa" size={20} />
              </span>
              <h1 className="text-title-lg md:text-display-md font-bold text-on-surface truncate">
                {t('aiAssistant.title')}
              </h1>
            </div>
            <p
              className={cn(
                'text-body-sm md:text-body-md text-on-surface-variant mt-0.5',
                messages.length > 0 && 'hidden md:block',
              )}
            >
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
              className="shrink-0 whitespace-nowrap"
              disabled={clearMessages.isPending}
              onClick={() => clearMessages.mutate()}
            >
              {t('aiAssistant.clearHistory')}
            </Button>
          )}
        </header>
      )}

      {/* Quick Prompt Chips (horizontal single-row scroll on mobile, auto-hidden when keyboard is open) */}
      <div
        data-testid="ai-quick-prompts"
        aria-label={t('aiAssistant.quickPromptsLabel')}
        className={cn(
          'shrink-0 flex items-center gap-2',
          compact
            ? 'flex-wrap'
            : cn(
                'overflow-x-auto no-scrollbar flex-nowrap px-3.5 pb-2 md:px-0 md:pb-0 md:flex-wrap',
                isKeyboardOpen && 'hidden md:flex',
              ),
        )}
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
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-low px-3.5 py-1.5 text-body-sm font-medium text-on-surface hover:bg-primary-container/40 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Icon name="spa" size={16} className="text-primary shrink-0" />
              <span>{text}</span>
            </button>
          );
        })}
      </div>

      {/* Message List */}
      <Card
        data-testid="ai-message-list"
        className={cn(
          'flex flex-col gap-3.5 overflow-y-auto overscroll-contain bg-surface-container-low',
          compact
            ? 'min-h-64 max-h-96 p-3.5 sm:p-6'
            : 'flex-1 min-h-0 rounded-none border-x-0 border-b-0 md:rounded-2xl md:border p-3.5 sm:p-6',
        )}
      >
        {!isLoading && messages.length === 0 && !pendingPrompt ? (
          <EmptyState
            icon="spa"
            title={t('aiAssistant.emptyTitle')}
            description={t('aiAssistant.emptyDescription')}
          />
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  data-testid={`ai-message-${msg.id}`}
                  data-role={msg.role}
                  className={cn(
                    'flex flex-col gap-2 max-w-[92%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4',
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
                  <p className="text-body-md whitespace-pre-wrap break-words">{msg.content}</p>
                  {msg.draft && (
                    <AiScheduleDraftCard messageId={msg.id} draft={msg.draft} />
                  )}
                </div>
              );
            })}

            {pendingPrompt && (
              <>
                <div
                  data-testid="ai-pending-user-message"
                  className="flex flex-col gap-1.5 max-w-[92%] sm:max-w-[85%] self-end rounded-2xl rounded-br-xs bg-primary/90 text-on-primary p-3.5 sm:p-4"
                >
                  <p className="text-body-md whitespace-pre-wrap break-words">{pendingPrompt.text}</p>
                </div>

                <div
                  role="status"
                  aria-live="polite"
                  data-testid="ai-thinking-indicator"
                  className="self-start w-full max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-bl-xs bg-surface-container-lowest border border-primary/25 p-3.5 sm:p-4 shadow-xs flex flex-col gap-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container animate-pulse">
                      <Icon name="spa" size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-body-sm font-bold text-primary">
                          {t('aiAssistant.thinkingTitle')}
                        </span>
                        <span className="inline-flex items-center gap-1" aria-hidden="true">
                          <span
                            className="ai-thinking-dot size-1.5 rounded-full bg-primary"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="ai-thinking-dot size-1.5 rounded-full bg-primary"
                            style={{ animationDelay: '160ms' }}
                          />
                          <span
                            className="ai-thinking-dot size-1.5 rounded-full bg-primary"
                            style={{ animationDelay: '320ms' }}
                          />
                        </span>
                      </div>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">
                        {pendingPrompt.hasImage
                          ? t('aiAssistant.thinkingWithImage')
                          : t('aiAssistant.thinkingSubtitle')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 pl-10" aria-hidden="true">
                    <div className="h-2.5 w-4/5 rounded-full bg-primary-container/45 animate-pulse" />
                    <div className="h-2.5 w-3/5 rounded-full bg-primary-container/30 animate-pulse" />
                  </div>
                </div>
              </>
            )}
            <div ref={messageEndRef} />
          </>
        )}
      </Card>

      {/* Composer Dock: sát khít với thanh điều hướng dưới khi đóng bàn phím, và sát trực tiếp trên bàn phím khi đang gõ */}
      <div
        className={cn(
          'shrink-0 flex flex-col gap-2',
          !compact && 'bg-surface-container-lowest border-t border-outline-variant/40 px-3 py-2 md:bg-transparent md:border-0 md:p-0',
        )}
      >
        {/* Send Message Error Banner */}
        {activeSendErrorKey && (
          <div
            data-testid="ai-send-error"
            role="alert"
            className="flex items-center justify-between gap-2 rounded-xl bg-error-container px-4 py-2 text-body-sm font-medium text-on-error-container"
          >
            <span>{t(activeSendErrorKey)}</span>
            <IconButton
              icon="close"
              size="sm"
              aria-label={t('common.actions.close')}
              onClick={() => {
                setSendErrorKey(null);
                sendMessage.reset();
              }}
            />
          </div>
        )}

        {/* Image Validation Error Banner */}
        {imageErrorKey && (
          <div
            data-testid="ai-image-error"
            role="alert"
            className="flex items-center justify-between gap-2 rounded-xl bg-error-container px-4 py-2 text-body-sm font-medium text-on-error-container"
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
        {isPreparingImage && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container px-3 py-2 text-body-sm text-on-surface-variant"
          >
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin"
            />
            <span>{t('aiAssistant.imagePreparing')}</span>
          </div>
        )}

        {imagePreviewUrl && (
          <div
            data-testid="ai-image-preview"
            className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/40 bg-surface-container p-2"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreviewUrl}
                alt={t('aiAssistant.imagePreviewAlt')}
                className="size-12 rounded-lg object-cover border border-outline-variant/30 shrink-0"
              />
              <span className="text-body-sm text-on-surface-variant truncate">
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
              className="shrink-0"
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
          className={cn(
            'flex flex-col gap-1.5',
            compact
              ? 'rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-2.5 sm:p-3 shadow-xs'
              : 'md:rounded-2xl md:border md:border-outline-variant/40 md:bg-surface-container-lowest md:p-3 md:shadow-xs',
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              data-testid="ai-image-input"
              onChange={handleSelectFile}
              className="sr-only"
            />
            <button
              type="button"
              data-testid="ai-attach-image-button"
              aria-label={t('aiAssistant.attachImage')}
              title={t('aiAssistant.attachImage')}
              disabled={sendMessage.isPending || isPreparingImage}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 w-11 sm:w-auto sm:px-4 shrink-0 items-center justify-center sm:gap-1.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim text-body-sm font-bold whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <Icon name="image" size={18} />
              <span className="hidden sm:inline">{t('aiAssistant.attachImage')}</span>
            </button>

            <input
              type="text"
              data-testid="ai-message-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sendMessage.isPending}
              placeholder={t('aiAssistant.inputPlaceholder')}
              className="h-11 min-w-0 flex-1 rounded-full border border-outline-variant/40 bg-surface px-4 text-body-md text-on-surface outline-none focus:border-primary disabled:opacity-60"
            />

            <button
              type="submit"
              data-testid="ai-send-button"
              aria-label={t('aiAssistant.sendButton')}
              aria-busy={sendMessage.isPending || undefined}
              disabled={
                sendMessage.isPending ||
                isPreparingImage ||
                (!inputText.trim() && !selectedImage && !imagePreviewUrl)
              }
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary-container text-on-primary-container shadow-sm hover:bg-primary-fixed-dim px-4 sm:px-5 text-body-sm font-bold whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {sendMessage.isPending ? (
                <>
                  <span
                    aria-hidden="true"
                    className="size-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
                  />
                  <span className="hidden sm:inline">{t('aiAssistant.sending')}</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">{t('aiAssistant.sendShort')}</span>
                  <span className="hidden sm:inline">{t('aiAssistant.sendButton')}</span>
                </>
              )}
            </button>
          </div>
          <p
            className={cn(
              'text-label-xs text-on-surface-variant px-1',
              isKeyboardOpen && 'hidden md:block',
            )}
          >
            {t('aiAssistant.imageHint')}
          </p>
        </form>
      </div>
    </div>
  );
}
