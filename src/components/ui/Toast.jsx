import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';

export default function Toast({ t, type = 'success', title, message }) {
  const icons = {
    success: (
      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {icons[type] || icons.info}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {title}
            </p>
            {message && (
              <p className="mt-1 text-sm text-gray-500">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-100">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

Toast.propTypes = {
  t: PropTypes.shape({
    id: PropTypes.string.isRequired,
    visible: PropTypes.bool.isRequired,
  }).isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
};
