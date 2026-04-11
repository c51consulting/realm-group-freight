'use client';

/**
 * NotificationContext — global toast notification system.
 *
 * Usage:
 *   const { notify } = useNotification();
 *   notify('Listing created!', 'success');
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextValue {
  notifications: Notification[];
  notify: (message: string, type?: NotificationType) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

let counter = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: NotificationType = 'info') => {
      const id = `notif-${++counter}`;
      setNotifications((prev) => [...prev, { id, message, type }]);
      // Auto-dismiss after 5 s
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
      <ToastContainer notifications={notifications} dismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used inside <NotificationProvider>');
  return ctx;
}

// ── Toast UI ──────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<NotificationType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-yellow-500 text-white',
};

const TYPE_ICONS: Record<NotificationType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

function ToastContainer({
  notifications,
  dismiss,
}: {
  notifications: Notification[];
  dismiss: (id: string) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
    >
      {notifications.map((n) => (
        <div
          key={n.id}
          role="alert"
          className={`flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium ${TYPE_STYLES[n.type]}`}
        >
          <span className="text-base leading-none mt-0.5">{TYPE_ICONS[n.type]}</span>
          <span className="flex-1">{n.message}</span>
          <button
            onClick={() => dismiss(n.id)}
            aria-label="Dismiss notification"
            className="ml-2 opacity-75 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
