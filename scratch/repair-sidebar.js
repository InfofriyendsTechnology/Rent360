const fs = require('fs');
const path = 'C:/Users/SIS/OneDrive/Desktop/My Projects/Rentopus/apps/rent360/frontend/src/components/Sidebar/Sidebar.jsx';

let content = fs.readFileSync(path, 'utf8');

// Fix the mess in useEffect
const brokenUseEffect = `
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

  return () => window.removeEventListener('themeChanged', handleThemeChange);`;

content = content.replace(brokenUseEffect, `  return () => window.removeEventListener('themeChanged', handleThemeChange);`);

// Insert handleRemoveProfilePic correctly
const insertAfter = `toast.error("Failed to update profile picture");
    }
  };`;

const fixFunc = `toast.error("Failed to update profile picture");
    }
  };

  const handleRemoveProfilePic = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
    try {
      await axios.put(\`http://localhost:61026/api/users/\${user.id}\`, 
        { profile_pic: null },
        { headers: { Authorization: \`Bearer \${token}\` }}
      );
      dispatch(updateUser({ profile_pic: null }));
      // Let's also dispatch toast manually or let it be
    } catch(err) {
      console.error(err);
    }
  };`;

content = content.replace(insertAfter, fixFunc);

fs.writeFileSync(path, content);
console.log('Sidebar repaired!');
