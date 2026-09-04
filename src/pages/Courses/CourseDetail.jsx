import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseByIdAPI } from "../../services/api";
import { track } from "../../services/tracking";
import { useSeo, stripHtml, SITE_URL } from "../../lib/seo";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);

  // SEO del curso (título, descripción, portada y ficha Course).
  useSeo(
    course
      ? {
          title: course.title,
          description: stripHtml(course.description),
          image: course.thumbnail_url || undefined,
          path: `/courses/${course.id}`,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Course",
            name: course.title,
            description: stripHtml(course.description).slice(0, 500),
            url: `${SITE_URL}/courses/${course.id}`,
            provider: { "@type": "Organization", name: "Forcepx", url: SITE_URL },
          },
        }
      : null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await getCourseByIdAPI(id);
        if (res.data?.success) {
          setCourse(res.data.data);
          // analytics_events no tiene columna course_id, así que va en properties.
          track("course_view", { properties: { course_id: res.data.data.id } });
        }
      } catch (err) {
        console.error("Error fetching course", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#c3ff00] border-t-[#531575] rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Curso no encontrado</h2>
        <p className="text-gray-500 mb-6">El curso que buscas no existe o ha sido movido.</p>
        <button onClick={() => navigate('/courses')} className="px-6 py-2 bg-[#531575] text-white rounded-xl hover:bg-[#6b1e96]">
          Ver todos los cursos
        </button>
      </div>
    );
  }

  // Helper to extract YouTube ID for embed
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] pb-20">
      {/* Dynamic Header/Player Area */}
      <div className="bg-[#111111] w-full">
        <div className="max-w-6xl mx-auto">
          {course.content_type === 'video' && course.content ? (
             <div className="relative w-full pb-[56.25%] h-0">
                <iframe 
                  src={getEmbedUrl(course.content)} 
                  title={course.title}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
             </div>
          ) : (
            <div className="relative h-64 md:h-96 w-full overflow-hidden">
               {course.thumbnail_url ? (
                 <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover opacity-60" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-r from-[#531575] to-[#6b1e96]" />
               )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Info */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
               <div className="flex flex-wrap gap-2 mb-4">
                 <span className="bg-[#531575]/10 text-[#531575] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                   {course.category}
                 </span>
                 <span className="bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                   {course.level}
                 </span>
               </div>
               
               <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">{course.title}</h1>
               <p className="text-lg text-gray-600 leading-relaxed mb-8">{course.description}</p>
               
               {course.content_type === 'article' && course.content && (
                 <div className="prose prose-purple max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: course.content }} />
                 </div>
               )}
            </div>
          </div>

          {/* Sticky Sidebar / Purchasing Card */}
          <div className="lg:w-1/3">
             <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 sticky top-24">
                <div className="text-center pb-6 border-b border-gray-100 mb-6">
                  <h3 className="text-3xl font-black text-gray-900 mb-2">
                    {course.is_free ? 'Completamente Gratis' : `$${course.price}`}
                  </h3>
                  <button className="w-full py-4 bg-[#c3ff00] hover:bg-[#aee600] text-[#111111] font-bold text-lg rounded-2xl transition-colors shadow-lg shadow-[#c3ff00]/20 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                    </svg>
                    {course.is_free ? 'Iniciar Curso Ahora' : 'Comprar Acceso'}
                  </button>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Instructor</h4>
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                     {course.instructor_avatar ? (
                       <img src={course.instructor_avatar} alt={course.instructor_name} className="w-12 h-12 rounded-full object-cover" />
                     ) : (
                       <div className="w-12 h-12 rounded-full bg-[#531575]/10 text-[#531575] flex items-center justify-center font-bold text-xl">
                         I
                       </div>
                     )}
                     <div>
                       <p className="font-bold text-gray-900">{course.instructor_name || 'Instructor Invitado'}</p>
                       <p className="text-xs text-gray-500">Autorizado por Forcepx</p>
                     </div>
                  </div>
                </div>

                <div>
                   <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Incluye</h4>
                   <ul className="space-y-3 text-sm text-gray-600">
                     <li className="flex gap-2 items-center">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#531575]"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                       Acceso ilimitado 24/7
                     </li>
                     <li className="flex gap-2 items-center">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#531575]"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                       Visualización multidispositivo
                     </li>
                     <li className="flex gap-2 items-center">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#531575]"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                       Garantía de calidad clínica
                     </li>
                   </ul>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
