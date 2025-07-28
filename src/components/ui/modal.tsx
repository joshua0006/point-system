import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]'
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  showCloseButton = true,
  onClose
}: ModalProps) {
  const handleClose = () => {
    onOpenChange(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </DialogHeader>
        )}
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {(footer || showCloseButton) && (
          <DialogFooter className="gap-2">
            {footer}
            {showCloseButton && (
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Specialized modal variants
export interface ConfirmModalProps extends Omit<ModalProps, 'children' | 'footer'> {
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
  ...props
}: ConfirmModalProps) {
  return (
    <Modal
      {...props}
      showCloseButton={false}
      footer={
        <>
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Loading...' : confirmText}
          </Button>
        </>
      }
    >
      <p className="text-center py-4">{message}</p>
    </Modal>
  );
}

// Data display modal
export interface DataModalProps extends ModalProps {
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  data?: any;
}

export function DataModal({
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  data,
  children,
  ...props
}: DataModalProps) {
  return (
    <Modal {...props}>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <p>Error: {error}</p>
        </div>
      ) : !data || (Array.isArray(data) && data.length === 0) ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </Modal>
  );
}