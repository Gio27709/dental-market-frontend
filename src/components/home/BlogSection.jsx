import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPostsAPI } from "../../services/api";

export default function BlogSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await getPostsAPI();
        if (res.data?.success) {
          // Take only the latest 4 posts to display on Home
          setPosts(res.data.data.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching blog posts for home:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <section className="mb-16">
      <div className="max-w-7xl mx-auto">
        {/* Header de la sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <h2 className="text-[28px] font-bold text-gray-900 leading-tight">
              Últimas Noticias y Artículos
            </h2>
            <p className="text-gray-500 mt-1 text-[15px]">
              Mantente al día con las últimas novedades, técnicas y consejos del sector dental.
            </p>
          </div>
          <Link
            to="/news"
            className="inline-flex items-center justify-center bg-[#531575] hover:bg-[#6b1e96] text-white font-medium px-6 py-2.5 rounded-md transition-colors shadow-sm self-start md:self-auto"
          >
            Ver Todos
          </Link>
        </div>

        {/* Grid del Blog */}
        <div className="px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 animate-pulse h-80 rounded-xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
               <p className="text-gray-500">Próximamente publicaremos artículos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300 group"
                >
                  {/* Imagen */}
                  <Link to={`/news/${post.id}`} className="block overflow-hidden h-48 bg-gray-50 relative">
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-[#c3ff00] text-[#111111] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm">
                       {post.category || 'General'}
                    </span>
                  </Link>

                  {/* Contenido Principal */}
                  <div className="p-5 flex-1 flex flex-col">
                    <Link to={`/news/${post.id}`}>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-[#531575] transition-colors leading-snug mb-3">
                        {post.title}
                      </h3>
                    </Link>

                    {/* Extracto */}
                    <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
                      {post.content?.replace(/<[^>]+>/g, '') || "Ingresa para leer el artículo completo..."}
                    </p>

                    <hr className="border-gray-100 mb-4" />

                    {/* Pie de tarjeta (Comentarios y Fecha) */}
                    <div className="flex items-center justify-between text-xs text-gray-400 font-medium pb-1">
                      <div className="flex items-center gap-1.5 text-[#531575] font-semibold">
                         Leer Artículo
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        <span>{new Date(post.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
