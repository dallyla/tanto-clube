# TANTO Clube — Especificação do Projeto

Documento de contexto completo. Versão 1.0 — 13 de maio de 2026.

---

## 1. Visão geral

**Nome:** TANTO Clube
**Tagline:** O fã-clube oficial de Diego Martins
**O que é:** Webapp PWA gamificado onde fãs de Diego Martins conectam o perfil do Last.fm, acumulam pontos automaticamente conforme ouvem o artista (em qualquer plataforma — Spotify, YouTube Music, Apple Music etc), competem em rankings semanais e mensais, desbloqueiam badges colecionáveis e ganham prêmios físicos (adesivos personalizados e canecas exclusivas mensais).

**Por que Last.fm:** Em vez de pedir OAuth direto do Spotify/YouTube (problemático por questões de ToS e privacidade), usamos o Last.fm como fonte agnóstica. Last.fm faz "scrobbling" automático do que o usuário ouve em qualquer plataforma. A API é pública, gratuita e estável.

**Sobre o artista:** Diego Martins, 29 anos, cantor brasileiro, drag queen, vencedor do The Masked Singer Brasil, contrato com Universal Music. Recém-lançou (7 de maio de 2026) o álbum ao vivo "tanto, tudo ao mesmo tempo" com 18 faixas. Base de ~31k ouvintes mensais no Spotify. Tem show no Blue Note SP em 30 de maio.

**Por que TANTO Clube:** Nome direto referente ao primeiro álbum dele (TANTO, novembro/2025), funciona como guarda-chuva pra todo o universo do artista.

---

## 2. Identidade visual

**Direção estética:** "Camarim Pop" — glam intimista, luz quente de espelho de camarim, sensação de bastidor de show. Sofisticada mas com calor.

**Paleta:**
- Fundo principal: marrom escuro (#1a1410) ou bordô profundo (#2a0e15)
- Acento principal: ouro envelhecido (#c8a45c)
- Acento dourado claro: (#e0bc70)
- Acento dourado profundo: (#8b6f3a)
- Acento quente: vermelho cereja (#c4314b)
- Cherry profundo: (#8b1f33)
- Texto/neutro claro: creme (#f4ead5), bege (#e8dcc5)

**Tipografia:**
- Display: **Fraunces** (serifada moderna, dramática) — títulos e números grandes
- Manuscrita: **Caveat** — toques pessoais, etiquetas, marca "clube"
- Corpo: **Manrope** — UI, parágrafos, legível

**Tema:** Padrão escuro. Suporte a tema claro também (usuário escolhe nas configurações).

**Texturas/detalhes:** grain overlay sutil simulando filme, radial glow quente no fundo, bordas finas douradas em cards, divisores tracejados, sombras dramáticas, números do ranking em serifa italic.

**Referência visual fiel:** ver `tanto-clube-mockup.html` anexo. Reproduzir aquela linguagem nos componentes do app.

---

## 3. Sistema de pontos (3 camadas)

### Camada 1 — Base (volume puro)

| Ação | Pontos base |
|---|---|
| 1 scrobble de qualquer música do artista | 10 pts |
| 1 scrobble de música do álbum em foco (campanha ativa) | 30 pts |
| 1 scrobble nas primeiras 48h de lançamento | 50 pts |

### Camada 2 — Multiplicadores (configuráveis por campanha)

| Multiplicador | Efeito | Quando ativar |
|---|---|---|
| Campanha ativa | ×2 nos scrobbles do álbum específico | Sempre que tiver foco definido |
| Janela de lançamento | ×3 nos primeiros 7 dias após lançamento | Lançamentos novos |
| Hora pico coletiva | ×1.5 em horários definidos | Criar momentos de comunidade |
| Streak ativo | ×1.2 a ×2 (escala com dias) | Sempre ativo |

Multiplicadores se acumulam (multiplicam entre si).

### Camada 3 — Bônus pontuais

| Bônus | Pontos | Frequência |
|---|---|---|
| Streak diário (1 scrobble no dia) | 50 pts/dia | Diário |
| Marco de streak (7 dias) | 500 pts | Eventual |
| Marco de streak (14 dias) | 1.000 pts | Eventual |
| Marco de streak (30 dias) | 2.000 pts | Eventual |
| Marco de streak (60 dias) | 3.000 pts | Eventual |
| Marco de streak (100 dias) | 5.000 pts | Eventual |
| Artista #1 no top mensal do fã (Last.fm) | 1.000 pts | Mensal |
| Artista no top 5 mensal do fã | 300 pts | Mensal |
| Missão pontual completada (com print) | 100-500 pts | Sob demanda |

---

## 4. Caps anti-fraude (inegociáveis)

| Limite | Valor |
|---|---|
| Scrobbles válidos do álbum em foco/dia | 150 |
| Scrobbles válidos artista geral/dia | 200 |
| Scrobbles válidos por hora | 25 |
| Idade mínima da conta Last.fm pra cadastrar | 7 dias |
| Idade mínima pra receber prêmio físico | 30 dias |

**Outras regras:**
- Perfil Last.fm precisa estar público
- Revisão manual do top 10 antes do envio de qualquer prêmio físico
- Scrobbles só contam a partir da data de cadastro no app (não vale histórico retroativo)
- Last.fm já valida internamente: scrobble só conta após 50% da música ou 4 min ouvidos

---

## 5. Eras (estrutura de competição)

Cada mês tem **4 Eras** (semanas temáticas) + apuração mensal.

Cada Era tem:
- Nome temático (nome de música do álbum em foco)
- Datas (início e fim — domingo a domingo)
- Frase tema
- Multiplicadores ativos específicos
- Premiação semanal
- Badge irrecuperável

### Eras de maio/26

| Era | Datas | Nome | Emoji | Multiplicadores |
|---|---|---|---|---|
| I | 13-19 mai | Queda Livre | 🪂 | ×3 janela até 14/05 + ×2 álbum |
| II | 20-26 mai | You and I | 💫 | ×2 álbum + ×1.5 TANTO + ×1.2 singles |
| III | 27 mai - 2 jun | Hot Stuff | 🎤 | ×2 álbum + ×2.5 no dia 30/05 (show Blue Note) |
| IV | 3-9 jun | Tanto, Tudo | 👑 | ×2 álbum + ×1.5 tudo |

**Apuração mensal:** 10 de junho. Top Fã Maio/26 + sorteios.

---

## 6. Sistema de badges

5 categorias. Badges automáticas (conferidas pelo sistema ao atingir critério) e manuais (admin concede).

### Volume (espinha dorsal)

| Badge | Critério |
|---|---|
| 🥉 Ouvinte | 50 scrobbles totais |
| 🥈 Fã | 500 scrobbles totais |
| 🥇 Superfã | 2.000 scrobbles totais |
| 💎 Cult | 10.000 scrobbles totais |
| 👑 Diva | 25.000 scrobbles totais |

### Catálogo

| Badge | Critério |
|---|---|
| 🌱 Curioso | 5 músicas únicas do artista |
| 🗺️ Cartógrafo | Todas as músicas do álbum atual |
| 📚 Historiador | Pelo menos 1 música de cada álbum/single |
| 🎭 Persona | Ouviu TANTO e tanto, tudo na mesma semana |
| 🏆 Discografia Completa | 50% do catálogo completo |

### Temporais

| Badge | Critério |
|---|---|
| 🌅 Madrugador | Scrobble nas primeiras 6h de qualquer lançamento |
| ⭐ Day One | Scrobble nas primeiras 24h de um lançamento |
| 🎬 Maratonista | Ouviu o álbum inteiro em sequência |
| 🔥 Constante 7 | 7 dias consecutivos com scrobble |
| 🔥🔥 Constante 30 | 30 dias consecutivos |
| 🔥🔥🔥 Constante 100 | 100 dias consecutivos |

### Era (irrecuperáveis)

| Badge | Critério |
|---|---|
| 🪂 Em Queda Livre | Top 30 da Era I Maio/26 |
| 💫 You and I | Top 30 da Era II Maio/26 |
| 🎤 Hot Stuff Ao Vivo | Scrobble do álbum durante o show 30/05 (20h-23h) |
| 🎤✨ Bloco Especial Blue Note | Top 10 da Era III |
| 👑 Saga Completa Maio/26 | Completou as 4 Eras de Maio (esteve no top 30 de cada) |

### Top do Mês

| Badge | Critério |
|---|---|
| 🥇 Top Fã Maio/26 | Top 1 do mês |
| 🥈 Pódio Maio/26 | Top 2-3 |
| 🏅 Top 10 Maio/26 | Top 4-10 |
| 🎖️ Top 30 Maio/26 | Top 11-30 |
| 🏆 Top 100 Maio/26 | Top 31-100 |

---

## 7. Níveis de fã

Progressão visual baseada em pontos acumulados totais (não scrobbles brutos — inclui bônus e missões).

| Nível | Pontos acumulados | Benefício futuro |
|---|---|---|
| Iniciante | 0 - 1.000 | Acesso ao app |
| Ouvinte | 1.000 - 10.000 | Entra em sorteios |
| Fã | 10.000 - 50.000 | Desconto em loja oficial |
| Superfã | 50.000 - 200.000 | Acesso antecipado a lançamentos |
| Devoto | 200.000 - 500.000 | Conteúdo exclusivo + prioridade em ingressos |
| Top Fã | 500.000+ | Tudo + brindes em todo lançamento |

Benefícios são aspiracionais — implementados conforme parcerias forem fechadas.

---

## 8. Premiação

### Por Era (semanal)

| Posição | Prêmio |
|---|---|
| 🥇 Top 1 | Pack premium adesivos + badge da Era |
| 🥈 Top 2 | Pack normal adesivos + badge |
| 🥉 Top 3 | Pack normal adesivos + badge |
| Top 4-10 | Badge "Top 10 [Nome da Era]" |
| Top 11-30 | Badge "Top 30 [Nome da Era]" |

### Mensal

| Posição | Prêmio |
|---|---|
| 🥇 Top 1 | Caneca exclusiva do mês + pack premium + badge "Top Fã" |
| 🥈 Top 2-3 | Pack premium + badge "Pódio" |
| 🥉 Top 4-10 | Badge "Top 10" + sorteio de 2 packs normais entre eles |
| Top 11-30 | Badge "Top 30" |
| Top 31-100 | Badge "Top 100" |
| Mês completo (4 Eras ativas) | Badge "Mês Completo" + sorteio bônus |
| Sorteio extra entre ativos fora do top 10 | 1 pack normal |

### Operação "tanto, tudo" (campanha guarda-chuva)

Roda em paralelo até 30/06. Todo scrobble do álbum vale ×2 automaticamente. Ranking próprio.

---

## 9. Telas do app (lado do fã)

5 telas principais + cadastro/onboarding. Navegação inferior fixa no mobile, lateral no desktop.

### Tela 1 — Home (Dashboard)

Hierarquia de informação:
1. Era atual com countdown
2. Posição no ranking + movimento (↑↓)
3. Pontos da Era + gap pro próximo marco
4. Streak ativo (urgência diária)
5. Próxima badge mais perto
6. Eventos especiais (Blue Note quando próximo)
7. Top 3 atual

### Tela 2 — Ranking

4 tabs: **Era** (atual), **Mês** (acumulado), **Geral** (all-time), **Álbum** (Operação tanto, tudo).

- Linha visual de corte do Top 10 e Top 30
- Posição do próprio fã sempre destacada (linha flutuante se estiver fora da viewport)
- Anônimos aparecem como "Anônimo" + emoji aleatório (consistente por hash do username)
- Setas de movimento (↑↑, ↑, =, ↓, ↓↓)

### Tela 3 — Era Atual

- Hero card da Era com tema e countdown
- Multiplicadores ativos explicados
- Missões pontuais com upload de print (status: pendente, enviada, aprovada, rejeitada)
- Lista de prêmios da Era

### Tela 4 — Prêmios & Badges

- 2 tabs: Conquistadas / A conquistar
- Nível atual + progresso pro próximo
- Grid de badges (conquistadas coloridas, locked com gauge)
- Próximos prêmios físicos com posição atual
- Hall de Eras passadas (futuro)

### Tela 5 — Perfil

- Avatar (emoji aleatório ou foto subida pelo fã)
- Nome, nível, tempo de membro
- Estatísticas vindas do Last.fm (scrobbles totais, top música, streak, posição do artista no top dele)
- Conexão Last.fm (status, última sync, sincronizar agora)
- Configurações: modo anônimo, notificações, tema escuro/claro, e-mails
- Acesso ao regulamento, suporte, sair

### Onboarding (4 telas)

1. Boas-vindas com proposta do app
2. Conectar Last.fm (instruções + campo de username + aviso de perfil público)
3. Dados pessoais (nome/apelido, e-mail, aceite de termos)
4. Tutorial rápido em 3 cards (como ganhar pontos, ranking, prêmios)

---

## 10. Painel admin (9 seções)

Acesso por role no banco. Quem tem flag `admin=true` destrava o menu.

### Dashboard Admin
Métricas em tempo real: fãs cadastrados (+24h), scrobbles do mês, DAU/MAU, missões aguardando validação, alertas de padrão suspeito.

### Eras & Desafios
Listar, criar, editar, clonar, ativar, encerrar Eras. Campos: nome, emoji, frase tema, datas, multiplicadores configuráveis, premiação por faixa, badge especial.

### Missões Pontuais
Criar missões com print/validação manual. Status: ativa, programada, encerrada. Interface de validação em fila com atalhos (← rejeitar, → aprovar).

### Badges
Criar, editar, ver estatísticas (quantos fãs têm cada). Definir critério (automático ou manual), raridade, descrição.

### Fãs
Listar, buscar, filtrar (ativos, suspeitos). Por fã: ver perfil, editar, adicionar/remover pontos manualmente (com justificativa), conceder badge manual, suspender/banir.

### Apuração
Fechar Eras e meses. Mostrar top 10 com status de revisão (✅ revisado / ⚠️ não revisado). Botão confirmar apuração → trava ranking + concede badges + notifica vencedores + cria entradas em "Envio de Prêmios".

### Envio de Prêmios
Gerenciar logística. Status: pendente endereço, pronto pra envio, enviado, entregue. Imprimir etiqueta, marcar como enviado, reenviar lembrete.

### Relatórios
Streams gerados (estimativa de impacto), aquisição, engajamento (DAU, MAU, retenção 7d), custos. Exportar CSV/PDF.

### Configurações Gerais
Configurações do artista (nome, álbum em foco, álbuns disponíveis), API key Last.fm, configurações de e-mail/push, manutenção.

---

## 11. Validação técnica (Last.fm API)

### Endpoints principais usados

| Endpoint | Uso |
|---|---|
| `user.getRecentTracks` | Últimas músicas ouvidas com timestamp |
| `user.getTopArtists` | Top artistas do usuário por período |
| `user.getTopAlbums` | Top álbuns do usuário por período |
| `user.getTopTracks` | Top faixas do usuário por período |
| `user.getWeeklyAlbumChart` | Recorte semanal específico (range de datas) |
| `user.getInfo` | Idade da conta, verificar se perfil é público |
| `artist.getInfo` | Info do artista pra UI |

### Estratégia de polling

Não consultar em tempo real. Polling em background:
- A cada 1-6h por fã (ajustar conforme custo de API e tier do hosting)
- Priorizar fãs ativos nas últimas 24h
- Cache de 10-30min nos endpoints menos voláteis

### Cálculo de pontos

Não calcular tudo a cada polling. Estratégia:
1. Buscar scrobbles novos desde último timestamp salvo
2. Filtrar só os do artista
3. Aplicar caps diários e horários
4. Aplicar multiplicadores ativos no momento do scrobble
5. Persistir pontos com referência ao scrobble original (auditável)
6. Atualizar ranking incrementalmente

### Rate limit

5 requisições por segundo por IP. Suficiente, mas vale cachear.

---

## 12. Cronograma operacional

### Mês 1 (maio/jun 2026)

| Período | Marco |
|---|---|
| 13-15 mai | Setup técnico + contratação designer freelancer |
| 16-22 mai | Era I rodando + design system entregue |
| 19 mai | Anúncio Top 3 Era I |
| 20 mai | Início Era II + adesivos sendo produzidos |
| 25-28 mai | Adesivos prontos + primeiros envios (Eras I e II juntas) |
| 27 mai | Início Era III |
| 30 mai 20-23h | Show Blue Note + badge irrecuperável ativa |
| 3 jun | Início Era IV + pedido da Caneca Maio |
| 10 jun | Apuração mensal + anúncio Top Fã Maio/26 |
| 15-25 jun | Envio caneca + lote final de adesivos |

### Premiação total mês 1

- 1 caneca exclusiva (Top 1 mensal)
- 7 packs premium adesivos
- 11 packs normais adesivos
- **Total: 19 envios físicos**
- **Custo estimado: ~R$ 364/mês**

### Comunicação de envio

"Os vencedores são anunciados no primeiro dia útil após o fim de cada Era/mês. O envio dos prêmios físicos ocorre em até 30 dias após o anúncio do resultado, conforme prazo de produção e logística."

---

## 13. Notificações (PWA — MVP)

Apenas 4 tipos no MVP:

1. **Nova Era começou** — segunda 09:00 do início
2. **Vencedores anunciados** — segunda 12:00 após fim da Era
3. **Quebra de streak iminente** — 21:00 se não há scrobble do dia
4. **Resultado mensal** — dia 10 às 10:00

Adicionar depois (média prioridade):
- Subiu/desceu mais de 5 posições
- Nova missão pontual
- Missão validada (aprovada/rejeitada)
- Badge desbloqueada
- Blue Note começa em 1h (só dia 30/05)

---

## 14. Avatares

**Sistema misto:**

- Cadastro gera **avatar emoji automaticamente** baseado em hash do username
- Pool: 🪂 🌙 ⭐ 💫 🎭 🌈 👑 🦋 🔥 ⚡ 💎 🌹 🎤 🎵 🎧 🪩
- Cada emoji com cor de fundo aleatória da paleta
- Fã pode trocar emoji (gera outro) ou subir foto
- Modo anônimo: sempre emoji, mesmo se tiver foto

**Restrições da foto:**
- Tamanho máx: 2MB
- Formatos: JPG, PNG, WEBP
- Sem GIF animado
- Sem moderação manual no MVP

---

## 15. Privacidade e LGPD

- Política de privacidade clara antes do cadastro
- Consentimento explícito e granular (não checkbox pré-marcado)
- Direito ao apagamento (deletar conta + todos dados)
- Encarregado de Dados (DPO) formal
- Tokens e dados sensíveis criptografados em repouso
- Coletar mínimo: username Last.fm, nome/apelido, e-mail, CPF (só pra envio físico, opcional até ganhar)
- Endereço só pedido após ganhar prêmio (não no cadastro)
- Logs de acesso por tempo limitado (90 dias)

---

## 16. Regras de elegibilidade pra prêmio físico

- Endereço no Brasil (início)
- CPF válido (necessário pra envio + LGPD)
- Conta Last.fm ≥ 30 dias no momento da apuração
- Perfil Last.fm público e preenchido
- 7 dias pra confirmar endereço após notificação (senão passa pro próximo)
- Máximo 1 prêmio físico por mês por fã (distribuir entre comunidade)
- Suspeitos top 10 passam por revisão manual antes do envio

---

## 17. Tabelas do banco (sugestão inicial)

Base relacional. Adaptar conforme escolha do banco.

```
users
- id (uuid, pk)
- username (unique, lowercase)
- email (unique)
- lastfm_username (unique)
- avatar_emoji
- avatar_image_url (nullable)
- anonymous_mode (boolean)
- theme_preference (dark|light|system)
- push_enabled (boolean)
- email_enabled (boolean)
- is_admin (boolean)
- created_at
- updated_at

scrobbles
- id (uuid, pk)
- user_id (fk users)
- lastfm_track_name
- lastfm_artist_name
- lastfm_album_name
- played_at (timestamp do scrobble no Last.fm)
- counts_for_artist (boolean, denormalizado)
- counts_for_focus_album (boolean, denormalizado)
- created_at (quando importamos)

points_transactions
- id (uuid, pk)
- user_id (fk users)
- scrobble_id (fk scrobbles, nullable)
- mission_submission_id (fk mission_submissions, nullable)
- era_id (fk eras, nullable)
- base_points
- multipliers_applied (json)
- final_points
- reason (string descritiva)
- created_at

eras
- id (uuid, pk)
- name (ex: Queda Livre)
- emoji
- tagline
- starts_at
- ends_at
- multipliers (json: estrutura configurável)
- status (draft|scheduled|active|ended)
- prize_top1, prize_top2, prize_top3 (fk a prizes ou json)
- created_at, updated_at

missions
- id (uuid, pk)
- title
- description
- reward_points
- starts_at
- ends_at
- requires_screenshot (boolean)
- status (draft|active|ended)
- created_at

mission_submissions
- id (uuid, pk)
- mission_id (fk missions)
- user_id (fk users)
- screenshot_url
- description (texto do fã)
- status (pending|approved|rejected)
- reviewed_by (fk users, nullable)
- reviewed_at (nullable)
- created_at

badges
- id (uuid, pk)
- name
- emoji
- description
- category (volume|catalog|temporal|era|monthly_top|custom)
- criteria (json — definição do critério automático)
- is_irrecoverable (boolean)
- created_at

user_badges
- id (uuid, pk)
- user_id (fk users)
- badge_id (fk badges)
- earned_at
- era_id (fk eras, nullable — pra badges de Era específica)

streaks
- user_id (pk, fk users)
- current_days
- longest_days
- last_scrobble_date
- updated_at

prizes
- id (uuid, pk)
- name (ex: Pack Premium Adesivos)
- type (physical|digital)
- description
- created_at

prize_shipments
- id (uuid, pk)
- user_id (fk users)
- prize_id (fk prizes)
- era_id (fk eras, nullable)
- monthly_apuration_id (nullable)
- status (pending_address|ready|sent|delivered|expired)
- shipping_address (json)
- shipping_code
- notified_at
- address_confirmed_at
- sent_at
- delivered_at

rankings_snapshot
- id (uuid, pk)
- user_id (fk users)
- era_id (fk eras, nullable)
- month (YYYY-MM, nullable)
- ranking_type (era|monthly|overall|album_operation)
- position
- points
- created_at

audit_log (importante pra anti-fraude e suporte)
- id (uuid, pk)
- user_id (fk users, nullable)
- admin_id (fk users, nullable)
- action (string)
- target_type (string)
- target_id (uuid)
- details (json)
- created_at
```

---

## 18. Decisões já tomadas

- Hospedagem: **Vercel**
- Idioma da interface: **pt-BR**
- Código, comentários e nomes: **inglês**
- Stack: **a recomendar pelo Claude Code**
- Backend/DB: **a recomendar pelo Claude Code**
- Auth: **a recomendar pelo Claude Code** (preferência por solução com magic link e/ou OAuth social, sem senha)
- Storage de imagens: necessário pra prints e avatares (a recomendar)
- Tipografia: **Fraunces + Caveat + Manrope** (Google Fonts)
- PWA: sim, com manifest e service worker
- Tema escuro/claro: sim, usuário escolhe

---

## 19. Decisões pendentes (a alinhar com Claude Code)

- Sistema de jobs/cron pra polling do Last.fm (qual ferramenta, qual frequência)
- Sistema de e-mail transacional (Resend, SendGrid, Postmark?)
- Sistema de notificações push (Web Push API nativo? Solução pronta?)
- Estratégia de testes (Jest? Vitest? Playwright pra e2e?)
- Sistema de feature flags pra rollout gradual
- Estratégia de cache (Redis? Cache nativo do Next.js?)
- Internacionalização futura (estruturar pra suportar outros idiomas depois?)
- Estratégia de backup de banco
- Estratégia de monitoramento e error tracking (Sentry?)

---

## 20. Pendências fora do código (operacionais)

- Contratar designer freelancer (briefing pronto, R$ 600-1.200)
- Achar fornecedor de adesivos personalizados
- Achar fornecedor de canecas personalizadas
- Escrever regulamento oficial (LGPD + regras de prêmio)
- Plano de comunicação inicial (primeiros 3-7 dias divulgando)
- Conta no Last.fm pra obter API key
- Domínio (sugestão: tantoclube.com.br ou similar)

---

**Fim do documento de contexto. Versão 1.0 — 13/05/2026.**
