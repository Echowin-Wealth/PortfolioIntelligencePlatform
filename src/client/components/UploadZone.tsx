import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface UploadZoneProps {
  file: File | null;
  onFile: (file: File) => void;
  onClear: () => void;
}

export function UploadZone({ file, onFile, onClear }: UploadZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    maxSize: 50 * 1024 * 1024,
  });

  if (file) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
        <div className="grid size-11 place-items-center rounded-xl bg-white text-[var(--color-brand-600)] ring-1 ring-inset ring-[var(--color-brand-100)]">
          <FileText className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium text-[var(--color-ink)]">
            {file.name}
          </div>
          <div className="font-mono text-[11.5px] text-[var(--color-ink-soft)]">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-success)] ring-1 ring-inset ring-[var(--color-success-line)]">
          <CheckCircle2 className="size-3" />
          Ready
        </span>
        <button
          type="button"
          onClick={onClear}
          aria-label="Remove file"
          className="grid size-8 place-items-center rounded-lg text-[var(--color-ink-soft)] transition-colors hover:bg-white hover:text-[var(--color-danger)]"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative cursor-pointer rounded-2xl border-2 border-dashed bg-[var(--color-surface-muted)]/60 px-6 py-12 text-center transition-all duration-200',
        isDragActive
          ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] shadow-[0_0_0_4px_rgba(99,91,255,0.08)]'
          : 'border-[var(--color-line-strong)] hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-50)]/40'
      )}
    >
      <input {...getInputProps()} />
      <div
        className="mx-auto grid size-14 place-items-center rounded-2xl text-white shadow-[0_10px_30px_-10px_rgba(99,91,255,0.55)]"
        style={{
          background: 'linear-gradient(135deg, #635bff 0%, #7a5af8 60%, #00d4ff 100%)',
        }}
      >
        <Upload className="size-6" />
      </div>
      <h3 className="mt-5 text-[16px] font-semibold text-[var(--color-ink)]">
        {isDragActive ? 'Drop to upload' : 'Drop your wealth statement here'}
      </h3>
      <p className="mt-1.5 text-[13px] text-[var(--color-ink-muted)]">
        or click anywhere in this card to browse
      </p>
      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11.5px] text-[var(--color-ink-soft)] ring-1 ring-inset ring-[var(--color-line)]">
        PDF · up to 50 MB · parsed locally in your browser
      </div>
    </div>
  );
}
