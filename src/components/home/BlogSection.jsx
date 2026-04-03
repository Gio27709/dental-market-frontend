import { Link } from "react-router-dom";

// Mock data para los artículos del blog
const BLOG_POSTS = [
  {
    id: 1,
    title: "Nuevos avances en escáneres intraorales 3D",
    author: "Dra. Ana Silva",
    date: "05 Jun, 2024",
    comments: 12,
    excerpt: "Descubre cómo la nueva generación de escáneres está reduciendo el tiempo de toma de impresiones a menos de un minuto y mejorando la precisión marginal...",
    image: "https://images.unsplash.com/photo-1599427303058-f04cb25e3650?q=80&w=400&h=300&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Cómo elegir la mejor resina compuesta",
    author: "Dr. Roberto Vargas",
    date: "28 May, 2024",
    comments: 8,
    excerpt: "Guía completa comparando las últimas marcas del mercado y sus propiedades de mimetismo óptico para restauraciones estéticas del sector anterior...",
    image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=400&h=300&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Mantenimiento clave de tu unidad dental",
    author: "Ing. Carlos Díaz",
    date: "14 May, 2024",
    comments: 24,
    excerpt: "Cinco pasos semanales que evitarán averías costosas en las válvulas de tus jeringas triples y mangueras neumáticas. Prolonga la vida de tus equipos...",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=400&h=300&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Tendencias tecnológicas en Ortodoncia 2024",
    author: "Dra. Lucía Méndez",
    date: "02 May, 2024",
    comments: 5,
    excerpt: "Desde alineadores invisibles impresos in-office hasta software de predicción 3D con IA interconectada al CBCT. Todo lo que depara este año...",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf41def98?q=80&w=400&h=300&auto=format&fit=crop",
  },
];

export default function BlogSection() {
  return (
    <section className="mb-16">
      <div className="max-w-7xl mx-auto">
        {/* Header de la sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-[28px] font-bold text-gray-900 leading-tight">
              Últimas Noticias y Artículos
            </h2>
            <p className="text-gray-500 mt-1 text-[15px]">
              Mantente al día con las últimas novedades, técnicas y consejos del sector dental.
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-md transition-colors shadow-sm self-start md:self-auto"
          >
            Ver Todos
          </Link>
        </div>

        {/* Grid del Blog */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300"
            >
              {/* Imagen (Aspect Ratio fijo para alineación) */}
              <Link to={`/blog/${post.id}`} className="block overflow-hidden h-48">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </Link>

              {/* Contenido Principal */}
              <div className="p-5 flex-1 flex flex-col">
                <Link to={`/blog/${post.id}`}>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors leading-snug mb-3">
                    {post.title}
                  </h3>
                </Link>

                {/* Autor */}
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                  <span className="material-symbols-rounded text-[18px]">account_circle</span>
                  <span>{post.author}</span>
                </div>

                {/* Extracto */}
                <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
                  {post.excerpt}
                </p>

                <hr className="border-gray-100 mb-4" />

                {/* Pie de tarjeta (Comentarios y Fecha) */}
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium pb-1">
                  <div className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer transition-colors">
                    <span className="material-symbols-rounded text-[16px]">chat_bubble_outline</span>
                    <span>{post.comments} Comentarios</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-rounded text-[16px]">calendar_today</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
