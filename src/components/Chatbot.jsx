import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const Chatbot = () => {
  const { loggedInUser, fees } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hi! I am your Aarambh Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
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

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');

    // Set loading state message
    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: loadingId, sender: 'bot', text: '...' }]);

    // Build current user context for personalized answers (omitting fees & financial data)
    let userContext = null;
    if (loggedInUser) {
      userContext = {
        name: loggedInUser.name,
        role: loggedInUser.role,
        class: loggedInUser.class,
        fatherName: loggedInUser.fatherName
      };
    }

    const lastUserMessage = input.toLowerCase();

    // Prevent financial / fee queries client-side
    const financialKeywords = ['fee', 'pending', 'due', 'pay', 'rupee', 'money', 'profit', 'loss', 'expense', 'cost', 'price', 'salary', 'financial', 'revenue', 'budget'];
    if (financialKeywords.some(keyword => lastUserMessage.includes(keyword))) {
      setMessages(prev => prev.map(m => 
        m.id === loadingId ? { ...m, text: "Sorry, I cannot answer questions about financial details, fees, or profit & loss metrics." } : m
      ));
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages.slice(1), // Skip the initial greeting to save tokens
          userContext
        })
      });
      const data = await response.json();

      setMessages(prev => prev.map(m => 
        m.id === loadingId ? { ...m, text: data.text } : m
      ));
    } catch (error) {
      // Offline fallback matching engine if local backend is stopped
      let reply = "I am Aarambh Assistant. How can I help you today?";
      const name = userContext?.name || "Student";
      const userClass = userContext?.class || "10th Math";
      const fatherName = userContext?.fatherName || "Not Set";

      if (lastUserMessage.includes('batch') || lastUserMessage.includes('class') || lastUserMessage.includes('schedule') || lastUserMessage.includes('timing')) {
        reply = `Hi ${name}, you are currently registered in the batch: **${userClass}**. Lectures and study materials are mapped directly to this class.`;
      } else if (lastUserMessage.includes('father') || lastUserMessage.includes('parent') || lastUserMessage.includes('dad') || lastUserMessage.includes('family')) {
        reply = `According to our student registration records, your father's name is: **${fatherName}**.`;
      } else if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi') || lastUserMessage.includes('hey')) {
        reply = `Hello ${name}! I am your Aarambh Assistant. I know you are in batch **${userClass}**. How can I help you today?`;
      } else {
        reply = `I am Aarambh Assistant. I can answer questions about your batch schedule (**${userClass}**) or father's name (**${fatherName}**). Let me know what you need!`;
      }

      setMessages(prev => prev.map(m => 
        m.id === loadingId ? { ...m, text: reply } : m
      ));
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'var(--primary)', color: 'white',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          cursor: 'pointer', boxShadow: 'var(--shadow-lg)',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'scale(0)' : 'scale(1)'
        }}
      >
        <MessageCircle size={28} />
      </div>

      {/* Chat Window */}
      <div style={{
        position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000,
        width: '350px', height: '500px',
        background: 'var(--bg-card)', borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformOrigin: 'bottom right',
        transform: isOpen ? 'scale(1)' : 'scale(0)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'all' : 'none'
      }}>
        
        {/* Header */}
        <div style={{
          background: 'var(--primary)', color: 'white', padding: '1rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Aarambh AI</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Student Support Bot</p>
          </div>
          <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-main)' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-card)',
              color: msg.sender === 'user' ? 'white' : 'var(--text-main)',
              border: `1px solid ${msg.sender === 'user' ? 'transparent' : 'var(--border-color)'}`,
              padding: '0.75rem 1rem', borderRadius: '12px',
              borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px',
              borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '12px',
              maxWidth: '85%', fontSize: '0.9rem', lineHeight: '1.4',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} style={{
          padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)',
          display: 'flex', gap: '0.5rem'
        }}>
          <input 
            type="text" 
            placeholder="Ask a question..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="prof-input"
            style={{ flex: 1, padding: '0.6rem 1rem' }}
          />
          <button type="submit" className="prof-btn" style={{ padding: '0.6rem', borderRadius: '6px' }}>
            <Send size={18} />
          </button>
        </form>

      </div>
    </>
  );
};

export default Chatbot;
