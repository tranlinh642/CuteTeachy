import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import type { ColorValue, StyleProp, TextStyle } from 'react-native';
import type { IconName } from '@cute-teachy/tokens';
import { colors } from '@/theme';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Tên icon ngữ nghĩa (dùng chung web/mobile) → glyph MaterialIcons. */
const ICON_GLYPHS: Readonly<Record<IconName, MaterialIconName>> = {
  add: 'add',
  arrowBack: 'arrow-back',
  bell: 'notifications-none',
  calendar: 'calendar-today',
  check: 'check',
  checklist: 'checklist',
  chevronDown: 'expand-more',
  chevronLeft: 'chevron-left',
  chevronRight: 'chevron-right',
  clock: 'schedule',
  close: 'close',
  delete: 'delete-outline',
  edit: 'edit',
  email: 'mail-outline',
  flag: 'flag',
  home: 'home',
  image: 'image',
  language: 'language',
  lock: 'lock-outline',
  logout: 'logout',
  menu: 'menu',
  notes: 'description',
  palette: 'palette',
  person: 'person-outline',
  print: 'print',
  quote: 'format-quote',
  school: 'school',
  search: 'search',
  settings: 'settings',
  spa: 'spa',
  tag: 'label-outline',
  task: 'task-alt',
  visibility: 'visibility',
  visibilityOff: 'visibility-off',
};

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: ColorValue;
  readonly style?: StyleProp<TextStyle>;
}

/** Icon trang trí – ẩn khỏi trình đọc màn hình; nút bấm tự mang accessibilityLabel. */
export function Icon({ name, size = 24, color = colors.onSurfaceVariant, style }: IconProps) {
  return (
    <MaterialIcons
      name={ICON_GLYPHS[name]}
      size={size}
      color={color}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
