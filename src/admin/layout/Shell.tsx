import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { CommandBar } from './CommandBar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ShellProps {
  title: string;
  userEmail?: string;
  onSignOut: () => void;
  children: React.ReactNode;
}

export function Shell({ title, userEmail, onSignOut, children }: ShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-muted)]">
      <div className="hidden lg:block sticky top-0 h-screen">
        <Sidebar />
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="p-0 max-w-[280px] h-[100dvh] left-0 top-0 translate-x-0 translate-y-0 rounded-none">
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        <CommandBar
          title={title}
          userEmail={userEmail}
          onSignOut={onSignOut}
          onMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
