/**
 * Semantic icon names shared by web and mobile.
 *
 * Each platform's `<Icon name="…" />` maps these to Material Symbols
 * (web: Material Symbols Rounded font, mobile: @expo/vector-icons MaterialIcons),
 * so features never depend on a specific icon library.
 */
export const iconNames = [
  'add',
  'arrowBack',
  'bell',
  'calendar',
  'check',
  'checklist',
  'chevronDown',
  'chevronLeft',
  'chevronRight',
  'clock',
  'close',
  'delete',
  'edit',
  'email',
  'flag',
  'home',
  'image',
  'language',
  'lock',
  'logout',
  'menu',
  'notes',
  'palette',
  'person',
  'print',
  'quote',
  'school',
  'search',
  'settings',
  'spa',
  'tag',
  'task',
  'visibility',
  'visibilityOff',
] as const;

export type IconName = (typeof iconNames)[number];
