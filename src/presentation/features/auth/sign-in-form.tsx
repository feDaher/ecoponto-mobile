import { Link } from 'expo-router';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';

import { MIN_PASSWORD_LENGTH } from '@/application/use-cases/register-user.use-case';
import { Button } from '@/presentation/components/ui/button';
import { PasswordInput } from '@/presentation/components/ui/password-input';
import { AppText } from '@/presentation/components/ui/text';
import { TextField } from '@/presentation/components/ui/text-field';
import { SocialAuthSection } from './social-auth-section';

import { useSignInForm } from './use-sign-in-form';

export function SignInForm() {
  const { control, submit, isPending, generalError } = useSignInForm();

  return (
    <View className="gap-8">
      <View className="gap-4">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <TextField
              label="E-mail"
              placeholder="Escreva seu e-mail"
              hint="Não iremos compartilhar seu e-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
              editable={!isPending}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <PasswordInput
              label="Senha"
              placeholder="Escreva sua senha"
              hint={`Certifique-se de que tenha pelo menos ${MIN_PASSWORD_LENGTH} caracteres`}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
              editable={!isPending}
              onSubmitEditing={submit}
            />
          )}
        />

        {generalError ? (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
            className="rounded-xl border border-state-danger/30 bg-state-danger/10 p-3"
          >
            <AppText variant="caption" tone="danger">
              {generalError}
            </AppText>
          </View>
        ) : null}
      </View>

      <View className="gap-4">
        <Button
          title="Login"
          size="md"
          fullWidth
          loading={isPending}
          disabled={isPending}
          onPress={submit}
        />

        <Link href="/sign-up" replace asChild>
          <Button title="Cadastre-se" variant="outline" size="md" fullWidth disabled={isPending} />
        </Link>
      </View>

      <SocialAuthSection />
    </View>
  );
}
