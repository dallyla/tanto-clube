"use client";

import { useState } from "react";
import { AddressForm } from "./address-form";
import { useRouter } from "next/navigation";

type Prize = {
  prizeAwardId: string;
  prizeName: string;
  prizeType: string;
  isPhysical: boolean;
  status: string;
};

export function AddressButtonClient({ prizes }: { prizes: Prize[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const target = prizes.find((p) => p.isPhysical && p.status === "address_pending");
  if (!target) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-3 px-4 py-2 rounded-xl text-sm font-bold"
        style={{
          background: "var(--color-gold)",
          color: "var(--color-bg-primary)",
          border: "none",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        📦 Informar endereço de entrega
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "20px",
              padding: "28px",
              maxWidth: "440px",
              width: "100%",
            }}
          >
            <AddressForm
              prizeAwardId={target.prizeAwardId}
              prizeName={target.prizeName}
              onSuccess={() => { setOpen(false); router.refresh(); }}
              onBack={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
