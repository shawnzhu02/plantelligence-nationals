const fs = require('fs');
const path = require('path');

// Copy electron.js and preload.js to the build directory
const electronFiles = ['electron.js', 'preload.js'];
electronFiles.forEach(file => {
  const sourcePath = path.join(__dirname, 'public', file);
  const targetPath = path.join(__dirname, 'build', file);
  
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied ${file} to build directory.`);
    } else {
      console.error(`Error: ${file} not found in public directory.`);
    }
  } catch (error) {
    console.error(`Error copying ${file}: ${error.message}`);
  }
});