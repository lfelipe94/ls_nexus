"use client";

import { Trash2 } from "lucide-react";

export function ConfirmDeleteButton({
  label,
  confirmMessage,
}: {
  label: string;
  confirmMessage: string;
}) {
  return (
    <button
      type="submit"
      aria-label={label}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      className="rounded p-1.5 text-ink-soft/60 transition hover:bg-mustard-soft hover:text-mustard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stamp"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
