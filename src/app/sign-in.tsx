import { router } from 'expo-router';

import { Screen } from '@/presentation/components/ui/screen';
import { EmptyState } from '@/presentation/components/ui/states';

/**
 * Sign-in (RN01, RB01).
 *
 * TODO: placeholder — implement with React Hook Form + Zod calling
 * `useUseCases().authenticateUser`; in demo mode use the seeded accounts.
 */
export default function SignInScreen() {
  return (
    <Screen edges={[]}>
      <EmptyState
        icon="login"
        title="Login em construção"
        description="Em breve você poderá entrar com e-mail e senha."
        action={{ title: 'Voltar', onPress: () => router.back() }}
      />
    </Screen>
  );
}
