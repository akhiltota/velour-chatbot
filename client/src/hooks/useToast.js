/**
 * hooks/useToast.js
 * ──────────────────
 * Simple toast state management hook.
 * Usage: const { toast, showToast, clearToast } = useToast();
 */

import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, clearToast };
}
