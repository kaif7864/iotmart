import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

/* ======================================================
   BASE MODAL
   Generic overlay modal that all other modals extend.
   Props: isOpen, onClose, title, children, maxWidth?, footer?
   ====================================================== */
export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg', footer }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-dark/60 backdrop-blur-sm"
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative bg-card-bg rounded-[24px] shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden border border-border-main`}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-8 py-6 border-b border-border-main bg-surface/50 shrink-0">
                <h2 className="heading-section text-base">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-border-main bg-card-bg text-text-muted hover:text-status-danger hover:border-status-danger/30 hover:bg-status-danger-bg transition-all shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* Body */}
            <div className="p-6 md:p-8 overflow-y-auto grow">{children}</div>
            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-border-main bg-surface/30 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ======================================================
   CONFIRM MODAL
   A pre-built confirmation dialog with title, message and actions.
   Props: isOpen, onClose, onConfirm, title, message, confirmLabel?, cancelLabel?, variant?
   ====================================================== */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',  // 'danger' | 'warning' | 'info'
  isLoading = false,
}) => {
  const icons = {
    danger:  { Icon: AlertTriangle, colorClass: 'text-status-danger', bgClass: 'bg-status-danger-bg' },
    warning: { Icon: AlertTriangle, colorClass: 'text-status-warning', bgClass: 'bg-status-warning-bg' },
    info:    { Icon: Info,          colorClass: 'text-status-info',    bgClass: 'bg-status-info-bg' },
  };
  const { Icon, colorClass, bgClass } = icons[variant];

  const btnVariants = {
    danger:  'bg-status-danger hover:bg-red-700 text-text-inverse',
    warning: 'bg-status-warning hover:bg-amber-700 text-text-inverse',
    info:    'bg-accent hover:bg-accent-hover text-text-inverse',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <>
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-6 py-3"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-3 rounded-sm text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 ${btnVariants[variant]}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center gap-5">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${bgClass}`}>
          <Icon className={`h-8 w-8 ${colorClass}`} />
        </div>
        <div>
          <h3 className="text-lg font-black text-text-primary mb-2 uppercase tracking-tight">{title}</h3>
          {message && <p className="text-sm text-text-secondary font-medium leading-relaxed">{message}</p>}
        </div>
      </div>
    </Modal>
  );
};

/* ======================================================
   SUCCESS MODAL
   Shows a success state after an action.
   ====================================================== */
export const SuccessModal = ({ isOpen, onClose, title, message, action }) => (
  <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <div className="w-16 h-16 rounded-full bg-status-success-bg flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-status-success" />
      </div>
      <div>
        <h3 className="text-lg font-black text-text-primary uppercase tracking-tight mb-2">{title}</h3>
        {message && <p className="text-sm text-text-secondary font-medium leading-relaxed">{message}</p>}
      </div>
      {action && (
        <div className="flex gap-3 mt-2">
          {action}
        </div>
      )}
    </div>
  </Modal>
);

/* ======================================================
   DRAWER MODAL
   A side panel that slides in from the right.
   ====================================================== */
export const DrawerModal = ({ isOpen, onClose, title, children, width = 'max-w-md' }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[9999] flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-surface-dark/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={`relative bg-card-bg h-full w-full ${width} shadow-2xl flex flex-col border-l border-border-main overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-border-main bg-surface/50 flex-shrink-0">
            <h2 className="heading-section text-base">{title}</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-border-main text-text-muted hover:text-status-danger hover:border-status-danger/30 hover:bg-status-danger-bg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
