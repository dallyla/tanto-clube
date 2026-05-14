import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { Resend } from "resend";

// Lazy Resend instance — avoids throwing during build when RESEND_API_KEY is absent
function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  advanced: {
    database: {
      // Gera UUID em JS antes do insert — funciona com colunas text e uuid
      generateId: () => crypto.randomUUID(),
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            // "name" é mapeado para a coluna displayName; usa prefixo do email se vier vazio
            name: user.name || user.email.split("@")[0],
          },
        }),
      },
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Route verification through our custom loading page instead of the raw API
        const loadingUrl = url.replace("/api/auth/magic-link/verify", "/magic-link");
        // Em dev: usa onboarding@resend.dev (domínio sandbox do Resend)
        // Em prod: troque por noreply@tantoclube.com.br após verificar o domínio no Resend
        const from = process.env.NODE_ENV === "production"
          ? "TANTO Clube <noreply@tantoclube.com.br>"
          : "TANTO Clube <onboarding@resend.dev>";

        const { error } = await getResend().emails.send({
          from,
          to: email,
          subject: "Seu link de acesso ao TANTO Clube ✨",
          html: `
            <div style="font-family: Georgia, serif; background: #1a1410; color: #f4ead5; padding: 32px; max-width: 480px; margin: 0 auto; border-radius: 12px;">
              <h1 style="font-size: 28px; color: #c8a45c; margin-bottom: 8px;">TANTO Clube</h1>
              <p style="color: #e8dcc5; margin-bottom: 24px;">Clique no botão abaixo para entrar. O link expira em 10 minutos.</p>
              <a href="${loadingUrl}" style="display: inline-block; background: #c4314b; color: #f4ead5; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Entrar no clube
              </a>
              <p style="color: #8b6f3a; font-size: 12px; margin-top: 24px;">
                Se você não solicitou este link, ignore este e-mail.
              </p>
            </div>
          `,
        });
        if (error) console.error("[Resend] Falha ao enviar magic link:", error);
      },
      expiresIn: 600, // 10 minutos
    }),
  ],

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dias
    updateAge: 60 * 60 * 24,       // atualiza a cada 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // cache de 5 min no cookie
    },
  },

  user: {
    // Mapeia os campos base do Better Auth para os nomes das nossas colunas
    fields: {
      name: "displayName",
      image: "avatarUrl",
    },
    additionalFields: {
      // displayName não aparece aqui — já é mapeado de "name" acima
      lastfmUsername: { type: "string", required: false },
      isOnboarded: { type: "boolean", defaultValue: false },
      role: { type: "string", defaultValue: "fan" },
      totalPoints: { type: "number", defaultValue: 0 },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
