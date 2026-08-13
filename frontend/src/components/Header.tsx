import React from 'react';
import ProfileHover from './ProfileHover';
import KI_Logo from '../assets/KILogo.jpeg';

interface HeaderProps {
    onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
    return (
        <header style={styles.header}>
            <div style={styles.leftSection}>
                <button onClick={onToggleSidebar} style={styles.hamburgerBtn} aria-label="Toggle Sidebar">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                    </svg>
                </button>
                <img src={KI_Logo} height="58" alt="Kumaraguru Institutions Logo" />
                <h2 style={styles.text}>Staff and Student Achievement Dashboard</h2>
            </div>
            
            <div style={styles.rightSection}>
                <ProfileHover />
            </div>
        </header>
    );
}

const styles: Record<string, React.CSSProperties> = {
      header: {
        height: '60px',
        backgroundColor: '#ffffff', // Original White background
        color: '#1e2842', // Campus+ Dark Blue text
        boxShadow: '0 0.15rem 1.75rem 0 rgba(58,59,69,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      },
      leftSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      },
      rightSection: {
        display: 'flex',
        alignItems: 'center',
      },
      hamburgerBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#1e2842', // Campus+ Dark Blue icon
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px'
      },
      text: {
          color: '#1e2842', // Dark Blue text
          margin: '0px 0px',
          padding: '10px 0px',
          fontSize: '1.25rem'
      }
    };
