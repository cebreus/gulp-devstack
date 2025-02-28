#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {
  createRequire
} from 'module';

const require = createRequire(
  import.meta.url);
const matter = require('gray-matter');

// Test front matter extrakce
function testFrontMatterExtraction() {
  console.log('=== TESTING FRONT MATTER EXTRACTION ===');

  try {
    // Načtení indexového markdown souboru
    const indexMdPath = './src/routes/index.md';
    const mdContent = fs.readFileSync(indexMdPath, 'utf8');

    console.log('\nOriginal Markdown file:');
    console.log('--------------------------');
    console.log(mdContent.slice(0, 500) + '...');

    // Extrakce front matter
    const {
      data,
      content
    } = matter(mdContent);

    console.log('\nExtracted Front Matter:');
    console.log('--------------------------');
    console.log(JSON.stringify(data, null, 2));

    console.log('\nExtracted Content (first 300 chars):');
    console.log('--------------------------');
    console.log(content.slice(0, 300) + '...');

    // Kontrola zpracování HML pro index
    const jsonDataDir = './.tmp/pages';
    const indexJsonPath = path.join(jsonDataDir, 'index.json');

    console.log('\nChecking if JSON data exists:');
    console.log('--------------------------');
    if (fs.existsSync(indexJsonPath)) {
      const jsonData = JSON.parse(fs.readFileSync(indexJsonPath, 'utf8'));
      console.log('JSON data exists!');
      console.log(JSON.stringify(jsonData, null, 2));
    } else {
      console.log('JSON data does not exist at:', indexJsonPath);

      // Zkontrolujme celý adresář
      console.log('\nListing .tmp/pages directory:');
      console.log('--------------------------');
      if (fs.existsSync(jsonDataDir)) {
        fs.readdirSync(jsonDataDir).forEach(file => {
          console.log(`- ${file}`);
        });
      } else {
        console.log('Directory does not exist');
      }
    }
  } catch (error) {
    console.error('Error testing front matter extraction:', error);
  }
}

// Testování cest a adresářové struktury
function testPaths() {
  console.log('\n=== TESTING PATHS AND DIRECTORY STRUCTURE ===');

  const routesDir = './src/routes';
  const tempDir = './.tmp';
  const datasetDir = path.join(tempDir, 'pages');

  console.log(`Routes source directory: ${routesDir}`);
  console.log(`Dataset directory: ${datasetDir}`);

  if (!fs.existsSync(routesDir)) {
    console.error(`Routes directory does not exist: ${routesDir}`);
    return;
  }

  console.log('\nListing files in routes directory:');
  console.log('--------------------------');
  listFilesInDirectory(routesDir);
}

// Rekurzivní výpis souborů v adresáři
function listFilesInDirectory(dir, indent = '') {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      console.log(`${indent}📁 ${file}/`);
      listFilesInDirectory(filePath, indent + '  ');
    } else {
      console.log(`${indent}📄 ${file}`);
    }
  });
}

// Spuštění testů
testFrontMatterExtraction();
testPaths();

console.log('\n===== DIAGNOSIS =====');
console.log(
  'Pokud JSON data neexistují nebo neobsahují správné meta údaje, problém je v dataset-prepare.js'
);
console.log(
  'Pokud JSON data jsou správná, ale HTML je bez meta tagů, problém je v html-build.js nebo v šablonách'
);
