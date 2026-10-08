const fs = require('fs');
const jsxPath = 'C:/Users/SIS/OneDrive/Desktop/My Projects/Rentopus/apps/rent360/frontend/src/pages/Bucket/BucketExplorer.jsx';
let jsxContent = fs.readFileSync(jsxPath, 'utf8');

// The JSX for the button has a lot of spaces and might not match perfectly if line endings are CRLF.
// I'll use regex to replace it.
const regex = /<button[\s\S]*?className="delete-file-btn"[\s\S]*?onClick=\{\(e\) => initiateDelete\(e, file\.public_id\)\}[\s\S]*?title="Delete File"[\s\S]*?>[\s\S]*?<FiTrash2 \/>[\s\S]*?<\/button>/;

const newBtn = `<button 
                        className="delete-file-btn btn-3d-trash" 
                        onClick={(e) => initiateDelete(e, file.public_id)}
                        title="Delete File"
                      >
                        <FiTrash2 className="btn-icon" /> Delete
                      </button>`;

if (regex.test(jsxContent)) {
  jsxContent = jsxContent.replace(regex, newBtn);
  fs.writeFileSync(jsxPath, jsxContent);
  console.log('Button replaced successfully!');
} else {
  console.log('Regex did not match. Trying fallback.');
  // Fallback: look for <FiTrash2 /> and just change the className of the parent button
  // Actually, I can just replace `className="delete-file-btn"` with `className="delete-file-btn btn-3d-trash"`
  jsxContent = jsxContent.replace('className="delete-file-btn"', 'className="delete-file-btn btn-3d-trash"');
  jsxContent = jsxContent.replace('<FiTrash2 />', '<FiTrash2 className="btn-icon" /> Delete');
  fs.writeFileSync(jsxPath, jsxContent);
  console.log('Fallback applied.');
}
