import { AuthLayout } from '@/presentation/features/auth/auth-layout';
import { SignUpForm } from '@/presentation/features/auth/sign-up-form';

export default function SignUpScreen() {
  return (
    <AuthLayout
      icon="recycle"
      title="Criar Conta"
      subtitle="Por favor, insira seus dados para registrar-se."
    >
      <SignUpForm />
    </AuthLayout>
  );
}
