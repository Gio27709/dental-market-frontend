import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de repuesto
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores
    console.error("ErrorBoundary atrapó un error detectado en la UI:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI de repuesto personalizada
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6 font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Ups! Algo salió mal</h1>
            <p className="text-gray-500 mb-6 text-sm">
              Ha ocurrido un error inesperado al renderizar la aplicación. Hemos notificado el problema.
            </p>
            {this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded text-left overflow-auto max-h-[300px] border border-red-200">
                <p className="text-red-700 font-bold mb-2">{this.state.error.toString()}</p>
                <pre className="text-xs text-red-600 whitespace-pre-wrap">{this.state.error.stack}</pre>
              </div>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-[#163152] text-white font-semibold py-3 px-4 rounded-xl hover:bg-[#0f233a] transition"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
