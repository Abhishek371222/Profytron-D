/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

let updatedFiles = 0;
walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Font family cleanup
    content = content.replace(/\bfont-syne\b/g, '');
    
    // Weight cleanup - change font-black to font-semibold or font-medium
    content = content.replace(/\bfont-black\b/g, 'font-semibold');
    
    // Style cleanup - remove italic
    content = content.replace(/\bitalic\b/g, '');
    
    // Tracking/Letter-spacing cleanup
    content = content.replace(/\btracking-\[0\.\d+em\]\b/g, 'tracking-wide');
    content = content.replace(/\btracking-tighter\b/g, 'tracking-tight');
    
    // Text size normalization (bump up micro-text)
    content = content.replace(/\btext-\[7px\]/g, 'text-[10px]');
    content = content.replace(/\btext-\[8px\]/g, 'text-xs');
    content = content.replace(/\btext-\[9px\]/g, 'text-xs');
    content = content.replace(/\btext-\[10px\]/g, 'text-xs');
    content = content.replace(/\btext-\[11px\]/g, 'text-sm');
    content = content.replace(/\btext-\[12px\]/g, 'text-sm');
    
    // Un-squishing some line heights
    content = content.replace(/\bleading-\[0\.\d+\]/g, 'leading-tight');
    content = content.replace(/\bleading-none\b/g, 'leading-tight');

    // Clean up extra spaces in classNames (ONLY space characters, not newlines)
    content = content.replace(/className=" +/g, 'className="');
    content = content.replace(/ +"/g, '"');
    content = content.replace(/ {2,}/g, ' ');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      updatedFiles++;
    }
  }
});
console.log(`Updated ${updatedFiles} files.`);
