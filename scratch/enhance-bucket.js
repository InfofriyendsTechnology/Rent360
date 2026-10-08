const fs = require('fs');

// --- Patch BucketExplorer.jsx ---
const jsxPath = 'C:/Users/SIS/OneDrive/Desktop/My Projects/Rentopus/apps/rent360/frontend/src/pages/Bucket/BucketExplorer.jsx';
let jsxContent = fs.readFileSync(jsxPath, 'utf8');

// 1. Fix MB calculation to show tiny values
const bytesToMBReplace = `const bytesToMB = (bytes) => {
    const validBytes = Math.max(0, bytes || 0);
    if (validBytes > 0 && validBytes < 10485) return "< 0.01";
    return (validBytes / (1024 * 1024)).toFixed(2);
  };`;
jsxContent = jsxContent.replace(/const bytesToMB = \(bytes\) => \{[\s\S]*?\};/, bytesToMBReplace);

// 2. Change Trash button to 3D loop style
const trashBtnOld = `<button 
                        className="delete-file-btn" 
                        onClick={(e) => initiateDelete(e, file.public_id)}
                        title="Delete File"
                      >
                        <FiTrash2 />
                      </button>`;
const trashBtnNew = `<button 
                        className="delete-file-btn btn-3d-trash" 
                        onClick={(e) => initiateDelete(e, file.public_id)}
                        title="Delete File"
                      >
                        <FiTrash2 className="btn-icon" /> Delete
                      </button>`;
jsxContent = jsxContent.replace(trashBtnOld, trashBtnNew);

fs.writeFileSync(jsxPath, jsxContent);


// --- Patch BucketExplorer.scss ---
const scssPath = 'C:/Users/SIS/OneDrive/Desktop/My Projects/Rentopus/apps/rent360/frontend/src/pages/Bucket/BucketExplorer.scss';
let scssContent = fs.readFileSync(scssPath, 'utf8');

// 1. Enhance the item-name
const itemNameOld = `.item-name {
          font-size: 0.8rem;
          text-align: left;
          word-break: break-all;
          max-width: 100%;
          flex: 1;`;

const itemNameNew = `.item-name {
          font-size: 0.85rem;
          font-weight: 700;
          text-align: left;
          word-break: break-all;
          max-width: 100%;
          flex: 1;`;
scssContent = scssContent.replace(itemNameOld, itemNameNew);

// 2. Add 3D trash button styles
if (!scssContent.includes('.btn-3d-trash')) {
  const cssInject = `
        .file-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          gap: 8px;
          flex-direction: column; /* Stack text and button */
          
          .item-name {
            font-size: 0.85rem;
            font-weight: 700;
            text-align: center;
            word-break: break-all;
            max-width: 100%;
            flex: 1;
          }

          .btn-3d-trash {
            background: linear-gradient(145deg, #ef4444, #dc2626);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.4), 0 2px 4px -1px rgba(220, 38, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
            transition: all 0.2s ease;
            width: 100%;
            justify-content: center;

            &:hover {
              transform: translateY(-1px);
              box-shadow: 0 6px 8px -1px rgba(220, 38, 38, 0.5), 0 4px 6px -1px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
              background: linear-gradient(145deg, #f87171, #ef4444);
            }

            &:active {
              transform: translateY(1px);
              box-shadow: 0 1px 2px rgba(220, 38, 38, 0.5), inset 0 2px 4px rgba(0, 0, 0, 0.2);
            }
          }
`;

  // We need to replace the original file-info-row to inject the new stack layout
  scssContent = scssContent.replace(/\.file-info-row\s*\{[\s\S]*?\.item-name\s*\{[\s\S]*?\}[\s\S]*?\.delete-file-btn\s*\{[\s\S]*?\}\s*\}/, cssInject);
  fs.writeFileSync(scssPath, scssContent);
}

console.log('UI Enhancements applied');
