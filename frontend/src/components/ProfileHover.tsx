import React, { useState, useRef, useEffect } from 'react';

// Define the shape of our User data so it's ready for OAuth later
export interface UserProfile {
  name: string;
  email: string;
  imageUrl?: string;
}

interface ProfileHoverProps {
  user?: UserProfile | null;
  onLogout?: () => void;
}

export default function ProfileHover({ user, onLogout }: ProfileHoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Default placeholder data for when user is not logged in yet
  const displayUser = user || {
    name: "John Doe",
    email: "john.doe@kumaraguru.ac.in",
    imageUrl: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff"
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={styles.container} ref={dropdownRef}>
      {/* Profile Button (The Circle) */}
      <button 
        style={styles.profileBtn} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Account manager"
      >
        <img 
          src={displayUser.imageUrl} 
          alt="Profile" 
          style={styles.profileImg} 
        />
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div style={styles.dropdown}>
          {/* Top Right Action */}
          <div style={styles.topRightAction}>
            <button 
              style={styles.signOutBtn}
              onClick={() => {
                if (onLogout) onLogout();
                alert("Sign out clicked (Ready for OAuth)");
              }}
            >
              Sign out
            </button>
          </div>

          {/* Header Section (Mimics Microsoft 365) */}
          <div style={styles.dropdownHeader}>
            <img 
              src={displayUser.imageUrl} 
              alt="Profile Large" 
              style={styles.profileImgLarge} 
            />
            <div style={styles.userInfo}>
              <strong style={styles.userName}>{displayUser.name}</strong>
              <span style={styles.userEmail}>{displayUser.email}</span>
              { /* <a href="#" style={styles.viewAccountLink}>View account</a> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  profileBtn: {
    background: 'none',
    border: '2px solid transparent',
    borderRadius: '50%',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 0.2s ease',
  },
  profileImg: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  dropdown: {
    position: 'absolute',
    top: '50px',
    right: '0',
    width: '320px',
    backgroundColor: '#ffffff',
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)',
    borderRadius: '8px',
    border: '1px solid #e1e1e1',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topRightAction: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '10px 15px 0 15px',
  },
  signOutBtn: {
    background: 'none',
    border: 'none',
    color: '#0067b8', // Microsoft Blue Link
    fontSize: '12px',
    cursor: 'pointer',
    textDecoration: 'none',
    padding: '0',
  },
  dropdownHeader: {
    display: 'flex',
    padding: '10px 20px 20px 20px',
    gap: '15px',
    alignItems: 'center',
  },
  profileImgLarge: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start', // Ensure left alignment
    textAlign: 'left',
  },
  userName: {
    fontSize: '18px',
    color: '#333',
    fontWeight: 600,
  },
  userEmail: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
  },
  viewAccountLink: {
    fontSize: '13px',
    color: '#0067b8', // Microsoft Blue link
    textDecoration: 'none',
    fontWeight: 500,
  }
};
