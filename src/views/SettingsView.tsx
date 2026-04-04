import { C } from "../constants/colors";
import { useAppServices } from "../services";

export function SettingsView() {
  const { runtime } = useAppServices();

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 24, letterSpacing: "-0.02em" }}>Configurações</h2>

      <div style={{ background: C.white, borderRadius: 16, padding: "24px 28px", border: `1px solid ${C.creamDark}`, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 4 }}>Perfil</div>
        <div style={{ fontSize: 13, color: C.grayLight }}>Breno Moreira</div>
        <div style={{ fontSize: 12, color: C.grayLighter }}>breno.moreira@rottasconstrutora.com.br</div>
      </div>

      <div style={{ background: C.white, borderRadius: 16, padding: "24px 28px", border: `1px solid ${C.creamDark}`, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 4 }}>API</div>
        <div style={{ fontSize: 13, color: C.grayLight }}>Backend URL: {runtime.apiUrl}</div>
      </div>

      <div style={{ background: C.white, borderRadius: 16, padding: "24px 28px", border: `1px solid ${C.creamDark}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 4 }}>Sobre</div>
        <div style={{ fontSize: 13, color: C.grayLight }}>PillarAI v0.1.0 — by Rottas</div>
      </div>
    </div>
  );
}
