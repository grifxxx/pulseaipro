export function PulseLogo({ className }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-indigo-400 text-white shadow-sm ${className ?? "h-7 w-7"}`}
    >
      <svg viewBox="0 0 24 24" width="62%" height="62%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline
          points="1,13 7,13 9.5,6 13,20 15.5,13 23,13"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
