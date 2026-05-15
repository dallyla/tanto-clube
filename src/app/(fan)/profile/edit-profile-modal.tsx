"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const EMOJIS = [
  "🎵", "🎶", "🎸", "🎹", "🎺", "🎻", "🥁", "🎤", "🎧", "🎼",
  "🌟", "⭐", "🔥", "💫", "✨", "🎯", "🏆", "💎",
  "🦁", "🐺", "🦊", "🐉", "🌙", "☀️", "🌈",
];

export default function EditProfileModal({
  initialName,
  initialEmoji,
  initialAvatarUrl,
}: {
  initialName: string;
  initialEmoji: string;
  initialAvatarUrl?: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  // "image" when an uploaded photo is active, "emoji" otherwise
  const [mode, setMode] = useState<"image" | "emoji">(initialAvatarUrl ? "image" : "emoji");
  const [emoji, setEmoji] = useState(initialEmoji);
  const [imageFile, setImageFile] = useState<File | null>(null);
  // preview: new file object URL, or existing URL
  const [imagePreview, setImagePreview] = useState<string | null>(initialAvatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // revoke object URL when unmounted or file changes
  useEffect(() => {
    return () => {
      if (imageFile && imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imageFile, imagePreview]);

  function handleClose() {
    setName(initialName);
    setEmoji(initialEmoji);
    setMode(initialAvatarUrl ? "image" : "emoji");
    setImageFile(null);
    setImagePreview(initialAvatarUrl ?? null);
    setError(null);
    setOpen(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageFile && imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMode("image");
    e.target.value = "";
  }

  function handleEmojiPick(e: string) {
    setEmoji(e);
    setMode("emoji");
    setImageFile(null);
    if (imagePreview && imageFile) URL.revokeObjectURL(imagePreview);
    if (imageFile) setImagePreview(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (mode === "image" && imageFile) {
        const form = new FormData();
        form.append("file", imageFile);
        const res = await fetch("/api/user/avatar", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Erro ao enviar imagem"); return; }
      }

      // Always save name; save emoji only when in emoji mode
      const patch: Record<string, unknown> = { displayName: name };
      if (mode === "emoji") patch.avatarEmoji = emoji;

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }

      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Pencil trigger */}
      <button
        type="button"
        aria-label="Editar perfil"
        onClick={() => setOpen(true)}
        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M11.854.146a.5.5 0 0 0-.707 0l-1.5 1.5-.146.147 3.707 3.707.146-.147 1.5-1.5a.5.5 0 0 0 0-.707l-3-3ZM9.354 2.5 2.5 9.354V12.5h3.146L12.5 5.646 9.354 2.5ZM1.5 9.086 9.086 1.5 10.5 2.914 2.914 10.5H1.5V9.086Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* Modal */}
          <div
            className="w-full max-w-sm rounded-2xl flex flex-col gap-5 p-6"
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border-strong)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-display text-cream text-base font-semibold">Editar perfil</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-[color:var(--color-muted-foreground)] hover:text-cream text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[color:var(--color-muted-foreground)] text-xs">Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="w-full bg-transparent border border-[color:var(--color-border)] text-cream rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
              />
            </div>

            {/* Avatar */}
            <div className="flex flex-col gap-3">
              <label className="text-[color:var(--color-muted-foreground)] text-xs">Avatar</label>

              {/* Upload row */}
              <div className="flex items-center gap-3">
                {/* Preview or placeholder */}
                <div
                  className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    background: mode === "image" && imagePreview
                      ? "transparent"
                      : "linear-gradient(135deg, var(--color-cherry-deep), var(--color-cherry))",
                    border: mode === "image" ? "2px solid var(--color-gold)" : "2px solid transparent",
                  }}
                >
                  {mode === "image" && imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{emoji}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/10"
                    style={{
                      border: "1px solid var(--color-border)",
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    {/* Camera icon */}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    {mode === "image" && imagePreview ? "Trocar foto" : "Enviar foto"}
                  </button>
                  <p className="text-[color:var(--color-muted-foreground)] text-[10px]">
                    JPG, PNG ou WEBP · máx. 2 MB
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 divider-dashed" />
                <span className="text-[color:var(--color-muted-foreground)] text-[10px] uppercase tracking-wider">
                  ou escolha um emoji
                </span>
                <div className="flex-1 divider-dashed" />
              </div>

              {/* Emoji grid */}
              <div className="grid grid-cols-8 gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => handleEmojiPick(e)}
                    className={`text-xl py-1.5 rounded-lg transition-colors ${
                      mode === "emoji" && emoji === e
                        ? "bg-gold/20 ring-1 ring-gold"
                        : "hover:bg-white/5"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-cherry text-sm">{error}</p>}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-cherry hover:bg-cherry/80 disabled:opacity-50 text-cream font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
