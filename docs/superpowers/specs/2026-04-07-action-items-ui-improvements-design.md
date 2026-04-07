# Design: Melhorias na UX de Ações (Action Items)

**Data:** 2026-04-07  
**Status:** Aprovado

## Problemas

**Problema 1:** Quando uma ação não tem responsável atribuído, aparece texto simples "Sem responsável". Não é visualmente claro que é um estado que precisa ser corrigido.

**Problema 2:** O aviso sobre responsáveis faltando (texto em vermelho) não tem destaque visual adequado. Deveria ser uma tag como em P1 para consistência.

**Problema 3:** Ao selecionar responsável, o dropdown mostra duas opções para cada participante: "nome (email)" e também apenas "email". Redundante e confuso.

## Solução

### Mudança 1: Novo Componente `MissingResponsibleTag`

Criar `src/components/MissingResponsibleTag.tsx`:

```tsx
interface MissingResponsibleTagProps {
  text?: string;
  size?: "small" | "medium";
}

export function MissingResponsibleTag({
  text = "Atribua um responsável",
  size = "medium",
}: MissingResponsibleTagProps) {
  return (
    <span style={{
      background: "#FF6B35", // laranja-avermelhado
      color: "#ffffff",
      padding: size === "small" ? "4px 8px" : "6px 12px",
      borderRadius: 6,
      fontSize: size === "small" ? 12 : 13,
      fontWeight: 600,
      whiteSpace: "nowrap",
      display: "inline-block",
    }}>
      {text}
    </span>
  );
}
```

### Mudança 2: Usar `MissingResponsibleTag` em 3 Locais

**Local 1 — TabsPanel.tsx (aba de ações, exibição de ação):**

Onde renderiza `{responsible || "Sem responsável"}` (linha ~675):
```tsx
// Antes
<div style={{ fontSize: 14, color: C.dark, fontWeight: 600 }}>
  {responsible || "Sem responsável"}
</div>

// Depois
<div style={{ fontSize: 14, color: C.dark, fontWeight: 600 }}>
  {responsible ? responsible : <MissingResponsibleTag size="small" />}
</div>
```

**Local 2 — TabsPanel.tsx (aba da ata, seção de ações):**

Onde renderiza `{action.responsible || "Sem responsável"}` (linha ~969):
```tsx
// Antes
<strong>Responsável:</strong> {action.responsible || "Sem responsável"}

// Depois
<strong>Responsável:</strong> {action.responsible ? action.responsible : <MissingResponsibleTag size="small" />}
```

**Local 3 — HomeView.tsx (aviso de confirmação):**

Substituir o texto de aviso por uma tag (linhas 155-159):
```tsx
// Antes
{hasActionWithoutResponsible && (
  <div style={{ marginBottom: 10, fontSize: 12.5, color: C.redStop }}>
    Defina um responsável para cada ação antes de confirmar a ata.
  </div>
)}

// Depois
{hasActionWithoutResponsible && (
  <div style={{ marginBottom: 10 }}>
    <MissingResponsibleTag text="Atribua um responsável para todas as ações" />
  </div>
)}
```

### Mudança 3: Limpar Duplicação no Dropdown de Responsáveis

**Em TabsPanel.tsx, função `responsibleOptions` (linhas 309-337):**

Remover as linhas que adicionam email como opção separada:
```tsx
// REMOVER isto:
if (participant.email?.trim()) {
  options.add(participant.email.trim());
}

// Resultado: o dropdown mostra APENAS "Nome (email)", não duplicação
```

**Ao salvar a ação:**

Quando o usuário seleciona um responsável no dropdown, extrair apenas o email antes de enviar ao backend:

```tsx
// No onChange do select (linha ~976)
onChange={(e) => {
  const selectedValue = e.target.value; // "Ana Silva (ana@empresa.com)"
  const email = selectedValue.match(/\(([^)]+)\)/)?.[1] || selectedValue; // Extrai "ana@empresa.com"
  
  setEditableActions(
    editableActions.map((item, i) =>
      i === itemIndex 
        ? { ...item, responsible: email } // Armazena apenas email
        : item
    )
  );
}}
```

**Renderização frontend:**

Quando exibir o responsável, usar `formatParticipantOption` ou lógica similar para recuperar "nome (email)" a partir do email armazenado. Esse matching já acontece naturalmente porque:
- O backend armazena: `"ana@empresa.com"`
- O frontend renderiza: encontra o participante com esse email → exibe `"Ana Silva (ana@empresa.com)"`

## Arquivos Afetados

- `src/components/MissingResponsibleTag.tsx` — novo arquivo
- `src/components/TabsPanel.tsx` — importar tag, usar em 2 locais, remover duplicação no dropdown
- `src/views/HomeView.tsx` — importar tag, usar em aviso de confirmação
- `src/components/index.ts` ou equivalente — exportar novo componente se houver

## Invariantes Preservados

- Responsável continua sendo armazenado e tratado como string
- Backend sempre recebe apenas email como valor de `responsible`
- Frontend continua exibindo "Nome (email)" quando houver dado
- Lógica de validação (`isMissingActionResponsible`) continua igual

## Fora do Escopo

- Mudanças na cor laranja-avermelhada se for considerada inadequada
- Refatoração da lógica de dropdown (apenas remover duplicação)
- Suporte a múltiplos responsáveis por ação
