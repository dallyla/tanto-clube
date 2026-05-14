# Prompt inicial — TANTO Clube no Claude Code

## Como usar

1. Crie uma pasta nova pro projeto (ex: `~/projects/tanto-clube`)
2. Abra essa pasta no Claude Code
3. Cole o prompt abaixo na primeira mensagem
4. Anexe os 2 arquivos de referência: `tanto-clube-contexto.md` e `tanto-clube-mockup.html`

---

## Prompt

```
Vou construir o TANTO Clube — webapp gamificado de fã-clube do artista Diego Martins.
Os fãs conectam username do Last.fm, ganham pontos automaticamente conforme ouvem
o artista no Spotify/YouTube Music (Last.fm captura tudo), competem em rankings
semanais e mensais, desbloqueiam badges e ganham prêmios físicos (adesivos e canecas).

Anexei dois documentos de referência:

1. `tanto-clube-contexto.md` — especificação completa do projeto: sistema de pontos,
   Eras, badges, premiação, regras anti-fraude, painel admin e telas do app.

2. `tanto-clube-mockup.html` — mockup visual estático das 5 telas principais do
   app (Home, Ranking, Era Atual, Prêmios & Badges, Perfil) na direção estética
   "Camarim Pop" — paleta marrom escuro + dourado + bordô + creme, com Fraunces +
   Caveat + Manrope. Esse mockup é a referência visual fiel pro design system.

Restrições e preferências:

- Hospedagem: Vercel (já decidido)
- Stack frontend: sua recomendação justificada, considerando que o app é PWA
  com tema escuro/claro, precisa funcionar bem no mobile, e tem dashboard
  com leitura em tempo real de rankings
- Backend/database: sua recomendação justificada, considerando que precisa
  rodar jobs periódicos pra consultar a API do Last.fm (a cada 1-6h por fã)
  e calcular pontos
- Integração externa principal: Last.fm API (chave gratuita)
- Idioma da interface: pt-BR (mas código, comentários e nomes de variáveis em inglês)
- Deve ter painel admin separado pra criar/editar Eras, missões, badges,
  validar prints e gerenciar envio de prêmios

O que eu quero nesta primeira sessão:

1. Leia os dois documentos de referência com atenção
2. Me recomende a stack completa (frontend, backend, database, auth, jobs)
   justificando as escolhas pro contexto específico do projeto
3. Proponha a estrutura de pastas do projeto
4. Proponha o modelo de dados (tabelas principais e relacionamentos)
5. Liste as decisões técnicas que ainda precisam ser tomadas antes de codar
6. Me mostre um roadmap de implementação dividido em fases (do setup inicial
   até MVP funcional)

Não comece a codar ainda. Quero alinhar a arquitetura primeiro. Me faça
perguntas se algo estiver ambíguo nos documentos.
```

---

## Variação opcional — se você quer começar codando direto

Caso prefira pular o planejamento detalhado e ir direto pra implementação:

```
Vou construir o TANTO Clube — leia os documentos anexos (`tanto-clube-contexto.md`
e `tanto-clube-mockup.html`) e comece configurando o projeto com:

- Next.js 14+ com App Router, TypeScript, Tailwind CSS
- Hospedagem Vercel
- Database e auth: Supabase (Postgres + auth + storage)
- PWA habilitado com manifest e service worker
- Tema escuro/claro com a paleta "Camarim Pop" do mockup
- Estrutura de pastas pensada pra app + admin separados
- ESLint, Prettier, husky pre-commit
- Idioma da interface: pt-BR

Setup primeiro. Depois vamos pelo roadmap: design system → tela de cadastro
com Last.fm → dashboard → ranking → painel admin → integração Last.fm API
com jobs periódicos.

Comece criando o projeto e configurando tudo isso. Depois me mostre a
estrutura final pra eu validar antes de seguirmos.
```

---

## Dica de uso

Pra qualquer das duas versões, salve os 3 arquivos juntos:
- `prompt.md` (este arquivo)
- `tanto-clube-contexto.md` (o resumo completo do projeto)
- `tanto-clube-mockup.html` (o mockup visual)

E mantenha o arquivo de contexto atualizado conforme novas decisões forem
sendo tomadas — vai ser sua "memória do projeto" pra futuras sessões.
