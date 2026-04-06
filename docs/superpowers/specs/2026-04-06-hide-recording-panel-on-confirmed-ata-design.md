# Design: Ocultar RecordingPanel em Reuniões com Ata Confirmada

**Data:** 2026-04-06  
**Status:** Aprovado

## Problema

Quando um usuário abre uma reunião/ata já confirmada (`isAtaConfirmed === true`), o `HomeView` exibe o `RecordingPanel` (com botão "Nova Gravação") junto ao `TabsPanel`. Isso é ruído visual desnecessário — a reunião está encerrada e confirmada, não há razão para mostrar controles de gravação.

## Solução

Condicionar a renderização do `RecordingPanel` em `HomeView.tsx` ao estado `isAtaConfirmed`:

- Se `isAtaConfirmed === false` → comportamento atual (RecordingPanel aparece)
- Se `isAtaConfirmed === true` → RecordingPanel não renderiza; apenas o `TabsPanel` é exibido

## Arquivo afetado

`src/views/HomeView.tsx` — dentro do bloco `if (appState !== "idle")`, linha ~124.

## Mudança

```tsx
// Antes
<RecordingPanel ... />

// Depois
{!isAtaConfirmed && <RecordingPanel ... />}
```

## Invariantes preservados

- Reuniões em gravação/processamento: `isAtaConfirmed` é sempre `false` → sem impacto
- Botão "Confirmar Ata" já é condicionado a `!isAtaConfirmed` → não muda
- `TabsPanel` com o conteúdo da ata continua renderizando normalmente
- Nenhum outro arquivo é alterado

## Fora do escopo

- Mudanças de tipo em `AppState`
- Alterações na lógica de persistência de estado
- Qualquer comportamento do `MeetingDetailModal` de calendário
