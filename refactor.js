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
    // Only process text files
    if (filePath.match(/\.(ts|js|vue|json|md|html|css|scss|bat|ps1|env|gitignore)$/i) || path.basename(filePath) === '.env') {
        let content = fs.readFileSync(filePath, 'utf8');
        
        let newContent = content;
        
        // Models / Fields
        newContent = newContent.replace(/\bjenis\b/g, 'tipeKamar');
        newContent = newContent.replace(/\bwarna\b/g, 'fasilitas');
        newContent = newContent.replace(/\blaundryStock\b/g, 'cleaningStock');
        newContent = newContent.replace(/\bkebaya\b/g, 'room');
        newContent = newContent.replace(/\bKebaya\b/g, 'Room');
        newContent = newContent.replace(/\bKEBAYA\b/g, 'ROOM');
        newContent = newContent.replace(/rooms/g, 'rooms');
        newContent = newContent.replace(/Rooms/g, 'Rooms');
        newContent = newContent.replace(/ROOMS/g, 'ROOMS');
        newContent = newContent.replace(/Sistem Inventaris Room/g, 'Sistem Manajemen Kosan');
        newContent = newContent.replace(/Sewa Baju Room/g, 'Sewa Ruang Kos');

        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated content: ' + filePath);
        }
    }
}

function renameFiles(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === '.nuxt') continue;
        const fullPath = path.join(currentPath, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
            renameFiles(fullPath);
        }
        
        const baseName = path.basename(fullPath);
        if (baseName.toLowerCase().includes('room')) {
            const newName = baseName.replace(/room/g, 'room').replace(/Room/g, 'Room');
            const newPath = path.join(path.dirname(fullPath), newName);
            fs.renameSync(fullPath, newPath);
            console.log('Renamed file: ' + fullPath + ' -> ' + newPath);
            if (fs.statSync(newPath).isDirectory()) {
                renameFiles(newPath); // process inside the renamed dir
            }
        }
    }
}

console.log('Starting content replacement...');
walkDir(dir);
console.log('Starting file renaming...');
renameFiles(dir);
console.log('Done.');
