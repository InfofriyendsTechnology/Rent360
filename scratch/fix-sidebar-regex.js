const fs = require('fs');
const sidebarPath = 'C:/Users/SIS/OneDrive/Desktop/My Projects/Rentopus/apps/rent360/frontend/src/components/Sidebar/Sidebar.jsx';
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

const targetStr = '<div style={{ display: \'flex\', gap: \'4px\', alignItems: \'center\' }}>';

if (sidebarContent.includes(targetStr)) {
  // We need to replace the entire <div className="user-profile-card">...</div>
  // I will just use regex to replace from <div className="user-profile-card"> to the end of the sidebar
  const regex = /<div className="user-profile-card">[\s\S]*?<\/div>\s*<\/div>\s*<\/aside>/;
  
  const replacement = `<div className="user-profile-card">
            <div className="profile-avatar" onClick={handleProfileClick} style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }} title="Change Profile Picture">
              {user?.profile_pic ? (
                <img src={user.profile_pic} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'
              )}
              {user?.profile_pic && (
                <button 
                  onClick={handleRemoveProfilePic} 
                  title="Remove Picture" 
                  style={{ 
                    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, 
                    background: 'rgba(239,68,68,0.8)', color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', opacity: 0, transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'Main Admin'}</span>
              <span className="profile-role">{isSuperAdmin ? 'Super Admin' : 'Store Admin'}</span>
            </div>
            <button className="logout-icon-btn" onClick={handleLogout} title="Logout">
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>`;
      
  sidebarContent = sidebarContent.replace(regex, replacement);
  fs.writeFileSync(sidebarPath, sidebarContent);
  console.log('Sidebar regex replacement successful!');
} else {
  console.log('Target string not found');
}
