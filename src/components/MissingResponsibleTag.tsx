interface MissingResponsibleTagProps {
  text?: string;
  size?: "small" | "medium";
}

export function MissingResponsibleTag({
  text = "Atribua um responsável",
  size = "medium",
}: MissingResponsibleTagProps) {
  const paddingClass = size === "small" ? "px-2 py-1" : "px-3 py-1.5";
  const textSizeClass = size === "small" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-block ${paddingClass} ${textSizeClass} rounded font-semibold text-white whitespace-nowrap`}
      style={{ backgroundColor: "#FF9114" }}
      role="status"
      aria-live="polite"
    >
      {text}
    </span>
  );
}
