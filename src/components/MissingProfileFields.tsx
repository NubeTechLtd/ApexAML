/** Toast body listing the institution profile fields that block a live export. */
export function MissingProfileFields({ missing }: { missing: string[] }) {
  return (
    <div className="space-y-1">
      <p>Export blocked. An institution administrator must complete the institution profile in Settings first. Missing:</p>
      <ul className="list-disc pl-4">
        {missing.map((field) => <li key={field}>{field}</li>)}
      </ul>
    </div>
  );
}
