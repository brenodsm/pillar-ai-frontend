import { Icon } from "./Icon";

interface MissingResponsibleTagProps {
  size?: "small" | "medium";
}

export function MissingResponsibleTag({ size = "medium" }: MissingResponsibleTagProps) {
  const paddingClass = size === "small" ? "px-2 py-0.5" : "px-3 py-1";
  const textSizeClass = size === "small" ? "text-xs" : "text-sm";
  const iconSize = size === "small" ? 13 : 15;

  return (
    <span
      className={`inline-flex items-center gap-1 ${paddingClass} ${textSizeClass} rounded font-semibold whitespace-nowrap`}
      style={{ border: "1.5px solid #FF9114", color: "#FF9114" }}
      role="status"
      aria-live="polite"
    >
      <Icon name="alertCircle" size={iconSize} color="#FF9114" />
      Atribuir responsável
    </span>
  );
}
