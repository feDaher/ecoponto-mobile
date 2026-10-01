import { normalizeText } from '@/core/text';
import type { EducationalContent } from '@/domain/repositories/educational-content.repository';
import { getCategory } from '@/domain/value-objects/waste-category';

export function searchContents(
  contents: readonly EducationalContent[],
  query: string,
): EducationalContent[] {
  const wanted = normalizeText(query);
  if (!wanted) return [...contents];

  return contents.filter((content) =>
    normalizeText(
      [
        content.title,
        content.summary,
        getCategory(content.category).name,
        ...content.howToDispose,
      ].join(' '),
    ).includes(wanted),
  );
}

export function pickFeatured(
  contents: readonly EducationalContent[],
  now: Date = new Date(),
): EducationalContent | null {
  if (contents.length === 0) return null;
  const day = Math.floor(now.getTime() / 86_400_000);
  return contents[day % contents.length];
}
