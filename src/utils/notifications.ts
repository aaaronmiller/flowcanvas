import toast from 'react-hot-toast';

// Toast notification utilities
export const notify = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#111827',
        color: '#4ade80',
        border: '1px solid #4ade80',
      },
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#111827',
        color: '#f87171',
        border: '1px solid #f87171',
      },
    });
  },

  info: (message: string) => {
    toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: '💡',
      style: {
        background: '#111827',
        color: '#60a5fa',
        border: '1px solid #60a5fa',
      },
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#111827',
        color: '#fbbf24',
        border: '1px solid #fbbf24',
      },
    });
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, msgs, {
      position: 'top-right',
      style: {
        background: '#111827',
        color: '#e2e8f0',
      },
      success: {
        style: {
          border: '1px solid #4ade80',
        },
      },
      error: {
        style: {
          border: '1px solid #f87171',
        },
      },
    });
  },
};
