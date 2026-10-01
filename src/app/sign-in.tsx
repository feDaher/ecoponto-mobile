import { AuthLayout } from '@/presentation/features/auth/auth-layout';
import { SignInForm } from '@/presentation/features/auth/sign-in-form';

export default function SignInScreen() {
  return (
    <AuthLayout title="Bem-vindo!" subtitle="Por favor, insira seus dados para acessar.">
      <SignInForm />
    </AuthLayout>
  );
}
