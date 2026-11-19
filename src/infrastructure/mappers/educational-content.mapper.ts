import type { EducationalContent } from '@/domain/repositories/educational-content.repository';
import type { WasteCategoryId } from '@/domain/value-objects/waste-category';

import type { ApiEducationalContentDto } from '../dto/api.schemas';

export type GuideSections = Pick<
  EducationalContent,
  'howToDispose' | 'whyRecycle' | 'environmentalImpact' | 'body'
>;

type Section = 'steps' | 'why' | 'impact' | 'body';

const HEADING = /^#{1,6}\s+(.+?)\s*#*$/;
const LIST_ITEM = /^(?:[-*+]|\d+[.)])\s+(.*)$/;

/** Which section a heading opens, by its words — tolerant to how the panel names them. */
function sectionOf(heading: string): Section {
  const text = heading.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  if (text.includes('impacto')) return 'impact';
  if (text.includes('por que') || text.includes('porque')) return 'why';
  if (text.includes('descart') || text.includes('como') || text.includes('passo')) return 'steps';
  return 'body';
}

/** Drops the inline Markdown the app can't render (bold, italics, code, links). */
function plain(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_|`)/g, '')
    .trim();
}

/**
 * Splits a guide's Markdown (`content` in ecoponto-api) into the sections the
 * guide screen shows. The convention, followed by the API seed, is three
 * headings: `## Como descartar` (a list of steps), `## Por que reciclar` and
 * `## Impacto ambiental`. Anything else — text before the first heading or
 * under another heading — goes to `body`, so nothing written in the panel is lost.
 */
export function parseGuideContent(markdown: string): GuideSections {
  const steps: string[] = [];
  const paragraphs: Record<Exclude<Section, 'steps'>, string[]> = { why: [], impact: [], body: [] };
  let current: Section = 'body';

  for (const rawLine of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = HEADING.exec(line);
    if (heading) {
      current = sectionOf(heading[1]);
      if (current === 'body') paragraphs.body.push(plain(heading[1]));
      continue;
    }

    const item = LIST_ITEM.exec(line);
    const text = plain(item ? item[1] : line);
    if (!text) continue;

    if (current === 'steps') steps.push(text);
    else paragraphs[current].push(item ? `• ${text}` : text);
  }

  return {
    howToDispose: steps,
    whyRecycle: paragraphs.why.join('\n'),
    environmentalImpact: paragraphs.impact.join('\n'),
    body: paragraphs.body.join('\n'),
  };
}

export function educationalContentFromApi(
  dto: ApiEducationalContentDto,
  category: WasteCategoryId,
): EducationalContent {
  return {
    id: dto.id,
    title: dto.title,
    summary: dto.summary,
    category,
    ...parseGuideContent(dto.content),
    // Only published guides reach the public routes; the creation date covers old rows.
    publishedAt: dto.publishedAt ?? dto.createdAt,
  };
}
