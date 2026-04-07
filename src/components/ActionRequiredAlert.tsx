import { C } from "../constants/colors";
import { Icon } from "./Icon";

export function ActionRequiredAlert() {
  return (
    <div
      style={{
        background: "rgba(224, 64, 64, 0.06)",
        border: "1px solid rgba(224, 64, 64, 0.25)",
        borderRadius: 10,
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1, display: "flex" }}>
        <Icon name="alertCircle" size={18} color={C.redStop} />
      </span>
      <div>
        <div style={{ fontWeight: 700, color: C.dark, fontSize: 13 }}>
          Ação necessária
        </div>
        <div style={{ color: C.redStop, fontSize: 12, marginTop: 2 }}>
          Você precisa definir um responsável para as ações destacadas acima.
        </div>
      </div>
    </div>
  );
}
