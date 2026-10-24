import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Check } from 'lucide-react';

type Change = { id: string; actor_email: string; target_email: string; action: string; role: string; justification: string; created_at: string };
type Notice = { id: string; change_id: string; read_at: string | null };

export function PlatformRoleChanges() {
  const [changes, setChanges] = useState<Change[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const [history, notifications] = await Promise.all([
      supabase.from('platform_role_changes').select('id,actor_email,target_email,action,role,justification,created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('platform_role_notifications').select('id,change_id,read_at').is('read_at', null),
    ]);
    setError(history.error?.message ?? notifications.error?.message ?? '');
    setChanges(history.data ?? []); setNotices(notifications.data ?? []); setLoading(false);
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 30_000); return () => window.clearInterval(timer); }, [load]);
  const markRead = async (id: string) => {
    const { error } = await supabase.rpc('mark_platform_notification_read', { _id: id });
    if (error) setError(error.message); else await load();
  };
  return <section className="space-y-3" aria-labelledby="platform-role-changes">
    <div className="flex items-center justify-between gap-3">
      <h2 id="platform-role-changes" className="text-sm font-semibold">Platform role changes {notices.length > 0 && <Badge variant="secondary">{notices.length} unread</Badge>}</h2>
      <Button variant="ghost" size="icon" aria-label="Refresh platform role changes" disabled={loading} onClick={() => void load()}><RefreshCw className="h-4 w-4" /></Button>
    </div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : changes.length === 0 ? <p className="text-sm text-muted-foreground">{loading ? 'Loading role changes…' : 'No platform role changes yet.'}</p> :
      <ul className="divide-y divide-border">{changes.map(change => {
        const notice = notices.find(n => n.change_id === change.id);
        return <li key={change.id} className="py-3 space-y-1 text-sm break-words">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{change.target_email} · {change.action === 'grant' ? 'Granted' : 'Revoked'} {change.role}</span>{notice && <Button size="sm" variant="outline" onClick={() => void markRead(notice.id)}><Check className="h-4 w-4 mr-1" />Mark read</Button>}</div>
          <p className="text-muted-foreground">{change.actor_email} · {new Date(change.created_at).toLocaleString()}</p>
          <p>{change.justification}</p>
        </li>;
      })}</ul>}
  </section>;
}