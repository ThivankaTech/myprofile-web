import { withBasePath } from "@/lib/basePath";

interface DownloadCvButtonProps {
  className?: string;
}

export function DownloadCvButton({ className = "" }: DownloadCvButtonProps) {
  return (
    <a
      href={withBasePath("/cv/thiwanka-saranatha-cv.pdf")}
      download
      className={`inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg shadow-sm transition-colors hover:bg-accent/90 ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />
      </svg>
      Download CV (PDF)
    </a>
  );
}
