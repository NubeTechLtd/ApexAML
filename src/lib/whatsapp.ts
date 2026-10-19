// Single source of truth for the WhatsApp contact number and prefill message.
export const WHATSAPP_NUMBER = '2349168062988';
export const WHATSAPP_DEFAULT_MESSAGE = "Hi ApexAML, I'd like to talk about AML compliance.";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;

export function buildWhatsAppUrl(message?: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message ?? WHATSAPP_DEFAULT_MESSAGE)}`;
}
