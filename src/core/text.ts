/**
 * Accent- and case-insensitive form of a text, for comparisons and search:
 * "São Vicente", "sao vicente" and " SAO VICENTE " all become "sao vicente".
 */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}
