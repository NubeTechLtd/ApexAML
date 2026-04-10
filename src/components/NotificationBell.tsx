import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, FileText, ShieldAlert, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications, type NotificationType } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  SLA_BREACH: { icon: AlertTriangle, color: 'text-destructive' },
  CBN_CIRCULAR: { icon: FileText, color: 'text-[hsl(var(--risk-medium))]' },
  HIGH_RISK_ALERT: { icon: ShieldAlert, color: 'text-destructive' },
};

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center bg-destructive text-destructive-foreground border-0">
              {unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs text-muted-foreground" onClick={markAllRead}>
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-72">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
          ) : (
            notifications.map((n) => {
              const cfg = typeConfig[n.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors',
                    !n.read && 'bg-muted/30'
                  )}
                  onClick={() => {
                    markRead(n.id);
                    navigate(n.link);
                  }}
                >
                  <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-xs font-medium', n.read ? 'text-muted-foreground' : 'text-foreground')}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{n.relativeTime}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-0.5 px-1.5 text-[10px] text-muted-foreground shrink-0 mt-0.5"
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                    >
                      Read
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
