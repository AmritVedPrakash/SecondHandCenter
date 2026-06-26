// ─────────────────────────────────────────────────────────────────────────────
//  Input  |  text · email · password · tel · number · textarea · select
//  All inputs share the same design language from index.css
// ─────────────────────────────────────────────────────────────────────────────

import { forwardRef, useState } from 'react';

// ── Eye icon for password toggle ──────────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

// ── Field wrapper (label + input + error) ─────────────────────────────────────
export function Field({ label, hint, error, required, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="label flex items-center gap-1">
          {label}
          {required && <span className="text-red-400 text-xs">*</span>}
          {hint && <span className="text-xs text-cream-500 font-normal ml-1">{hint}</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="field-error">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
const Input = forwardRef(function Input(
  { label, hint, error, required, leftIcon, rightIcon, className = '', ...props },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === 'password';
  const inputType  = isPassword ? (showPassword ? 'text' : 'password') : props.type;

  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-cream-500">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          {...props}
          type={inputType}
          className={`
            input
            ${error ? 'input-error' : ''}
            ${leftIcon ? 'pl-10' : ''}
            ${(rightIcon || isPassword) ? 'pr-10' : ''}
            ${className}
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-cream-500 hover:text-charcoal-800 transition-colors"
          >
            <EyeIcon open={showPassword} />
          </button>
        )}
        {rightIcon && !isPassword && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-cream-500">
            {rightIcon}
          </div>
        )}
      </div>
    </Field>
  );
});

export default Input;

// ── Textarea ──────────────────────────────────────────────────────────────────
export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, maxLength, showCount = false, className = '', ...props },
  ref
) {
  const len = props.value?.length ?? 0;
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <textarea
          ref={ref}
          maxLength={maxLength}
          className={`textarea ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {showCount && maxLength && (
          <span className={`absolute bottom-2.5 right-3 text-xs font-medium ${
            len >= maxLength * 0.9 ? 'text-red-400' : 'text-cream-500'
          }`}>
            {len}/{maxLength}
          </span>
        )}
      </div>
    </Field>
  );
});

// ── Select ─────────────────────────────────────────────────────────────────────
export const Select = forwardRef(function Select(
  { label, hint, error, required, children, className = '', ...props },
  ref
) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <select
        ref={ref}
        className={`select ${error ? 'input-error' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
});
