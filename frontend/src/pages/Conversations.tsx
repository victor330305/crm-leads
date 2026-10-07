// Lista de conversaciones recientes
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface Conversation {
  id: string;
  channel: string;
  createdAt: string;
  lead: { id: string; name: string | null; score: number; temperature: string; status: string };
  _count: { messages: number };
}

export default function Conversations() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/conversations')
      .then(({ data }) => { setConversations(data.conversations); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const tempColor = (t: string) =>
    t === 'HOT' ? 'text-red-400' : t === 'WARM' ? 'text-amber-400' : 'text-blue-400';

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Conversaciones</h2>
        <p className="text-gray-400 text-sm mt-1">{total} en total</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay conversaciones todavía</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Lead</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Mensajes</th>
                <th className="px-4 py-3 text-left">Canal</th>
                <th className="px-4 py-3 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conv) => (
                <tr
                  key={conv.id}
                  onClick={() => navigate(`/leads/${conv.lead.id}`)}
                  className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{conv.lead.name ?? 'Sin nombre'}</p>
                    <p className="text-gray-500 text-xs">{conv.lead.status}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${tempColor(conv.lead.temperature)}`}>{conv.lead.score}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{conv._count.messages}</td>
                  <td className="px-4 py-3 text-gray-400">{conv.channel}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(conv.createdAt).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
