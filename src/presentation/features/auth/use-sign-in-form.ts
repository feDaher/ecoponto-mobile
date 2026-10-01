import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AppError, UnexpectedError } from '@/core/errors';
import { useSignIn } from '@/presentation/hooks/use-session';

import { signInSchema, type SignInFormData } from './sign-in.schema';

export function useSignInForm() {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useSignIn();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = form.handleSubmit(async (data) => {
    setGeneralError(null);

    try {
      await mutateAsync({ email: data.email.trim().toLowerCase(), password: data.password });
      router.replace('/(tabs)');
    } catch (error) {
      const appError = error instanceof AppError ? error : new UnexpectedError(error);

      if (appError.field && ['email', 'password'].includes(appError.field)) {
        form.setError(appError.field as keyof SignInFormData, { message: appError.message });
      } else {
        setGeneralError(appError.message);
      }
    }
  });

  return {
    control: form.control,
    submit,
    isPending,
    generalError,
  };
}
