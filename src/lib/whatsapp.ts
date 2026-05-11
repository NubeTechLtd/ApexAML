export const WHATSAPP_NUMBER = '2348XXXXXXXX';
export const WHATSAPP_DEFAULT_MESSAGE = "Hi, I'm interested in ApexAML AML for my institution.";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;

export function buildWhatsAppUrl(message?: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message ?? WHATSAPP_DEFAULT_MESSAGE)}`;
}
