import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Lock, Mail, Sparkles, ArrowRight, Eye, EyeOff, 
  ShieldCheck, Zap, ArrowLeft, AlertCircle, CheckCircle2, User, UserPlus, KeyRound
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { login, register, resetPassword } = useAuth()
  const navigate = useNavigate()

  // Calculate password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' }
    let score = 0
    if (pwd.length >= 6) score += 1
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1
    if (/\d/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1

    if (score <= 1) return { score: 1, label: 'Weak', color: '#ff4466' }
    if (score === 2) return { score: 2, label: 'Fair', color: '#ffaa00' }
    if (score === 3) return { score: 3, label: 'Good', color: '#00bbd4' }
    return { score: 4, label: 'Strong', color: '#00ff88' }
  }

  const pwdStrength = getPasswordStrength(password)

  const handleFastFill = (fillEmail, fillPwd) => {
    setMode('login')
    setEmail(fillEmail)
    setPassword(fillPwd)
    setError('')
    setSuccessMsg('')
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (mode === 'register') {
      if (!name.trim() || name.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters).')
        return
      }
      if (!email.trim() || !email.includes('@') || !email.includes('.')) {
        setError('Please enter a valid email address.')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    } else if (mode === 'forgot') {
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter your registered email address.')
        return
      }
      if (password.length < 6) {
        setError('New password must be at least 6 characters long.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    } else {
      if (!email.trim() || !password) {
        setError('Please enter both your email and password.')
        return
      }
    }

    setLoading(true)

    try {
      if (mode === 'register') {
        await register(name, email, password, 'Customer')
        navigate('/chat')
      } else if (mode === 'forgot') {
        const msg = await resetPassword(email, password)
        setSuccessMsg(msg || 'Password updated! Please sign in with your new password.')
        setMode('login')
        setPassword('')
        setConfirmPassword('')
      } else {
        await login(email, password, rememberMe)
        navigate('/chat')
      }
    } catch (err) {
      setError(err.message || 'Authentication error. Please try again.')
    } finally {
      setLoading(false)
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
      padding: '36px 16px',
    }}>
      {/* Background ambient lighting glow */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.22, 0.4, 0.22],
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
          background: 'rgba(8, 12, 24, 0.90)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(0, 255, 247, 0.24)',
          borderRadius: 24,
          padding: '36px 40px',
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.7), 0 0 35px rgba(0, 255, 247, 0.09), inset 0 0 25px rgba(0, 255, 247, 0.04)',
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

        {/* Mode Selector Tabs (Sign In / Register / Reset) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: mode === 'forgot' ? '1fr 1fr 1fr' : '1fr 1fr',
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
              background: mode === 'login' ? 'linear-gradient(135deg, rgba(0,255,247,0.22), rgba(191,0,255,0.22))' : 'transparent',
              border: mode === 'login' ? '1px solid rgba(0,255,247,0.45)' : 'none',
              borderRadius: 9,
              padding: '9px 10px',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              fontWeight: mode === 'login' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <ShieldCheck size={14} /> Sign In
          </button>

          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccessMsg('') }}
            style={{
              background: mode === 'register' ? 'linear-gradient(135deg, rgba(191,0,255,0.25), rgba(0,255,247,0.2))' : 'transparent',
              border: mode === 'register' ? '1px solid rgba(191,0,255,0.45)' : 'none',
              borderRadius: 9,
              padding: '9px 10px',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              fontWeight: mode === 'register' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <UserPlus size={14} /> Create Account
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              style={{
                background: 'linear-gradient(135deg, rgba(255,170,0,0.25), rgba(0,255,247,0.15))',
                border: '1px solid rgba(255,170,0,0.45)',
                borderRadius: 9,
                padding: '9px 10px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <KeyRound size={14} /> Reset Key
            </button>
          )}
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(0, 255, 136, 0.12)',
                border: '1px solid rgba(0, 255, 136, 0.35)',
                color: '#00ff88',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: '0.85rem'
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
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
          
          {/* Full Name Field (Register only) */}
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
                {mode === 'forgot' ? 'New Password' : 'Password'} {mode !== 'login' && <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>(min 6 chars)</span>}
              </label>
              {mode === 'register' && password && (
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: pwdStrength.color }}>
                  {pwdStrength.label}
                </span>
              )}
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

            {/* Password strength progress bar (Register only) */}
            {mode === 'register' && password && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {[1, 2, 3, 4].map(step => (
                  <div
                    key={step}
                    style={{
                      height: 3,
                      flex: 1,
                      borderRadius: 2,
                      background: step <= pwdStrength.score ? pwdStrength.color : 'rgba(255,255,255,0.1)',
                      transition: 'all 0.3s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password (Register or Forgot only) */}
          {(mode === 'register' || mode === 'forgot') && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                Confirm {mode === 'forgot' ? 'New ' : ''}Password
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

          {/* Options: Remember me & Forgot Password */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
            {mode === 'login' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--cyan)', width: 15, height: 15, cursor: 'pointer' }}
                />
                Remember session
              </label>
            )}

            {mode === 'login' ? (
              <span 
                onClick={() => { setMode('forgot'); setError(''); setSuccessMsg('') }} 
                style={{ color: 'var(--cyan)', cursor: 'pointer', fontSize: '0.82rem', marginLeft: 'auto', textDecoration: 'underline' }}
              >
                Forgot Password?
              </span>
            ) : mode === 'forgot' ? (
              <span 
                onClick={() => { setMode('login'); setError(''); setSuccessMsg('') }} 
                style={{ color: 'var(--cyan)', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}
              >
                Back to Sign In
              </span>
            ) : null}
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 0 25px rgba(0, 255, 247, 0.4)' }}
            whileTap={loading ? {} : { scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              background: 'linear-gradient(135deg, var(--cyan), #00bbd4, var(--purple))',
              border: 'none',
              borderRadius: 12,
              padding: '14px',
              color: '#000',
              fontSize: '0.96rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 0.25s ease'
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#000', borderTopColor: 'transparent' }} />
                <span>Securing Connection...</span>
              </div>
            ) : mode === 'register' ? (
              <>
                Create Customer Account <UserPlus size={18} />
              </>
            ) : mode === 'forgot' ? (
              <>
                Update & Reset Password <KeyRound size={18} />
              </>
            ) : (
              <>
                Sign In to Workspace <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        {/* Demo Fast-Fill Cards */}
        <div style={{
          marginTop: 24,
          paddingTop: 18,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '0.74rem',
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 10
          }}>
            <Zap size={13} color="var(--cyan)" /> Fast Fill Test Accounts
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, borderColor: 'var(--cyan)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFastFill('customer@support.ai', 'customer123')}
              style={{
                background: 'rgba(0, 255, 247, 0.05)',
                border: '1px solid rgba(0, 255, 247, 0.2)',
                borderRadius: 10,
                padding: '8px 8px',
                color: 'var(--text-primary)',
                fontSize: '0.74rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--cyan)' }}>✨ Customer</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.66rem' }}>customer123</div>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02, borderColor: 'var(--purple)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFastFill('agent@support.ai', 'agent123')}
              style={{
                background: 'rgba(191, 0, 255, 0.05)',
                border: '1px solid rgba(191, 0, 255, 0.2)',
                borderRadius: 10,
                padding: '8px 8px',
                color: 'var(--text-primary)',
                fontSize: '0.74rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: 600, color: '#d980ff' }}>🛡️ Support Agent</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.66rem' }}>agent123</div>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02, borderColor: '#00ff88' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFastFill('admin@support.ai', 'admin123')}
              style={{
                background: 'rgba(0, 255, 136, 0.05)',
                border: '1px solid rgba(0, 255, 136, 0.2)',
                borderRadius: 10,
                padding: '8px 8px',
                color: 'var(--text-primary)',
                fontSize: '0.74rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: 600, color: '#00ff88' }}>⚡ Admin Lead</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.66rem' }}>admin123</div>
            </motion.button>
          </div>
        </div>

      </motion.div>
    </div>
  )
}
