import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CompanyFooterLine } from "@/components/CompanyFooterLine";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "ready" | "already" | "invalid" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setState("invalid");
        else if (data.valid) setState("ready");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    if (error || !data?.success) setState(data?.reason === "already_unsubscribed" ? "already" : "error");
    else setState("done");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center gap-5 px-6">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-400 mb-4">
          ApexAML
        </div>

        {state === "loading" && <p className="text-sm text-slate-300">Checking your link…</p>}

        {state === "ready" && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">Unsubscribe?</h1>
            <p className="text-sm text-slate-300 mb-6">
              You'll stop receiving further ApexAML emails at this address. You may still receive
              transactional messages you request yourself.
            </p>
            <Button onClick={confirm} className="bg-blue-700 hover:bg-blue-800 text-white">
              Confirm unsubscribe
            </Button>
          </>
        )}

        {state === "submitting" && <p className="text-sm text-slate-300">Processing…</p>}

        {state === "done" && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">You're unsubscribed</h1>
            <p className="text-sm text-slate-300">Your address has been removed. Sorry to see you go.</p>
          </>
        )}

        {state === "already" && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">Already unsubscribed</h1>
            <p className="text-sm text-slate-300">This address is no longer on our list.</p>
          </>
        )}

        {state === "invalid" && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">Invalid link</h1>
            <p className="text-sm text-slate-300">
              This unsubscribe link is missing or expired. Reply to any email from us and we'll remove
              you manually.
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-300">Please try again or reply to any email from us.</p>
          </>
        )}
      </div>

      <CompanyFooterLine className="text-slate-500" />
    </div>
  );
}
