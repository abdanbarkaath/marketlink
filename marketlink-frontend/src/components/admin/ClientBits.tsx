'use client';

import React, { useEffect, useState } from 'react';

/** Wrap a form to show a confirm dialog before submitting, supports server actions via `action` prop. */
export function ConfirmSubmit({
  message = 'Are you sure?',
  action,
  className,
  children,
}: {
  message?: string;
  action?: (formData: FormData) => void | Promise<void>; // server action or normal
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action as any}
      className={className}
      onSubmit={(e) => {
        const ok = window.confirm(message);
        if (!ok) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {children}
    </form>
  );
}

/** Simple toast/flash that auto-dismisses. */
export function Flash({ message, duration = 3000 }: { message?: string; duration?: number }) {
  const [show, setShow] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;
    setShow(true);
    const id = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(id);
  }, [message, duration]);

  if (!show || !message) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border bg-white px-4 py-2 shadow-lg">
      <span className="text-sm">{message}</span>
      <button type="button" onClick={() => setShow(false)} className="ml-3 rounded border px-2 py-0.5 text-xs hover:bg-gray-50" aria-label="Close">
        Close
      </button>
    </div>
  );
}
