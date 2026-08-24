import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Chatbot({ token }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: '¡Hola! Soy el Asistente Virtual de Career-Fit de la ESPE. ¿En qué te puedo ayudar hoy con respecto a requisitos de idiomas, convenios o trámites?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al conectar con el chat');

      setMessages(prev => [...prev, { role: 'model', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: 'Lo siento, hubo un problema al procesar tu solicitud: ' + error.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-700 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform z-50"
          style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden" style={{ height: '500px', maxHeight: '80vh' }}>
          
          {/* Header */}
          <div className="bg-green-700 text-white p-4 flex justify-between items-center" style={{ backgroundColor: 'var(--primary-color)' }}>
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-bold">Asistente ESPE</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1" style={{ color: 'var(--primary-color)' }}>
                    <Bot size={14} />
                  </div>
                )}
                
                <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-blue-100 text-blue-900 rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`} style={msg.role === 'user' ? { backgroundColor: '#e0f2fe' } : {}}>
                  <ReactMarkdown className="markdown-content">{msg.content}</ReactMarkdown>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1 text-white">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1" style={{ color: 'var(--primary-color)' }}>
                  <Bot size={14} />
                </div>
                <div className="p-3 rounded-2xl bg-white border border-gray-200 text-gray-500 text-sm italic">
                  Escribiendo...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Hazme una pregunta..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-green-700 text-sm"
              disabled={loading}
              style={{ color: 'var(--text-main)' }}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors"
              style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              <Send size={16} style={{ marginLeft: '2px' }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
