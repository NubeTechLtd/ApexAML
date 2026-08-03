import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StickyNote } from 'lucide-react';

export type NoteVisibility = 'Internal only' | 'Shared with compliance team' | 'Escalation evidence';

export interface ComplianceNote {
  id: string;
  timestamp: string;
  analyst: string;
  content: string;
  visibility: NoteVisibility;
}

const VISIBILITIES: NoteVisibility[] = [
  'Internal only',
  'Shared with compliance team',
  'Escalation evidence',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: ComplianceNote) => void;
  /** Prefilled note body, e.g. an adverse media article reference. */
  initialContent?: string;
}

export function AddNoteSheet({ open, onOpenChange, onSave, initialContent }: Props) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<NoteVisibility>('Internal only');

  useEffect(() => {
    if (open) setContent(initialContent ?? '');
  }, [open, initialContent]);

  const valid = content.trim().length >= 10;

  const handleSave = () => {
    const note: ComplianceNote = {
      id: `NOTE-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      analyst: 'Current Analyst',
      content: content.trim(),
      visibility,
    };
    onSave(note);
    setContent('');
    setVisibility('Internal only');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" /> Add Compliance Note
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Note</Label>
            <Textarea
              placeholder="Compliance note… (min 10 characters)"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-[11px] text-muted-foreground">{content.trim().length}/10 characters minimum</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Visibility</Label>
            <Select value={visibility} onValueChange={v => setVisibility(v as NoteVisibility)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VISIBILITIES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" disabled={!valid} onClick={handleSave}>
            Save Note
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
