#!/bin/bash
# Adiciona as variáveis do .env.local como Development no Vercel
# Uso: bash scripts/add-dev-env.sh

set -e

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE não encontrado. Execute na raiz do projeto."
  exit 1
fi

VARS=(
  BETTER_AUTH_SECRET
  CRON_SECRET
  DATABASE_URL
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  LASTFM_API_KEY
  NEXT_PUBLIC_APP_URL
  NEXT_PUBLIC_SENTRY_DSN
  NEXT_PUBLIC_VAPID_PUBLIC_KEY
  RESEND_API_KEY
  SENTRY_AUTH_TOKEN
  SENTRY_ORG
  SENTRY_PROJECT
  UPSTASH_REDIS_REST_TOKEN
  UPSTASH_REDIS_REST_URL
  VAPID_PRIVATE_KEY
  VAPID_SUBJECT
)

for VAR in "${VARS[@]}"; do
  # extrai o valor do .env.local (ignora linhas de comentário)
  VALUE=$(grep -E "^${VAR}=" "$ENV_FILE" | head -1 | cut -d'=' -f2-)

  if [ -z "$VALUE" ]; then
    echo "⏭  $VAR — vazio, pulando"
    continue
  fi

  echo "➕ Adicionando $VAR ao ambiente Development..."
  printf '%s\n' "$VALUE" | vercel env add "$VAR" development 2>&1 | grep -v "^$" || true
done

echo ""
echo "✅ Concluído! Agora rode: vercel env pull .env.local"
