import { useState, type ReactNode, type Ref } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import type { IconName } from '@cute-teachy/tokens';
import { colors, layout, radius, spacing, textVariants } from '@/theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  readonly label?: string;
  /** Thông báo lỗi đã dịch – hiển thị dưới ô nhập và đổi màu viền. */
  readonly error?: string;
  readonly helperText?: string;
  readonly icon?: IconName;
  /** Phần tử bên phải (ví dụ nút ẩn/hiện mật khẩu). */
  readonly trailing?: ReactNode;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly inputStyle?: StyleProp<TextStyle>;
  readonly ref?: Ref<TextInput>;
}

export function TextField({
  label,
  error,
  helperText,
  icon,
  trailing,
  containerStyle,
  inputStyle,
  multiline,
  onFocus,
  onBlur,
  ref,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.error : focused ? colors.primary : 'transparent';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Typography variant="labelMd" color={colors.onSurfaceVariant} style={styles.label}>
          {label}
        </Typography>
      ) : null}
      <View style={[styles.field, multiline && styles.fieldMultiline, { borderColor }]}>
        {icon ? <Icon name={icon} size={20} color={colors.outline} style={styles.icon} /> : null}
        <TextInput
          ref={ref}
          multiline={multiline}
          placeholderTextColor={colors.outline}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          accessibilityHint={error}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
          {...inputProps}
        />
        {trailing}
      </View>
      {error || helperText ? (
        <Typography
          variant="labelSm"
          color={error ? colors.error : colors.onSurfaceVariant}
          style={styles.message}
          accessibilityLiveRegion={error ? 'polite' : undefined}
        >
          {error ?? helperText}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1.5],
  },
  label: {
    marginLeft: spacing[1],
  },
  field: {
    minHeight: layout.minTouchTarget + 8,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing[3],
  },
  icon: {
    marginRight: spacing[1],
  },
  input: {
    ...textVariants.bodyLg,
    flex: 1,
    color: colors.onSurface,
    paddingVertical: spacing[3],
  },
  inputMultiline: {
    minHeight: 120,
    paddingVertical: 0,
    textAlignVertical: 'top',
  },
  message: {
    marginLeft: spacing[1],
  },
});
