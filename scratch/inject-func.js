const fs = require('fs');
const path = 'C:/Users/SIS/OneDrive/Desktop/My Projects/Rentopus/apps/rent360/frontend/src/components/Sidebar/Sidebar.jsx';

let content = fs.readFileSync(path, 'utf8');

if (!content.includes('const handleRemoveProfilePic')) {
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

  return (`;

  // Only replace the FIRST occurrence of "return (" inside the component 
  // (which is the main render return, since previous ones are inside handlers)
  // Wait, there is a `return () => window.removeEventListener` inside useEffect.
  // I'll replace `return (\n    <>`
  content = content.replace(/return \(\s*<>/, insertFunc + '\n    <>');
  fs.writeFileSync(path, content);
  console.log('Function injected!');
} else {
  console.log('Function already exists?');
}
