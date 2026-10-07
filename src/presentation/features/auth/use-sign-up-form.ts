import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AppError, UnexpectedError } from '@/core/errors';
import { useSignUp } from '@/presentation/hooks/use-session';

import { signUpSchema, type SignUpFormData } from './sign-up.schema';

const SIGN_UP_FIELDS: readonly (keyof SignUpFormData)[] = [
  'name',
  'email',
  'phone',
  'city',
  'password',
  'confirmPassword',
  'role',
  'consent',
];

export function useSignUpForm() {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useSignUp();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      city: '',
      password: '',
      confirmPassword: '',
      role: 'citizen',
      consent: false,
    },
  });

  const submit = form.handleSubmit(async (data) => {
    setGeneralError(null);

    try {
      await mutateAsync({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone,
        city: data.city.trim(),
        password: data.password,
        role: data.role,
      });
      router.replace('/(tabs)');
    } catch (error) {
      const appError = error instanceof AppError ? error : new UnexpectedError(error);

      if (appError.field && SIGN_UP_FIELDS.includes(appError.field as keyof SignUpFormData)) {
        form.setError(appError.field as keyof SignUpFormData, { message: appError.message });
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
