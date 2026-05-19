import fs from 'fs';
const data = fs.readFileSync('src/App.jsx', 'utf8');
console.log(data.substring(0, 100));
