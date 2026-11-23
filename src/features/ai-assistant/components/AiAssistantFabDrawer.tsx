'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Dialog, Icon } from '@/components/ui';
import { cn } from '@/utils/cn';
import { AiAssistantView } from './AiAssistantView';

export interface AiAssistantFabDrawerProps {
  readonly defaultOpen?: boolean;
  readonly className?: string;
}

export function AiAssistantFabDrawer({
  defaultOpen = false,
  className,
}: AiAssistantFabDrawerProps = {}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <button
        type="button"
        data-testid="ai-assistant-fab"
        aria-label={t('aiAssistant.fabLabel')}
        onClick={() => setOpen(true)}
        className={cn(
          'group bg-primary text-on-primary fixed right-4 bottom-20 md:right-8 md:bottom-8 z-30 inline-flex items-center gap-2 rounded-full px-4 py-3.5 shadow-lg cursor-pointer',
          'transition-[translate,box-shadow] duration-200 hover:-translate-y-1',
          className,
        )}
      >
        <Icon name="spa" size={22} />
        <span className="text-label-lg font-bold">{t('aiAssistant.fabLabel')}</span>
      </button>

      {open && (
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title={t('aiAssistant.drawerTitle')}
          description={t('aiAssistant.drawerDescription')}
          size="lg"
        >
          <AiAssistantView compact />
        </Dialog>
      )}
    </>
  );
}
