import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getPostByIdAPI } from "../../services/api";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await getPostByIdAPI(id);
        if (res.data?.success) {
          setPost(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching post", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#c3ff00] border-t-[#531575] rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Publicación no encontrada</h2>
        <p className="text-gray-500 mb-6">El artículo que buscas no existe o ha sido eliminado.</p>
        <button onClick={() => navigate('/news')} className="px-6 py-2 bg-[#531575] text-white rounded-xl hover:bg-[#6b1e96]">
          Volver a Noticias
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header Immersive */}
      <div className="w-full relative bg-[#111111] min-h-[40vh] flex flex-col items-center justify-center overflow-hidden border-b-8 border-[#c3ff00]">
        {post.thumbnail_url && (
           <img 
             src={post.thumbnail_url} 
             alt={post.title} 
             className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
           />
        )}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
           <span className="inline-block bg-[#c3ff00] text-[#111111] font-bold text-sm uppercase px-4 py-2 rounded-full mb-6 shadow-xl">
             {post.category}
           </span>
           <h1 className="text-4xl md:text-6xl font-black text-white font-serif leading-tight mb-8">
             {post.title}
           </h1>
           <div className="flex items-center justify-center gap-4 text-gray-300 text-sm font-medium">
             <span>Publicado el {new Date(post.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
           </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
         <main className="prose prose-lg md:prose-xl prose-purple max-w-none">
           <div dangerouslySetInnerHTML={{ __html: post.content }} />
         </main>
         
         <div className="mt-20 pt-10 border-t border-gray-200">
           <div className="flex items-center justify-between">
              <Link to="/news" className="flex items-center gap-2 text-[#531575] font-bold hover:text-[#6b1e96] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
                Volver a Publicaciones
              </Link>
           </div>
         </div>
      </div>
    </div>
  );
}
