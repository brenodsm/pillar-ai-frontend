# API v1 Swagger Migration Design (Frontend)

Date: 2026-04-03  
Status: Draft aprovado para implementação  
Owner: Frontend

## 1. Objetivo

Atualizar o frontend para usar apenas o contrato Swagger atual da API Pilar AI (`/api/v1/*`), garantindo que todos os fluxos existentes no Swagger funcionem 100%:

1. Calendário
2. Reuniões
3. Transcrição
4. Atas (editar, confirmar, distribuir)
5. Notas privadas
6. Ações (listar atribuídas/organizadas e atualizar status)
7. Usuário autenticado (`/api/v1/me`)

## 2. Escopo e Não Escopo

### Escopo

1. Substituir rotas legadas por rotas Swagger.
2. Manter UX atual com camada de adaptação (mappers).
3. Ajustar UI para remover interações sem endpoint no Swagger.
4. Tratar erros operacionais e rate limiting de forma explícita.

### Não escopo

1. Refatoração visual ampla.
2. Codegen automático de SDK.
3. Implementar funcionalidades não presentes no Swagger.

## 3. Diagnóstico Atual

O frontend atual depende de endpoints legados e incompatíveis com o Swagger novo, por exemplo:

1. `/meetings/process`
2. `/meetings/rewrite`
3. `/meetings/send-minutes`
4. `/meetings/extract-actions`
5. `/users/resolve`
6. `/users/:email/meetings`
7. CRUD expandido de ações (`comments`, `attachments`, `history`, `reminders`, criação manual)

Consequência: incompatibilidade de payloads, semântica e respostas.

## 4. Arquitetura Proposta

### 4.1 Camadas

1. `api/config.ts`: catálogo novo de rotas Swagger.
2. `api/client.ts`: cliente HTTP único com envelope `{ status, data }` e erro padronizado.
3. `api/services/*`: serviços por domínio alinhados ao Swagger.
4. `api/mappers/*`: transformação do contrato Swagger para view models atuais da UI.
5. `services/contracts.ts`: contratos atualizados para representar operações reais suportadas.

### 4.2 Estratégia de migração

1. Trocar chamadas de dados mantendo a UI.
2. Onde não houver endpoint no Swagger, remover/ocultar ação de UI relacionada.
3. Minimizar mudanças de componente com adaptação em serviços e mappers.

## 5. Matriz de Endpoints e Uso no Frontend

### Usuário

1. `GET /api/v1/me`
2. Uso: identificar usuário autenticado no app.

### Calendário

1. `GET /api/v1/calendar/events?startDateTime&endDateTime`
2. Uso: views de calendário e seleção de reunião.

### Reuniões

1. `GET /api/v1/meetings`
2. `POST /api/v1/meetings`
3. `GET /api/v1/meetings/{id}`
4. `PATCH /api/v1/meetings/{id}`
5. `POST /api/v1/meetings/{id}/participants`
6. `DELETE /api/v1/meetings/{id}/participants/{participantId}`
7. `POST /api/v1/meetings/{id}/recording/start`

### Transcrição

1. `POST /api/v1/meetings/{id}/transcription`
2. `GET /api/v1/meetings/{id}/transcription`

### Ata

1. `GET /api/v1/meetings/{id}/minutes`
2. `PATCH /api/v1/meetings/{id}/minutes`
3. `POST /api/v1/meetings/{id}/minutes/confirm`
4. `POST /api/v1/meetings/{id}/minutes/distribute`

### Notas privadas

1. `GET /api/v1/meetings/{id}/notes`
2. `PUT /api/v1/meetings/{id}/notes`

### Ações

1. `GET /api/v1/actions/assigned`
2. `GET /api/v1/actions/organized`
3. `PATCH /api/v1/actions/{id}/status`

## 6. Mapeamento de Dados (Swagger -> UI)

### 6.1 SessionUser

Fonte: `GET /api/v1/me`

1. `email <- data.email`
2. `display_name <- data.name`

### 6.2 CalendarMeeting

Fonte: `GET /api/v1/calendar/events`

1. `id <- event.id`
2. `subject <- event.subject`
3. `location <- event.location`
4. `start <- parse EventDateTime(start.dateTime, start.timeZone)`
5. `end <- parse EventDateTime(end.dateTime, end.timeZone)`
6. `organizer <- event.organizer`
7. `attendees <- event.attendees` (map `name`, `email`)

### 6.3 Actions board model

Fontes: `assigned`, `organized`, `patch status`

1. `id <- action.id`
2. `title <- action.description` (fallback de apresentação)
3. `description <- action.description`
4. `deadline <- action.dueDate`
5. `status <- action.status`
6. `effective_status <- action.status`
7. `meeting_id <- action.meetingId`
8. `meeting_title <- action.meeting.title`
9. `responsible_email <- action.responsible.email`
10. Campos sem equivalente no Swagger recebem default seguro de UI.

### 6.4 ProcessResult (view model local para compatibilidade)

Fonte combinada: `meeting + transcription + minutes`

1. `meeting_id <- meeting.id`
2. `minutes_id <- minutes.id`
3. `transcription.text <- transcription.transcription`
4. `transcription.language <- "unknown"`
5. `transcription.segments <- []`
6. `minutes.title <- minutes.content.title`
7. `minutes.date <- meeting.scheduledAt || meeting.createdAt`
8. `minutes.participants <- minutes.content.participants[].name|email`
9. `minutes.summary <- minutes.content.summary`
10. `minutes.topics <- minutes.content.topics.map(t => { title: t, discussion: "" })`
11. `minutes.action_items <- minutes.content.actions` com mapeamento de responsável/prazo
12. `minutes.decisions <- []` (não presente no contrato)
13. `minutes.next_steps <- ""` (não presente no contrato)

## 7. Regras de Fluxo

### 7.1 Fluxo de reunião ao vivo

1. Criar reunião (`POST /meetings`) ao iniciar fluxo.
2. Iniciar gravação lógica no backend (`POST /meetings/{id}/recording/start`).
3. Após stop local, enviar áudio (`POST /meetings/{id}/transcription`) e tratar `202`.
4. Polling de status até reunião ficar `done`.
5. Ler transcrição (`GET /transcription`) e ata (`GET /minutes`).

### 7.2 Edição de ata por IA

1. Substituir rota legada de rewrite por `PATCH /meetings/{id}/minutes` com `instruction`.
2. Atualizar editor com resposta `MinutesResponse` retornada.

### 7.3 Confirmação de ata e ações

1. Substituir extração/criação manual por `POST /meetings/{id}/minutes/confirm`.
2. Após confirmação, recarregar ações de `assigned/organized`.
3. Remover etapa de aprovação manual baseada em endpoint legado.

### 7.4 Distribuição

1. Substituir envio legado por `POST /meetings/{id}/minutes/distribute`.
2. Mostrar retorno de sucesso e status de reenvio.

### 7.5 Notas privadas

1. Ao abrir reunião, tentar `GET /notes`.
2. Se `404`, tratar como "sem nota ainda" (estado vazio).
3. Persistir com `PUT /notes`.

### 7.6 Ações

1. Board monta dataset unindo `assigned` + `organized` (dedupe por `id`).
2. Drag/drop ou botões de coluna chamam `PATCH /actions/{id}/status`.
3. Filtros suportados: `limit`, `offset`, `status`, `meeting_id`.

## 8. Ajustes de UI obrigatórios por aderência ao contrato

1. Remover tabs e carregamentos de:
   - comentários de ação
   - anexos de ação
   - lembretes de ação
   - histórico de ação
2. Remover chamadas de criação/edição completa de ação fora do que o Swagger permite.
3. Manter apenas mudança de status de ação.
4. Manter telas de calendário, reunião, transcrição, ata, notas e distribuição.

## 9. Tratamento de Erros e Rate Limit

### 9.1 Regras gerais

1. `400`: erro de validação com detalhamento de campo.
2. `401`: sessão inválida/não autenticada.
3. `403`: sem permissão (notas privadas quando aplicável).
4. `404`: recurso inexistente ou não pertencente ao usuário.
5. `409`: estado inválido do fluxo (ex.: transcrição ainda não pronta).
6. `413`: payload maior que limite (áudio/nota/instrução).
7. `429`: rate limiting com leitura de headers (`Retry-After`, `X-RateLimit-*`).
8. `500/502`: erro interno/dependência externa.

### 9.2 UX mínima de erro

1. Banner local por seção com ação de retry.
2. Mensagens específicas para `409`, `413` e `429`.
3. Não colapsar o app inteiro por erro de endpoint isolado.

## 10. Plano de Testes

### 10.1 Unitário

1. Mappers Swagger -> UI:
   - usuário
   - calendário
   - ações
   - minutes/transcription para `ProcessResult`
2. Parsing de erros (`ApiError`) por status.

### 10.2 Integração (serviços)

1. Cada serviço chama rota correta, método correto e payload correto.
2. Cobertura para respostas `200/201/202/204` e erros críticos (`401/404/409/429`).

### 10.3 E2E funcional

1. Login -> carregar `/me`.
2. Carregar calendário em janela de 30 dias.
3. Criar reunião, iniciar gravação, subir áudio, acompanhar processamento.
4. Ler transcrição e ata.
5. Editar ata via instrução natural.
6. Confirmar ata.
7. Reenviar ata por e-mail.
8. Listar ações e mover status entre colunas.
9. Ler/salvar nota privada.

## 11. Critérios de Aceite

1. Não há chamadas para rotas legadas no código.
2. Todos os fluxos Swagger listados no item 1 funcionam ponta a ponta.
3. Features sem endpoint no Swagger não geram erro em runtime (ficam ocultas/removidas).
4. Build e testes relevantes passam.
5. Mensagens de erro para `409`, `413` e `429` foram validadas.

## 12. Riscos e Mitigações

1. Diferença de timezone em `EventDateTime`:
   - Mitigação: mapper centralizado + testes de data.
2. Polling de transcrição/ata gerar carga excessiva:
   - Mitigação: backoff progressivo e stop automático ao concluir.
3. Quebra por remoção de tabs legadas:
   - Mitigação: ajuste de navegação e fallback visual simples.
4. Inconsistência temporária após confirmar ata:
   - Mitigação: refresh de ações após confirmação e feedback de status.
