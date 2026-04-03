import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

export default function ProductQA({ productId, storeOwnerId }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmittingQ, setIsSubmittingQ] = useState(false);

  // For answering
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);

  useEffect(() => {
    if (!productId) return;
    const fetchQA = async () => {
      try {
        const res = await api.get(`/products/${productId}/questions`);
        setQuestions(res.data.data || []);
      } catch (error) {
        console.error("Error cargando Q&A:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQA();
  }, [productId]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Debes iniciar sesión para preguntar.");
    
    try {
      setIsSubmittingQ(true);
      await api.post(`/products/${productId}/questions`, { question: newQuestion });
      toast.success("Tu pregunta fue publicada.");
      setNewQuestion("");
      
      const res = await api.get(`/products/${productId}/questions`);
      setQuestions(res.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error publicando pregunta.");
    } finally {
      setIsSubmittingQ(false);
    }
  };

  const handleReply = async (questionId) => {
    if (!replyText.trim()) return;

    try {
      await api.post(`/products/questions/${questionId}/reply`, { answer: replyText });
      toast.success("Respuesta enviada Oficialmente.");
      setReplyText("");
      setActiveReplyId(null);
      // reload
      const res = await api.get(`/products/${productId}/questions`);
      setQuestions(res.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al responder.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {/* HACER PREGUNTA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="flex-1 w-full">
          <h3 className="text-xl font-bold font-['Manrope'] mb-2 text-[#160a22]">Pregúntale al vendedor</h3>
          <p className="text-sm text-gray-500 mb-4">¿Tienes dudas sobre disponibilidad, especificaciones o envíos? Deja tu pregunta acá.</p>
          <form onSubmit={handleAsk} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ej: ¿Sirven para lámparas halógenas?"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6b1e96] outline-none text-sm"
            />
            <button
              type="submit"
              disabled={isSubmittingQ || !newQuestion.trim()}
              className="bg-[#2563eb] text-white font-semibold py-3 px-8 rounded-xl shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              Preguntar
            </button>
          </form>
        </div>
      </div>

      {/* LISTA DE P&R */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold font-['Manrope'] text-[#160a22] border-b pb-4">
          Últimas Preguntas
        </h3>
        
        {loading ? (
          <p className="text-gray-400">Cargando comunidad...</p>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <span className="material-symbols-outlined text-gray-300 text-[48px] mb-2">forum</span>
            <h3 className="text-lg font-bold text-gray-900 mb-1">El foro está vacío</h3>
            <p className="text-gray-500 text-sm">Nadie ha preguntado aún. Tienes la oportunidad de ser el primero.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q) => {
              // The API will send asker and responder objects using the alias. But if Supabase flattens it, handled here.
              const askerName = q.asker?.full_name || "Comprador";
              const isStoreOwnerAnswering = q.responder_id === storeOwnerId;

              return (
                <div key={q.id} className="bg-white border text-sm border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  {/* Contenedor Pregunta */}
                  <div className="p-5 flex gap-4 items-start">
                    <span className="material-symbols-outlined text-gray-300 mt-0.5">help</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 leading-relaxed">{q.question}</p>
                      <p className="text-xs text-gray-400 mt-2">Preguntado por {askerName} - {new Date(q.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Contenedor Respuesta */}
                  {q.answer ? (
                    <div className={`p-5 pl-14 pt-4 border-t ${isStoreOwnerAnswering ? 'bg-[#c3ff00]/10 border-[#c3ff00]/30' : 'bg-gray-50 border-gray-100'}`}>
                       <div className="flex gap-4 items-start">
                         <span className={`material-symbols-outlined mt-0.5 ${isStoreOwnerAnswering ? 'text-[#557300]' : 'text-gray-400'}`}>forum</span>
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-2">
                             <p className={`font-bold ${isStoreOwnerAnswering ? 'text-[#557300]' : 'text-gray-700'}`}>
                                {isStoreOwnerAnswering ? "Respuesta Oficial del Vendedor" : "Respuesta de la Comunidad"}
                             </p>
                             {isStoreOwnerAnswering && (
                                <span className="material-symbols-outlined text-[#557300] text-[16px]">verified</span>
                             )}
                           </div>
                           <p className="text-gray-700 leading-relaxed">{q.answer}</p>
                           <p className="text-xs text-gray-500 mt-2">{new Date(q.answered_at).toLocaleDateString()}</p>
                         </div>
                       </div>
                    </div>
                  ) : (
                    // Si no tiene respuesta y el usuario logeado es la tienda o alguien cualquiera
                    user && (
                      <div className="p-5 pl-14 pt-4 border-t bg-gray-50 border-gray-100 flex gap-4">
                         <span className="material-symbols-outlined text-gray-300">reply</span>
                         <div className="flex-1">
                           {activeReplyId === q.id ? (
                             <div className="flex gap-2 w-full">
                               <input 
                                  autoFocus
                                  type="text" 
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Escribe la respuesta..."
                                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-[#6b1e96] outline-none"
                               />
                               <button onClick={() => handleReply(q.id)} className="bg-[#6b1e96] text-white px-4 py-2 rounded-lg font-bold">Enviar</button>
                               <button onClick={() => setActiveReplyId(null)} className="text-gray-500 px-2 font-medium">Cancelar</button>
                             </div>
                           ) : (
                             <button 
                               onClick={() => setActiveReplyId(q.id)} 
                               className="text-[#6b1e96] font-semibold hover:underline"
                             >
                               {user.id === storeOwnerId ? "Como vendedor, responde esto ya." : "Responder como experto"}
                             </button>
                           )}
                         </div>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

ProductQA.propTypes = {
  productId: PropTypes.string.isRequired,
  storeOwnerId: PropTypes.string,
};
