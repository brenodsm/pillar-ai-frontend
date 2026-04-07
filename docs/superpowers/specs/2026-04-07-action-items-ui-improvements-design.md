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
```

**Notas sobre implementação:**
- Usa Tailwind para padding, text-size, border-radius
- Cor `#FF9114` é a cor `C.orange` do design system (laranja-avermelhado conforme requisição)
- Inclui `role="status"` e `aria-live="polite"` para acessibilidade

### Mudança 2: Usar `MissingResponsibleTag` em 3 Locais

**Local 1 — TabsPanel.tsx (aba de ações, exibição de ação em renderização):**

Localizar linha ~225 onde renderiza `{responsible || "Sem responsável"}`:
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

**Local 2 — TabsPanel.tsx (aba da ata, seção de ações em renderização):**

Localizar linha ~1016 onde renderiza `{action.responsible || "Sem responsável"}`:
```tsx
// Antes
<strong>Responsável:</strong> {action.responsible || "Sem responsável"}

// Depois
<strong>Responsável:</strong> {action.responsible ? action.responsible : <MissingResponsibleTag size="small" />}
```

**Local 3 — HomeView.tsx (aviso de confirmação):**

Localizar linhas 155-159, substituir bloco inteiro:
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

Remover as linhas 317-319 que adicionam email como opção separada:
```tsx
// REMOVER isto:
if (participant.email?.trim()) {
  options.add(participant.email.trim());
}
```

**Resultado esperado:** O dropdown mostra APENAS `"Nome (email)"`, sem duplicação.

**Ao salvar a ação:**

Quando o usuário seleciona um responsável no dropdown, extrair apenas o email antes de enviar ao backend:

```tsx
// No onChange do select (linha ~976)
onChange={(e) => {
  const selectedValue = e.target.value; // "Ana Silva (ana@empresa.com)"
  
  // Extrair email do formato "Nome (email)"
  const emailMatch = selectedValue.match(/\(([^)]+)\)$/);
  const email = emailMatch?.[1]?.trim() || selectedValue.trim();
  
  // Validar que é um email (contém @)
  if (!email.includes('@')) {
    console.error('Invalid email selected:', selectedValue);
    return; // Ou mostrar erro ao usuário
  }
  
  setEditableActions(
    editableActions.map((item, i) =>
      i === itemIndex 
        ? { ...item, responsible: email } // Armazena apenas email
        : item
    )
  );
}}
```

**Data Flow:**
1. Dropdown mostra: `["Ana Silva (ana@empresa.com)", "Bruno (bruno@empresa.com)"]`
2. Usuário seleciona: `"Ana Silva (ana@empresa.com)"`
3. Antes de salvar: extrair email → `"ana@empresa.com"`
4. Backend recebe: `{ responsible: "ana@empresa.com" }`
5. Frontend renderiza: `"Ana Silva (ana@empresa.com)"` (do `formatParticipantOption`)

## Arquivos Afetados

- `src/components/MissingResponsibleTag.tsx` — novo arquivo, exportar normalmente (import direto)
- `src/components/TabsPanel.tsx` — importar tag, usar em 2 locais, remover duplicação no dropdown, atualizar onChange
- `src/views/HomeView.tsx` — importar tag, usar em aviso de confirmação

## Invariantes Preservados

- Responsável continua sendo armazenado e tratado como string (email)
- Backend sempre recebe apenas email como valor de `responsible`
- Frontend continua exibindo "Nome (email)" quando houver dado
- Lógica de validação (`isMissingActionResponsible`) continua igual
- Editable actions e action items continuam com mesma estrutura

## Fora do Escopo

- Mudanças na cor do design system
- Suporte a múltiplos responsáveis por ação
- Refatoração completa da lógica de dropdown (apenas remover duplicação)
- Salvar o mapeamento nome→email no backend (backend responsável por esse mapeamento)
