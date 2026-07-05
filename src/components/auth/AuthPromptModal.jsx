import { X, Sparkles, LogIn, UserPlus } from "lucide-react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

export default function AuthPromptModal({ isOpen, onClose, redirectPath = "/news" }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  };

  const handleRegister = () => {
    onClose();
    navigate(`/register?redirect=${encodeURIComponent(redirectPath)}`);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop overlay with blur */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal box */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer z-20"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-[#531575] via-[#6b1e96] to-[#400d5c] px-6 py-9 text-center text-white relative overflow-hidden flex flex-col items-center">
          {/* Subtle background glow effect */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white blur-md" />
            <div className="absolute -bottom-4 -left-4 w-28 h-28 rounded-full bg-white blur-md" />
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Visual Icon Badge */}
            <div className="w-16 h-16 mb-4 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center ring-4 ring-white/10 shadow-lg shadow-[#531575]/35">
              <Sparkles className="w-8 h-8 text-[#c3ff00]" />
            </div>

            <h3 className="text-2xl font-black mb-2 tracking-tight">
              ¡Únete a Forcepx!
            </h3>
            <p className="text-xs text-white/80 leading-relaxed max-w-[280px]">
              Comparte casos clínicos, noticias y conecta con otros odontólogos profesionales de la comunidad.
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="p-6 space-y-4 bg-slate-50/50">
          <p className="text-center text-slate-500 text-xs font-semibold mb-2">
            Debes iniciar sesión para proponer una publicación
          </p>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-[#531575] hover:bg-[#6b1e96] text-white rounded-xl font-bold text-sm transition-all duration-200 shadow-md shadow-[#531575]/10 hover:shadow-[#531575]/25 active:scale-[0.98] cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-[#c3ff00]" />
            Iniciar Sesión
          </button>

          <button
            onClick={handleRegister}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#531575]" />
            Crear Cuenta Gratis
          </button>

          <button
            onClick={onClose}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-medium py-1 transition-colors cursor-pointer"
          >
            Seguir explorando el Feed
          </button>
        </div>
      </div>
    </div>
  );
}

AuthPromptModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  redirectPath: PropTypes.string
};
