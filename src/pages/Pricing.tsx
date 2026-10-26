import { Seo } from "@/components/Seo";
import { MarketingPageShell } from "@/components/landing/MarketingPageShell";
import { PricingSection } from "@/components/landing/PricingSection";

export default function Pricing() {
  return (
    <MarketingPageShell>
      {(openBooking) => (
        <>
          <Seo title="ApexAML Pricing | Essential, Starter, Growth and IMTO plans"
            description="Monthly subscription plans for Nigerian fintechs, banks and IMTOs, plus the Professional Implementation Programme. Book a 30-minute walkthrough."
            path="/pricing" />
          <PricingSection onBookDemo={openBooking} />
        </>
      )}
    </MarketingPageShell>
  );
}
