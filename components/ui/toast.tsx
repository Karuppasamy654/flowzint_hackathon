import * as React from 'react';

export interface ToastOptions {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export interface ToastItem {
  id: string;
  title: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message';
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

type Listener = (toasts: ToastItem[]) => void;
const listeners = new Set<Listener>();
let toastsList: ToastItem[] = [];

const emit = () => {
  listeners.forEach((listener) => listener([...toastsList]));
};

export const toast = {
  info(title: string, options?: ToastOptions) {
    this.create(title, 'info', options);
  },
  success(title: string, options?: ToastOptions) {
    this.create(title, 'success', options);
  },
  warning(title: string, options?: ToastOptions) {
    this.create(title, 'warning', options);
  },
  error(title: string, options?: ToastOptions) {
    this.create(title, 'error', options);
  },
  message(title: string, options?: ToastOptions) {
    this.create(title, 'message', options);
  },
  create(title: string, type: ToastItem['type'], options?: ToastOptions) {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = {
      id,
      title,
      type,
      description: options?.description,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
    };
    toastsList.push(item);
    emit();

    setTimeout(() => {
      this.dismiss(id);
    }, options?.duration || 6000);
  },
  dismiss(id: string) {
    toastsList = toastsList.filter((t) => t.id !== id);
    emit();
  },
};

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    setToasts(toastsList);
    const listener = (newList: ToastItem[]) => setToasts(newList);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return toasts;
}

export function ToastContainer() {
  const toasts = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        let borderLeftColor = 'border-l-blue-500';
        if (t.type === 'success') borderLeftColor = 'border-l-success';
        if (t.type === 'error') borderLeftColor = 'border-l-danger';
        if (t.type === 'warning') borderLeftColor = 'border-l-warning';

        return (
          <div
            key={t.id}
            className={`flex flex-col gap-1 w-full bg-white border-l-4 ${borderLeftColor} border border-gray-100 rounded-r-md rounded-l-xs p-4 shadow-modal pointer-events-auto animate-in slide-in-from-bottom-5 duration-200`}
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-sm text-gray-900">{t.title}</span>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600 text-sm leading-none focus:outline-none"
              >
                &times;
              </button>
            </div>
            {t.description && (
              <span className="text-xs text-gray-500 leading-normal">{t.description}</span>
            )}
            {t.actionLabel && t.onAction && (
              <button
                onClick={() => {
                  try {
                    t.onAction?.();
                  } catch (e) {
                    console.error(e);
                  }
                  toast.dismiss(t.id);
                }}
                className="mt-2 text-xs font-semibold text-primary hover:text-primary-hover self-start border border-primary/20 hover:border-primary px-3 py-1 rounded-pill transition-colors bg-primary-light"
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
