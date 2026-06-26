// ─────────────────────────────────────────────────────────────────────────────
//  PageWrapper  |  Consistent max-width padding for all pages
// ─────────────────────────────────────────────────────────────────────────────

export default function PageWrapper({ children, className = '', narrow = false }) {
  return (
    <div className={`${narrow ? 'max-w-2xl' : 'max-w-6xl'} mx-auto px-4 sm:px-6 py-6 ${className}`}>
      {children}
    </div>
  );
}
