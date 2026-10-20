import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Lock, Mail, Sparkles, ArrowRight, Eye, EyeOff, 
  ShieldCheck, Zap, ArrowLeft, AlertCircle, CheckCircle2, User, UserPlus
} from 'lucide-react'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.')
        return
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    } else {
      if (!email || !password) {
        setError('Please enter both email and password.')
        return
      }
    }

    setIsLoading(true)

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const payload = mode === 'register' 
        ? { name: name.trim(), email: email.trim(), password, role: 'Customer' }
        : { email: email.trim(), password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.ok) {
        const authUser = {
          ...data.user,
          token: data.token
        }
        if (onLogin) {
          onLogin(authUser, rememberMe)
        }
        navigate('/chat')
      } else {
        setError(data.error || 'Authentication failed. Please verify your details.')
      }
    } catch (err) {
      console.warn('Backend connection error:', err)
      setError('Cannot connect to authentication service. Please ensure the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '32px 16px',
    }}>
      {/* Background ambient lighting */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: '70vw',
          height: '70vw',
          maxWidth: 900,
          maxHeight: 900,
          background: 'radial-gradient(circle, rgba(0,255,247,0.12) 0%, rgba(191,0,255,0.08) 35%, transparent 70%)',
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Cyberpunk Grid Accent */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0, 255, 247, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 247, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        style={{
          background: 'rgba(8, 12, 24, 0.88)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(0, 255, 247, 0.22)',
          borderRadius: 24,
          padding: '36px 40px',
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.65), 0 0 35px rgba(0, 255, 247, 0.08), inset 0 0 25px rgba(0, 255, 247, 0.04)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Back to Home link */}
        <Link 
          to="/" 
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-dim)',
            fontSize: '0.82rem',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cyan)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
        >
          <ArrowLeft size={16} /> Home
        </Link>

        {/* Top Header & Brand Icon */}
        <div style={{ textAlign: 'center', marginBottom: 22, marginTop: 8 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', bounce: 0.5 }}
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(0, 255, 247, 0.2), rgba(191, 0, 255, 0.25))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              border: '1px solid rgba(0, 255, 247, 0.45)',
              boxShadow: '0 0 25px rgba(0, 255, 247, 0.3)'
            }}
          >
            <ShieldCheck size={28} color="var(--cyan)" />
          </motion.div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            fontWeight: 800,
            marginBottom: 4,
            letterSpacing: '1px',
            background: 'linear-gradient(90deg, #ffffff, var(--cyan))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            AI SUPPORT
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', letterSpacing: '0.5px' }}>
            AUTHENTICATED CUSTOMER WORKSPACE
          </p>
        </div>

        {/* Mode Selector Tabs (Sign In vs Create Account) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 20,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg('') }}
            style={{
              background: mode === 'login' ? 'linear-gradient(135deg, rgba(0,255,247,0.2), rgba(191,0,255,0.2))' : 'transparent',
              border: mode === 'login' ? '1px solid rgba(0,255,247,0.4)' : 'none',
              borderRadius: 9,
              padding: '9px 12px',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              fontWeight: mode === 'login' ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <ShieldCheck size={15} /> Customer Sign In
          </button>

          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccessMsg('') }}
            style={{
              background: mode === 'register' ? 'linear-gradient(135deg, rgba(191,0,255,0.25), rgba(0,255,247,0.2))' : 'transparent',
              border: mode === 'register' ? '1px solid rgba(191,0,255,0.4)' : 'none',
              borderRadius: 9,
              padding: '9px 12px',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              fontWeight: mode === 'register' ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <UserPlus size={15} /> Create Account
          </button>
        </div>

        {/* Error Notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255, 68, 102, 0.12)',
                border: '1px solid rgba(255, 68, 102, 0.35)',
                color: '#ff6b8b',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: '0.85rem'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Name Field (Register only) */}
          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                Customer Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 14, color: 'var(--text-dim)', pointerEvents: 'none' }}>
                  <User size={17} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Jordan Smith"
                  value={name}
                  onChange={e => { setName(e.target.value); setError('') }}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 12,
                    padding: '12px 14px 12px 42px',
                    color: '#fff',
                    fontSize: '0.92rem',
                    outline: 'none',
                    transition: 'all 0.25s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--cyan)'
                    e.target.style.boxShadow = '0 0 15px rgba(0, 255, 247, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Email Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 14, color: 'var(--text-dim)', pointerEvents: 'none' }}>
                <Mail size={17} />
              </div>
              <input
                type="email"
                placeholder={mode === 'register' ? "you@example.com" : "customer@support.ai"}
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 12,
                  padding: '12px 14px 12px 42px',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none',
                  transition: 'all 0.25s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--cyan)'
                  e.target.style.boxShadow = '0 0 15px rgba(0, 255, 247, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Password {mode === 'register' && <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>(min 6 chars)</span>}
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 14, color: 'var(--text-dim)', pointerEvents: 'none' }}>
                <Lock size={17} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 12,
                  padding: '12px 44px 12px 42px',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none',
                  transition: 'all 0.25s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--purple)'
                  e.target.style.boxShadow = '0 0 15px rgba(191, 0, 255, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 12,
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 14, color: 'var(--text-dim)', pointerEvents: 'none' }}>
                  <Lock size={17} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 12,
                    padding: '12px 14px 12px 42px',
                    color: '#fff',
                    fontSize: '0.92rem',
                    outline: 'none',
                    transition: 'all 0.25s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--purple)'
                    e.target.style.boxShadow = '0 0 15px rgba(191, 0, 255, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Options */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--cyan)', width: 15, height: 15, cursor: 'pointer' }}
              />
              Remember session
            </label>
            {mode === 'login' && (
              <span 
                onClick={() => setError('Password reset instructions: Use admin@support.ai or create a new Customer account.')} 
                style={{ color: 'var(--cyan)', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Forgot Key?
              </span>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={isLoading ? {} : { scale: 1.02, boxShadow: '0 0 25px rgba(0, 255, 247, 0.4)' }}
            whileTap={isLoading ? {} : { scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 4,
              background: 'linear-gradient(135deg, var(--cyan), #00bbd4, var(--purple))',
              border: 'none',
              borderRadius: 12,
              padding: '14px',
              color: '#000',
              fontSize: '0.96rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 0.25s ease'
            }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#000', borderTopColor: 'transparent' }} />
                <span>Authenticating with Database...</span>
              </div>
            ) : mode === 'register' ? (
              <>
                Create Customer Account <UserPlus size={18} />
              </>
            ) : (
              <>
                Sign In to Workspace <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

      </motion.div>
    </div>
  )
}
