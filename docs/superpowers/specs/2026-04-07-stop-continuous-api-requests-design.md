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

2. **Enquanto visualizando reunião**: O useEffect na linha 834 (`refreshMeetingMinutesState`) roda continuamente enquanto a reunião está aberta, mesmo sem mudanças. O useEffect na linha 810 (nota privada) também roda continuamente.

## Causa Raiz

- **Contexto 1**: Sidebar só chama `onReset()` para a view "home". Outras navegações deixam o estado sujo.
- **Contexto 2**: `refreshMeetingMinutesState` no useEffect (linha 834) é polling sem parada. `getMeetingNote` no useEffect (linha 810) também é polling contínuo. Após a carga inicial via `openMeetingById()`, não há razão para continuar fazendo GET repetidamente — só quando há edições (POST/PUT).

## Solução

### Parte A1: Limpar estado ao navegar (PREREQUISITO para B1)

Criar função `clearMeetingContext()` que reseta **todos** os estados relacionados à reunião aberta:
- `selectedMeeting` → null
- `currentMeetingId` → null
- `currentMinutesId` → null
- `currentMeetingSnapshot` → null
- `result` → null
- `ataText` → ""
- `isAtaConfirmed` → false
- `activeTab` → "notas" (default)
- `appState` → "idle"
- `showPanel` → false

**Implementação:**
1. Em `PillarAI.tsx`: Criar função `clearMeetingContext()` com toda a lógica acima
2. Passar para Sidebar como novo prop `onClearMeetingContext`
3. No Sidebar.tsx (linha 77), ao clicar em item: 
   - Se item.id !== "home" → chamar `onClearMeetingContext()` **antes** de `setSidebarView()`
   - Se item.id === "home" → continuar chamando `onReset()` como antes
   - Nota: "settings" (linha 105) também é uma navegação, então precisa limpar contexto

**Por que é pré-requisito:** Sem limpar `currentMeetingId` e `selectedMeeting`, os useEffects (linhas 810 e 834) vão continuar disparando mesmo em outras views.

### Parte B1: Remover polling contínuo (SÓ APÓS A1)

Remover **ambos** os useEffects de polling:

1. **useEffect linha 810** (nota privada):
```tsx
// REMOVER
useEffect(() => {
  if (!currentMeetingId || !selectedMeeting || appState !== "finished") return;
  let mounted = true;
  (async () => {
    try {
      const note = await notesService.getMeetingNote(currentMeetingId);
      if (mounted) setNotes(note.content || "");
    } catch (err) { ... }
  })();
  return () => { mounted = false; };
}, [appState, currentMeetingId, notesService, selectedMeeting]);
```

2. **useEffect linha 834** (minuta):
```tsx
// REMOVER
useEffect(() => {
  if (!currentMeetingId || !selectedMeeting || appState !== "finished") return;
  let mounted = true;
  (async () => {
    try {
      await refreshMeetingMinutesState(currentMeetingId);
    } catch (err) { ... }
  })();
  return () => { mounted = false; };
}, [appState, currentMeetingId, refreshMeetingMinutesState, selectedMeeting]);
```

**Ao invés disso**, chamar `refreshMeetingMinutesState()` **apenas** quando necessário (já existem essas chamadas):
- Após `handleAiRewrite()` (linha 875) — já existe
- Após `handleUpdateActionItems()` (linha 681) — já existe  
- Após `handleConfirmAta()` (linha 596) — já existe

A nota privada (`notes`) é carregada inicialmente em `openMeetingById()` e armazenada em `pastMeetings[].notes`. Se precisar sincronizar, é via POST (ex: usuário edita nota), não via GET polling.

## Arquivos afetados

- `src/PillarAI.tsx` — adicionar `clearMeetingContext()`, remover 2 useEffects (linhas 810-832 e 834-855), passar prop ao Sidebar
- `src/components/Sidebar.tsx` — receber prop `onClearMeetingContext`, chamar em onClick (linha 77 e 105)

## Mudanças Detalhadas

### PillarAI.tsx

```tsx
// Adicionar função (junto com resetRecording)
const clearMeetingContext = useCallback(() => {
  setSelectedMeeting(null);
  setCurrentMeetingId(null);
  setCurrentMinutesId(null);
  setCurrentMeetingSnapshot(null);
  setResult(null);
  setAtaText("");
  setIsAtaConfirmed(false);
  setActiveTab("notas");
  setAppState("idle");
  setShowPanel(false);
}, []);

// REMOVER useEffect (linhas 810-832): getMeetingNote polling
// REMOVER useEffect (linhas 834-855): refreshMeetingMinutesState polling

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

// Ao clicar em item do sidebar (linha 77)
onClick={() => {
  if (item.id !== "home") {
    onClearMeetingContext?.();
  }
  setSidebarView(item.id);
  if (item.id === "home") onReset();
}}

// Ao clicar em settings (linha 105)
onClick={() => {
  onClearMeetingContext?.();
  setSidebarView("settings");
}}
```

## Fluxo Completo

1. Usuário abre reunião A → `openMeetingById()` faz 3 GET iniciais, carrega dados em memória
2. Usuário visualiza/edita reunião A → sem polling automático (estados em memória)
3. Se editar ata (AI rewrite, ações, confirmar) → `refreshMeetingMinutesState()` é chamado explicitamente
4. Usuário navega para "Reuniões" → `clearMeetingContext()` reseta tudo
5. Usuário navega para reunião B → volta a fazer 3 GET iniciais (novo contexto)

## Invariantes preservados

- `openMeetingById()` continua fazendo as 3 requisições iniciais — apenas removemos o polling repetido
- `refreshMeetingMinutesState()` continua sendo chamado após edições
- `pastMeetings` array é preservado (não é zerado)
- Usuário pode navegar e voltar para mesma reunião — contexto é refrescado como nova abertura
- Sem Part A1, Part B1 causa stale state (não faça Part B1 sem A1)

## Impacto na Performance

- **Antes**: ~3 requisições por segundo enquanto reunião aberta = ~180 req/min (ou mais)
- **Depois**: 3 requisições iniciais por visita + 1-2 req por edição = ~5-10 req total por sessão de uma reunião

## Fora do escopo

- WebSocket/real-time sync
- Cache com stale-while-revalidate
- AbortController para cancelar requisições pendentes ao navegar
