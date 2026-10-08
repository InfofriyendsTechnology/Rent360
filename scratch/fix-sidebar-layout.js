const fs = require('fs');
const path = 'C:/Users/SIS/OneDrive/Desktop/My Projects/Rentopus/apps/rent360/frontend/src/components/Sidebar/Sidebar.jsx';

let content = fs.readFileSync(path, 'utf8');

const brokenButtons = `
            {user?.profile_pic && (
              <button className="logout-icon-btn" onClick={handleRemoveProfilePic} title="Remove Picture" style={{ marginRight: '5px', color: '#ef4444' }}>
                <FiTrash2 />
              </button>
            )}
            <button className="logout-icon-btn" onClick={handleLogout} title="Logout">
              <FiLogOut />
            </button>
`;

const fixedButtons = `
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
`;

content = content.replace(brokenButtons.trim(), fixedButtons.trim());
fs.writeFileSync(path, content);
console.log('Sidebar layout fixed!');
