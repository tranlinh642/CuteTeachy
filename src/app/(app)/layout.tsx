import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout';
import { AuthGuard, LogoutButton, UserGreeting } from '@/features/auth';
import { PushNotificationPrompt } from '@/features/push';

export interface AppLayoutProps {
  readonly children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthGuard>
      <AppShell
        topbarTitle={<UserGreeting />}
        sidebarFooter={<LogoutButton appearance="sidebar" />}
      >
        {children}
        <PushNotificationPrompt />
      </AppShell>
    </AuthGuard>
  );
}
