# Design: Eliminar Requisições Contínuas Desnecessárias (Problema 2 - Transição Lenta)

**Data:** 2026-04-07  
**Status:** Aprovado

## Problema

Quando um usuário abre uma reunião, o frontend dispara 3 requisições continuamente:
- `GET /meetings/{id}` (meeting)
- `GET /meetings/{id}/minutes` (minuta/ata)
- `GET /meetings/{id}/notes` (nota privada)

Isso ocorre em dois contextos:

1. **Enquanto navegando**: Ao trocar de "Reuniões" para outra view (ex: "Acções"), os estados `selectedMeeting` e `currentMeetingId` não são zerados, então os useEffects continuam disparando requisições.

2. **Enquanto visualizando reunião**: O useEffect na linha 834 (`refreshMeetingMinutesState`) roda continuamente enquanto a reunião está aberta, mesmo sem mudanças.

## Causa Raiz

- **Contexto 1**: Sidebar só chama `onReset()` para a view "home". Outras navegações deixam o estado sujo.
- **Contexto 2**: `refreshMeetingMinutesState` no useEffect é um polling sem parada. Depois que a ata é carregada inicialmente, não há razão para continuar fazendo GET repetidamente.

## Solução

### Parte A1: Limpar estado ao navegar (Opção A1)

Criar função `clearMeetingContext()` que reseta:
- `selectedMeeting` → null
- `currentMeetingId` → null
- `currentMinutesId` → null
- `currentMeetingSnapshot` → null
- `appState` → "idle"
- `showPanel` → false

Chamar essa função no Sidebar quando o usuário clica em qualquer view que não seja "home" (meetings, acoes, calendario, recentes).

**Implementação:**
1. Em `PillarAI.tsx`: Criar função `clearMeetingContext()` com a lógica acima
2. Passar para Sidebar como novo prop `onClearMeetingContext`
3. No Sidebar, ao clicar em item (exceto "home"): chamar `onClearMeetingContext()` antes de `setSidebarView()`

### Parte B1: Remover polling contínuo (Opção B1)

Remover o `useEffect` na linha 834 que dispara `refreshMeetingMinutesState()` automaticamente.

Ao invés disso, chamar `refreshMeetingMinutesState()` **apenas** quando necessário:
- Após `handleAiRewrite()` (linha 875) — já existe
- Após `handleUpdateActionItems()` (linha 681) — já existe
- Após `handleConfirmAta()` (linha 596) — já existe

**Lógica**: Uma vez que a ata é carregada em `openMeetingById()`, o frontend tem tudo em memória. Só precisa refetch se o usuário editou algo via POST (AI rewrite, action items, confirmar ata).

## Arquivos afetados

- `src/PillarAI.tsx` — adicionar `clearMeetingContext()`, remover useEffect linha 834, passar prop ao Sidebar
- `src/components/Sidebar.tsx` — receber prop `onClearMeetingContext`, chamar em onClick

## Mudanças

### PillarAI.tsx

```tsx
// Adicionar função
const clearMeetingContext = useCallback(() => {
  setSelectedMeeting(null);
  setCurrentMeetingId(null);
  setCurrentMinutesId(null);
  setCurrentMeetingSnapshot(null);
  setAppState("idle");
  setShowPanel(false);
}, []);

// Remover useEffect linha 834:
// useEffect(() => {
//   if (!currentMeetingId || !selectedMeeting || appState !== "finished") return;
//   let mounted = true;
//   (async () => {
//     try {
//       await refreshMeetingMinutesState(currentMeetingId);
//     } catch (err) { ... }
//   })();
//   return () => { mounted = false; };
// }, [appState, currentMeetingId, refreshMeetingMinutesState, selectedMeeting]);

// Passar para Sidebar
<Sidebar
  ...
  onClearMeetingContext={clearMeetingContext}
/>
```

### Sidebar.tsx

```tsx
interface SidebarProps {
  ...
  onClearMeetingContext?: () => void;
}

// Ao clicar em item (linha 77)
onClick={() => {
  if (item.id !== "home") {
    onClearMeetingContext?.();
  }
  setSidebarView(item.id);
  if (item.id === "home") onReset();
}}
```

## Invariantes preservados

- `openMeetingById()` continua fazendo as 3 requisições iniciais para carregar reunião
- `refreshMeetingMinutesState()` continua sendo chamado após edições (AI rewrite, ações, confirmar)
- Usuário pode navegar e voltar para mesma reunião — estado é refrescado novamente
- useEffect na linha 810 (nota privada) também pode ser removido (ver Fora do Escopo)

## Impacto na Performance

- **Antes**: 3 requisições por segundo enquanto reunião aberta = ~180 req/min
- **Depois**: 1 requisição inicial + 1 req por edição = ~2-3 req total por visita

## Fora do escopo

- Remover useEffect da nota privada (linha 810) — pode ser feito em PR separado
- Implementar WebSocket/real-time sync — não necessário por enquanto
- Cache de requisições com stale-while-revalidate — pode melhorar mas não resolve o polling
