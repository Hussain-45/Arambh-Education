import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Send, Sparkles, GraduationCap, Compass, Play, Pause, RotateCcw, Clock, ArrowRight, Upload, Image, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

// ==========================================
// Inline Newton's Second Law Simulator
// ==========================================
const NewtonSimulator = () => {
  const [force, setForce] = useState(10);
  const [mass, setMass] = useState(2);
  const [running, setRunning] = useState(false);
  const canvasRef = useRef(null);
  const xRef = useRef(50);
  const vRef = useRef(0);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }

      // Floor
      ctx.strokeStyle = 'var(--border-color)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, height - 30); ctx.lineTo(width, height - 30); ctx.stroke();

      if (running) {
        const acceleration = force / mass;
        const dt = 0.05;
        vRef.current += acceleration * dt;
        xRef.current += vRef.current * dt;

        if (xRef.current > width - 70) {
          xRef.current = 20;
          vRef.current = 0;
        }
      }

      // Box
      const boxSize = 40;
      const boxY = height - 30 - boxSize;
      const boxX = xRef.current;

      ctx.fillStyle = 'var(--primary-text)';
      ctx.fillRect(boxX, boxY, boxSize, boxSize);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(boxX, boxY, boxSize, boxSize);

      // Mass label
      ctx.fillStyle = 'white';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${mass}kg`, boxX + boxSize / 2, boxY + boxSize / 2 + 4);

      // Force Arrow
      if (force > 0) {
        ctx.strokeStyle = '#22c55e';
        ctx.fillStyle = '#22c55e';
        ctx.lineWidth = 2;
        const startX = boxX - force * 2.5 - 5;
        const endX = boxX - 3;
        const arrowY = boxY + boxSize / 2;

        ctx.beginPath(); ctx.moveTo(startX, arrowY); ctx.lineTo(endX, arrowY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(endX, arrowY); ctx.lineTo(endX - 6, arrowY - 4); ctx.lineTo(endX - 6, arrowY + 4); ctx.fill();
      }

      // Velocity Arrow
      if (running && vRef.current > 0) {
        ctx.strokeStyle = '#3b82f6';
        ctx.fillStyle = '#3b82f6';
        ctx.lineWidth = 2;
        const startX = boxX + boxSize + 3;
        const endX = startX + Math.min(vRef.current * 3, 60);
        const arrowY = boxY + boxSize / 2;

        ctx.beginPath(); ctx.moveTo(startX, arrowY); ctx.lineTo(endX, arrowY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(endX, arrowY); ctx.lineTo(endX - 6, arrowY - 4); ctx.lineTo(endX - 6, arrowY + 4); ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [force, mass, running]);

  return (
    <div style={{ marginTop: '1rem', background: 'var(--bg-main)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Sparkles size={14} style={{ color: 'var(--primary-text)' }} /> Newton's 2nd Law Simulation
      </div>
      <canvas ref={canvasRef} width={340} height={120} style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', display: 'block' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.8rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mass: {mass} kg</span>
          <input type="range" min="1" max="5" step="0.5" value={mass} onChange={e => setMass(parseFloat(e.target.value))} style={{ accentColor: 'var(--primary-text)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Force: {force} N</span>
          <input type="range" min="1" max="20" step="1" value={force} onChange={e => setForce(parseInt(e.target.value))} style={{ accentColor: 'var(--primary-text)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
        <button onClick={() => setRunning(!running)} className="prof-btn" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          {running ? <Pause size={12} /> : <Play size={12} />}
          {running ? 'Pause' : 'Run'}
        </button>
        <button onClick={() => { setRunning(false); xRef.current = 50; vRef.current = 0; }} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <RotateCcw size={12} />
        </button>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', marginLeft: 'auto', color: 'var(--text-muted)' }}>
          a = F/m = <span style={{ color: 'var(--primary-text)', marginLeft: '4px' }}>{(force/mass).toFixed(2)} m/s²</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Inline Faraday's Induction Simulator
// ==========================================
const InductionSimulator = () => {
  const [magnetX, setMagnetX] = useState(60);
  const [inducedCurrent, setInducedCurrent] = useState(0);
  const prevX = useRef(magnetX);
  const canvasRef = useRef(null);
  const coilX = 220;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Coil
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    const centerY = height / 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(coilX + i * 10, centerY, 12, 28, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Dial
    const dialX = width / 2;
    const dialY = height - 35;
    ctx.strokeStyle = 'var(--border-color)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(dialX, dialY, 20, Math.PI, 2 * Math.PI); ctx.stroke();

    // Deflecting Needle
    const maxDeflection = Math.PI / 4;
    const angle = -Math.PI / 2 + Math.min(Math.max(inducedCurrent * 0.2, -maxDeflection), maxDeflection);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(dialX, dialY); ctx.lineTo(dialX + Math.cos(angle) * 16, dialY + Math.sin(angle) * 16); ctx.stroke();

    // Magnet
    const magW = 70;
    const magH = 26;
    const magY = centerY - magH / 2;

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(magnetX, magY, magW / 2, magH);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("N", magnetX + magW / 4, magY + 16);

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(magnetX + magW / 2, magY, magW / 2, magH);
    ctx.fillStyle = 'white';
    ctx.fillText("S", magnetX + (3 * magW) / 4, magY + 16);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(magnetX, magY, magW, magH);

    // Bulb
    const bulbX = coilX + 20;
    const bulbY = 25;
    ctx.beginPath(); ctx.arc(bulbX, bulbY, 10, 0, 2 * Math.PI);
    const brightness = Math.min(Math.abs(inducedCurrent) * 12, 255);
    ctx.fillStyle = brightness > 5 ? `rgba(234, 179, 8, ${brightness / 255})` : 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = brightness > 5 ? '#eab308' : 'var(--border-color)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

  }, [magnetX, inducedCurrent]);

  const handleDrag = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - 35;
    const clampedX = Math.min(Math.max(x, 10), canvas.width - 80);

    const dx = clampedX - prevX.current;
    setMagnetX(clampedX);
    setInducedCurrent(dx * 3.5);
    prevX.current = clampedX;

    setTimeout(() => setInducedCurrent(0), 150);
  };

  return (
    <div style={{ marginTop: '1rem', background: 'var(--bg-main)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Sparkles size={14} style={{ color: 'var(--primary-text)' }} /> Faraday's Induction Simulation
      </div>
      <canvas ref={canvasRef} width={340} height={120} onMouseMove={handleDrag} style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', display: 'block', cursor: 'ew-resize' }} />
      <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        💡 Drag your mouse/finger horizontally inside the canvas to move the magnet!
      </div>
    </div>
  );
};

// ==========================================
// Inline Function Plotter
// ==========================================
const PlotterSimulator = () => {
  const [formula, setFormula] = useState('Math.sin(x/10) * 30');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke();

    // Plot
    ctx.strokeStyle = 'var(--primary-text)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let first = true;
    for (let screenX = 0; screenX < width; screenX++) {
      const graphX = screenX - centerX;
      try {
        const fn = new Function('x', 'return ' + formula);
        const graphY = fn(graphX);
        const screenY = centerY - graphY;

        if (screenY >= 0 && screenY <= height) {
          if (first) {
            ctx.moveTo(screenX, screenY);
            first = false;
          } else {
            ctx.lineTo(screenX, screenY);
          }
        }
      } catch (e) {}
    }
    ctx.stroke();
  }, [formula]);

  return (
    <div style={{ marginTop: '1rem', background: 'var(--bg-main)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Sparkles size={14} style={{ color: 'var(--primary-text)' }} /> Math Function Plotter
      </div>
      <canvas ref={canvasRef} width={340} height={120} style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', display: 'block' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Formula y = f(x)</span>
        <input type="text" value={formula} onChange={e => setFormula(e.target.value)} className="prof-input" style={{ fontSize: '0.75rem', padding: '0.35rem' }} />
      </div>
    </div>
  );
};

// ==========================================
// Main Gemini Chatbot Workspace Component
// ==========================================
const StudyCompanion = () => {
  const { authToken, loggedInUser, showToast } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'doubt' | 'podcast'
  
  // Chat History states
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am your Aarambh AI Study Tutor. Ask me any question about Math, Science, English, or Computer Science! I will explain concepts step-by-step and provide check-for-understanding practice problems. Feel free to ask for visual simulations or graph plotting!'
    }
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Doubt Solver states
  const [doubtImage, setDoubtImage] = useState(null);
  const [doubtImageBase64, setDoubtImageBase64] = useState('');
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtResult, setDoubtResult] = useState('');

  const handleDoubtImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDoubtImage(URL.createObjectURL(file));
      setDoubtImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSolveDoubt = async () => {
    if (!doubtImageBase64) return;
    setDoubtLoading(true);
    setDoubtResult('');

    try {
      const response = await fetch('http://localhost:5000/api/ai/solve-doubt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ image: doubtImageBase64 })
      });

      if (response.ok) {
        const data = await response.json();
        setDoubtResult(data.text);
        showToast('Doubt solved successfully! +15 XP awarded.', 'success');
      } else {
        const err = await response.json();
        setDoubtResult(`⚠️ **Error:** ${err.error || 'Failed to solve doubt'}`);
      }
    } catch (err) {
      console.error(err);
      setDoubtResult(`⚠️ **Connection Error:** Could not reach the server.`);
    } finally {
      setDoubtLoading(false);
    }
  };

  // Podcast player states
  const [podcastTopic, setPodcastTopic] = useState('');
  const [podcastScript, setPodcastScript] = useState([]);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [activeDialogueIdx, setActiveDialogueIdx] = useState(-1);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const utteranceRef = useRef(null);

  // Stop SpeechSynthesis when changing tab or unmounting
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [activeTab]);

  const handleGeneratePodcast = async () => {
    if (!podcastTopic.trim()) return;
    setPodcastLoading(true);
    setPodcastScript([]);
    setActiveDialogueIdx(-1);
    setIsPlayingPodcast(false);
    window.speechSynthesis?.cancel();

    try {
      const response = await fetch('http://localhost:5000/api/ai/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ topic: podcastTopic })
      });

      if (response.ok) {
        const data = await response.json();
        setPodcastScript(data.script);
        showToast('Academic Podcast generated! Ready to listen.', 'success');
      } else {
        showToast('Failed to generate podcast script.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    } finally {
      setPodcastLoading(false);
    }
  };

  const playPodcastLine = (idx) => {
    if (!podcastScript || podcastScript.length === 0) return;
    if (idx >= podcastScript.length) {
      setIsPlayingPodcast(false);
      setActiveDialogueIdx(-1);
      showToast('Podcast finished! +20 XP awarded for active listening.', 'success');
      return;
    }

    setActiveDialogueIdx(idx);
    const card = podcastScript[idx];

    const utterance = new SpeechSynthesisUtterance(card.line);
    utteranceRef.current = utterance;
    
    if (card.speaker === 'Dr. Elena') {
      utterance.pitch = 0.95;
      utterance.rate = 0.9 * playbackSpeed;
    } else {
      utterance.pitch = 1.15;
      utterance.rate = 1.0 * playbackSpeed;
    }

    utterance.onend = () => {
      if (isPlayingPodcast) {
        playPodcastLine(idx + 1);
      }
    };

    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(utterance);
  };

  const togglePlayPodcast = () => {
    if (isPlayingPodcast) {
      window.speechSynthesis?.pause();
      setIsPlayingPodcast(false);
    } else {
      setIsPlayingPodcast(true);
      if (window.speechSynthesis?.paused) {
        window.speechSynthesis?.resume();
      } else {
        const startIdx = activeDialogueIdx === -1 ? 0 : activeDialogueIdx;
        playPodcastLine(startIdx);
      }
    }
  };

  const handleResetPodcast = () => {
    window.speechSynthesis?.cancel();
    setIsPlayingPodcast(false);
    setActiveDialogueIdx(-1);
  };

  // Suggested Prompts (Gemini Card Style)
  const suggestedCards = [
    {
      title: 'Newton\'s 2nd Law',
      desc: 'Visualize acceleration with a force and mass simulator.',
      prompt: 'Explain Newton\'s second law with an interactive block simulation.'
    },
    {
      title: 'Electromagnetic Induction',
      desc: 'Drag magnets to induce electric current in a coil.',
      prompt: 'Show me how moving magnets generate electricity in a coil.'
    },
    {
      title: 'Math Graph Plotter',
      desc: 'Render mathematical functions like y = sin(x) on a grid.',
      prompt: 'Plot a mathematical function like y = sin(x) on a graph.'
    },
    {
      title: 'Algebra Help',
      desc: 'Learn about simple and compound interest step-by-step.',
      prompt: 'Explain how simple and compound interest are calculated with formulas.'
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAsk = async (presetPrompt = null) => {
    const activeQuestion = presetPrompt || question;
    if (!activeQuestion.trim()) return;

    if (!presetPrompt) {
      setQuestion('');
    }

    const userMessage = { id: Date.now(), sender: 'user', text: activeQuestion };
    setChatHistory(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/ai/study-help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          question: activeQuestion,
          history: chatHistory.slice(1)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: data.text, promptContext: activeQuestion }]);
      } else {
        const errData = await response.json();
        setChatHistory(prev => [...prev, { 
          id: Date.now() + 1, 
          sender: 'bot', 
          text: `⚠️ **Error:** ${errData.error || 'Failed to generate response. Please try again.'}` 
        }]);
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: `⚠️ **Connection Error:** Could not reach the AI server. Make sure the backend server is running.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // LaTeX & Markdown Rich Text Parser
  // ----------------------------------------
  const renderFormattedMessage = (text) => {
    if (!text) return null;
    const blocks = text.split('$$');
    
    return blocks.map((block, blockIdx) => {
      // Block equations
      if (blockIdx % 2 === 1) {
        const formula = block.trim();
        if (window.katex) {
          try {
            const html = window.katex.renderToString(formula, { displayMode: true, throwOnError: false });
            return (
              <div 
                key={`eq-block-${blockIdx}`} 
                dangerouslySetInnerHTML={{ __html: html }} 
                style={{ margin: '1rem 0', overflowX: 'auto', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}
              />
            );
          } catch (e) {
            return <div key={`eq-block-err-${blockIdx}`} style={{ textAlign: 'center', fontFamily: 'monospace', margin: '0.8rem 0', padding: '0.5rem', background: 'rgba(255,0,0,0.05)', borderRadius: '6px' }}>{formula}</div>;
          }
        }
        return <div key={`eq-block-fallback-${blockIdx}`} style={{ textAlign: 'center', fontFamily: 'monospace', margin: '0.8rem 0' }}>{formula}</div>;
      }
      
      const lines = block.split('\n');
      
      return lines.map((line, lineIdx) => {
        if (line.startsWith('### ')) {
          return <h3 key={`h3-${lineIdx}`} style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={`h2-${lineIdx}`} style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{line.replace('## ', '')}</h2>;
        }

        let isBullet = false;
        let cleanLine = line;
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          isBullet = true;
          cleanLine = line.trim().substring(2);
        }

        const parts = [];
        const inlineRegex = /(\*\*([^*`$]+)\*\*)|(\*([^*`$]+)\*)|(`([^`]+)`)|(\$([^\$]+)\$)/g;
        let match;
        let lastIndex = 0;

        while ((match = inlineRegex.exec(cleanLine)) !== null) {
          if (match.index > lastIndex) {
            parts.push(cleanLine.substring(lastIndex, match.index));
          }

          if (match[1]) {
            parts.push(<strong key={`b-${match.index}`} style={{ fontWeight: 700, color: 'var(--text-main)' }}>{match[2]}</strong>);
          } else if (match[3]) {
            parts.push(<em key={`i-${match.index}`} style={{ fontStyle: 'italic' }}>{match[4]}</em>);
          } else if (match[5]) {
            parts.push(
              <code 
                key={`c-${match.index}`} 
                style={{ 
                  fontFamily: 'monospace', 
                  background: 'rgba(255,255,255,0.06)', 
                  color: 'var(--primary-text)', 
                  padding: '0.15rem 0.35rem', 
                  borderRadius: '4px',
                  fontSize: '0.85rem'
                }}
              >
                {match[6]}
              </code>
            );
          } else if (match[7]) {
            const formula = match[8];
            if (window.katex) {
              try {
                const html = window.katex.renderToString(formula, { displayMode: false, throwOnError: false });
                parts.push(<span key={`eq-${match.index}`} dangerouslySetInnerHTML={{ __html: html }} style={{ padding: '0 0.2rem' }} />);
              } catch (e) {
                parts.push(<code key={`eq-err-${match.index}`} style={{ fontFamily: 'monospace', background: 'rgba(255,0,0,0.05)', padding: '2px 4px', borderRadius: '4px' }}>{formula}</code>);
              }
            } else {
              parts.push(<code key={`eq-fallback-${match.index}`} style={{ fontFamily: 'monospace' }}>{formula}</code>);
            }
          }

          lastIndex = inlineRegex.lastIndex;
        }

        if (lastIndex < cleanLine.length) {
          parts.push(cleanLine.substring(lastIndex));
        }

        if (isBullet) {
          return (
            <div key={`bullet-${lineIdx}`} style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--primary-text)', fontWeight: 'bold' }}>•</span>
              <div style={{ flex: 1 }}>{parts}</div>
            </div>
          );
        }

        return (
          <div key={`line-${lineIdx}`} style={{ minHeight: '1.2em', marginBottom: '0.5rem' }}>
            {parts}
          </div>
        );
      });
    });
  };

  // ----------------------------------------
  // Helper to detect if a simulator is needed
  // ----------------------------------------
  const renderInlineSimulator = (msg) => {
    if (msg.sender !== 'bot') return null;
    const textToCheck = (msg.text + ' ' + (msg.promptContext || '')).toLowerCase();

    if (textToCheck.includes('newton') && (textToCheck.includes('second') || textToCheck.includes('simulation') || textToCheck.includes('force'))) {
      return <NewtonSimulator />;
    }
    if (textToCheck.includes('induction') || textToCheck.includes('faraday') || textToCheck.includes('coil') || textToCheck.includes('magnet')) {
      return <InductionSimulator />;
    }
    if (textToCheck.includes('plotter') || textToCheck.includes('graph') || textToCheck.includes('plot') || textToCheck.includes('y =')) {
      return <PlotterSimulator />;
    }
    return null;
  };

  return (
    <>
      <Sidebar />
      <main className="main-content" style={{ padding: '2rem 1.5rem', background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />

        {/* Gemini Centralized Chat Layout */}
        <div style={{ 
          flex: 1, 
          maxWidth: '820px', 
          width: '100%', 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          position: 'relative'
        }}>

          {/* Workspace Tab Switcher */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '24px',
                border: activeTab === 'chat' ? '1px solid var(--primary-text)' : '1px solid var(--border-color)',
                background: activeTab === 'chat' ? 'rgba(124, 98, 243, 0.08)' : 'transparent',
                color: activeTab === 'chat' ? 'var(--primary-text)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              💬 AI Study Tutor
            </button>
            <button
              onClick={() => setActiveTab('doubt')}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '24px',
                border: activeTab === 'doubt' ? '1px solid var(--primary-text)' : '1px solid var(--border-color)',
                background: activeTab === 'doubt' ? 'rgba(124, 98, 243, 0.08)' : 'transparent',
                color: activeTab === 'doubt' ? 'var(--primary-text)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📸 AI Doubt Solver
            </button>
            <button
              onClick={() => setActiveTab('podcast')}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '24px',
                border: activeTab === 'podcast' ? '1px solid var(--primary-text)' : '1px solid var(--border-color)',
                background: activeTab === 'podcast' ? 'rgba(124, 98, 243, 0.08)' : 'transparent',
                color: activeTab === 'podcast' ? 'var(--primary-text)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🎧 Listen & Learn Podcast
            </button>
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '80px' }}>
            
            {activeTab === 'chat' && (
              <>
                {/* Welcome Screen (Show only if conversation has not started) */}
                {chatHistory.length <= 1 ? (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    padding: '2rem 1rem',
                    minHeight: '40vh'
                  }}>
                    <h1 style={{ 
                      fontSize: '3rem', 
                      fontWeight: 700, 
                      margin: 0, 
                      background: 'linear-gradient(75deg, #7c62f3, #c084fc, #3b82f6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: '1.2'
                    }}>
                      Hello, {loggedInUser?.name || 'Student'}.
                    </h1>
                    <h2 style={{ 
                      fontSize: '2.5rem', 
                      fontWeight: 600, 
                      color: 'var(--text-muted)', 
                      margin: '0.2rem 0 2rem 0',
                      lineHeight: '1.2'
                    }}>
                      How can I help you today?
                    </h2>

                    {/* Gemini Prompt Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                      gap: '1rem',
                      marginTop: '1.5rem'
                    }}>
                      {suggestedCards.map((card, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleAsk(card.prompt)}
                          className="prof-card"
                          style={{ 
                            padding: '1.25rem', 
                            borderRadius: '16px', 
                            cursor: 'pointer', 
                            transition: 'all 0.25s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '130px',
                            border: '1px solid var(--border-color)',
                            background: 'rgba(255, 255, 255, 0.01)'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.borderColor = 'var(--primary-text)';
                            e.currentTarget.style.background = 'rgba(124, 98, 243, 0.03)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                              {card.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                              {card.desc}
                            </div>
                          </div>
                          <div style={{ 
                            alignSelf: 'flex-end', 
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.04)', display: 'flex', 
                            alignItems: 'center', justifyContext: 'center', color: 'var(--text-muted)'
                          }}>
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Conversation Message List
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2.5rem', 
                    padding: '1.5rem 0.5rem',
                    minHeight: '400px'
                  }}>
                    {chatHistory.map(msg => (
                      <div key={msg.id} style={{ 
                        display: 'flex', 
                        gap: '1.25rem',
                        alignItems: 'flex-start',
                        maxWidth: '100%',
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                      }}>
                        {/* Bot Avatar */}
                        {msg.sender === 'bot' && (
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #7c62f3, #3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 10px rgba(124, 98, 243, 0.3)',
                            flexShrink: 0
                          }}>
                            <Sparkles size={16} color="white" />
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div style={{ 
                          flex: msg.sender === 'user' ? 'none' : 1,
                          background: msg.sender === 'user' ? 'var(--secondary)' : 'transparent',
                          color: 'var(--text-main)',
                          padding: msg.sender === 'user' ? '0.75rem 1.25rem' : '0',
                          borderRadius: '20px',
                          maxWidth: msg.sender === 'user' ? '70%' : '100%',
                          fontSize: '0.95rem',
                          lineHeight: '1.6',
                          border: msg.sender === 'user' ? '1px solid var(--border-color)' : 'none',
                          boxShadow: msg.sender === 'user' ? 'var(--shadow-sm)' : 'none'
                        }}>
                          {/* Formatted Text */}
                          <div>
                            {msg.sender === 'bot' ? renderFormattedMessage(msg.text) : msg.text}
                          </div>

                          {/* Condition-based Inline Visualization */}
                          {renderInlineSimulator(msg)}
                        </div>
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {loading && (
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #7c62f3, #3b82f6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 10px rgba(124, 98, 243, 0.3)'
                        }}>
                          <Sparkles size={16} color="white" />
                        </div>
                        <div style={{ display: 'flex', gap: '6px', padding: '0.8rem 0' }}>
                          <div style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                          <div style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.2s' }} />
                          <div style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.4s' }} />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </>
            )}

            {/* AI Doubt Solver View */}
            {activeTab === 'doubt' && (
              <div style={{ background: 'var(--secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>📸 AI Photo Doubt Solver</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Upload a photo of a math, physics, or chemistry problem. Gemini will read it and write a step-by-step tutorial!
                </p>

                {/* Drag and Drop Zone */}
                <div style={{ 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: '16px', 
                  padding: '2.5rem 1rem', 
                  textAlign: 'center', 
                  background: 'rgba(255,255,255,0.01)',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDoubtImageChange}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  <Upload size={32} style={{ color: 'var(--primary-text)', marginBottom: '0.8rem' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Drag & drop or click to upload question image</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Supports PNG, JPG, or JPEG</div>
                </div>

                {/* Preview Image Card */}
                {doubtImage && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <img src={doubtImage} alt="Doubt question preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                    <button 
                      onClick={handleSolveDoubt}
                      disabled={doubtLoading}
                      style={{
                        background: 'var(--primary-text)',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '20px',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: doubtLoading ? 0.6 : 1
                      }}
                    >
                      {doubtLoading ? (
                        <>Solving Doubt...</>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Solve Doubt with Gemini
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Doubt Result Solutions card */}
                {(doubtLoading || doubtResult) && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={16} style={{ color: 'var(--primary-text)' }} />
                      Step-by-Step Solution:
                    </h4>
                    {doubtLoading ? (
                      <div style={{ display: 'flex', gap: '6px', padding: '1rem 0' }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                        <div style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.2s' }} />
                        <div style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.4s' }} />
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {renderFormattedMessage(doubtResult)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI Academic Audio Podcast View */}
            {activeTab === 'podcast' && (
              <div style={{ background: 'var(--secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>🎧 AI Academic Audio Podcast</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Enter any topic, and Gemini will compose a Dialogue script (Dr. Elena & student Alex) and narrate it using Text-to-Speech voices!
                </p>

                {/* Podcast Topic Input Form */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={podcastTopic}
                    onChange={e => setPodcastTopic(e.target.value)}
                    placeholder="Enter study topic (e.g., Photosynthesis, Newton's 2nd Law, Trigonometry)..."
                    disabled={podcastLoading}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      color: 'var(--text-main)',
                      fontSize: '0.95rem',
                      padding: '0.75rem 1.25rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleGeneratePodcast}
                    disabled={podcastLoading || !podcastTopic.trim()}
                    style={{
                      background: 'var(--primary-text)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '0 1.5rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: (podcastLoading || !podcastTopic.trim()) ? 0.6 : 1
                    }}
                  >
                    {podcastLoading ? 'Creating...' : 'Create Podcast'}
                  </button>
                </div>

                {/* Podcast Script & Audio TTS Controls */}
                {podcastScript.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Visual Player Header Control Bar */}
                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', items: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', items: 'center', gap: '1rem' }}>
                        <button
                          onClick={togglePlayPodcast}
                          style={{
                            width: '44px', height: '44px', borderRadius: '50%',
                            background: 'var(--primary-text)', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'white'
                          }}
                        >
                          {isPlayingPodcast ? <Pause size={18} fill="white" /> : <Play size={18} style={{ marginLeft: '2px' }} fill="white" />}
                        </button>
                        <button
                          onClick={handleResetPodcast}
                          style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--text-main)'
                          }}
                          title="Reset Podcast"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>

                      {/* Speed Rate Multiplex */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>Speed:</span>
                        {[0.75, 1, 1.25, 1.5].map(speed => (
                          <button
                            key={speed}
                            onClick={() => {
                              setPlaybackSpeed(speed);
                              if (isPlayingPodcast && activeDialogueIdx !== -1) {
                                playPodcastLine(activeDialogueIdx); // reload with new speed
                              }
                            }}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              borderRadius: '8px',
                              border: playbackSpeed === speed ? '1px solid var(--primary-text)' : '1px solid var(--border-color)',
                              background: playbackSpeed === speed ? 'rgba(124, 98, 243, 0.1)' : 'transparent',
                              color: playbackSpeed === speed ? 'var(--primary-text)' : 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dialogue Line Bubble Feed */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                      {podcastScript.map((card, idx) => {
                        const isActive = idx === activeDialogueIdx;
                        const isDr = card.speaker === 'Dr. Elena';

                        return (
                          <div 
                            key={idx} 
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: isDr ? 'flex-start' : 'flex-end',
                              width: '100%'
                            }}
                          >
                            <div style={{ 
                              maxWidth: '80%', 
                              borderRadius: '16px', 
                              padding: '0.85rem 1.2rem',
                              background: isActive 
                                ? 'rgba(124, 98, 243, 0.15)' 
                                : isDr 
                                  ? 'rgba(255,255,255,0.02)' 
                                  : 'rgba(255,255,255,0.05)',
                              border: isActive 
                                ? '1.5px solid var(--primary-text)' 
                                : '1px solid var(--border-color)',
                              transition: 'all 0.3s ease',
                              boxShadow: isActive ? '0 4px 15px rgba(124, 98, 243, 0.2)' : 'none'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isDr ? '#3b82f6' : '#22c55e' }}>
                                  {isDr ? '👩‍🏫 Dr. Elena' : '👨‍🎓 Alex'}
                                </span>
                                {isActive && (
                                  <span style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                    <span style={{ width: '3px', height: '8px', background: 'var(--primary-text)', display: 'inline-block', animation: 'bounce 0.8s infinite ease-in-out both' }} />
                                    <span style={{ width: '3px', height: '12px', background: 'var(--primary-text)', display: 'inline-block', animation: 'bounce 0.8s infinite ease-in-out both 0.15s' }} />
                                    <span style={{ width: '3px', height: '8px', background: 'var(--primary-text)', display: 'inline-block', animation: 'bounce 0.8s infinite ease-in-out both 0.3s' }} />
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5' }}>{card.line}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Floating Gemini Input Bar */}
          {activeTab === 'chat' && (
            <div style={{ 
              position: 'fixed', 
              bottom: '1.5rem', 
              left: 'calc(var(--sidebar-width, 240px) + (100% - var(--sidebar-width, 240px) - 820px)/2)',
              right: 'calc((100% - var(--sidebar-width, 240px) - 820px)/2)',
              maxWidth: '820px',
              width: 'calc(100% - var(--sidebar-width, 240px) - 3rem)',
              background: 'var(--secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '32px',
              padding: '0.4rem 0.5rem 0.4rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
              zIndex: 10
            }}>
              <input
                type="text"
                placeholder="Ask a question about any subject..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !loading) { e.preventDefault(); handleAsk(); } }}
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  padding: '0.6rem 0'
                }}
              />
              <button 
                onClick={() => handleAsk()}
                disabled={loading || !question.trim()}
                style={{
                  borderRadius: '50%', width: '40px', height: '40px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--primary-text)', border: 'none', cursor: 'pointer',
                  opacity: loading || !question.trim() ? 0.4 : 1,
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <Send size={15} color="white" />
              </button>
            </div>
          )}

        </div>
      </main>
    </>
  );
};

export default StudyCompanion;
