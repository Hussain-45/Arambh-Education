import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { MessageSquare, Send, Users, ShieldAlert, Award } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function BatchChat() {
  const { loggedInUser, apiBaseUrl, authToken, showToast } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batches, setBatches] = useState([]);
  const messagesEndRef = useRef(null);

  const isTeacherOrAdmin = loggedInUser?.role === 'teacher' || loggedInUser?.role === 'admin';

  // Fetch classes/batches for teachers/admins
  useEffect(() => {
    if (isTeacherOrAdmin) {
      fetch(`http://localhost:5000/api/classes`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
        .then(res => res.json())
        .then(data => {
          setBatches(data);
          if (data.length > 0) {
            setSelectedBatch(data[0].name);
          }
        })
        .catch(err => console.error('Error fetching batches:', err));
    } else if (loggedInUser?.class || loggedInUser?.className) {
      setSelectedBatch(loggedInUser.class || loggedInUser.className);
    }
  }, [loggedInUser, apiBaseUrl, authToken]);

  // Fetch messages when selectedBatch changes
  useEffect(() => {
    if (!selectedBatch) return;

    const fetchMessages = () => {
      fetch(`http://localhost:5000/api/batches/${encodeURIComponent(selectedBatch)}/messages`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMessages(data);
          }
        })
        .catch(err => console.error('Error fetching messages:', err));
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // Polling every 4 seconds
    return () => clearInterval(interval);
  }, [selectedBatch, apiBaseUrl, authToken]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedBatch) return;

    try {
      const response = await fetch(`http://localhost:5000/api/batches/${encodeURIComponent(selectedBatch)}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      const newMsg = {
        id: data.msgId,
        class_name: selectedBatch,
        sender_id: loggedInUser.id,
        sender_name: loggedInUser.name,
        sender_role: loggedInUser.role,
        text: inputText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMsg]);
      setInputText('');

      // Award XP toast for students
      if (loggedInUser?.role === 'student') {
        showToast('Message sent! +5 XP awarded for classroom participation.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to send message.', 'error');
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content" style={{ padding: '2rem 1.5rem', background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />

        <div style={{ padding: '1rem', maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          
          {/* Upper header block */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'var(--secondary)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '16px', 
            padding: '1.5rem', 
            gap: '1rem', 
            flexWrap: 'wrap' 
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MessageSquare className="h-6 w-6" style={{ color: 'var(--primary-text)' }} />
                Classroom Discussion Room
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Discuss textbook topics and preparation. Students earn +5 XP per message!
              </p>
            </div>

            {/* Batch selection dropdown */}
            {isTeacherOrAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Select Batch:</span>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(124, 98, 243, 0.08)', 
                color: 'var(--primary-text)', 
                padding: '0.5rem 1rem', 
                borderRadius: '12px', 
                fontSize: '0.85rem', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                border: '1px solid rgba(124, 98, 243, 0.15)'
              }}>
                <Users size={16} />
                Active Batch: {selectedBatch || 'Loading...'}
              </div>
            )}
          </div>

          {/* Main chat interface panel */}
          <div style={{ 
            flex: 1, 
            background: 'var(--secondary)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '16px', 
            display: 'flex', 
            overflow: 'hidden',
            minHeight: '450px'
          }}>
            {/* Chat Feed */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.02)' }}>
              
              {/* Messages viewport */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px' }}>
                {messages.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem' }}>
                    <MessageSquare size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.8rem', opacity: 0.5 }} />
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>No Messages Yet</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '250px' }}>
                      Start the classroom discussion! Type a message below.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === loggedInUser?.id;
                    const isMsgTeacher = msg.sender_role === 'teacher';
                    const isMsgAdmin = msg.sender_role === 'admin';

                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', width: '100%' }}>
                        <div style={{ 
                          maxWidth: '70%', 
                          borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0', 
                          padding: '0.75rem 1.25rem', 
                          boxShadow: 'var(--shadow-sm)',
                          background: isMe 
                            ? 'var(--primary-text)' 
                            : isMsgTeacher 
                              ? 'rgba(16, 185, 129, 0.08)'
                              : isMsgAdmin
                                ? 'rgba(245, 158, 11, 0.08)'
                                : 'var(--bg-main)',
                          border: isMe 
                            ? 'none' 
                            : isMsgTeacher 
                              ? '1px solid rgba(16, 185, 129, 0.2)'
                              : isMsgAdmin
                                ? '1px solid rgba(245, 158, 11, 0.2)'
                                : '1px solid var(--border-color)',
                          color: isMe ? 'white' : 'var(--text-main)'
                        }}>
                          {/* Sender identity */}
                          {!isMe && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                {msg.sender_name}
                              </span>
                              {isMsgTeacher && (
                                <span style={{ background: '#10b981', color: 'white', fontSize: '8px', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 800 }}>
                                  TEACHER
                                </span>
                              )}
                              {isMsgAdmin && (
                                <span style={{ background: '#f59e0b', color: 'white', fontSize: '8px', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 800 }}>
                                  ADMIN
                                </span>
                              )}
                            </div>
                          )}

                          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4', wordBreak: 'break-word' }}>{msg.text}</p>
                          
                          <span style={{ 
                            display: 'block', 
                            fontSize: '8px', 
                            marginTop: '0.4rem', 
                            textAlign: 'right', 
                            opacity: 0.7,
                            color: isMe ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'
                          }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input box */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: 'var(--secondary)', borderTop: '1px solid var(--border-color)' }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask a question or discuss syllabus topics..."
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'var(--primary-text)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

            {/* Sidebar Guidelines Panel */}
            <div style={{ 
              width: '240px', 
              padding: '1.5rem', 
              borderLeft: '1px solid var(--border-color)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              background: 'rgba(0,0,0,0.01)'
            }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={14} style={{ color: 'var(--text-muted)' }} />
                Class Guidelines
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                <li>
                  Keep chat focused on subject-related notes, study questions, and quiz preparations.
                </li>
                <li>
                  Respect peers, educators, and administrators at all times.
                </li>
                <li>
                  Students earn **+5 XP** per message for active learning involvement.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
