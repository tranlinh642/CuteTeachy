'use client';

import { useTranslation } from '@/lib/i18n';
import { env, isMockApi } from '@/config';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { cn } from '@/utils/cn';
import { useRouter } from 'next/navigation';
import { GoogleIcon } from './GoogleIcon';
import { saveOAuthRemember } from '../utils/oauth-storage';

export const MOCK_GOOGLE_CODE = 'mock-google-code';

export interface BuildGoogleAuthUrlOptions {
  readonly apiUrl?: string;
  readonly remember?: boolean;
  readonly isMock?: boolean;
}

export function buildGoogleAuthUrl({
  apiUrl = env.apiUrl,
  remember = true,
  isMock = isMockApi,
}: BuildGoogleAuthUrlOptions = {}): string {
  if (isMock) {
    return `/auth/callback?code=${MOCK_GOOGLE_CODE}`;
  }
  const cleanApiUrl = apiUrl.replace(/\/+$/, '');
  const baseEndpoint = ENDPOINTS.auth.google.replace(/^\/+/, '');
  const url = `${cleanApiUrl}/${baseEndpoint}`;
  return `${url}?remember=${remember}`;
}

export interface GoogleLoginButtonProps {
  readonly remember?: boolean;
  readonly className?: string;
  readonly fullWidth?: boolean;
}

/**
 * Nút "Tiếp tục với Google" tuân thủ Google Brand Guidelines:
 * - Logo Google "G" chuẩn đa màu
 * - Vùng chạm ≥ 44px (`min-h-12`)
 * - Nhãn `aria-label` đầy đủ cho công nghệ trợ năng
 * - Lưu lựa chọn `remember` vào storage trước khi điều hướng
 * - Hỗ trợ chế độ mock (đi thẳng vào /auth/callback?code=mock-google-code)
 */
export function GoogleLoginButton({
  remember = true,
  className,
  fullWidth = true,
}: GoogleLoginButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const label = t('auth.google.button');
  const targetUrl = buildGoogleAuthUrl({ remember });

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    saveOAuthRemember(remember);
    if (isMockApi) {
      event.preventDefault();
      router.push(targetUrl);
    }
  };

  return (
    <a
      href={targetUrl}
      onClick={handleClick}
      aria-label={label}
      className={cn(
        'min-h-12 px-6 rounded-full font-medium transition-colors duration-200',
        'bg-surface-container-lowest text-on-surface border border-outline-variant/80',
        'hover:bg-surface-container-low hover:border-outline shadow-xs',
        'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'inline-flex items-center justify-center gap-3',
        fullWidth && 'w-full',
        className,
      )}
    >
      <GoogleIcon size={20} />
      <span className="text-body-lg text-on-surface font-medium">{label}</span>
    </a>
  );
}
