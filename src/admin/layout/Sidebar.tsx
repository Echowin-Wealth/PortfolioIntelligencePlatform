import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Database,
  Tags,
  History,
} from 'lucide-react';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { cn } from '@/shared/lib/utils';

const groups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
      { label: 'Report history', icon: History, to: '/admin/history' },
    ],
  },
  {
    label: 'Generate',
    items: [{ label: 'New report', icon: Sparkles, to: '/admin/generate' }],
  },
  {
    label: 'Data',
    items: [
      { label: 'Benchmarks', icon: Database, to: '/admin/benchmarks' },
      { label: 'Categories', icon: Tags, to: '/admin/categories' },
    ],
  },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full w-[244px] flex-col border-r border-[var(--color-line)] bg-white',
        className
      )}
    >
      <div className="flex h-16 items-center border-b border-[var(--color-line)] px-5">
        <BrandLogo variant="compact" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label} className="mb-6">
            <div className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)]'
                        : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]'
                    )
                  }
                >
                  <item.icon className="size-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--color-line)] p-4">
        <div className="rounded-xl bg-[var(--color-surface-muted)] p-3.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--color-success)] animate-pulse" />
            <div className="text-[12px] font-medium text-[var(--color-ink)]">All systems operational</div>
          </div>
          <div className="mt-1 text-[11px] text-[var(--color-ink-soft)]">
            Edge functions live · Supabase healthy
          </div>
        </div>
      </div>
    </aside>
  );
}
