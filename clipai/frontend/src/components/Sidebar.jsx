import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Scissors, Settings, Zap, Key, Film } from 'lucide-react'
import styles from './Sidebar.module.css'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new', icon: Zap, label: 'New Project' },
  { to: '/projects', icon: Film, label: 'Projects' },
  { to: '/settings', icon: Key, label: 'API Keys' },
]

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth="2.5">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </div>
        <span className={styles.logoText}>Clip<span>AI</span></span>
      </div>
      <nav className={styles.nav}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className={styles.bottom}>
        <div className={styles.tagline}>Powered by Whisper + Claude</div>
      </div>
    </aside>
  )
}
