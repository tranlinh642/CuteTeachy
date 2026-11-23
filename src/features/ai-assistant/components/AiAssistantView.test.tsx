import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { ServicesContext } from '@/lib/api/services-context';
import { queryKeys } from '@/lib/query';
import type { Services } from '@/lib/api';
import type { AiChatMessage, ListAiChatMessagesResponse } from '@/types';
import { AppShell } from '@/components/layout';
import { TimetableManagementView } from '@/features/timetable';
import {
  AiAssistantView,
  MAX_AI_IMAGE_BYTES,
  validateAiImageFile,
} from './AiAssistantView';
import { AiAssistantFabDrawer } from './AiAssistantFabDrawer';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/assistant',
}));

vi.mock('@/components/ui/Dialog', () => ({
  Dialog: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="ai-drawer-dialog" data-title={title}>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

describe('AiAssistantView & AiAssistantFabDrawer (SPEC-007 S7-FE-02)', () => {
  const sampleMessages: AiChatMessage[] = [
    {
      id: 'msg-user-1',
      role: 'user',
      content: 'Thêm lịch dạy thêm Toán 9A tối Thứ 3, Thứ 5 18:00-19:30',
      imageUrl: 'https://storage.cuteteachy.vn/ai-chat/tkb-sample.png',
      createdAt: '2026-10-29T08:00:00.000Z',
    },
    {
      id: 'msg-ai-1',
      role: 'assistant',
      content: 'Tôi đã chuẩn bị bản nháp gồm 1 mục lịch dạy thêm cho bạn.',
      draft: {
        status: 'pending',
        items: [
          {
            id: 'draft-1',
            kind: 'timetable_slot',
            category: 'extra_teaching',
            titleOrSubject: 'Toán 9A',
            grade: '9A',
            room: 'P.201',
            weekday: 2,
            startTime: '18:00',
            endTime: '19:30',
            conflict: null,
          },
        ],
      },
      createdAt: '2026-10-29T08:00:02.000Z',
    },
  ];

  const createTestHarness = (messages: AiChatMessage[] = sampleMessages) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const listData: ListAiChatMessagesResponse = { items: messages };
    queryClient.setQueryData(queryKeys.aiAssistant.messages(), listData);

    const mockServices = {
      aiAssistant: {
        listMessages: vi.fn().mockResolvedValue(listData),
        sendMessage: vi.fn(),
        applyDraft: vi.fn(),
        clearMessages: vi.fn(),
      },
      notifications: {
        list: vi.fn().mockResolvedValue({ items: [], unreadCount: 0 }),
        markRead: vi.fn(),
        markAllRead: vi.fn(),
      },
    } as unknown as Services;

    return { queryClient, mockServices };
  };

  const renderAssistant = (
    props: React.ComponentProps<typeof AiAssistantView> = {},
    messages: AiChatMessage[] = sampleMessages,
    locale: 'vi' | 'en' = 'vi',
  ) => {
    const { queryClient, mockServices } = createTestHarness(messages);

    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ServicesContext.Provider value={mockServices}>
          <I18nProvider locale={locale}>
            <AiAssistantView {...props} />
          </I18nProvider>
        </ServicesContext.Provider>
      </QueryClientProvider>,
    );
  };

  it('renders chat messages, attached image, embedded AiScheduleDraftCard, and quick prompt chips', () => {
    const html = renderAssistant();

    expect(html).toContain('Trợ lý AI');
    // Quick prompt chips
    expect(html).toContain('data-testid="ai-quick-prompts"');
    expect(html).toContain('Hôm nay tôi có lịch gì?');
    expect(html).toContain('Liệt kê việc trong tuần này');
    expect(html).toContain('Thêm lịch dạy thêm Toán 9A tối Thứ 3, Thứ 5 18:00-19:30');

    // Messages and draft card
    expect(html).toContain('data-testid="ai-message-msg-user-1"');
    expect(html).toContain('data-testid="ai-message-image-msg-user-1"');
    expect(html).toContain('data-testid="ai-message-msg-ai-1"');
    expect(html).toContain('data-testid="ai-draft-card-msg-ai-1"');
    expect(html).toContain('Toán 9A');

    // Composer controls
    expect(html).toContain('data-testid="ai-image-input"');
    expect(html).toContain('data-testid="ai-attach-image-button"');
    expect(html).toContain('data-testid="ai-message-input"');
    expect(html).toContain('data-testid="ai-send-button"');
  });

  it('validates timetable image files (JPEG/PNG/WebP <= 5MB) and renders image preview and error states', () => {
    // Valid JPEG, PNG, WebP <= 5MB
    expect(validateAiImageFile({ size: 1024, type: 'image/jpeg' }).valid).toBe(true);
    expect(validateAiImageFile({ size: MAX_AI_IMAGE_BYTES, type: 'image/png' }).valid).toBe(true);
    expect(validateAiImageFile({ size: 2048, type: 'image/webp' }).valid).toBe(true);

    // Invalid size (> 5MB)
    const tooLarge = validateAiImageFile({ size: MAX_AI_IMAGE_BYTES + 1, type: 'image/png' });
    expect(tooLarge.valid).toBe(false);
    expect(tooLarge.error).toBe('file_too_large');
    expect(tooLarge.errorKey).toBe('aiAssistant.imageTooLarge');

    // Invalid format
    const badFormat = validateAiImageFile({ size: 1024, type: 'application/pdf' });
    expect(badFormat.valid).toBe(false);
    expect(badFormat.error).toBe('unsupported_file_type');
    expect(badFormat.errorKey).toBe('aiAssistant.imageUnsupportedType');

    // Renders preview with remove button when imagePreviewUrl is present
    const previewHtml = renderAssistant({
      initialImagePreviewUrl: 'blob:http://localhost/preview-tkb',
    });
    expect(previewHtml).toContain('data-testid="ai-image-preview"');
    expect(previewHtml).toContain('data-testid="ai-remove-image-button"');

    // Renders validation error alert when imageErrorKey is set
    const errorHtml = renderAssistant({
      initialImageErrorKey: 'aiAssistant.imageTooLarge',
    });
    expect(errorHtml).toContain('data-testid="ai-image-error"');
    expect(errorHtml).toContain('Ảnh vượt quá dung lượng tối đa 5MB');
  });

  it('renders AiAssistantFabDrawer button and opens drawer containing AiAssistantView', () => {
    const { queryClient, mockServices } = createTestHarness();

    const closedHtml = renderToStaticMarkup(
      <I18nProvider locale="vi">
        <AiAssistantFabDrawer />
      </I18nProvider>,
    );
    expect(closedHtml).toContain('data-testid="ai-assistant-fab"');
    expect(closedHtml).toContain('Mở Trợ lý AI');
    expect(closedHtml).not.toContain('data-testid="ai-drawer-dialog"');

    const openHtml = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ServicesContext.Provider value={mockServices}>
          <I18nProvider locale="vi">
            <AiAssistantFabDrawer defaultOpen={true} />
          </I18nProvider>
        </ServicesContext.Provider>
      </QueryClientProvider>,
    );
    expect(openHtml).toContain('data-testid="ai-drawer-dialog"');
    expect(openHtml).toContain('Trợ lý AI thông minh');
    expect(openHtml).toContain('data-testid="ai-quick-prompts"');
  });

  it('includes /assistant navigation link inside AppShell and FAB on TimetableManagementView', () => {
    const { queryClient, mockServices } = createTestHarness();
    const shellHtml = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ServicesContext.Provider value={mockServices}>
          <I18nProvider locale="vi">
            <AppShell>
              <div>Trang Trợ lý AI</div>
            </AppShell>
          </I18nProvider>
        </ServicesContext.Provider>
      </QueryClientProvider>,
    );

    expect(shellHtml).toContain('href="/assistant"');
    expect(shellHtml).toContain('Trợ lý AI');

    const httpClient = createHttpClient({ mode: 'mock' });
    const services = createServices(httpClient);
    queryClient.setQueryData(queryKeys.timetableSlots.list(), []);

    const timetableHtml = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ServicesContext.Provider value={services}>
          <I18nProvider locale="vi">
            <TimetableManagementView />
          </I18nProvider>
        </ServicesContext.Provider>
      </QueryClientProvider>,
    );
    expect(timetableHtml).toContain('data-testid="ai-assistant-fab"');
  });
});
