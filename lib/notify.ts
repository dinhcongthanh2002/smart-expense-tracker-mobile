// Lightweight toast bus. A <ToastHost/> mounted at the app root subscribes and
// renders messages. Any module can call notify.success/error/info.

export type ToastType = "success" | "error" | "info";
export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

type Listener = (toast: ToastMessage) => void;

let listeners: Listener[] = [];
let seq = 0;

export function subscribeToast(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emit(type: ToastType, message?: string) {
  if (!message) return;
  const toast: ToastMessage = { id: ++seq, type, message };
  listeners.forEach((l) => l(toast));
}

export const notify = {
  success: (message?: string) => emit("success", message),
  error: (message?: string) => emit("error", message),
  info: (message?: string) => emit("info", message),
};
