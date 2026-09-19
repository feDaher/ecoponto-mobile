import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import type { DisposalSummary } from '@/application/use-cases/list-my-disposals.use-case';
import { USER_ROLE_LABEL } from '@/domain/value-objects/user-role';
import { getCategory } from '@/domain/value-objects/waste-category';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Screen } from '@/presentation/components/ui/screen';
import { Loading } from '@/presentation/components/ui/states';
import { AppText } from '@/presentation/components/ui/text';
import {
  formatPoints,
  formatRelativeTime,
  formatWeight,
} from '@/presentation/features/points/formatting';
import { useMyDisposals } from '@/presentation/hooks/use-gamification';
import { useSignOut } from '@/presentation/hooks/use-session';
import { useSessionStatus, useUser } from '@/presentation/stores/session.store';

/**
 * User account.
 *
 * RB01 — this is the only area that requires sign-up; the rest of the app stays public.
 * RB09 — gathers points, level, seals and disposal history.
 */
export default function ProfileScreen() {
  const status = useSessionStatus();
  const user = useUser();

  if (status === 'loading') return <Loading label="Carregando sua conta" />;
  if (!user) return <SignUpPrompt />;

  return (
    <Screen title={`Olá, ${user.firstName}`} subtitle={USER_ROLE_LABEL[user.role]} noPadding>
      <ScrollView contentContainerClassName="gap-3 px-4 pb-10" showsVerticalScrollIndicator={false}>
        <GamificationSummary />
        <AccountDetails />
        <DisposalHistory />
        <LgpdNotice />
        <SignOutButton />
      </ScrollView>
    </Screen>
  );
}

function SignUpPrompt() {
  const router = useRouter();

  return (
    <Screen title="Sua conta">
      <View className="flex-1 items-center justify-center gap-4 px-2">
        <MaterialCommunityIcons name="account-plus-outline" size={56} color="#059669" />

        <AppText variant="title" className="text-center">
          Entre para participar
        </AppText>

        <AppText variant="body" tone="muted" className="text-center">
          Consultar o mapa é livre. Já registrar descartes, acumular pontos e avaliar pontos de
          coleta exige uma conta.
        </AppText>

        <View className="w-full gap-2 pt-2">
          <Button title="Entrar" icon="login" fullWidth onPress={() => router.push('/sign-in')} />
          <Button
            title="Criar conta"
            variant="outline"
            fullWidth
            onPress={() => router.push('/sign-up')}
          />
        </View>
      </View>
    </Screen>
  );
}

function GamificationSummary() {
  const query = useMyDisposals();

  if (query.isPending) {
    return (
      <Card>
        <AppText variant="caption" tone="muted">
          Carregando seu progresso…
        </AppText>
      </Card>
    );
  }

  if (!query.data) return null;
  const summary: DisposalSummary = query.data;

  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <AppText variant="overline" tone="muted">
            Seus pontos
          </AppText>
          <AppText variant="display" tone="brand">
            {formatPoints(summary.totalPoints)}
          </AppText>
        </View>

        <Badge label={summary.level.title} tone="success" icon="leaf" />
      </View>

      {summary.nextLevel ? (
        <View className="gap-1.5">
          <View
            className="h-2 w-full overflow-hidden rounded-pill bg-black/10 dark:bg-white/10"
            accessibilityRole="progressbar"
            accessibilityValue={{ now: Math.round(summary.progress * 100), min: 0, max: 100 }}
          >
            <View
              className="h-full rounded-pill bg-brand-500"
              style={{ width: `${Math.round(summary.progress * 100)}%` }}
            />
          </View>

          <AppText variant="caption" tone="muted">
            Faltam {formatPoints(summary.pointsRemaining)} pontos para {summary.nextLevel.title}.
          </AppText>
        </View>
      ) : (
        <AppText variant="caption" tone="muted">
          Você alcançou o nível máximo. Obrigado por cuidar da cidade.
        </AppText>
      )}

      <View className="flex-row gap-3">
        <Metric label="Descartes" value={String(summary.records.length)} />
        <Metric label="Total descartado" value={formatWeight(summary.totalWeightKg)} />
        <Metric label="Selos" value={String(summary.achievements.length)} />
      </View>

      {summary.achievements.length > 0 ? (
        <View className="flex-row flex-wrap gap-2 border-t border-black/5 pt-3 dark:border-white/10">
          {summary.achievements.map((achievement) => (
            <Badge
              key={achievement.id}
              label={achievement.title}
              tone="info"
              icon={achievement.icon as never}
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-0.5 rounded-2xl bg-black/[0.03] p-3 dark:bg-white/5">
      <AppText variant="heading">{value}</AppText>
      <AppText variant="overline" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

function AccountDetails() {
  const user = useUser();
  if (!user) return null;

  return (
    <Card className="gap-3">
      <AppText variant="overline" tone="muted">
        Dados da conta
      </AppText>

      <InfoRow icon="email-outline" label="E-mail" value={user.email.value} />
      <InfoRow icon="phone-outline" label="Telefone" value={user.phone.formatted} />
      <InfoRow icon="map-marker-outline" label="Cidade" value={user.city} />
      <InfoRow
        icon="shield-account-outline"
        label="Perfil de acesso"
        value={USER_ROLE_LABEL[user.role]}
      />
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <MaterialCommunityIcons name={icon as never} size={18} color="#5A655F" />
      <AppText variant="caption" tone="muted" className="w-28">
        {label}
      </AppText>
      <AppText variant="body" className="flex-1" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

function DisposalHistory() {
  const query = useMyDisposals();
  const records = query.data?.records ?? [];

  if (records.length === 0) return null;

  return (
    <Card className="gap-3">
      <AppText variant="overline" tone="muted">
        Histórico de descartes
      </AppText>

      {records.map((record) => {
        const category = getCategory(record.category);

        return (
          <View key={record.id} className="flex-row items-center gap-3">
            <View
              style={{ backgroundColor: `${category.color}1A` }}
              className="h-9 w-9 items-center justify-center rounded-full"
            >
              <MaterialCommunityIcons
                name={category.icon as never}
                size={18}
                color={category.color}
              />
            </View>

            <View className="flex-1">
              <AppText variant="body" numberOfLines={1}>
                {record.collectionPointName ?? category.name}
              </AppText>
              <AppText variant="caption" tone="muted">
                {formatWeight(record.weightKg)} de {category.name.toLowerCase()} ·{' '}
                {formatRelativeTime(record.disposedAt)}
              </AppText>
            </View>

            <AppText variant="heading" tone="brand">
              +{record.pointsEarned}
            </AppText>
          </View>
        );
      })}
    </Card>
  );
}

/** Section 8.2 — transparency about data processing (LGPD). */
function LgpdNotice() {
  return (
    <Card className="flex-row gap-3">
      <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#0284C7" />
      <View className="flex-1 gap-1">
        <AppText variant="caption">Seus dados</AppText>
        <AppText variant="caption" tone="muted">
          Localização, histórico de uso e mensagens são tratados conforme a LGPD. Você pode
          solicitar a exclusão da sua conta e dos seus dados a qualquer momento.
        </AppText>
      </View>
    </Card>
  );
}

function SignOutButton() {
  const signOut = useSignOut();

  return (
    <Button
      title="Sair da conta"
      variant="ghost"
      icon="logout"
      fullWidth
      loading={signOut.isPending}
      onPress={() => signOut.mutate()}
    />
  );
}
