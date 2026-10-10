import type { ReactElement, ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@/theme';

export interface ScreenContainerProps {
  readonly children: ReactNode;
  /** Header cố định phía trên vùng cuộn. */
  readonly header?: ReactNode;
  /** Phần tử nổi (FAB…) đặt ngoài vùng cuộn. */
  readonly overlay?: ReactNode;
  readonly scroll?: boolean;
  readonly padded?: boolean;
  /** Mặc định chỉ `top` – tab bar / sheet đã xử lý cạnh dưới. */
  readonly edges?: readonly Edge[];
  readonly refreshing?: boolean;
  readonly onRefresh?: () => void;
  readonly contentStyle?: StyleProp<ViewStyle>;
}

const DEFAULT_EDGES: readonly Edge[] = ['top'];
/** Chừa chỗ cho FAB để nội dung cuối không bị che. */
const BOTTOM_SPACE = 96;

export function ScreenContainer({
  children,
  header,
  overlay,
  scroll = true,
  padded = true,
  edges = DEFAULT_EDGES,
  refreshing = false,
  onRefresh,
  contentStyle,
}: ScreenContainerProps) {
  const paddingStyle = padded ? styles.padded : undefined;
  const refreshControl: ReactElement<RefreshControlProps> | undefined = onRefresh ? (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
  ) : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[paddingStyle, styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, paddingStyle, contentStyle]}>{children}</View>
      )}
      {overlay}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: layout.containerPadding,
  },
  scrollContent: {
    paddingTop: spacing[2],
    paddingBottom: BOTTOM_SPACE,
    gap: spacing[6],
  },
});
