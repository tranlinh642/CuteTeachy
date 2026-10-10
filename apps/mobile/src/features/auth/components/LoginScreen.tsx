import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from '@cute-teachy/i18n';
import { ScreenContainer } from '@/components/layout';
import { Button, Checkbox, Icon, IconButton, TextField, Typography } from '@/components/ui';
import { colors, layout, radius, shadowStyles, spacing } from '@/theme';
import { useLoginForm } from '../hooks/use-login-form';

/** Màn hình đăng nhập (design: Login / Interactive Login). */
export function LoginScreen() {
  const { t } = useTranslation();
  const form = useLoginForm();
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Icon name="spa" size={44} color={colors.primary} />
          </View>
          <Typography variant="displayMd" align="center" accessibilityRole="header">
            {t('auth.login.title')}
          </Typography>
          <Typography variant="bodyLg" align="center" color={colors.onSurfaceVariant}>
            {t('auth.login.subtitle')}
          </Typography>
        </View>

        <View style={styles.card}>
          <TextField
            label={t('auth.login.emailLabel')}
            placeholder={t('auth.login.emailPlaceholder')}
            icon="email"
            value={form.values.email}
            onChangeText={(text) => form.setField('email', text)}
            error={form.emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <TextField
            label={t('auth.login.passwordLabel')}
            placeholder={t('auth.login.passwordPlaceholder')}
            icon="lock"
            value={form.values.password}
            onChangeText={(text) => form.setField('password', text)}
            error={form.passwordError}
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={form.submit}
            trailing={
              <IconButton
                icon={passwordVisible ? 'visibilityOff' : 'visibility'}
                accessibilityLabel={passwordVisible ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                onPress={() => setPasswordVisible((visible) => !visible)}
              />
            }
          />

          <Pressable
            style={styles.rememberRow}
            onPress={() => form.setField('remember', !form.values.remember)}
            accessible={false}
          >
            <Checkbox
              checked={form.values.remember ?? true}
              onChange={(checked) => form.setField('remember', checked)}
              accessibilityLabel={t('auth.login.remember')}
            />
            <Typography variant="bodySm" color={colors.onSurfaceVariant}>
              {t('auth.login.remember')}
            </Typography>
          </Pressable>

          {form.submitError ? (
            <View style={styles.errorBox} accessibilityLiveRegion="assertive">
              <Typography variant="bodySm" color={colors.onErrorContainer}>
                {form.submitError}
              </Typography>
            </View>
          ) : null}

          <Button title={t('auth.login.submit')} onPress={form.submit} loading={form.isSubmitting} fullWidth />
        </View>

        <Pressable
          onPress={form.fillDemo}
          accessibilityRole="button"
          style={({ pressed }) => [styles.demo, pressed && styles.pressed]}
        >
          <Typography variant="bodySm" align="center" color={colors.onSurfaceVariant}>
            {form.demoHint}
          </Typography>
        </Pressable>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: spacing[8],
  },
  hero: {
    alignItems: 'center',
    gap: spacing[2],
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  card: {
    backgroundColor: colors.tertiaryFixed,
    borderRadius: radius.xl + 8,
    padding: spacing[6],
    gap: spacing[4],
    ...shadowStyles.md,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -spacing[2],
  },
  errorBox: {
    backgroundColor: colors.errorContainer,
    borderRadius: radius.md,
    padding: spacing[3],
  },
  demo: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
  },
  pressed: {
    backgroundColor: colors.surfaceContainer,
  },
});
