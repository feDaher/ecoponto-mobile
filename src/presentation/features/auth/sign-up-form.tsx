import { Link } from 'expo-router';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';

import { MIN_PASSWORD_LENGTH } from '@/application/use-cases/register-user.use-case';
import { Button } from '@/presentation/components/ui/button';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Chip } from '@/presentation/components/ui/chip';
import { PasswordInput } from '@/presentation/components/ui/password-input';
import { AppText } from '@/presentation/components/ui/text';
import { TextField } from '@/presentation/components/ui/text-field';
import { SocialAuthSection } from './social-auth-section';

import { AVAILABLE_ROLES } from './sign-up.schema';
import { useSignUpForm } from './use-sign-up-form';

export function SignUpForm() {
  const { control, submit, isPending, generalError } = useSignUpForm();

  return (
    <View className="gap-8">
      <View className="gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <TextField
              label="Nome completo"
              placeholder="Escreva seu nome"
              autoComplete="name"
              textContentType="name"
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
          name="phone"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <TextField
              label="Telefone"
              placeholder="(33) 98888-7777"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
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
          name="city"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <TextField
              label="Cidade"
              placeholder="Escreva sua cidade"
              textContentType="addressCity"
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
              autoComplete="new-password"
              textContentType="newPassword"
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
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <PasswordInput
              label="Confirmar senha"
              placeholder="Repita sua senha"
              autoComplete="new-password"
              textContentType="newPassword"
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

        <Controller
          control={control}
          name="role"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View className="gap-2">
              <AppText variant="caption" tone="muted">
                Perfil
              </AppText>

              <View className="flex-row flex-wrap gap-2" role="radiogroup">
                {AVAILABLE_ROLES.map((role) => (
                  <Chip
                    key={role.value}
                    label={role.label}
                    icon={role.icon}
                    selected={value === role.value}
                    onPress={() => onChange(role.value)}
                  />
                ))}
              </View>

              {error ? (
                <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
                  {error.message}
                </AppText>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="consent"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Checkbox
              label="Eu concordo com os Termos de Serviço e Política de Privacidade."
              checked={value}
              onToggle={() => onChange(!value)}
              error={error?.message}
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
          title="Cadastrar-se"
          size="md"
          fullWidth
          loading={isPending}
          disabled={isPending}
          onPress={submit}
        />

        <Link href="/sign-in" replace asChild>
          <Button title="Login" variant="outline" size="md" fullWidth disabled={isPending} />
        </Link>
      </View>

      <SocialAuthSection />
    </View>
  );
}
