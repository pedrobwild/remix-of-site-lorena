import { useId, useRef, useState } from "react";
import {
  BEWILD_IMAGE_ACCEPT,
  uploadBewildImage,
  validateBewildImageFile,
} from "@/lib/bewildAdmin";

interface Props {
  label: string;
  value: string | null;
  /** Pasta lógica dentro do bucket — geralmente o slug do projeto. */
  folder: string;
  onChange: (url: string | null) => void;
  /** Notifica o pai quando há upload em andamento. */
  onBusyChange?: (busy: boolean) => void;
  hint?: string;
  /** Pede confirmação antes de remover (ex.: projeto já publicado). */
  confirmRemoval?: boolean;
}

/**
 * Campo de uma foto (capa, antes, depois).
 *
 * "Remover" e "Trocar" só mexem no formulário. O arquivo antigo NÃO é
 * apagado aqui: a mesma URL pode ser a capa e uma foto da galeria, e o admin
 * ainda pode clicar em "Cancelar". A limpeza do storage acontece depois de um
 * save bem-sucedido, só para o que não é mais usado (projectImageCleanup.ts).
 */
export default function BewildImageField({
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
    const file = files[0];
    const invalid = validateBewildImageFile(file);
    if (invalid) {
      setError(invalid);
      if (inputRef.current) inputRef.current.value = "";
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

  function handleRemove() {
    if (!value) return;
    if (
      confirmRemoval &&
      !window.confirm(
        `Remover a foto "${label}"? O projeto está publicado: ela sai do site quando você salvar.`,
      )
    ) {
      return;
    }
    onChange(null);
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
        accept={BEWILD_IMAGE_ACCEPT}
        style={{ display: "none" }}
        aria-labelledby={labelId}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {hint && (
        <p className="mono admin-hint" id={hintId} style={{ marginTop: 6 }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mono admin-hint" role="alert" style={{ color: "#b00020", marginTop: 6 }}>
          {error}
        </p>
      )}
    </div>
  );
}
