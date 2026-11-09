import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Alert, Linking, Pressable, ScrollView, Switch, View } from 'react-native';

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
import { useTabBarInset } from '@/presentation/hooks/use-tab-bar-inset';
import { useSessionStatus, useUser } from '@/presentation/stores/session.store';
import { useSettingsStore } from '@/presentation/stores/settings.store';

export default function ProfileScreen() {
  const status = useSessionStatus();
  const user = useUser();
  const tabBarInset = useTabBarInset();

  if (status === 'loading') return <Loading label="Carregando sua conta" />;

  if (!user) return <VisitorProfile />;

  return (
    <Screen title={`Olá, ${user.firstName}`} subtitle={USER_ROLE_LABEL[user.role]} noPadding>
      <ScrollView contentContainerClassName="gap-4 px-4 pb-10" showsVerticalScrollIndicator={false}>
        <GamificationSummary />
        <AccountDetails />
        <DisposalHistory />
        <LgpdNotice />
        <SignOutButton />
        <AppSettings />
        <AboutSettings />
        <HelpAndSupport />
        <View style={{ height: tabBarInset }} />
      </ScrollView>
    </Screen>
  );
}

function VisitorProfile() {
  const router = useRouter();

  return (
    <Screen noPadding>
      <View className="flex-1">
        <View className="flex-row items-center justify-between border-b border-black/5 bg-white px-4 py-3 dark:border-white/10 dark:bg-surface-dark">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-2"
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#65977A" />
            <AppText variant="body" className="text-brand-700 dark:text-brand-300">
              Configurações
            </AppText>
          </Pressable>

          <MaterialCommunityIcons name="account-circle-outline" size={27} color="#65977A" />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 22,
            paddingBottom: 120,
            gap: 30,
          }}
          showsVerticalScrollIndicator={false}
        >
          <SignUpPrompt />
          <MembersSection />
          <AppSettings />
          <AboutSettings />
          <HelpAndSupport />
        </ScrollView>
      </View>
    </Screen>
  );
}

function SignUpPrompt() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className="rounded-2xl"
      style={{
        backgroundColor: isDark ? '#17452F' : '#397A53',
        minHeight: 232,
        paddingHorizontal: 19,
        paddingVertical: 20,
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 5,
      }}
    >
      <View style={{ gap: 8 }}>
        <AppText variant="title" style={{ color: '#FFFFFF', fontSize: 19, lineHeight: 24 }}>
          Junte-se à comunidade
        </AppText>

        <AppText variant="body" style={{ color: '#FFFFFF', fontSize: 12, lineHeight: 17 }}>
          Transforme o futuro descartando seu lixo eletrônico de forma inteligente e ganhe
          recompensas exclusivas.
        </AppText>
      </View>

      <View style={{ gap: 10 }}>
        <Button title="Criar conta agora" fullWidth onPress={() => router.push('/sign-up')} />

        <Button
          title="Fazer Login"
          variant="outline"
          fullWidth
          labelClassName="text-white"
          className="border-white/70"
          onPress={() => router.push('/sign-in')}
        />
      </View>
    </View>
  );
}

function MembersSection() {
  return (
    <View style={{ gap: 18 }}>
      <View className="flex-row items-center justify-between">
        <AppText variant="heading">Para Membros</AppText>

        <View className="rounded-full px-3 py-1" style={{ backgroundColor: '#65977A' }}>
          <AppText variant="overline" className="text-white">
            BLOQUEADO
          </AppText>
        </View>
      </View>

      <View style={{ gap: 14 }}>
        <LockedMemberItem
          icon="history"
          title="Histórico de Reciclagem"
          subtitle="Veja suas contribuições passadas"
        />

        <LockedMemberItem
          icon="bookmark-outline"
          title="Locais Salvos"
          subtitle="Seus pontos de coleta favoritos"
        />

        <LockedMemberItem
          icon="trophy-outline"
          title="Eco-Recompensas"
          subtitle="Acumule pontos e troque por benefícios"
        />
      </View>
    </View>
  );
}

function LockedMemberItem({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className="flex-row items-center rounded-2xl"
      style={{
        backgroundColor: isDark ? '#203D2E' : '#E5F0E8',
        minHeight: 104,
        paddingHorizontal: 18,
        paddingVertical: 20,
        gap: 14,
      }}
    >
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: 46,
          height: 46,
          backgroundColor: isDark ? '#315640' : '#D2E5D8',
        }}
      >
        <MaterialCommunityIcons
          name={icon as never}
          size={22}
          color={isDark ? '#B7D8C0' : '#6B9278'}
        />
      </View>

      <View className="flex-1" style={{ gap: 5 }}>
        <AppText
          variant="body"
          style={{ color: isDark ? '#E5F1E8' : '#526B59', fontWeight: '600' }}
        >
          {title}
        </AppText>

        <AppText variant="caption" style={{ color: isDark ? '#BCD0C1' : '#718477' }}>
          {subtitle}
        </AppText>
      </View>

      <MaterialCommunityIcons
        name="lock-outline"
        size={20}
        color={isDark ? '#A9CBB2' : '#789582'}
      />
    </View>
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

function AppSettings() {
  const themePreference = useSettingsStore((state) => state.themePreference);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);

  return (
    <View style={{ gap: 16 }}>
      <AppText variant="heading">Ajustes do App</AppText>

      <Card className="gap-0">
        <SettingRow
          icon="web"
          title="Idioma"
          subtitle="Português (Brasil)"
          onPress={() =>
            Alert.alert('Idioma', 'Português (Brasil) é o idioma disponível no momento.')
          }
          showArrow
        />

        <View className="h-px bg-black/5 dark:bg-white/10" />

        <View
          className="flex-row gap-3"
          style={{
            minHeight: 82,
            alignItems: 'center',
          }}
        >
          <MaterialCommunityIcons name="moon-waning-crescent" size={21} color="#65977A" />

          <View className="flex-1 justify-center gap-1">
            <AppText variant="body">Modo Escuro</AppText>
            <AppText variant="caption" tone="muted">
              {themePreference === 'system'
                ? 'Automático conforme sistema'
                : themePreference === 'dark'
                  ? 'Modo escuro ativado'
                  : 'Modo claro ativado'}
            </AppText>
          </View>

          <View
            style={{
              width: 56,
              height: 50,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Switch
              value={themePreference === 'dark'}
              onValueChange={(enabled) => setThemePreference(enabled ? 'dark' : 'light')}
              trackColor={{ false: '#D1D5DB', true: '#83B39A' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Ativar modo escuro"
              style={{ transform: [{ scale: 0.9 }] }}
            />
          </View>
        </View>

        <View className="h-px bg-black/5 dark:bg-white/10" />

        <SettingRow
          icon="bell-ring-outline"
          title="Notificações"
          subtitle="Alertas de novos pontos e eventos"
          onPress={openNotificationSettings}
          showArrow
        />
      </Card>
    </View>
  );
}

function AboutSettings() {
  return (
    <View style={{ gap: 16 }}>
      <AppText variant="heading">Sobre</AppText>

      <Card className="gap-0">
        <SettingRow
          icon="shield-check-outline"
          title="Privacidade e Termos"
          onPress={() =>
            Alert.alert(
              'Privacidade e Termos',
              'O ECO Ponto respeita a sua privacidade e trata os dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD). Esta seção será ampliada com os documentos completos do aplicativo.',
            )
          }
          showExternal
        />

        <View className="h-px bg-black/5 dark:bg-white/10" />

        <View className="flex-row items-center gap-3" style={{ minHeight: 76 }}>
          <MaterialCommunityIcons name="information-outline" size={21} color="#65977A" />
          <AppText variant="body" className="flex-1">
            Versão do Aplicativo
          </AppText>
          <AppText variant="caption" tone="muted">
            2.4.1-beta
          </AppText>
        </View>
      </Card>
    </View>
  );
}

function HelpAndSupport() {
  return (
    <View className="flex-row gap-4">
      <Pressable
        onPress={() =>
          Alert.alert(
            'Central de Ajuda',
            'A central de ajuda do ECO Ponto está em desenvolvimento e estará disponível em breve.',
          )
        }
        className="flex-1 gap-3 rounded-2xl bg-black/[0.03] dark:bg-white/5"
        style={{ minHeight: 120, padding: 20 }}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="help-box-outline" size={25} color="#65977A" />
        <AppText variant="body">Central de Ajuda</AppText>
      </Pressable>

      <Pressable
        onPress={() =>
          Alert.alert(
            'Suporte',
            'Nosso canal de suporte está em desenvolvimento e estará disponível em breve.',
          )
        }
        className="flex-1 gap-3 rounded-2xl bg-black/[0.03] dark:bg-white/5"
        style={{ minHeight: 120, padding: 20 }}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="message-text-outline" size={25} color="#65977A" />
        <AppText variant="body">Suporte</AppText>
      </Pressable>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = false,
  showExternal = false,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  showExternal?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3"
      style={{ minHeight: subtitle ? 82 : 76, paddingVertical: 16 }}
      accessibilityRole="button"
    >
      <MaterialCommunityIcons name={icon as never} size={21} color="#65977A" />

      <View className="flex-1 gap-1">
        <AppText variant="body">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {showArrow ? <MaterialCommunityIcons name="chevron-right" size={21} color="#8A9690" /> : null}

      {showExternal ? (
        <MaterialCommunityIcons name="open-in-new" size={19} color="#8A9690" />
      ) : null}
    </Pressable>
  );
}

function openNotificationSettings() {
  Alert.alert(
    'Notificações',
    'Você pode permitir ou bloquear as notificações do ECO Ponto nas configurações do seu celular.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Abrir configurações',
        onPress: () => {
          Linking.openSettings().catch(() => {
            Alert.alert(
              'Não foi possível abrir',
              'Acesse as configurações do aplicativo pelo celular.',
            );
          });
        },
      },
    ],
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
