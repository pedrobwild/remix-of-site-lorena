import { useRef, useState } from "react";
import { uploadBewildImage, deleteBewildImage } from "@/lib/bewildAdmin";

interface Props {
  label: string;
  value: string | null;
  /** Pasta lógica dentro do bucket — geralmente o slug do projeto. */
  folder: string;
  onChange: (url: string | null) => void;
  /** Notifica o pai quando há upload em andamento. */
  onBusyChange?: (busy: boolean) => void;
  hint?: string;
}

export default function BewildImageField({
  label,
  value,
  folder,
  onChange,
  onBusyChange,
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setBusyAndNotify(b: boolean) {
    setBusy(b);
    onBusyChange?.(b);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Arquivo precisa ser uma imagem.");
      return;
    }
    setError(null);
    setBusyAndNotify(true);
    try {
      const url = await uploadBewildImage(file, folder);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao subir a imagem.");
    } finally {
      setBusyAndNotify(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!value) return;
    const previous = value;
    onChange(null);
    await deleteBewildImage(previous);
  }

  return (
    <div className="admin-field admin-field--full">
      <label className="admin-field__label">{label}</label>
      {value ? (
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 8 }}>
          <img
            src={value}
            alt=""
            style={{
              width: 180,
              height: 135,
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid var(--admin-line, #e5e7eb)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              className="admin-btn"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? "Enviando…" : "Trocar imagem"}
            </button>
            <button
              type="button"
              className="admin-btn admin-link--danger"
              onClick={handleRemove}
              disabled={busy}
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="admin-btn"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Enviando…" : "Escolher imagem"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {hint && <p className="mono admin-hint" style={{ marginTop: 6 }}>{hint}</p>}
      {error && <p className="mono admin-hint" style={{ color: "#b00020", marginTop: 6 }}>{error}</p>}
    </div>
  );
}
