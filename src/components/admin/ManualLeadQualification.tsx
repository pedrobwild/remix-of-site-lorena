import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, X } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { setManualLeadQualification } from "@/lib/manualLeadQualification.functions";

type Quality = "qualificado" | "descartado";

export function ManualLeadQualification({ leadId, name, value, onSaved }: {
  leadId: string; name: string | null; value?: string | null; onSaved: (status: Quality) => void;
}) {
  const save = useServerFn(setManualLeadQualification);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  async function qualify(status: Quality) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await save({ data: { leadId, status } });
      onSaved(result.status);
      setMessage({ error: false, text: result.engine === "enviado" ? "Qualificação salva no site e no Engine." : "Qualificação salva no site. O Engine recebe na próxima sincronização (até 1 hora)." });
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente." });
    } finally { setBusy(false); }
  }
  return <div className="grid gap-2 mt-2" aria-label={`Qualificação manual de ${name ?? "lead"}`} aria-busy={busy}>
    <span className="muted text-xs">{value ? "Qualificação manual" : "Qualificação automática"}</span>
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" className="min-h-11 bw-admin__qualification-btn" disabled={busy || value === "qualificado"} aria-pressed={value === "qualificado"} onClick={() => void qualify("qualificado")}><Check aria-hidden />Qualificado</Button>
      <Button size="sm" variant="outline" className="min-h-11 bw-admin__qualification-btn" disabled={busy || value === "descartado"} aria-pressed={value === "descartado"} onClick={() => void qualify("descartado")}><X aria-hidden />Não qualificado</Button>
      {(value === "qualificado" || value === "descartado") && <span className="text-xs" aria-live="polite">Marcado: {value === "qualificado" ? "Qualificado" : "Não qualificado"}</span>}
    </div>
    {message && <span className="text-xs" role={message.error ? "alert" : "status"}>{message.text}</span>}
  </div>;
}