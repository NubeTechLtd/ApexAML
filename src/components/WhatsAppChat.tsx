import { useState } from "react";
import { X } from "lucide-react";
import { WhatsAppIcon } from "@/components/landing/WhatsAppIcon";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

const CHAT_MESSAGE =
  "Hi ApexAML, I visited apexaml.com and I'd like to know more about the platform.";
const CHAT_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(CHAT_MESSAGE)}`;

const GREEN = "#25D366";

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-1 h-1 rounded-full bg-white animate-bounce"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

export function WhatsAppChat() {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const toggle = () => {
    setOpen((o) => !o);
    setHasUnread(false);
  };

  return (
    <div
      className="fixed right-5 z-50"
      style={{ bottom: "calc(1.25rem + 48px + 70px)" }}
      aria-live="polite"
    >
      {open && (
        <div
          className="mb-3 rounded-2xl overflow-hidden shadow-2xl bg-white border border-black/5"
          style={{ width: 280 }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ backgroundColor: GREEN }}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <WhatsAppIcon className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm leading-tight">ApexAML</div>
              <div className="text-[11px] text-white/70 leading-tight">
                Compliance team · Typically replies in 4 hours
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#ECE5DD] px-4 py-4">
            <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm text-[13px] text-slate-800 whitespace-pre-line leading-relaxed">
              {`👋 Hi there! I'm from the ApexAML compliance team.
Are you looking to achieve CBN AML compliance?
I can help you with:
→ A free CBN roadmap (2 minutes)
→ A product demo (30 minutes)
→ Pricing for your institution type

What brings you here today?`}
            </div>
          </div>

          <div className="p-3 bg-white">
            <a
              href={CHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: GREEN }}
            >
              Reply on WhatsApp →
            </a>
          </div>
        </div>
      )}

      <button
        onClick={toggle}
        aria-label="Chat with us on WhatsApp"
        className="relative flex items-center justify-center gap-2 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-full md:h-11 h-12 md:w-[140px] w-12 md:px-4 px-0"
        style={{ backgroundColor: GREEN }}
      >
        <WhatsAppIcon className="w-5 h-5 shrink-0" />
        <span className="hidden md:inline text-sm">Chat with us</span>
        <span className="hidden md:inline"><TypingDots /></span>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            1
          </span>
        )}
      </button>
    </div>
  );
}

export default WhatsAppChat;
