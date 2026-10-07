import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getOpeningLabel } from '@/domain/services/point-status';
import { getCategory } from '@/domain/value-objects/waste-category';
import { getErrorMessage } from '@/presentation/hooks/result';
import { usePointDetails } from '@/presentation/hooks/use-point-details';
import { useUseCases } from '@/presentation/providers/container-provider';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const GREEN = '#5B8A6B';
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function PointDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: details, isLoading, error, refetch } = usePointDetails(id);
  const { contactWhatsApp, plotRoute } = useUseCases();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F7F7]">
        <ActivityIndicator color={GREEN} />
      </View>
    );
  }

  if (error || !details) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-[#F7F7F7] px-6">
        <Text className="text-center text-base text-[#444]">
          {error ? getErrorMessage(error) : 'Ponto de coleta não encontrado.'}
        </Text>
        <Pressable onPress={() => refetch()} className="rounded-xl bg-[#5B8A6B] px-5 py-3">
          <Text className="font-bold text-white">Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  const { point, reviews, averageRating, distanceKm, isOpenNow, isInfoOutdated, daysSinceUpdate } =
    details;

  const handleRoute = async () => {
    const result = await plotRoute.execute({ point });
    if (!result.ok) Alert.alert('Não foi possível abrir a rota', getErrorMessage(result.error));
  };

  const handleWhatsApp = async () => {
    const result = await contactWhatsApp.execute({ point });
    if (!result.ok) Alert.alert('Não foi possível abrir o WhatsApp', getErrorMessage(result.error));
  };

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ paddingTop: insets.top }} className="flex-row items-center px-4 pb-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="flex-row items-center gap-2"
          accessibilityRole="button"
          accessibilityLabel="Voltar para locais"
        >
          <Ionicons name="arrow-back" size={22} color="#4A7A5A" />
          <Text className="text-base font-medium text-[#4A7A5A]">Locais</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View className="mx-2 h-[200px] items-center justify-center overflow-hidden rounded-[20px] bg-[#DDE6DF]">
          <MaterialCommunityIcons name="recycle-variant" size={64} color={GREEN} />
          <View className="absolute bottom-2 right-2 rounded-full bg-[#5B8A6B] px-3 py-1">
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-white">
              {point.isVisibleOnMap ? 'Centro ativo' : 'Em análise'}
            </Text>
          </View>
        </View>

        <View className="gap-4 px-4 pt-5">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-[#1E1E1E]">{point.name}</Text>

            {distanceKm !== null && (
              <View className="flex-row items-center gap-1.5 self-start rounded-full bg-[#5B8A6B] px-3 py-1">
                <Ionicons name="navigate-outline" size={12} color="#fff" />
                <Text className="text-xs font-semibold text-white">{distanceKm.toFixed(1)} km</Text>
              </View>
            )}

            <View className="flex-row items-start gap-2">
              <Ionicons name="location-outline" size={16} color={GREEN} />
              <Text className="flex-1 text-xs leading-5 text-[#444]">{point.address}</Text>
            </View>

            {averageRating !== null && reviews.length > 0 && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={14} color="#D9A441" />
                <Text className="text-xs font-semibold text-[#1E1E1E]">
                  {averageRating.toFixed(1)}
                </Text>
                <Text className="text-xs text-[#555]">({reviews.length} avaliações)</Text>
              </View>
            )}
          </View>

          {isInfoOutdated && (
            <View
              accessibilityRole="alert"
              className="flex-row items-start gap-2 rounded-xl bg-[#FBF1DC] p-3"
            >
              <Ionicons name="warning-outline" size={18} color="#9A6B12" />
              <Text className="flex-1 text-xs leading-5 text-[#6B4A0E]">
                Estas informações não são atualizadas há {daysSinceUpdate} dias. Confirme horário e
                itens aceitos antes de ir.
              </Text>
            </View>
          )}

          <View className="flex-row items-center gap-3 rounded-xl bg-[#E8EBE8] px-4 py-3">
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: isOpenNow ? GREEN : '#9A9A9A' }}
            />
            <Text className="text-xs text-[#1E1E1E]">{getOpeningLabel(point.openingHours)}</Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={handleRoute}
              className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-[#5B8A6B]"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="directions" size={18} color="#fff" />
              <Text className="text-xs font-bold text-white">Como chegar</Text>
            </Pressable>

            {point.isWhatsAppAvailable && (
              <Pressable
                onPress={handleWhatsApp}
                className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-[#D6E4EE]"
                accessibilityRole="button"
                accessibilityLabel="Falar com o coletor pelo WhatsApp"
              >
                <Ionicons name="logo-whatsapp" size={18} color="#3A5A73" />
                <Text className="text-xs font-bold text-[#3A5A73]">WhatsApp</Text>
              </Pressable>
            )}
          </View>

          {point.description ? (
            <Text className="text-xs leading-5 text-[#444]">{point.description}</Text>
          ) : null}

          <View className="gap-3">
            <Text className="text-[15px] font-semibold text-[#1E1E1E]">Itens aceitos</Text>
            <View className="flex-row flex-wrap gap-2.5">
              {point.categories.map((categoryId) => {
                const category = getCategory(categoryId);
                return (
                  <View
                    key={category.id}
                    className="h-[72px] w-[48%] items-center justify-center gap-1.5 rounded-xl bg-white px-2 shadow-sm"
                  >
                    <MaterialCommunityIcons
                      name={category.icon as IconName}
                      size={22}
                      color="#4A7A5A"
                    />
                    <Text
                      numberOfLines={2}
                      className="text-center text-[11px] font-medium text-[#1E1E1E]"
                    >
                      {category.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-[15px] font-semibold text-[#1E1E1E]">Horários</Text>
            {WEEKDAYS.map((label, weekday) => {
              const slots = point.openingHours.filter((h) => h.weekday === weekday);
              return (
                <View key={label} className="flex-row justify-between">
                  <Text className="text-xs text-[#444]">{label}</Text>
                  <Text className="text-xs text-[#1E1E1E]">
                    {slots.length
                      ? slots.map((s) => `${s.opensAt}–${s.closesAt}`).join(' · ')
                      : 'Fechado'}
                  </Text>
                </View>
              );
            })}
          </View>

          <View className="gap-2">
            <Text className="text-[15px] font-semibold text-[#1E1E1E]">Avaliações</Text>
            {reviews.length === 0 ? (
              <Text className="text-xs text-[#555]">Este ponto ainda não tem avaliações.</Text>
            ) : (
              reviews.map((review, index) => (
                <View key={index} className="gap-1 rounded-xl bg-white p-3 shadow-sm">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="star" size={12} color="#D9A441" />
                    <Text className="text-xs font-semibold text-[#1E1E1E]">{review.rating}</Text>
                  </View>
                  {review.comment ? (
                    <Text className="text-xs leading-5 text-[#444]">{review.comment}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

          <View className="h-[140px] overflow-hidden rounded-2xl">
            <MapView
              style={{ flex: 1 }}
              pointerEvents="none"
              scrollEnabled={false}
              zoomEnabled={false}
              initialRegion={{
                latitude: point.coordinate.latitude,
                longitude: point.coordinate.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={point.coordinate} pinColor={GREEN} />
            </MapView>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
