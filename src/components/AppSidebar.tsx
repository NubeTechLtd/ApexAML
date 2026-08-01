import { LayoutDashboard, Inbox, Users, Settings2, FileText, Fingerprint, ShieldAlert, Banknote, Building2, BarChart2, LogOut, FolderOpen, Search, Activity } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.svg';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const todaysWork = [
  { title: "Compliance Overview", url: '/dashboard', icon: LayoutDashboard },
  { title: 'Suspicious Activity Alerts', url: '/', icon: Inbox },
  { title: 'Alert Workspace', url: '/workspace', icon: Search },
  { title: 'Case Files', url: '/case/ALT-2026-0891', icon: FolderOpen },
];

const customerManagement = [
  { title: 'Customer Risk Profiles', url: '/customers', icon: Users },
  { title: 'KYC Verification Queue', url: '/identity', icon: Fingerprint },
  { title: 'Corporate KYB', url: '/kyb/corporate', icon: Building2 },
  { title: 'Sanctions & PEP Screening', url: '/sanctions', icon: ShieldAlert },
];

const reporting = [
  { title: 'CBN & NFIU Reports', url: '/reports/cbn', icon: FileText },
  { title: 'CBN Roadmap Generator', url: '/roadmap', icon: FileText },
  { title: 'Settlement Account Registry', url: '/accounts', icon: Banknote },
];

const system = [
  { title: 'Detection Rules & Typologies', url: '/rules', icon: Settings2 },
  { title: 'Audit Trail & Access Control', url: '/audit', icon: ShieldAlert },
];

const admin = [
  { title: 'Partner Bank View', url: '/partner-bank', icon: Building2 },
  { title: 'Visitor Analytics', url: '/admin/analytics', icon: Activity },
  { title: 'Roadmap Analytics', url: '/admin/roadmaps', icon: BarChart2 },
];

const groups = [
  { label: "Today's work", items: todaysWork },
  { label: 'Customer management', items: customerManagement },
  { label: 'Reporting', items: reporting },
  { label: 'System', items: system },
  { label: 'Admin', items: admin },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { session, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="ApexAML" className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-primary">ApexAML</span>
              <span className="text-[10px] text-sidebar-muted">Compliance Suite v2.4</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sidebar-muted text-[10px] uppercase tracking-wider">
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        {!collapsed && (
          <div className="rounded-lg bg-sidebar-accent p-3">
            <p className="text-[10px] text-sidebar-muted">Last sync</p>
            <p className="text-xs font-medium text-sidebar-primary">Today, 08:32 WAT</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                end
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                {!collapsed && <span>Account Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {session && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign out</span>}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
