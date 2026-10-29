import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, BarChart2, Clock, Home, Menu, X, Zap, 
  LogOut, User, Shield, KeyRound, Check, AlertCircle, Edit3
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/chat', icon: MessageSquare, label: 'User Portal' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/history', icon: Clock, label: 'History' },
]

const AVATARS = ['👤', '✨', '⚡', '🛡️', '🤖', '🚀', '🌟', '💼']

export default function Navbar({ sidebarOpen, onToggleSidebar, kbStatus, onHome }) {
  const location = useLocation()
  const { user, logout, updateProfile, changePassword } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdError, setPwdError] = useState('')

  const handleOpenProfile = () => {
    if (!user) return
    setEditName(user.name || '')
    setSelectedAvatar(user.avatar || '👤')
    setProfileSuccess('')
    setProfileError('')
    setShowPasswordChange(false)
    setPwdMsg('')
    setPwdError('')
    setProfileOpen(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileSaving(true)
    try {
      await updateProfile(editName, selectedAvatar)
      setProfileSuccess('Profile updated successfully!')
      setTimeout(() => setProfileSuccess(''), 3000)
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdMsg('')
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.')
      return
    }
    setPwdSaving(true)
    try {
      const msg = await changePassword(oldPassword, newPassword)
      setPwdMsg(msg || 'Password updated successfully!')
      setOldPassword('')
      setNewPassword('')
      setTimeout(() => {
        setPwdMsg('')
        setShowPasswordChange(false)
      }, 2500)
    } catch (err) {
      setPwdError(err.message || 'Failed to update password.')
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: 'var(--navbar-h)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px',
          background: 'rgba(2, 2, 9, 0.94)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(0,255,247,0.1)',
          zIndex: 1000,
          gap: 16,
        }}
      >
        {/* Sidebar toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleSidebar}
          className="btn btn-icon btn-ghost"
          style={{ flexShrink: 0 }}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </motion.button>

        {/* Brand */}
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, cursor: 'pointer' }}
          onClick={onHome}
          whileHover={{ scale: 1.03 }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Zap size={16} color="#000" fill="#000" />
          </motion.div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.78rem', fontWeight: 700,
              background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: 2,
            }}>AI SUPPORT</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: 1 }}>WORKSPACE</div>
          </div>
        </motion.div>

        {/* Nav links */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          marginLeft: 'auto',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
        }}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <NavLink key={to} to={to} style={{ textDecoration: 'none', position: 'relative' }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.84rem', fontWeight: active ? 700 : 500,
                    color: active ? '#000' : 'var(--text-secondary)',
                    background: active
                      ? 'linear-gradient(135deg, var(--cyan), #00aacc, var(--purple))'
                      : 'transparent',
                    boxShadow: active ? '0 0 20px rgba(0,255,247,0.3)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <Icon size={15} />
                  {label}
                </motion.div>
              </NavLink>
            )
          })}
        </div>

        {/* KB Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${kbStatus.online ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,102,0.2)'}`,
            borderRadius: 'var(--radius-full)',
            flexShrink: 0,
          }}
        >
          <span className={`status-dot ${kbStatus.online ? 'online' : 'offline'}`} />
          <span style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-display)',
            letterSpacing: 1.5,
            color: kbStatus.online ? 'var(--green)' : 'var(--red)',
          }}>
            {kbStatus.online ? `${kbStatus.chunks} CHUNKS` : 'NO DATA'}
          </span>
        </motion.div>

        {/* User Profile Chip with Click to Manage */}
        {user && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={handleOpenProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(0, 255, 247, 0.2)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 12px 4px 6px',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Click to view Account Settings"
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem'
            }}>
              {user.avatar || '👤'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>{user.name}</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--cyan)' }}>{user.role || 'Customer'}</span>
            </div>
          </motion.div>
        )}

        {/* Logout button */}
        {user && (
          <motion.button
            whileHover={{ scale: 1.1, color: '#ff4466' }}
            whileTap={{ scale: 0.92 }}
            onClick={logout}
            className="btn btn-ghost btn-icon"
            style={{ flexShrink: 0, padding: 8 }}
            title="Sign Out"
          >
            <LogOut size={16} />
          </motion.button>
        )}

        {/* Home button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onHome}
          className="btn btn-ghost btn-sm"
          style={{ flexShrink: 0 }}
          title="Back to Landing Page"
        >
          <Home size={14} />
        </motion.button>
      </motion.nav>

      {/* Profile & Security Modal */}
      <AnimatePresence>
        {profileOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 16
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              style={{
                background: 'rgba(10, 14, 28, 0.96)',
                border: '1px solid rgba(0, 255, 247, 0.3)',
                borderRadius: 20,
                padding: '28px 32px',
                width: '100%',
                maxWidth: 460,
                boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0,255,247,0.15)',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                style={{
                  position: 'absolute',
                  top: 18,
                  right: 18,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  border: '2px solid rgba(0, 255, 247, 0.4)'
                }}>
                  {selectedAvatar || user?.avatar || '👤'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                    Account Profile
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>{user?.email}</span>
                    <span style={{
                      background: 'rgba(0, 255, 247, 0.1)',
                      border: '1px solid rgba(0, 255, 247, 0.3)',
                      color: 'var(--cyan)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}>
                      {user?.role || 'Customer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status messages */}
              {profileSuccess && (
                <div style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', marginBottom: 14 }}>
                  {profileSuccess}
                </div>
              )}
              {profileError && (
                <div style={{ background: 'rgba(255,68,102,0.12)', border: '1px solid rgba(255,68,102,0.3)', color: '#ff6b8b', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', marginBottom: 14 }}>
                  {profileError}
                </div>
              )}

              {/* Edit Profile Form */}
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Choose Avatar
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {AVATARS.map(av => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: selectedAvatar === av ? 'rgba(0, 255, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                          border: selectedAvatar === av ? '1px solid var(--cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: '1.1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={profileSaving}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    {profileSaving ? 'Saving...' : 'Update Profile'}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(p => !p)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '10px 14px', fontSize: '0.8rem' }}
                  >
                    <KeyRound size={14} /> Change Key
                  </button>
                </div>
              </form>

              {/* Collapsible Change Password Box */}
              {showPasswordChange && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleChangePassword}
                  style={{
                    marginTop: 18,
                    paddingTop: 16,
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cyan)' }}>
                    Change Password
                  </div>

                  {pwdMsg && (
                    <div style={{ background: 'rgba(0,255,136,0.12)', color: '#00ff88', padding: '6px 10px', borderRadius: 6, fontSize: '0.78rem' }}>
                      {pwdMsg}
                    </div>
                  )}
                  {pwdError && (
                    <div style={{ background: 'rgba(255,68,102,0.12)', color: '#ff6b8b', padding: '6px 10px', borderRadius: 6, fontSize: '0.78rem' }}>
                      {pwdError}
                    </div>
                  )}

                  <input
                    type="password"
                    placeholder="Current Password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                  />
                  <input
                    type="password"
                    placeholder="New Password (min 6 chars)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={pwdSaving}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '8px' }}
                  >
                    {pwdSaving ? 'Updating...' : 'Set New Password'}
                  </motion.button>
                </motion.form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
