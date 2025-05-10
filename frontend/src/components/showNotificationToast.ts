enum ToastType {
  INFO,
  SUCCESS,
  ERROR
};

const TOAST_DURATION: number = 4000;
const FADE_OUT_DURATION: number = 500;

const TOAST_STYLES: Record<ToastType, string> = {
  [ToastType.INFO]: "toast-info",
  [ToastType.SUCCESS]: "toast-success",
  [ToastType.ERROR]: "toast-error",
};

function createToastElement(message: string, type: ToastType): HTMLDivElement {
  const toastWrapper: HTMLDivElement = document.createElement("div");
  toastWrapper.className = `fixed bottom-6 right-6 z-50 animate-toast-pop`;
  const toastContent: HTMLDivElement = document.createElement("div");
  toastContent.className = `text-white px-6 py-4 rounded-2xl shadow-xl text-sm font-medium font-bold ${TOAST_STYLES[type]}`;
  toastContent.textContent = message;

  toastWrapper.appendChild(toastContent);
  return toastWrapper;
}

function showToast(message: string, type: ToastType = ToastType.INFO): void {
  const toast: HTMLDivElement = createToastElement(message, type);
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => toast.remove(), FADE_OUT_DURATION);
  }, TOAST_DURATION);
}

export const showInfoToast = (message: string) => showToast(message, ToastType.INFO);
export const showSuccessToast = (message: string) => showToast(message, ToastType.SUCCESS);
export const showErrorToast = (message: string) => showToast(message, ToastType.ERROR);
