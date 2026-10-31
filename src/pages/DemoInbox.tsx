import { useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { useDemoEmails, markDemoEmailsRead } from '@/data-layer/demoNotifications';
const statusLabels: Record<string,string> = { pending: 'Sending', sent: 'Sent', recipient_suppressed: 'Email suppressed · inbox copy', failed: 'Email unavailable · inbox copy', inbox_only: 'Inbox only', session_limit: 'Session email limit · inbox copy', daily_address_limit: 'Daily email limit · inbox copy', reserved: 'Send already requested', briefing_already_sent: 'Briefing already requested today' };
export default function DemoInbox() {
  const emails = useDemoEmails();
  const [params, setParams] = useSearchParams();
  const selected = emails.find(e => e.id === params.get('message')) ?? emails[0];
  return <SidebarProvider><div className="flex min-h-screen w-full bg-background"><AppSidebar /><main className="min-w-0 flex-1">
    <header className="flex h-14 items-center justify-between border-b border-border px-6"><div className="flex items-center gap-3"><SidebarTrigger /><h1 className="text-lg font-semibold">Demo inbox</h1></div><NotificationBell /></header>
    <div className="border-b border-border p-4"><DemoEmailConfirmCard /></div>
    <div className="grid min-h-[600px] md:grid-cols-[320px_minmax(0,1fr)]">
      <section className="border-b border-border md:border-b-0 md:border-r"><div className="flex items-center justify-between p-4"><span className="text-sm text-muted-foreground">{emails.length} messages</span><Button variant="ghost" size="sm" onClick={() => markDemoEmailsRead()}>Mark all read</Button></div>
      {emails.map(e => <Button key={e.id} variant="ghost" className="h-auto w-full justify-start whitespace-normal rounded-none border-b border-border px-4 py-4 text-left" onClick={() => { markDemoEmailsRead(e.id); setParams({ message: e.id }); }}><div className="min-w-0"><p className={e.read ? 'text-sm text-muted-foreground' : 'text-sm font-semibold text-foreground'}>{e.subject}</p><p className="mt-1 text-xs text-muted-foreground">{statusLabels[e.status] ?? e.status}</p></div></Button>)}
      {!emails.length && <p className="p-6 text-sm text-muted-foreground">No demo notifications yet.</p>}</section>
      <section className="min-w-0 p-6">{selected ? <><h2 className="text-xl font-semibold">{selected.subject}</h2><p className="mt-2 text-sm text-muted-foreground">{selected.from ?? 'ApexAML <noreply@apexaml.com>'}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleString()} · {statusLabels[selected.status] ?? selected.status}</p>
      {selected.html ? <iframe title="Demo email content" sandbox="" srcDoc={selected.html} className="mt-6 h-[760px] w-full rounded-md border border-border bg-card" /> : <div className="mt-8 max-w-xl"><Mail className="mb-4 h-6 w-6 text-primary" /><p className="text-base leading-relaxed">{selected.body}</p><p className="mt-6 text-sm text-muted-foreground">Demo environment: sample data only, no live connections.</p></div>}
      </> : null}</section>
    </div></main></div></SidebarProvider>;
}
