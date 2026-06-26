// ─────────────────────────────────────────────────────────────────────────────
//  Button  |  variants: primary · forest · secondary · ghost · danger
//           |  sizes: xs · sm · md · lg · xl
//           |  Special: icon-only, loading state, full-width
// ─────────────────────────────────────────────────────────────────────────────

import Spinner from './Spinner';

const VARIANTS = {
  primary:   'btn-primary',
  forest:    'btn-forest',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
  link:      'btn-ghost underline-offset-4 hover:underline px-0 py-0',
};

const SIZES = {
  xs: 'text-xs   px-2.5 py-1',
  sm: 'text-sm   px-3.5 py-1.5',
  md: 'text-sm   px-5   py-2.5',
  lg: 'text-base px-6   py-3',
  xl: 'text-base px-8   py-3.5 font-bold',
};

const SPINNER_COLORS = {
  primary:   'white',
  forest:    'white',
  secondary: 'primary',
  ghost:     'primary',
  danger:    'primary',
  link:      'primary',
};

export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  fullWidth = false,
  iconOnly  = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`
        btn
        ${VARIANTS[variant] ?? VARIANTS.primary}
        ${iconOnly ? 'p-2' : SIZES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" color={SPINNER_COLORS[variant] ?? 'primary'} />
          {!iconOnly && <span className="opacity-70">Please wait…</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}
