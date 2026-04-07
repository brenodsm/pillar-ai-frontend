# Design: Redesign Visual dos Indicadores de Responsável em Ações

**Data:** 2026-04-07  
**Status:** Aprovado

## Problema

Os indicadores visuais de ausência de responsável em ações não comunicam adequadamente o estado:

1. O badge inline "Atribua um responsável" é um bloco laranja sólido — não parece um indicador de estado pendente.
2. O card da ação sem responsável não tem destaque visual — fica idêntico ao card com responsável.
3. Quando o responsável está atribuído, não há nenhum indicador visual positivo de confirmação.
4. O aviso acima do botão "Confirmar Ata" usa o mesmo componente de badge, mas deveria ser um alerta distinto com título e subtítulo.

## Solução

### Mudança 1: Novo ícone `alertCircle` em `Icon.tsx`

Adicionar o ícone `alertCircle` ao mapa de ícones existente:

```tsx
alertCircle: (
  <>
    <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="8" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16.5" r="1" fill={color} stroke="none"/>
  </>
),
```

Usado por `MissingResponsibleTag` (13px laranja) e `ActionRequiredAlert` (18px vermelho).

### Mudança 2: Redesign de `MissingResponsibleTag`

Substituir o badge sólido por um badge outlined:

```tsx
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
```

**Notas:**
- Prop `text` removida — texto agora é fixo "Atribuir responsável" (matching design)
- Fundo transparente, borda laranja, texto laranja
- Ícone `alertCircle` à esquerda

### Mudança 3: Novo componente `ActionRequiredAlert`

Criar `src/components/ActionRequiredAlert.tsx`:

```tsx
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
      <Icon name="alertCircle" size={18} color={C.redStop} style={{ flexShrink: 0, marginTop: 1 }} />
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
```

### Mudança 4: Card de ação em `TabsPanel.tsx` — estado visual condicional

No mapa `editableActions` (linha ~914), aplicar estilo condicional no card:

```tsx
const isMissing = isMissingActionResponsible(action.responsible);

<div
  key={`action-item-${index}`}
  style={{
    background: isMissing ? "rgba(255, 145, 20, 0.04)" : C.white,
    borderRadius: 12,
    border: `1px solid ${isMissing ? C.orange : C.creamDark}`,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    transition: "border-color 0.2s ease, background 0.2s ease",
  }}
>
```

Aplica-se **apenas no modo de visualização** (não-editing). No modo de edição, o card usa estilo padrão.

### Mudança 5: Checkmark verde para responsável atribuído em `TabsPanel.tsx`

No modo de visualização (linha ~1027), mostrar ✓ verde quando responsável está atribuído:

```tsx
// Antes
<strong>Responsável:</strong> {action.responsible ? action.responsible : <MissingResponsibleTag size="small" />}

// Depois
<strong>Responsável:</strong>{" "}
{action.responsible && !isMissingActionResponsible(action.responsible) ? (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    <Icon name="check" size={13} color={C.green} />
    <span style={{ color: C.green }}>{action.responsible}</span>
  </span>
) : (
  <MissingResponsibleTag size="small" />
)}
```

### Mudança 6: `HomeView.tsx` — substituir badge por `ActionRequiredAlert`

```tsx
// Antes
{hasActionWithoutResponsible && (
  <div style={{ marginBottom: 10 }}>
    <MissingResponsibleTag text="Atribua um responsável para todas as ações" />
  </div>
)}

// Depois
{hasActionWithoutResponsible && (
  <div style={{ marginBottom: 10 }}>
    <ActionRequiredAlert />
  </div>
)}
```

## Arquivos Afetados

- `src/components/Icon.tsx` — adicionar ícone `alertCircle`
- `src/components/MissingResponsibleTag.tsx` — redesign para outlined badge, remover prop `text`
- `src/components/ActionRequiredAlert.tsx` — novo arquivo
- `src/components/TabsPanel.tsx` — estilo condicional no card + checkmark verde na visualização
- `src/views/HomeView.tsx` — trocar `MissingResponsibleTag` por `ActionRequiredAlert`

## Invariantes Preservados

- Lógica de `isMissingActionResponsible` não muda
- `hasActionWithoutResponsible` não muda
- Responsável continua sendo armazenado e enviado como email
- Botão "Confirmar Ata" continua desabilitado quando há ações sem responsável
- Modo de edição do card não é afetado visualmente

## Fora do Escopo

- Redesign do modo de edição do card
- Mudanças no fluxo de atribuição de responsável
- Checkmark verde na aba da ata (seção de ações da ata gerada)
