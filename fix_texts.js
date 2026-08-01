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
        let newContent = content.replace(/Sistem Manajemen Kosan Fio/gi, 'Sistem Manajemen Kosan Fio')
                                .replace(/Kosan Fio/gi, 'Kosan Fio')
                                .replace(/Sewa Ruang Kos/gi, 'Sewa Ruang Kos')
                                .replace(/\bLinda\b/gi, 'Fio');
        
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated texts in: ' + filePath);
        }
    }
}
walkDir(dir);
console.log('Text fix done.');
