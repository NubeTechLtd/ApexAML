interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

/** Spam trap named "website": hidden from people and screen readers, filled by bots. */
export function HoneypotField({ id, value, onChange }: Props) {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label htmlFor={id}>Website</label>
      <input id={id} name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
