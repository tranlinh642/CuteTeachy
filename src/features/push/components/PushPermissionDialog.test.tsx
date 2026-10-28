import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import type { Locale } from '@/types';
import { PushPermissionDialog } from './PushPermissionDialog';

vi.mock('@/components/ui/Dialog', () => ({
  Dialog: ({
    open,
    title,
    children,
    footer,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="dialog" data-title={title}>
        <h1>{title}</h1>
        <div data-testid="dialog-body">{children}</div>
        <div data-testid="dialog-footer">{footer}</div>
      </div>
    ) : null,
}));

describe('PushPermissionDialog Component', () => {
  const renderDialog = (props: React.ComponentProps<typeof PushPermissionDialog>, locale: Locale = 'vi') => {
    return renderToStaticMarkup(
      <I18nProvider defaultLocale={locale}>
        <PushPermissionDialog {...props} />
      </I18nProvider>,
    );
  };

  it('renders nothing when open is false', () => {
    const html = renderDialog({
      open: false,
      step: 'explanation',
      onClose: vi.fn(),
      onConfirm: vi.fn(),
    });
    expect(html).toBe('');
  });

  describe('Step: explanation', () => {
    it('renders explanation title, description, and action buttons in Vietnamese', () => {
      const html = renderDialog({
        open: true,
        step: 'explanation',
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      });

      expect(html).toContain('Bật thông báo nhắc việc');
      expect(html).toContain('CuteTeachy sẽ gửi thông báo nhắc bạn trước khi đến giờ tiết dạy hoặc việc cần làm');
      expect(html).toContain('Nhắc trước giờ tiết dạy theo thời khoá biểu');
      expect(html).toContain('Nhắc công việc có giờ hẹn (Task) đúng lúc');
      expect(html).toContain('Bật thông báo ngay');
      expect(html).toContain('Để sau');
    });

    it('renders explanation in English when locale is en', () => {
      const html = renderDialog(
        {
          open: true,
          step: 'explanation',
          onClose: vi.fn(),
          onConfirm: vi.fn(),
        },
        'en',
      );

      expect(html).toContain('Enable Reminders');
      expect(html).toContain('CuteTeachy sends timely notifications');
      expect(html).toContain('Reminders before teaching sessions on your timetable');
      expect(html).toContain('Timely reminders for scheduled tasks');
      expect(html).toContain('Enable Notifications');
      expect(html).toContain('Not now');
    });

    it('renders error message when error prop is provided', () => {
      const html = renderDialog({
        open: true,
        step: 'explanation',
        error: 'Network error occurred',
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      });

      expect(html).toContain('Network error occurred');
      expect(html).toContain('role="alert"');
    });
  });

  describe('Step: ios_guide', () => {
    it('renders iOS standalone requirement instructions', () => {
      const html = renderDialog({
        open: true,
        step: 'ios_guide',
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      });

      expect(html).toContain('Thêm vào Màn hình chính trước');
      expect(html).toContain('Trên thiết bị iOS (iPhone/iPad)');
      expect(html).toContain('Nhấn nút Chia sẻ (biểu tượng mũi tên hướng lên) trên trình duyệt Safari');
      expect(html).toContain('Đã hiểu');
      expect(html).not.toContain('Bật thông báo ngay');
    });
  });

  describe('Step: denied_guide', () => {
    it('renders browser settings guidance when permission was denied', () => {
      const html = renderDialog({
        open: true,
        step: 'denied_guide',
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      });

      expect(html).toContain('Thông báo đang bị chặn');
      expect(html).toContain('Trình duyệt đang chặn quyền thông báo của CuteTeachy');
      expect(html).toContain('Bấm vào biểu tượng ổ khoá hoặc cài đặt trang web trên thanh địa chỉ');
      expect(html).toContain('Đã hiểu');
      expect(html).not.toContain('Bật thông báo ngay');
    });
  });
});
