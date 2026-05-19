import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'rounded-xl border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-[var(--shadow-lg)]',
          title: 'text-[13px] font-medium',
          description: 'text-[12px] text-[var(--color-ink-soft)]',
        },
      }}
    />
  );
}

export { toast } from 'sonner';
