const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

export function formatDateToBrDate(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const normalized = value.trim();
  const isoMatch = normalized.match(ISO_DATE_PREFIX);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
