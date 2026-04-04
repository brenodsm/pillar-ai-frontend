import { useState } from "react";
import { C } from "../../constants/colors";
import { EyeIcon } from "./AuthIcons";

/* ─── Password Strength ─── */
function getPasswordStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: C.creamDark };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Fraca", color: C.redStop },
    { label: "Fraca", color: C.redStop },
    { label: "Media", color: C.orange },
    { label: "Forte", color: C.green },
    { label: "Muito forte", color: C.green },
  ];
  return { score, ...levels[score] };
}

export function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: -4, marginBottom: 16 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            background: i <= score ? color : C.creamDark,
            transition: "background 0.3s",
          }}
        />
      ))}
      <span style={{ fontSize: 11, fontWeight: 600, color, marginLeft: 8, whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

/* ─── Text Input ─── */
export function TextInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 7 }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          height: 48,
          border: `1.5px solid ${focused ? C.orange : C.creamDark}`,
          borderRadius: 12,
          padding: "0 16px",
          fontFamily: "inherit",
          fontSize: 14,
          color: C.dark,
          background: C.white,
          outline: "none",
          transition: "border-color 0.2s",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

/* ─── Password Input ─── */
export function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 7 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            height: 48,
            border: `1.5px solid ${focused ? C.orange : C.creamDark}`,
            borderRadius: 12,
            padding: "0 48px 0 16px",
            fontFamily: "inherit",
            fontSize: 14,
            color: C.dark,
            background: C.white,
            outline: "none",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
          }}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </div>
  );
}
