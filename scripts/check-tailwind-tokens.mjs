import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '../src');

// Regex to find arbitrary values in Tailwind classes for z-index, rounded, and text.
// We want to ban raw values like z-[100], rounded-[12px], rounded-[1.5rem], text-[14px]
// But ALLOW CSS variables like z-[var(--z-toast)] or rounded-[var(--radius-md)]
// This regex matches z-[...], rounded-[...], text-[...] where the inside DOES NOT contain 'var('
const ARBITRARY_CLASS_REGEX = /\b(?:z|rounded|text)-\[(?!.*var\().+?\]/g;

let hasErrors = false;

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    let match;
    while ((match = ARBITRARY_CLASS_REGEX.exec(line)) !== null) {
      const violation = match[0];
      
      console.error(`❌ Violation in ${path.relative(process.cwd(), filePath)}:${index + 1}`);
      console.error(`   Found forbidden arbitrary class: ${violation}`);
      console.error(`   Please use Design System tokens (e.g., standard Tailwind classes or var(--radius-*), var(--z-*))\n`);
      hasErrors = true;
    }
  });
}

console.log('🔍 Scanning .jsx files for arbitrary Tailwind classes...');
scanDirectory(SRC_DIR);

if (hasErrors) {
  console.error('💥 Guardrail check failed! Fix the above issues.');
  process.exit(1);
} else {
  console.log('✅ All good! No arbitrary Tailwind classes found for z-index, rounded, or text.');
  process.exit(0);
}
