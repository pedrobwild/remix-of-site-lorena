import { useId, useRef, useState } from "react";
import {
  BEWILD_IMAGE_ACCEPT,
  uploadBewildImage,
  validateBewildImageFile,
} from "@/lib/bewildAdmin";

/** Atualização funcional: o pai aplica sobre o valor MAIS RECENTE do formulário. */
export type GalleryUpdate = (prev: string[]) => string[];

interface Props {
  label: string;
  value: string[];
  folder: string;
  onChange: (update: GalleryUpdate) => void;
  onBusyChange?: (busy: boolean) => void;
  /** Texto curto sob o rótulo (ex.: em que seção do site as fotos aparecem). */
  hint?: string;
  /** Pede confirmação antes de remover (ex.: projeto já publicado). */
  confirmRemoval?: boolean;
}

/**
 * Galeria de fotos. Remover só tira do formulário — o arquivo é apagado do
 * storage depois do save, e apenas se não estiver em uso (a capa costuma ser
 * a mesma URL da primeira foto). As mudanças são funcionais (`prev => …`)
 * para uploads longos não sobrescreverem fotos adicionadas no meio do caminho
 * (ex.: uma importação do Drive terminando durante o upload).
 */
export default function BewildGalleryField({
  label,
  value,
  folder,
  onChange,
  onBusyChange,
  hint,
  confirmRemoval,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labelId = useId();
  const hintId = useId();

  function setBusyAndNotify(b: boolean) {
    setBusy(b);
    onBusyChange?.(b);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const all = Array.from(files);
    const problems: string[] = [];
    const list = all.filter((f) => {
      const invalid = validateBewildImageFile(f);
      if (invalid) problems.push(invalid);
      return !invalid;
    });
    if (list.length === 0) {
      setError(problems.join(" ") || "Selecione arquivos de imagem.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(problems.length ? `${problems.length} arquivo(s) ignorado(s): ${problems.join(" ")}` : null);
    setBusyAndNotify(true);
    try {
      for (const file of list) {
        const url = await uploadBewildImage(file, folder);
        onChange((prev) => [...prev, url]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao subir uma imagem.");
    } finally {
      setBusyAndNotify(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(i: number, dir: -1 | 1) {
    const url = value[i];
    onChange((prev) => {
      const from = prev[i] === url ? i : prev.indexOf(url);
      const to = from + dir;
      if (from < 0 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  function remove(i: number) {
    const url = value[i];
    if (
      confirmRemoval &&
      !window.confirm(
        `Remover a foto #${i + 1} de "${label}"? O projeto está publicado: ela sai do site quando você salvar.`,
      )
    ) {
      return;
    }
    onChange((prev) => {
      const at = prev[i] === url ? i : prev.indexOf(url);
      return at < 0 ? prev : prev.filter((_, k) => k !== at);
    });
  }

  return (
    <div
      className="admin-field admin-field--full"
      role="group"
      aria-labelledby={labelId}
      aria-describedby={hint ? hintId : undefined}
    >
      <span className="admin-field__label" id={labelId}>
        {label}
      </span>
      {hint && (
        <p className="mono admin-hint" id={hintId} style={{ marginTop: 0, marginBottom: 8 }}>
          {hint}
        </p>
      )}

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
                    aria-label={`Subir foto ${i + 1}`}
                    style={{ padding: "2px 8px" }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => move(i, 1)}
                    disabled={busy || i === value.length - 1}
                    aria-label={`Descer foto ${i + 1}`}
                    style={{ padding: "2px 8px" }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-link--danger"
                    onClick={() => remove(i)}
                    disabled={busy}
                    aria-label={`Remover foto ${i + 1}`}
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
        accept={BEWILD_IMAGE_ACCEPT}
        multiple
        style={{ display: "none" }}
        aria-labelledby={labelId}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mono admin-hint" style={{ marginTop: 6 }}>
        JPG, PNG, WebP ou AVIF, até 15 MB por foto.
      </p>
      {error && (
        <p className="mono admin-hint" role="alert" style={{ color: "#b00020", marginTop: 6 }}>
          {error}
        </p>
      )}
    </div>
  );
}
