// Página de descadastro dos e-mails transacionais do site (/unsubscribe).
// Lê ?token= da URL, valida na edge function e confirma o descadastro.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type State = "validando" | "confirmar" | "ja-descadastrado" | "invalido" | "ok" | "erro";

const NAVY = "#11355B";
const CYAN = "#2F86B8";
const SAND = "#F2ECE1";

export default function UnsubscribePage() {
  const [state, setState] = useState<State>("validando");
  const [enviando, setEnviando] = useState(false);

  const token =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token") || ""
      : "";

  useEffect(() => {
    document.title = "Descadastro de e-mails — Bewild";
    if (!token) {
      setState("invalido");
      return;
    }
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    fetch(`${url}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: key },
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as {
          valid?: boolean;
          already_unsubscribed?: boolean;
        };
        if (res.ok && body.valid) {
          setState(body.already_unsubscribed ? "ja-descadastrado" : "confirmar");
        } else {
          setState("invalido");
        }
      })
      .catch(() => setState("erro"));
  }, [token]);

  async function confirmar() {
    setEnviando(true);
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      setState(error ? "erro" : "ok");
    } catch {
      setState("erro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: SAND,
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          maxWidth: 440,
          width: "100%",
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 8px 30px rgba(17, 53, 91, 0.08)",
        }}
      >
        <p
          style={{
            color: NAVY,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontSize: 13,
            margin: "0 0 16px",
          }}
        >
          Bewild
        </p>

        {state === "validando" && <p style={{ color: "#555" }}>Verificando seu link…</p>}

        {state === "confirmar" && (
          <>
            <h1 style={{ color: NAVY, fontSize: 22, margin: "0 0 12px" }}>
              Descadastrar e-mails
            </h1>
            <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
              Confirme abaixo para deixar de receber os e-mails deste site neste endereço.
            </p>
            <button
              type="button"
              onClick={confirmar}
              disabled={enviando}
              style={{
                marginTop: 20,
                background: CYAN,
                color: "#fff",
                border: 0,
                borderRadius: 8,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                minHeight: 48,
                opacity: enviando ? 0.6 : 1,
              }}
            >
              {enviando ? "Confirmando…" : "Confirmar descadastro"}
            </button>
          </>
        )}

        {state === "ok" && (
          <>
            <h1 style={{ color: NAVY, fontSize: 22, margin: "0 0 12px" }}>Tudo certo</h1>
            <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
              Este endereço foi descadastrado e não receberá mais esses e-mails.
            </p>
          </>
        )}

        {state === "ja-descadastrado" && (
          <>
            <h1 style={{ color: NAVY, fontSize: 22, margin: "0 0 12px" }}>Já descadastrado</h1>
            <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
              Este endereço já foi removido anteriormente. Nenhuma ação é necessária.
            </p>
          </>
        )}

        {state === "invalido" && (
          <>
            <h1 style={{ color: NAVY, fontSize: 22, margin: "0 0 12px" }}>Link inválido</h1>
            <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
              Este link de descadastro é inválido ou já foi utilizado.
            </p>
          </>
        )}

        {state === "erro" && (
          <>
            <h1 style={{ color: NAVY, fontSize: 22, margin: "0 0 12px" }}>Algo deu errado</h1>
            <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
              Não conseguimos concluir agora. Tente novamente em alguns minutos.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
