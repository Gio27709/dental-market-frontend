import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createTicketAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Contact() {
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      const fullName = user.firstName 
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : user.user_metadata?.full_name || '';
      
      setFormData(prev => ({
        ...prev,
        name: fullName,
        email: user.email || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        name: '',
        email: '',
        subject: '',
        message: ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión para enviar un mensaje.");
      return;
    }
    try {
      setSending(true);
      const res = await createTicketAPI({
        subject: formData.subject,
        message: formData.message,
        category: 'other'
      });
      if (res.data && res.data.success) {
        toast.success("Mensaje enviado correctamente. Te contactaremos pronto.");
        setSubmitted(true);
        setFormData(prev => ({ ...prev, subject: '', message: '' }));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f9f9ff] min-h-screen py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4f0077]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9ff] min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative background shape */}
      <style>{`
        .bg-editorial {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        }
        @media (min-width: 1024px) {
          .bg-editorial {
            clip-path: polygon(0 0, 65% 0, 55% 100%, 0% 100%);
          }
        }
      `}</style>
      <div 
        className="absolute top-0 left-0 w-full h-[850px] lg:h-[120%] bg-gradient-to-br from-[#4f0077] to-[#6b1e96] z-0 bg-editorial"
      ></div>

      <div className="max-w-7xl mx-auto relative z-10 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-start">
          
          {/* Contact Information (Left Side) */}
          <div className="text-white pt-8 lg:pr-12">
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 font-manrope">
              Contáctanos
            </h1>
            <p className="text-lg text-[#e6b4ff] mb-12 font-inter max-w-md">
              Estamos aquí para resolver tus dudas y ayudarte a equipar tu clínica con la mejor tecnología.
            </p>

            <div className="space-y-10">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-[#c3ff00] p-4 rounded-2xl shadow-lg">
                  <Mail className="w-6 h-6 text-[#30004a]" />
                </div>
                <div className="ml-6">
                  <h3 className="text-sm font-semibold text-[#e6b4ff] uppercase tracking-widest font-inter mb-1">Correo Electrónico</h3>
                  <p className="text-2xl font-bold font-manrope text-white">soporte@dentalmarket.com</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-[#c3ff00] p-4 rounded-2xl shadow-lg">
                  <Phone className="w-6 h-6 text-[#30004a]" />
                </div>
                <div className="ml-6">
                  <h3 className="text-sm font-semibold text-[#e6b4ff] uppercase tracking-widest font-inter mb-1">Teléfono</h3>
                  <p className="text-2xl font-bold font-manrope text-white">+1 800 555 0199</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-[#c3ff00] p-4 rounded-2xl shadow-lg">
                  <MapPin className="w-6 h-6 text-[#30004a]" />
                </div>
                <div className="ml-6">
                  <h3 className="text-sm font-semibold text-[#e6b4ff] uppercase tracking-widest font-inter mb-1">Ubicación Principal</h3>
                  <p className="text-xl font-semibold font-manrope text-white">Dental Market HQ</p>
                  <p className="text-[#e6b4ff] font-inter mt-1">Av. Las Américas, Centro Empresarial Médico</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Container (Right Side) */}
          {!user ? (
            <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(25,28,32,0.06)] p-8 md:p-12 relative z-20 lg:-mt-10 lg:ml-8 flex flex-col items-center text-center justify-center min-h-[450px]">
              <div className="bg-[#f3f3f9] p-4 rounded-2xl mb-6">
                <Mail className="w-8 h-8 text-[#4f0077]" />
              </div>
              <h2 className="text-3xl font-bold text-[#191c20] font-manrope mb-4">Inicia sesión para escribirnos</h2>
              <p className="text-gray-500 mb-8 max-w-sm font-inter">
                Para enviar un mensaje a nuestro equipo de soporte y recibir respuestas en tiempo real, necesitas tener una cuenta activa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link
                  to="/login?redirect=/contacto"
                  className="flex-1 sm:flex-none text-center bg-[#c3ff00] hover:bg-[#bcf600] text-[#151f00] font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:transform active:scale-95 font-inter"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register?redirect=/contacto"
                  className="flex-1 sm:flex-none text-center bg-[#f3f3f9] hover:bg-[#e8e8f0] text-[#4d4351] font-bold py-3.5 px-8 rounded-xl transition-all active:transform active:scale-95 font-inter border border-gray-200"
                >
                  Registrarse
                </Link>
              </div>
            </div>
          ) : submitted ? (
            <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(25,28,32,0.06)] p-8 md:p-12 relative z-20 lg:-mt-10 lg:ml-8 flex flex-col items-center text-center justify-center min-h-[450px]">
              <div className="bg-green-50 p-4 rounded-2xl mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-[#191c20] font-manrope mb-4">¡Mensaje Enviado!</h2>
              <p className="text-gray-500 mb-8 max-w-sm font-inter">
                Hemos registrado tu solicitud correctamente. Puedes hacer seguimiento a tu consulta y chatear con nuestro equipo desde tu panel de soporte.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link
                  to="/account/support"
                  className="flex-1 sm:flex-none text-center bg-[#c3ff00] hover:bg-[#bcf600] text-[#151f00] font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:transform active:scale-95 font-inter"
                >
                  Ver mis Tickets
                </Link>
                <button
                  onClick={() => setSubmitted(false)}
                  className="flex-1 sm:flex-none text-center bg-[#f3f3f9] hover:bg-[#e8e8f0] text-[#4d4351] font-bold py-3.5 px-8 rounded-xl transition-all active:transform active:scale-95 font-inter border border-gray-200 cursor-pointer"
                >
                  Enviar otro mensaje
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(25,28,32,0.06)] p-8 md:p-12 relative z-20 lg:-mt-10 lg:ml-8">
              <h2 className="text-3xl font-bold text-[#191c20] font-manrope mb-8">Envíanos un mensaje</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label htmlFor="name" className="text-sm font-semibold text-[#4d4351] font-inter ml-1">Nombre Completo</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    disabled
                    className="w-full bg-[#f3f3f9] text-[#727785] px-5 py-4 rounded-xl border border-gray-200 cursor-not-allowed opacity-85 font-inter"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="email" className="text-sm font-semibold text-[#4d4351] font-inter ml-1">Correo Electrónico</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full bg-[#f3f3f9] text-[#727785] px-5 py-4 rounded-xl border border-gray-200 cursor-not-allowed opacity-85 font-inter"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="subject" className="text-sm font-semibold text-[#4d4351] font-inter ml-1">Asunto</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#f3f3f9] text-[#191c20] px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c3ff00] focus:bg-white transition-all border border-transparent focus:border-transparent placeholder-[#7f7382]"
                    placeholder="¿En qué podemos ayudarte?"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="message" className="text-sm font-semibold text-[#4d4351] font-inter ml-1">Mensaje</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full bg-[#f3f3f9] text-[#191c20] px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c3ff00] focus:bg-white transition-all border border-transparent focus:border-transparent placeholder-[#7f7382] resize-none"
                    placeholder="Describe los detalles de tu consulta..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 bg-[#c3ff00] hover:bg-[#bcf600] text-[#151f00] font-bold text-lg py-4 px-8 rounded-xl transition-all hover:shadow-[0_10px_20px_rgba(195,255,0,0.2)] active:transform active:scale-95 mt-4 font-inter disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{sending ? 'Enviando...' : 'Enviar Mensaje'}</span>
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
