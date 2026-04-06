# Design: Ocultar RecordingPanel em Reuniões com Ata Confirmada

**Data:** 2026-04-06  
**Status:** Aprovado

## Problema

Quando um usuário abre uma reunião/ata já confirmada (`isAtaConfirmed === true`), o `HomeView` exibe o `RecordingPanel` junto ao `TabsPanel`. No estado `"finished"`, o `RecordingPanel` renderiza: label "Gravação finalizada", timer com a duração registrada, onda de áudio inativa e botão "Nova Gravação". Todo esse conjunto é ruído visual — a reunião está encerrada e confirmada, não há razão para exibir nenhum controle ou indicador de gravação.

## Solução

Condicionar a renderização do `RecordingPanel` em `HomeView.tsx` ao estado `isAtaConfirmed`, dentro do bloco `if (appState !== "idle")`, antes do condicional do `TabsPanel`:

- Se `isAtaConfirmed === false` → comportamento atual (RecordingPanel aparece)
- Se `isAtaConfirmed === true` → RecordingPanel não renderiza; apenas o `TabsPanel` é exibido

## Arquivo afetado

`src/views/HomeView.tsx` — dentro do bloco `if (appState !== "idle")`, antes do condicional do `TabsPanel`.

## Mudança

```tsx
// Antes
<RecordingPanel ... />

// Depois
{!isAtaConfirmed && <RecordingPanel ... />}
```

## Invariantes preservados

- Reuniões em gravação/processamento: `isAtaConfirmed` é sempre `false` nestes estados — o callback `onConfirmAta` só é executável quando `appState === "finished"`, então `"recording"` e `"processing"` não são afetados.
- Botão "Confirmar Ata" já é condicionado a `!isAtaConfirmed` → não muda.
- `TabsPanel` com o conteúdo da ata continua renderizando normalmente.
- Nenhum outro arquivo é alterado — `isAtaConfirmed` já é passado como prop ao `HomeView`.

## Fora do escopo

- Mudanças de tipo em `AppState`
- Alterações na lógica de persistência de estado
- Qualquer comportamento do `MeetingDetailModal` de calendário
