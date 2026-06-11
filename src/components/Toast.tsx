import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}