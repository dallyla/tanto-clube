import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="font-display text-gold text-4xl font-semibold tracking-tight">
            TANTO
          </span>
          <span className="block font-script text-cream text-xl mt-1">
            Clube
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
