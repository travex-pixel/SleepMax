export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <p className={`wordmark ${className}`} aria-label="OFFMODE">
      Offmode
    </p>
  );
}
