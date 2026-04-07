import { C } from "../constants/colors";
import { Icon } from "./Icon";

export function ActionRequiredAlert() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div
        style={{
          background: "rgba(224, 64, 64, 0.06)",
          border: "1px solid rgba(224, 64, 64, 0.25)",
          borderRadius: 10,
          padding: "12px 16px",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 700, color: C.redStop, fontSize: 13 }}>
          Ação necessária
        </div>
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          <Icon name="alertCircle" size={16} color={C.redStop} />
        </span>
        <div style={{ color: C.redStop, fontSize: 13 }}>
          Defina um responsável para as ações
        </div>
      </div>
    </div>
  );
}
