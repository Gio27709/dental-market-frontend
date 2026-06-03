import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate sending
    console.log('Sending message:', formData);
    alert('Mensaje enviado correctamente. Te contactaremos pronto.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

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

          {/* Contact Form (Right Side) */}
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
                  onChange={handleChange}
                  required
                  className="w-full bg-[#f3f3f9] text-[#191c20] px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c3ff00] focus:bg-white transition-all border border-transparent focus:border-transparent placeholder-[#7f7382]"
                  placeholder="Ej. Dra. María González"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-semibold text-[#4d4351] font-inter ml-1">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#f3f3f9] text-[#191c20] px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c3ff00] focus:bg-white transition-all border border-transparent focus:border-transparent placeholder-[#7f7382]"
                  placeholder="tu@correo.com"
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
                className="w-full flex items-center justify-center gap-2 bg-[#c3ff00] hover:bg-[#bcf600] text-[#151f00] font-bold text-lg py-4 px-8 rounded-xl transition-all hover:shadow-[0_10px_20px_rgba(195,255,0,0.2)] active:transform active:scale-95 mt-4 font-inter"
              >
                <span>Enviar Mensaje</span>
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
