import { CompanyFooterLine } from "@/components/CompanyFooterLine";

export default function Unsubscribe() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center gap-5 px-6">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-400 mb-4">
          ApexAML
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Manage email preferences</h1>
        <p className="text-sm text-slate-300">
          Every email we send includes an unsubscribe link in its footer. Use that link to stop
          non-essential emails at this address — it takes effect immediately. You may still receive
          transactional messages you request yourself, such as a booking confirmation.
        </p>
      </div>

      <CompanyFooterLine className="text-slate-500" />
    </div>
  );
}
