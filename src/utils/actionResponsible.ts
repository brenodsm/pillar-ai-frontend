export function isMissingActionResponsible(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
  return normalized.length === 0 || normalized === "sem responsável" || normalized === "sem responsavel";
}
