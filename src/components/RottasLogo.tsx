import { C } from "../constants/colors";

export const RottasLogo = ({ size = 32, color = C.orange }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path d="M50 15 C50 15, 35 30, 35 42 C35 48, 42 50, 50 50 C58 50, 65 48, 65 42 C65 30, 50 15, 50 15Z" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <path d="M50 15 C50 15, 28 35, 28 42 C28 52, 40 55, 50 55 C60 55, 72 52, 72 42 C72 35, 50 15, 50 15Z" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
    <path d="M50 85 C50 85, 35 70, 35 58 C35 52, 42 50, 50 50 C58 50, 65 52, 65 58 C65 70, 50 85, 50 85Z" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <path d="M50 85 C50 85, 28 65, 28 58 C28 48, 40 45, 50 45 C60 45, 72 48, 72 58 C72 65, 50 85, 50 85Z" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
    <path d="M15 50 C15 50, 30 35, 42 35 C48 35, 50 42, 50 50 C50 58, 48 65, 42 65 C30 65, 15 50, 15 50Z" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <path d="M15 50 C15 50, 35 28, 42 28 C52 28, 55 40, 55 50 C55 60, 52 72, 42 72 C35 72, 15 50, 15 50Z" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
    <path d="M85 50 C85 50, 70 35, 58 35 C52 35, 50 42, 50 50 C50 58, 52 65, 58 65 C70 65, 85 50, 85 50Z" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <path d="M85 50 C85 50, 65 28, 58 28 C48 28, 45 40, 45 50 C45 60, 48 72, 58 72 C65 72, 85 50, 85 50Z" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
    <rect x="46" y="46" width="8" height="8" rx="2" fill={color} transform="rotate(45 50 50)"/>
  </svg>
);
