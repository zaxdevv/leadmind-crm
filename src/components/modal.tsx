"use client";
import { useEffect, useRef } from "react";
export function Modal({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      className="panel modal"
      aria-label={label}
      ref={ref}
      onCancel={onClose}
    >
      {children}
    </dialog>
  );
}
