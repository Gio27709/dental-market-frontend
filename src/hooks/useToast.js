import { toast as hotToast } from 'react-hot-toast';
import Toast from '../components/ui/Toast';

const showToast = (title, message = '', type = 'info') => {
  hotToast.custom((t) => (
    <Toast t={t} type={type} title={title} message={message} />
  ));
};

export const toast = {
  // Para mantener compatibilidad si el frontend hace toast.success("Mensaje rápido")
  success: (message, title = 'Éxito') => showToast(title, message, 'success'),
  error: (message, title = 'Error') => showToast(title, message, 'error'),
  warning: (message, title = 'Atención') => showToast(title, message, 'warning'),
  info: (message, title = 'Información') => showToast(title, message, 'info'),
  loading: hotToast.loading,
  dismiss: hotToast.dismiss,
};

export default function useToast() {
  return toast;
}
