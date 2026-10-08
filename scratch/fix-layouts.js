const fs = require('fs');

// --- 1. Fix Sidebar.jsx ---
const sidebarPath = 'C:/Users/SIS/OneDrive/Desktop/My Projects/Rentopus/apps/rent360/frontend/src/components/Sidebar/Sidebar.jsx';
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

// The layout was squished. We will overlay the trash on the avatar and restore the normal flex layout.
const badSidebarFooter = `<div className="user-profile-card">
            <div className="profile-avatar" onClick={handleProfileClick} style={{ cursor: 'pointer', overflow: 'hidden' }} title="Change Profile Picture">
              {user?.profile_pic ? (
                <img src={user.profile_pic} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'
              )}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'Main Admin'}</span>
              <span className="profile-role">{isSuperAdmin ? 'Super Admin' : 'Store Admin'}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {user?.profile_pic && (
                <button className="logout-icon-btn" onClick={handleRemoveProfilePic} title="Remove Picture" style={{ color: '#ef4444' }}>
                  <FiTrash2 />
                </button>
              )}
              <button className="logout-icon-btn" onClick={handleLogout} title="Logout">
                <FiLogOut />
              </button>
            </div>
          </div>`;

const newSidebarFooter = `<div className="user-profile-card">
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
          </div>`;

if (sidebarContent.includes('<div style={{ display: \'flex\', gap: \'4px\', alignItems: \'center\' }}>')) {
  sidebarContent = sidebarContent.replace(badSidebarFooter, newSidebarFooter);
  fs.writeFileSync(sidebarPath, sidebarContent);
  console.log('Sidebar footer fixed.');
}

// --- 2. Fix BucketExplorer.jsx classes ---
const bucketPath = 'C:/Users/SIS/OneDrive/Desktop/My Projects/Rentopus/apps/rent360/frontend/src/pages/Bucket/BucketExplorer.jsx';
let bucketContent = fs.readFileSync(bucketPath, 'utf8');

// Fix explorer-body -> explorer-content
bucketContent = bucketContent.replace('className="explorer-body"', 'className="explorer-content"');

// Fix folder icon wrapper
const oldFolder = `<div className="grid-item folder-item" key={folder.path} onClick={() => handleFolderClick(folder.path)}>
                  <FiFolder className="folder-icon" />
                  <span className="item-name">{folder.name}</span>
                </div>`;
const newFolder = `<div className="grid-item folder-item" key={folder.path} onClick={() => handleFolderClick(folder.path)}>
                  <div className="icon-wrapper"><FiFolder /></div>
                  <span className="item-name">{folder.name}</span>
                </div>`;
bucketContent = bucketContent.replace(oldFolder, newFolder);

// Fix breadcrumbs classes
bucketContent = bucketContent.replace(/className="breadcrumb-btn"/g, 'className="crumb-btn"');
bucketContent = bucketContent.replace(/className="breadcrumb-separator"/g, 'className="crumb-sep"');

// Fix refresh button
const oldRefresh = `<button className="refresh-btn" onClick={() => { fetchStats(); fetchContents(currentPath); }} disabled={loading}>
            <FiRefreshCw className={loading ? 'spinning' : ''} /> Refresh
          </button>`;
const newRefresh = `<button className="refresh-btn" onClick={() => { fetchStats(); fetchContents(currentPath); }} disabled={loading} title="Refresh">
            <FiRefreshCw className={loading ? 'spinning' : ''} />
          </button>`;
bucketContent = bucketContent.replace(oldRefresh, newRefresh);

fs.writeFileSync(bucketPath, bucketContent);
console.log('BucketExplorer layout fixed.');
