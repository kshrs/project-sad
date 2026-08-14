import React from 'react';
import ProfileHover from './ProfileHover';
import KI_Logo from '../assets/KILogo.jpeg';
import { useReport } from '../context/ReportContext';

interface HeaderProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export default function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
    const {
        monthlyReports,
        monthId,
        changeMonth
    } = useReport();

    return (
        <header style={styles.header}>
            <div style={styles.leftSection}>
                <button onClick={onToggleSidebar} style={styles.hamburgerBtn} aria-label={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                        {isSidebarOpen ? (
                            /* Sidebar is currently open -> Show icon indicating collapse/close */
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-layout-sidebar-right-expand">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" />
                                <path d="M15 4v16" />
                                <path d="M10 10l-2 2l2 2" />
                            </svg>
                        ) : (
                            /* Sidebar is currently closed -> Show icon indicating open/expand */
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-layout-sidebar-right-collapse">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" />
                                <path d="M15 4v16" />
                                <path d="M9 10l2 2l-2 2" />
                            </svg>
                        )}
                    </span>
                </button>
                <img src={KI_Logo} height="58" alt="Kumaraguru Institutions Logo" />
                <h2 style={styles.text}>Staff and Student Achievement Dashboard</h2>
            </div>
            
            <div style={styles.rightSection}>
                {/* Month Selection Dropdown (Only selectable up to current month) */}
                {monthlyReports.length > 0 && (
                    <select
                        style={styles.select}
                        value={monthId || ''}
                        onChange={(e) => changeMonth(e.target.value)}
                        aria-label="Select Month"
                    >
                        {monthlyReports
                            .filter((m) => {
                                const currentMonthNumber = new Date().getMonth() + 1; // 1-12
                                return m.month_number <= currentMonthNumber;
                            })
                            .map((m) => (
                                <option key={m._id} value={m._id}>
                                    {m.month_name}
                                </option>
                            ))}
                    </select>
                )}

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
        userSelect: 'none',
        WebkitUserSelect: 'none',
        zIndex: 10
      },
      leftSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      },
      rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      },
      select: {
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#f8fafc',
        color: '#1e293b',
        fontFamily: 'var(--sans)',
        fontSize: '0.85rem',
        fontWeight: 600,
        outline: 'none',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease'
      },
      hamburgerBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#1e2842', // Campus+ Dark Blue icon
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px',
        borderRadius: '6px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'background-color 0.2s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease'
      },
      text: {
          fontFamily: 'var(--heading)',
          fontWeight: 600,
          color: '#1e2842', // Dark Blue text
          margin: '0px 0px',
          padding: '10px 0px',
          fontSize: '1.2rem',
          letterSpacing: '-0.01em',
          userSelect: 'none',
          WebkitUserSelect: 'none'
      }
    };
