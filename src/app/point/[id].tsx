import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/presentation/components/ui/screen';
import { EmptyState } from '@/presentation/components/ui/states';

/**
 * Collection point details (RN03, RN08, RB06, RB08, RB11, RB12).
 *
 * TODO: placeholder — implement with `useUseCases().getPointDetails`, showing
 * address, categories, opening hours (RB06 stale warning), WhatsApp button only
 * when `showWhatsApp` is true (RB08), route via `plotRoute` (RB11) and reviews (RB12).
 */
export default function PointDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen edges={[]}>
      <EmptyState
        icon="hammer-wrench"
        title="Ficha do ponto em construção"
        description={`Detalhes do ponto #${id} serão exibidos aqui.`}
        action={{ title: 'Voltar ao mapa', onPress: () => router.back() }}
      />
    </Screen>
  );
}
