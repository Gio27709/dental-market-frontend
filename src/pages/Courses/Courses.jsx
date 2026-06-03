import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCoursesAPI } from "../../services/api";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await getCoursesAPI();
        if (res.data?.success) {
          setCourses(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = ["All", "Surgical", "Restorative", "Endodontics", "Orthodontics", "Business", "General"];
  
  const filteredCourses = filter === "All" ? courses : courses.filter(c => c.category === filter);

  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#531575] to-[#6b1e96] text-white py-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between relative z-10">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Avanza en tu <span className="text-[#c3ff00]">Maestría Clínica</span>
            </h1>
            <p className="text-lg opacity-90 mb-8 max-w-lg font-light leading-relaxed">
              Educación digital elite para la odontología moderna. Aprende procedimientos avanzados, gestión y más.
            </p>
          </div>
          <div className="md:w-1/2 flex justify-end">
           <div className="w-64 h-64 border-2 border-[#c3ff00]/40 rounded-full flex items-center justify-center backdrop-blur-sm bg-white/5 relative">
             <div className="absolute w-48 h-48 border border-[#c3ff00]/60 rounded-full animate-pulse" />
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 text-[#c3ff00]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
           </div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 sticky top-24">
            <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Especialidades</h3>
            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => setFilter(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      filter === cat
                        ? "bg-[#531575]/10 text-[#531575] font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {cat === "All" ? "Todos los Cursos" : cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-[380px] flex flex-col">
                  <div className="bg-gray-100 h-48 rounded-xl mb-4" />
                  <div className="h-5 bg-gray-100 rounded-md w-3/4 mb-3" />
                  <div className="h-4 bg-gray-100 rounded-md w-1/2 mb-4" />
                  <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                    <div className="h-6 bg-gray-100 rounded-md w-16" />
                    <div className="h-6 bg-gray-100 rounded-md w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">No hay cursos encontrados</h2>
              <p className="text-gray-500 mt-2">No se encontraron cursos para esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full"
                >
                  <div className="relative h-48 bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 group-hover:scale-110 transition-transform duration-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                       {course.category && (
                         <span className="bg-white/90 backdrop-blur text-gray-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                           {course.category}
                         </span>
                       )}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-lg font-bold text-gray-800 leading-snug mb-3 group-hover:text-[#531575] transition-colors line-clamp-2">
                      {course.title}
                    </h2>
                    
                    <div className="flex items-center gap-2 mb-4">
                       {course.instructor_avatar ? (
                         <img src={course.instructor_avatar} alt={course.instructor_name} className="w-6 h-6 rounded-full object-cover border border-gray-100" />
                       ) : (
                         <div className="w-6 h-6 rounded-full bg-[#f9f9ff] text-[#531575] border border-[#531575]/20 flex items-center justify-center text-[10px] font-bold">I</div>
                       )}
                       <span className="text-sm font-medium text-gray-500 truncate">{course.instructor_name || 'Instructor Certificado'}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-6 mt-auto">
                      <span className="text-[11px] font-semibold px-2 py-1 bg-gray-50 text-gray-600 rounded-md border border-gray-100">
                        Nivel: {course.level || 'Todos'}
                      </span>
                      {course.content_type === 'video' && (
                        <span className="text-[11px] font-semibold px-2 py-1 bg-[#531575]/5 text-[#531575] rounded-md border border-[#531575]/10">
                          Video Curso
                        </span>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-lg font-black text-gray-900 tracking-tight">
                        {course.is_free ? (
                           <span className="text-[#10b981]">Gratis</span>
                        ) : (
                           `$${course.price}`
                        )}
                      </span>
                      <span className="text-sm font-bold text-white bg-[#531575] px-4 py-2 rounded-xl group-hover:bg-[#6b1e96] transition-colors shadow-sm shadow-[#531575]/30">
                        Ingresar
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
