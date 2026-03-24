import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, { description }),

  error: (message: string, description?: string) =>
    sonnerToast.error(message, { description }),

  loading: (message: string) =>
    sonnerToast.loading(message),

  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) =>
    sonnerToast.promise(promise, messages),

  dismiss: (id?: string | number) =>
    sonnerToast.dismiss(id),
};