import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@cute-teachy/i18n';
import { colors, radius, shadowStyles, spacing } from '@/theme';
import { IconButton } from './IconButton';
import { Typography } from './Typography';

export type SheetPlacement = 'bottom' | 'center';

export interface SheetSurfaceProps {
  readonly title?: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** Thanh hành động cố định phía dưới (Hủy / Lưu). */
  readonly footer?: ReactNode;
  readonly placement?: SheetPlacement;
  /** Tắt cuộn khi nội dung tự quản lý (ví dụ picker có ScrollView riêng). */
  readonly scrollable?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Lớp phủ + bề mặt bottom sheet / dialog (không tự mở Modal).
 * Dùng trực tiếp trong route `presentation: 'transparentModal'`, hoặc qua `BottomSheet`.
 */
export function SheetSurface({
  title,
  onClose,
  children,
  footer,
  placement = 'bottom',
  scrollable = true,
  style,
}: SheetSurfaceProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isBottom = placement === 'bottom';

  return (
    <KeyboardAvoidingView
      style={[styles.root, isBottom ? styles.rootBottom : styles.rootCenter]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.actions.close')}
      >
        <View style={styles.backdrop} />
      </Pressable>

      <View
        style={[
          styles.surface,
          isBottom ? styles.surfaceBottom : styles.surfaceCenter,
          isBottom && { paddingBottom: Math.max(insets.bottom, spacing[4]) },
          style,
        ]}
        accessibilityViewIsModal
      >
        <View style={styles.header}>
          {title ? (
            <Typography variant="titleLg" accessibilityRole="header" style={styles.title}>
              {title}
            </Typography>
          ) : (
            <View style={styles.title} />
          )}
          <IconButton icon="close" accessibilityLabel={t('common.actions.close')} onPress={onClose} />
        </View>

        {scrollable ? (
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.body, styles.bodyContent]}>{children}</View>
        )}

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootBottom: {
    justifyContent: 'flex-end',
  },
  rootCenter: {
    justifyContent: 'center',
    padding: spacing[5],
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    opacity: 0.4,
  },
  surface: {
    backgroundColor: colors.surface,
    maxHeight: '92%',
    ...shadowStyles.lg,
  },
  surfaceBottom: {
    borderTopLeftRadius: radius.xl + 8,
    borderTopRightRadius: radius.xl + 8,
  },
  surfaceCenter: {
    borderRadius: radius.xl,
    paddingBottom: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing[5],
    paddingRight: spacing[2],
    paddingTop: spacing[3],
  },
  title: {
    flex: 1,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
    gap: spacing[5],
  },
  footer: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
});
