export default function BowtieIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className}>
      <rect width="64" height="64" rx="8" ry="8" className="fill-black dark:fill-white" />
      <path d="M8 12L8 52L28 32L8 12Z" className="fill-white dark:fill-black" />
      <path d="M56 12L56 52L36 32L56 12Z" className="fill-white dark:fill-black" />
      <circle cx="32" cy="32" r="2" className="fill-white dark:fill-black" />
    </svg>
  );
}
