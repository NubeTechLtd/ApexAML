import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActiveFilterChipProps {
  label: string;
  onClear: () => void;
}

export function ActiveFilterChip({ label, onClear }: ActiveFilterChipProps) {
  return (
    <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs bg-primary/5 border-primary/30 text-primary">
      Filtered by: {label}
      <button onClick={onClear} className="rounded-full hover:bg-primary/10 p-0.5 transition-colors">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
