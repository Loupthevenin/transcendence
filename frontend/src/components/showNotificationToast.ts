type ToastType = "info" | "success" | "error";

const TOAST_DURATION = 4000;
const FADE_OUT_DURATION = 500;

const TOAST_STYLES: Record<ToastType, string> = {
  info: "bg-gradient-to-br from-purple-700 via-indigo-600 to-purple-800",
  success: "bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700",
  error: "bg-gradient-to-br from-red-500 via-red-600 to-red-700",
};

function createToastElement(message: string, type: ToastType): HTMLDivElement {
  const toast: HTMLDivElement = document.createElement("div");
  toast.className = `fixed bottom-6 right-6 z-50 text-white px-6 py-4 rounded-2xl shadow-xl animate-fade-in-out text-sm font-medium font-bold ${TOAST_STYLES[type]}`;
  toast.textContent = message;
  return toast;
}

function showToast(message: string, type: ToastType = "info"): void {
  const toast: HTMLDivElement = createToastElement(message, type);
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => toast.remove(), FADE_OUT_DURATION);
  }, TOAST_DURATION);
}

export const showInfoToast = (message: string) => showToast(message, "info");
export const showSuccessToast = (message: string) =>
  showToast(message, "success");
export const showErrorToast = (message: string) => showToast(message, "error");
