# Design: Ocultar RecordingPanel Após Ata Gerada (Problemas 1 + 3)

**Data:** 2026-04-07  
**Status:** Aprovado

## Problemas

**Problema 1:** Após gerar uma ata (parar gravação → processamento completo), o painel de gravação (timer, onda de áudio, status, botão "Nova Gravação") reaparece. Usuário deveria poder gravar apenas uma vez por reunião.

**Problema 3:** Ao abrir uma reunião com ata já confirmada, o painel de gravação pisca (aparece e desaparece rapidamente). Isso ocorre porque o painel renderiza por padrão, e só depois faz o check de `isAtaConfirmed`.

## Causa Raiz

Ambos os problemas existem porque o painel usa `!isAtaConfirmed` como condição de renderização, que é verificado **após** a renderização inicial. Uma ata pode estar gerada mas ainda não confirmada, resultando em `hasAta = true` mas `isAtaConfirmed = false`, fazendo o painel aparecer novamente.

## Solução

Mudar a condição de renderização do `RecordingPanel` em `HomeView.tsx` de `!isAtaConfirmed` para `!hasAta`. Isso garante que:

1. O painel renderiza apenas quando não há ata gerada (`hasAta = false`)
2. Uma vez que a ata é gerada (`hasAta = true`), o painel nunca mais aparece para aquela reunião
3. O check é feito antes da renderização, eliminando o flashing
4. O indicador `hasAta` é **independente** de `isAtaConfirmed`, permitindo que edições sejam bloqueadas sem afetar a visibilidade do painel

## Arquivo afetado

`src/views/HomeView.tsx` — dentro do bloco `if (appState !== "idle")`, antes do condicional do `TabsPanel`.

## Mudança

```tsx
// Antes
{!isAtaConfirmed && <RecordingPanel ... />}

// Depois
{!hasAta && <RecordingPanel ... />}
```

## Diferença: `hasAta` vs `isAtaConfirmed`

- **`hasAta`**: boolean que indica se a reunião foi gravada e a ata foi gerada (transcrita + minuta processada). Setado para `true` no final do pipeline de processamento em `stopRecording` (linha 567 em `PillarAI.tsx`).
- **`isAtaConfirmed`**: boolean que indica se a ata foi confirmada pelo usuário, bloqueando edições. Setado para `true` apenas quando `onConfirmAta` é executado.

Estado possível: `hasAta = true, isAtaConfirmed = false` (ata gerada mas ainda editável).

## Fluxo de uma gravação

1. Usuário inicia nova gravação → `hasAta = false` → `RecordingPanel` renderiza ✓
2. Para a gravação → transcrição + minuta processadas → `hasAta = true` → `RecordingPanel` some ✓
3. Usuário pode editar a ata → `isAtaConfirmed = false` → botões de edição visíveis ✓
4. Usuário clica "Confirmar Ata" → `isAtaConfirmed = true` → edições bloqueadas, `RecordingPanel` continua oculto ✓
5. Usuário fecha e reabre reunião → `hasAta = true` desde o início → sem flashing, `RecordingPanel` oculto ✓
6. Usuário inicia nova gravação diferente → `hasAta = false` para a nova reunião → `RecordingPanel` aparece ✓

## Invariantes preservados

- Uma reunião sempre tem seu próprio `hasAta` independente
- Edições de ata continuam bloqueadas quando `isAtaConfirmed = true`
- Botão "Confirmar Ata" continua usando `!isAtaConfirmed`
- Nenhum novo campo é adicionado
- Nenhum outro arquivo é alterado

## Fora do escopo

- Mudanças em `AppState`
- Alterações na lógica de confirmação de ata
- Qualquer comportamento do `MeetingDetailModal` de calendário
- Performance de transição (será endereçado separadamente)
