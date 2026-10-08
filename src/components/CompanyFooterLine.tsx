type Props = {
  /** Colour/spacing utilities so the line can match each page's theme. */
  className?: string;
};

/**
 * Statutory company registration line, shown in the footer of every public page.
 * Must stay consistent with the UK Corporate Governance card on LandingPage.tsx
 * and the "Who we are" section of Privacy.tsx.
 */
export function CompanyFooterLine({ className = "text-muted-foreground" }: Props) {
  return (
    <p className={`text-xs leading-relaxed ${className}`}>
      NubeTech Ltd, registered in England and Wales, company number 11844857.
    </p>
  );
}
