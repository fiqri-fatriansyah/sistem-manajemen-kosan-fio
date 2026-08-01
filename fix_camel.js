const fs = require('fs');
const path = require('path');

const dir = 'D:\\sistem-manajemen-kosan-fio';

function walkDir(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === '.nuxt') continue;
        const fullPath = path.join(currentPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    if (filePath.match(/\.(ts|js|vue|json|md|html|css|scss|bat|ps1|env|gitignore)$/i)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        
        newContent = newContent.replace(/roomId/g, 'roomId');
        newContent = newContent.replace(/RoomId/g, 'RoomId');
        newContent = newContent.replace(/roomDestination/g, 'roomDestination');
        newContent = newContent.replace(/RoomDestination/g, 'RoomDestination');
        newContent = newContent.replace(/roomName/g, 'roomName');
        newContent = newContent.replace(/RoomName/g, 'RoomName');
        
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Fixed camelCase kebaya in: ' + filePath);
        }
    }
}

walkDir(dir);
console.log('Done fixing camelCase.');
