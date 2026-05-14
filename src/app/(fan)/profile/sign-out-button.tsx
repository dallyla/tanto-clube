"use client";

import { signOut } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => signOut().then(() => router.push("/login"))}
      className="w-full border border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)] hover:text-cream hover:border-cream text-sm font-medium py-3 rounded-xl transition-colors"
    >
      Sair da conta
    </button>
  );
}
