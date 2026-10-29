import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Trash2, MessageSquare, Mic, Sparkles, Paperclip, PlusCircle } from 'lucide-react'
import { UserBubble, BotBubble, TypingIndicator } from '../components/ChatBubble'
import { useAuth } from '../context/AuthContext'

const SUGGESTED = [
  'What is your return policy?',
  'What are the shipping charges?',
  'How do I track my order?',
  'Do you offer EMI options?',
  'How to contact customer support?',
  'Can I exchange a product?',
]

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
}

export default function UserPortal() {
  const { apiFetch, user } = useAuth()
  const location = useLocation()

  const [conversationId, setConversationId] = useState(() => {
    return location.state?.conversationId || null
  })
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [feedbacks, setFeedbacks] = useState({})
  const [clearing, setClearing] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch messages for active conversation or restore from location state
  useEffect(() => {
    const targetConvId = location.state?.conversationId || conversationId
    const query = targetConvId ? `?conversation_id=${encodeURIComponent(targetConvId)}` : ''

    apiFetch(`/api/messages${query}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setMessages(d.messages || [])
          if (d.conversation_id) setConversationId(d.conversation_id)
        }
      })
      .catch(() => {})
  }, [location.state?.conversationId, apiFetch])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || typing) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg, ts: new Date().toISOString() }])
    setTyping(true)

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversation_id: conversationId
        }),
      })
      const d = await res.json()
      if (d.ok) {
        setMessages(prev => [...prev, d.message])
        if (d.conversation_id) setConversationId(d.conversation_id)
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant', content: `Error: ${d.error || 'Something went wrong.'}`,
          ts: new Date().toISOString(),
        }])
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant', content: e.message || 'Cannot reach the AI server.',
        ts: new Date().toISOString(),
      }])
    } finally {
      setTyping(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleFeedback = async (msgIdx, vote) => {
    if (feedbacks[msgIdx]) return
    setFeedbacks(f => ({ ...f, [msgIdx]: vote }))
    try {
      await apiFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote }),
      })
    } catch (_) {}
  }

  const handleNewChat = async () => {
    setClearing(true)
    try {
      const res = await apiFetch('/api/clear', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setMessages([])
        setFeedbacks({})
        if (data.conversation_id) setConversationId(data.conversation_id)
      }
    } catch (_) {}
    setClearing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--navbar-h) - 64px)', maxWidth: 1000, margin: '0 auto', position: 'relative' }}
    >
      {/* Dynamic Background Glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '30%', width: '40%', height: '40%',
        background: 'radial-gradient(circle, rgba(0,255,247,0.03) 0%, transparent 70%)',
        zIndex: -1, pointerEvents: 'none'
      }} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(10, 15, 30, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0,255,247,0.15)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 32px',
          marginBottom: 24,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
      >
        <motion.div
          animate={{ left: ['-100%', '100%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', top: 0, height: '2px', width: '40%',
            background: 'linear-gradient(90deg, transparent, var(--cyan), var(--purple), transparent)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <MessageSquare size={24} color="var(--cyan)" />
          </motion.div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem', fontWeight: 800,
            background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: 1
          }}>
            AI Support Workspace
          </h2>
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase' }}>
          Welcome back, {user?.name || 'Customer'} • Authenticated RAG Engine
        </div>

        {/* New Session button */}
        <motion.button
          whileHover={{ scale: 1.05, background: 'rgba(0,255,247,0.15)', borderColor: 'var(--cyan)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNewChat}
          disabled={clearing}
          style={{
            position: 'absolute', top: '50%', right: 20, transform: 'translateY(-50%)',
            background: 'rgba(0,255,247,0.08)',
            border: '1px solid rgba(0,255,247,0.3)',
            borderRadius: 10, padding: '8px 16px',
            color: '#fff', cursor: 'pointer', fontSize: '0.82rem',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s'
          }}
        >
          <PlusCircle size={15} color="var(--cyan)" /> {clearing ? 'Saving...' : 'New Chat'}
        </motion.button>
      </motion.div>

      {/* Chat messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '10px 20px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Suggested questions Empty State */}
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 30, fontSize: '0.8rem' }}>
                <Sparkles size={16} color="var(--purple)" /> Suggested Questions
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16, width: '100%', maxWidth: 700,
              }}>
                {SUGGESTED.map((q, idx) => (
                  <motion.button
                    key={q}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(q)}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 16, padding: '16px 20px',
                      color: 'var(--text-secondary)', textAlign: 'left',
                      fontSize: '0.86rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,255,247,0.3)'
                      e.currentTarget.style.background = 'rgba(0,255,247,0.03)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <span>{q}</span>
                    <span style={{ color: 'var(--cyan)', opacity: 0.7 }}>&rarr;</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message stream */}
        {messages.map((m, idx) => (
          m.role === 'user' ? (
            <UserBubble 
              key={idx} 
              content={m.content}
              ts={m.ts}
              message={m} 
              userAvatar={user?.avatar || '👤'} 
            />
          ) : (
            <BotBubble
              key={idx}
              content={m.content}
              sources={m.sources}
              languageName={m.language_name}
              ts={m.ts}
              message={m}
              feedbackState={feedbacks[idx]}
              onFeedback={(vote) => handleFeedback(idx, vote)}
            />
          )
        ))}

        {typing && <TypingIndicator />}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* Input bar */}
      <div style={{
        position: 'relative', marginTop: 14,
        background: 'rgba(8, 12, 28, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 255, 247, 0.25)',
        borderRadius: 24,
        padding: '6px 8px 6px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(0,255,247,0.05)',
      }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about company policies, orders, or support..."
          disabled={typing}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: '0.94rem', resize: 'none',
            lineHeight: 1.5, maxHeight: 120, fontFamily: 'inherit',
            padding: '8px 0',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || typing}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: input.trim() && !typing
                ? 'linear-gradient(135deg, var(--cyan), var(--purple))'
                : 'rgba(255,255,255,0.05)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && !typing ? 'pointer' : 'not-allowed',
              boxShadow: input.trim() && !typing ? '0 0 16px rgba(0,255,247,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Send size={18} color={input.trim() && !typing ? '#000' : 'var(--text-dim)'} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
