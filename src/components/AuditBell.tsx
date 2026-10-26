import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useZoneHref } from '@/hooks/useZone';
import { Badge } from '@/components/ui/badge';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function AuditBell() {
  const { entries } = useAuditLog();
  const count = entries.length;
  const navigate = useNavigate();
  const auditHref = useZoneHref()('/audit');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" onClick={auditHref ? () => navigate(auditHref) : undefined} className="relative p-1.5 rounded-md hover:bg-muted transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {count > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center bg-destructive text-destructive-foreground border-0">
              {count}
            </Badge>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {count === 0 ? 'No audit actions' : `${count} regulatory action${count !== 1 ? 's' : ''} logged`}
      </TooltipContent>
    </Tooltip>
  );
}
