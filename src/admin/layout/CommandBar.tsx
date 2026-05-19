import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Database,
  Tags,
  History,
  LogOut,
  Search,
  ChevronDown,
  User,
  Menu,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommandBarProps {
  title: string;
  userEmail?: string;
  onSignOut: () => void;
  onMenu?: () => void;
}

export function CommandBar({ title, userEmail, onSignOut, onMenu }: CommandBarProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[var(--color-line)] bg-white/80 px-5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      {onMenu && (
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="lg:hidden grid size-9 place-items-center rounded-lg text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
        >
          <Menu className="size-5" />
        </button>
      )}

      <div className="flex flex-col">
        <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
          Admin console
        </div>
        <div className="text-[14px] font-semibold text-[var(--color-ink)]">{title}</div>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-3.5 py-1.5 text-[12.5px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search · jump to…</span>
        <span className="hidden sm:inline-flex items-center gap-0.5 rounded-md bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink-faint)] ring-1 ring-inset ring-[var(--color-line)]">
          <span>⌘</span>K
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white py-1 pl-1 pr-2.5 text-[12.5px] text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-line-strong)]">
            <span className="grid size-7 place-items-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
              <User className="size-3.5" />
            </span>
            <span className="hidden sm:inline max-w-[160px] truncate">{userEmail ?? '—'}</span>
            <ChevronDown className="size-3.5 text-[var(--color-ink-faint)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px]">
          <DropdownMenuLabel>Signed in</DropdownMenuLabel>
          <div className="px-2.5 pb-2 text-[12px] text-[var(--color-ink-soft)] truncate">
            {userEmail ?? '—'}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut} className="text-[var(--color-danger)] focus:text-[var(--color-danger)]">
            <LogOut className="size-3.5" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem onSelect={() => go('/admin/dashboard')}>
              <LayoutDashboard className="size-3.5" />
              Dashboard <CommandShortcut>G D</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go('/admin/generate')}>
              <Sparkles className="size-3.5" />
              Generate report <CommandShortcut>G G</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go('/admin/history')}>
              <History className="size-3.5" />
              Report history <CommandShortcut>G H</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go('/admin/benchmarks')}>
              <Database className="size-3.5" />
              Benchmarks
            </CommandItem>
            <CommandItem onSelect={() => go('/admin/categories')}>
              <Tags className="size-3.5" />
              Categories
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Account">
            <CommandItem onSelect={onSignOut}>
              <LogOut className="size-3.5" />
              Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
