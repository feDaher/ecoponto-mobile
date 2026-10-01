import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { EducationalContent } from '@/domain/repositories/educational-content.repository';
import { getCategory } from '@/domain/value-objects/waste-category';

import { AppText } from '../../components/ui/text';

export function ContentDetail({
  content,
  onClose,
  wide,
}: {
  content: EducationalContent | null;
  onClose: () => void;
  wide: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={content !== null}
      transparent
      animationType={wide ? 'fade' : 'slide'}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className={`flex-1 ${wide ? 'items-center justify-center p-6' : 'justify-end'}`}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar guia"
          onPress={onClose}
          className="absolute inset-0 bg-black/40"
        />

        {content ? (
          <View
            accessibilityViewIsModal
            style={
              wide
                ? { width: '100%', maxWidth: 600, maxHeight: '85%' }
                : { maxHeight: '90%', paddingBottom: insets.bottom }
            }
            className={`overflow-hidden bg-surface-light-muted dark:bg-surface-dark ${
              wide ? 'rounded-3xl' : 'rounded-t-3xl'
            }`}
          >
            <GuideBody content={content} onClose={onClose} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function GuideBody({ content, onClose }: { content: EducationalContent; onClose: () => void }) {
  const category = getCategory(content.category);

  return (
    <>
      <View
        style={{ backgroundColor: `${category.color}1A` }}
        className="flex-row items-center gap-3 px-5 py-4"
      >
        <MaterialCommunityIcons name={category.icon as never} size={28} color={category.color} />
        <AppText variant="overline" className="flex-1" style={{ color: category.color }}>
          {category.name}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar guia"
          onPress={onClose}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-black/5"
        >
          <MaterialCommunityIcons name="close" size={22} color="#5A655F" />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-5 p-5 pb-8">
        <View className="gap-2">
          <AppText variant="title">{content.title}</AppText>
          <AppText variant="body" tone="muted">
            {content.summary}
          </AppText>
        </View>

        <Section icon="format-list-numbered" title="Como descartar">
          {content.howToDispose.map((step, index) => (
            <View key={step} className="flex-row gap-3">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-brand-600">
                <AppText variant="overline" tone="inverse">
                  {index + 1}
                </AppText>
              </View>
              <AppText variant="body" className="flex-1">
                {step}
              </AppText>
            </View>
          ))}
        </Section>

        <Section icon="recycle" title="Por que reciclar">
          <AppText variant="body">{content.whyRecycle}</AppText>
        </Section>

        <Section icon="earth" title="Impacto ambiental">
          <AppText variant="body">{content.environmentalImpact}</AppText>
        </Section>
      </ScrollView>
    </>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-3 rounded-card bg-surface-light p-4 dark:bg-surface-dark-muted">
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons name={icon} size={18} color="#047857" />
        <AppText variant="overline" tone="brand">
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}
