import type { IconName } from '@/lib/theme';
import { cn } from '@/utils/cn';

/** Tên icon ngữ nghĩa → ligature Material Symbols Rounded. */
const MATERIAL_SYMBOLS: Readonly<Record<IconName, string>> = {
  add: 'add',
  arrowBack: 'arrow_back',
  bell: 'notifications',
  calendar: 'calendar_today',
  check: 'check',
  checklist: 'checklist',
  chevronDown: 'expand_more',
  chevronLeft: 'chevron_left',
  chevronRight: 'chevron_right',
  clock: 'schedule',
  close: 'close',
  delete: 'delete',
  edit: 'edit',
  email: 'mail',
  flag: 'flag',
  home: 'home',
  image: 'image',
  language: 'language',
  lock: 'lock',
  logout: 'logout',
  menu: 'menu',
  notes: 'description',
  palette: 'palette',
  person: 'person',
  print: 'print',
  quote: 'format_quote',
  school: 'school',
  search: 'search',
  settings: 'settings',
  spa: 'spa',
  tag: 'sell',
  task: 'task_alt',
  visibility: 'visibility',
  visibilityOff: 'visibility_off',
};

export interface IconProps {
  readonly name: IconName;
  /** Kích thước px (mặc định 24). */
  readonly size?: number;
  /** Dùng biến thể tô đầy (FILL 1). */
  readonly filled?: boolean;
  /** Nếu có, icon mang nghĩa (role="img"); nếu không, icon chỉ trang trí. */
  readonly label?: string;
  readonly className?: string;
}

export function Icon({ name, size = 24, filled = false, label, className }: IconProps) {
  return (
    <span
      className={cn('material-symbols-rounded inline-flex shrink-0 items-center justify-center', className)}
      style={{
        fontSize: size,
        width: size,
        height: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 500, 'opsz' ${Math.min(48, Math.max(20, size))}`,
      }}
      translate="no"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {MATERIAL_SYMBOLS[name]}
    </span>
  );
}
