import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';

import type { EducationalContent } from '@/domain/repositories/educational-content.repository';
import { getCategory } from '@/domain/value-objects/waste-category';

import { Button } from '../../components/ui/button';
import { AppText } from '../../components/ui/text';

export function FeaturedContent({
  content,
  onOpen,
  wide,
}: {
  content: EducationalContent;
  onOpen: () => void;
  wide: boolean;
}) {
  const category = getCategory(content.category);

  return (
    <View
      className={`overflow-hidden rounded-3xl bg-slate-800 ${wide ? 'p-10' : 'p-6'}`}
      accessibilityRole="summary"
    >
      {wide ? (
        <View className="absolute bottom-0 right-10 top-0 justify-center" pointerEvents="none">
          <MaterialCommunityIcons
            name={category.icon as never}
            size={200}
            color="#FFFFFF"
            style={{ opacity: 0.06 }}
          />
        </View>
      ) : null}

      <View className={`gap-4 ${wide ? 'max-w-[680px]' : ''}`}>
        <View className="flex-row items-center gap-1.5 self-start rounded-pill bg-brand-100 px-3 py-1">
          <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color="#047857" />
          <AppText variant="overline" className="text-brand-800">
            Sabia que?
          </AppText>
        </View>

        <AppText
          className={`font-bold text-white ${
            wide ? 'text-[40px] leading-[46px]' : 'text-[26px] leading-[32px]'
          }`}
        >
          {content.title}
        </AppText>

        <AppText variant="body" className="text-slate-300">
          {content.summary}
        </AppText>

        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 pt-1">
          <Button title="Ver como descartar" icon="book-open-variant" onPress={onOpen} />
          <View className="flex-row items-center gap-1.5">
            <MaterialCommunityIcons name={category.icon as never} size={16} color="#94A3B8" />
            <AppText variant="caption" className="text-slate-400">
              {category.name}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}
