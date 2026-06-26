// ─────────────────────────────────────────────────────────────────────────────
//  ConfirmDialog  |  "Are you sure?" modal for destructive actions
// ─────────────────────────────────────────────────────────────────────────────

import Modal  from './Modal';
import Button from './Button';

const ICONS = {
  danger:  { emoji: '🗑️', ring: 'bg-red-100',    icon: 'text-red-500'    },
  warning: { emoji: '⚠️',  ring: 'bg-amber-100',  icon: 'text-amber-500'  },
  info:    { emoji: 'ℹ️',  ring: 'bg-blue-100',   icon: 'text-blue-500'   },
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title        = 'Are you sure?',
  message      = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  type         = 'danger',
  loading      = false,
}) {
  const style = ICONS[type] ?? ICONS.danger;

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm" showCloseBtn={false}>
      <div className="flex flex-col items-center text-center gap-4">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl ${style.ring} flex items-center justify-center text-2xl`}>
          {style.emoji}
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-charcoal-800">{title}</h3>
          <p className="text-sm text-cream-500 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full pt-1">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={type === 'danger' ? 'danger' : 'primary'}
            size="md"
            fullWidth
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
