import { useRef, useState } from "react";
import { uploadBewildImage, deleteBewildImage } from "@/lib/bewildAdmin";

interface Props {
  label: string;
  value: string[];
  folder: string;
  onChange: (urls: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
}

export default function BewildGalleryField({
  label,
  value,
  folder,
  onChange,
  onBusyChange,
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
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setError("Selecione arquivos de imagem.");
      return;
    }
    setError(null);
    setBusyAndNotify(true);
    const next = [...value];
    try {
      for (const file of list) {
        const url = await uploadBewildImage(file, folder);
        next.push(url);
        onChange([...next]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao subir uma imagem.");
    } finally {
      setBusyAndNotify(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  async function remove(i: number) {
    const url = value[i];
    const next = value.filter((_, k) => k !== i);
    onChange(next);
    await deleteBewildImage(url);
  }

  return (
    <div className="admin-field admin-field--full">
      <label className="admin-field__label">{label}</label>

      {value.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 12,
          }}
        >
          {value.map((url, i) => (
            <div
              key={url + i}
              style={{
                border: "1px solid var(--admin-line, #e5e7eb)",
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <img
                src={url}
                alt=""
                style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
              />
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  padding: 6,
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                }}
              >
                <span className="mono" style={{ opacity: 0.6 }}>#{i + 1}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => move(i, -1)}
                    disabled={busy || i === 0}
                    aria-label="Subir"
                    style={{ padding: "2px 8px" }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => move(i, 1)}
                    disabled={busy || i === value.length - 1}
                    aria-label="Descer"
                    style={{ padding: "2px 8px" }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-link--danger"
                    onClick={() => remove(i)}
                    disabled={busy}
                    aria-label="Remover"
                    style={{ padding: "2px 8px" }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="admin-btn"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? "Enviando…" : value.length > 0 ? "+ adicionar mais fotos" : "Escolher fotos"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && (
        <p className="mono admin-hint" style={{ color: "#b00020", marginTop: 6 }}>
          {error}
        </p>
      )}
    </div>
  );
}
