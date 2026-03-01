export const useToast = () => ({ showToast: (msg: string, type: 'success' | 'error' | 'info') => {} });
export const ToastProvider = ({ children }: any) => children;
