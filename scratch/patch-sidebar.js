const fs = require('fs');
const path = 'C:/Users/SIS/OneDrive/Desktop/My Projects/Rentopus/apps/rent360/frontend/src/components/Sidebar/Sidebar.jsx';
let content = fs.readFileSync(path, 'utf8');

const insertFunc = `
  const handleRemoveProfilePic = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
    try {
      await axios.put(\`http://localhost:61026/api/users/\${user.id}\`, 
        { profile_pic: null },
        { headers: { Authorization: \`Bearer \${token}\` }}
      );
      dispatch(updateUser({ profile_pic: null }));
    } catch(err) {
      console.error(err);
    }
  };
`;

content = content.replace('return (', insertFunc + '\n  return (');

const insertBtn = `
            {user?.profile_pic && (
              <button className="logout-icon-btn" onClick={handleRemoveProfilePic} title="Remove Picture" style={{ marginRight: '5px', color: '#ef4444' }}>
                <FiTrash2 />
              </button>
            )}
            <button className="logout-icon-btn" onClick={handleLogout} title="Logout">`;

content = content.replace('<button className="logout-icon-btn" onClick={handleLogout} title="Logout">', insertBtn);

// Ensure FiTrash2 is imported
if (!content.includes('FiTrash2')) {
  content = content.replace('FiLogOut', 'FiLogOut, FiTrash2');
}

fs.writeFileSync(path, content);
console.log('Sidebar patched successfully!');
