import { router } from 'expo-router';

import { Screen } from '@/presentation/components/ui/screen';
import { EmptyState } from '@/presentation/components/ui/states';

/**
 * Sign-up (RN01, RB01 — name, e-mail, phone and valid city are required).
 *
 * TODO: placeholder — implement with React Hook Form + Zod calling
 * `useUseCases().registerUser`, including explicit LGPD consent.
 */
export default function SignUpScreen() {
  return (
    <Screen edges={[]}>
      <EmptyState
        icon="account-plus-outline"
        title="Cadastro em construção"
        description="Em breve você poderá criar sua conta por aqui."
        action={{ title: 'Voltar', onPress: () => router.back() }}
      />
    </Screen>
  );
}
