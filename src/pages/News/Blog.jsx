import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPostsAPI } from "../../services/api";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await getPostsAPI();
        if (res.data?.success) {
          setPosts(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const categories = ["All", "Casos Clínicos", "Noticias", "Investigación", "Entrevistas", "Innovación"];
  const filteredPosts = filter === "All" ? posts : posts.filter(p => p.category === filter);

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const standardPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];

  return (
    <div className="min-h-screen bg-[#fcfcff]">
      {/* Magazine Hero Section */}
      <div className="bg-[#111111] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b-8 border-[#c3ff00]">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="text-[#c3ff00] font-bold tracking-widest uppercase text-sm mb-4">
            Dental Market Journal
          </span>
          <h1 className="text-5xl md:text-7xl font-black mb-6 font-serif tracking-tight">
            Noticias & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#531575] to-[#c3ff00]">Publicaciones</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl font-light">
            Explora las últimas investigaciones, casos clínicos de nuestra comunidad y actualizaciones tecnológicas de la odontología moderna.
          </p>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-[72px] md:top-[64px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto hide-scrollbar py-4 gap-2 md:justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  filter === cat
                    ? "bg-[#531575] text-white shadow-md shadow-[#531575]/20"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-[#531575]"
                }`}
              >
                {cat === "All" ? "Todos los Artículos" : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="space-y-12">
             <div className="w-full h-96 bg-gray-200 animate-pulse rounded-2xl" />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-2xl" />)}
             </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">No hay publicaciones</h2>
            <p className="text-gray-500 mt-2">Próximamente publicaremos artículos en esta sección.</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <Link 
                to={`/news/${featuredPost.id}`} 
                className="group relative block bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 mb-16 hover:-translate-y-1 transition-transform duration-500"
              >
                <div className="flex flex-col lg:flex-row h-full">
                  <div className="lg:w-2/3 h-72 lg:h-[450px] relative overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {featuredPost.thumbnail_url ? (
                      <img 
                        src={featuredPost.thumbnail_url} 
                        alt={featuredPost.title} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                      />
                    ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 text-gray-300">
                         <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                       </svg>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-[#c3ff00] text-[#111111] font-bold text-xs uppercase px-3 py-1.5 rounded-md shadow-sm">
                        Artículo Principal
                      </span>
                    </div>
                  </div>
                  <div className="lg:w-1/3 p-8 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="uppercase tracking-widest text-[#531575] font-bold text-xs">
                        {featuredPost.category}
                      </span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-4 group-hover:text-[#531575] transition-colors line-clamp-3">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-600 line-clamp-3 mb-8">
                      {featuredPost.content?.replace(/<[^>]+>/g, '') || "Leer más sobre este artículo destacado..."}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                       <span className="text-sm font-semibold text-gray-500">
                         {new Date(featuredPost.created_at).toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}
                       </span>
                       <span className="w-10 h-10 rounded-full bg-[#531575]/10 flex items-center justify-center text-[#531575] group-hover:bg-[#531575] group-hover:text-white transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                       </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Standard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {standardPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/news/${post.id}`}
                  className="group bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 flex flex-col"
                >
                  <div className="relative h-60 bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {post.thumbnail_url ? (
                      <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-gray-300">
                         <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 backdrop-blur text-[#531575] font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-md shadow-sm">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 leading-snug mb-4 group-hover:text-[#531575] transition-colors line-clamp-3">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-6">
                      {post.content?.replace(/<[^>]+>/g, '') || "Leer más sobre este artículo..."}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-6">
                      <span className="text-xs font-semibold text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-sm font-bold text-[#531575] group-hover:underline">Leer Artículo</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
