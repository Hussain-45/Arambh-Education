import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Messages = () => {
  const { messages, students, sendMessage } = useContext(AppContext);
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState('SMS');

  const handleManualSend = (e) => {
    e.preventDefault();
    if (!recipient || !content) return;
    
    // Check if recipient is a student name, map to phone
    const student = students.find(s => s.name.toLowerCase().includes(recipient.toLowerCase()));
    const targetPhone = student ? student.parentPhone : recipient;

    sendMessage(targetPhone, channel, content);
    setRecipient('');
    setContent('');
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          <div className="prof-card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', marginTop: 0 }}>Compose Message</h2>
            <form onSubmit={handleManualSend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Recipient (Student Name or Phone)" 
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                className="prof-input"
              />
              <select 
                value={channel} 
                onChange={e => setChannel(e.target.value)}
                className="prof-input"
                required
              >
                <option value="SMS">SMS / Email Notification (Free)</option>
                <option value="Auto-WhatsApp">Auto-WhatsApp Robot</option>
              </select>
              <textarea 
                placeholder="Message Content..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows="5"
                className="prof-input"
                style={{ resize: 'vertical' }}
              />
              <button type="submit" className="prof-btn" style={{ alignSelf: 'flex-start' }}>Send Message</button>
            </form>
          </div>

          <div className="prof-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', marginTop: 0 }}>Message Logs</h2>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
              {messages.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No messages sent yet.</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} style={{ 
                    padding: '1rem', background: 'var(--bg-main)', 
                    border: '1px solid var(--border-color)', borderRadius: '8px',
                    borderLeft: '4px solid var(--primary)'
                  }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>To: {msg.recipient}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{msg.date}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>{msg.content}</p>
                    
                    <div className="flex-between" style={{ marginTop: '0.8rem' }}>
                      <div style={{ fontSize: '0.8rem', color: msg.status === 'Failed' ? 'var(--danger)' : 'var(--success)', fontWeight: 500 }}>
                        Status: {msg.status}
                        {msg.previewUrl && (
                          <a href={msg.previewUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '10px', color: 'var(--primary)', textDecoration: 'underline' }}>
                            View Delivered Message
                          </a>
                        )}
                      </div>
                      
                      <a 
                        href={`https://wa.me/${msg.recipient.replace(/\D/g,'')}?text=${encodeURIComponent(msg.content)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="prof-btn prof-btn-outline" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: '#25D366', color: '#25D366' }}
                      >
                        Send via WhatsApp
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  );
};

export default Messages;
