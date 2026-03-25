import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';

import { deleteAsync } from 'del';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import compileSass from './compile-sass.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMP_DIR = path.join(__dirname, '../../.temp/tmp-test-css');
const SRC_DIR = path.join(__dirname, '../../.temp/scss');
const TEST_SUBDIR = path.join(
  SRC_DIR,
  `test-files-${process.pid}-${Date.now()}`,
);
const TEST_SCSS = path.join(TEST_SUBDIR, 'test.scss');
const TEST_SCSS2 = path.join(TEST_SUBDIR, 'test2.scss');

/**
 * Cleans up temporary test files and directories.
 * @returns {Promise<string[]>} Promise resolving to array of deleted paths.
 */
async function cleanup() {
  return deleteAsync([TMP_DIR, TEST_SUBDIR], { force: true });
}

/**
 * Checks if a file exists.
 * @param {string} file - Path to the file.
 * @returns {boolean} True if the file exists, false otherwise.
 */
function fileExists(file) {
  try {
    fs.accessSync(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads CSS file content.
 * @param {string} file - Path to the CSS file.
 * @returns {string} The contents of the CSS file as a string.
 */
function readCss(file) {
  return fs.readFileSync(file, 'utf8');
}

/**
 * Ensures test files exist for SASS tests.
 * @returns {void}
 */
function ensureTestFiles() {
  if (!fs.existsSync(TEST_SUBDIR)) {
    fs.mkdirSync(TEST_SUBDIR, {
      recursive: true,
    });
  }
  if (!fs.existsSync(TEST_SCSS)) {
    fs.writeFileSync(TEST_SCSS, '.test { color: red; padding: 10px; }\n');
  }
  if (!fs.existsSync(TEST_SCSS2)) {
    fs.writeFileSync(TEST_SCSS2, '.test2 { color: blue; margin: 5px; }\n');
  }
}

describe('compileSass', () => {
  before(async () => {
    await cleanup();
    fs.mkdirSync(TMP_DIR, {
      recursive: true,
    });
    ensureTestFiles();
  });

  after(async () => {
    await cleanup();
  });

  it('should compile a single file with default plugins', async () => {
    const outFile = path.join(TMP_DIR, 'single-default.css');
    const stream = await compileSass(TEST_SCSS, TMP_DIR, 'single-default.css');
    await new Promise((resolve) => stream.on('end', resolve));
    assert.strictEqual(fileExists(outFile), true);
    const css = readCss(outFile);
    assert.ok(css.includes('.test'));
    assert.ok(css.includes('color: red'));
    assert.ok(css.includes('padding: 10px'));
  });

  it('should compile and merge multiple SCSS files into a single CSS output', async () => {
    const outFile = path.join(TMP_DIR, 'merge-multi.css');
    const stream = await compileSass([TEST_SCSS, TEST_SCSS2], TMP_DIR, 'merge-multi.css');
    await new Promise((resolve) => stream.on('end', resolve));
    assert.strictEqual(fileExists(outFile), true);
    const css = readCss(outFile);
    assert.ok(css.includes('.test'));
    assert.ok(css.includes('.test2'));
    assert.ok(css.includes('color: red'));
    assert.ok(css.includes('color: blue'));
  });

  it('should not create output for missing file', async () => {
    const outFile = path.join(TMP_DIR, 'missing-input.css');
    const stream = await compileSass(
      'nonexistent.scss',
      TMP_DIR,
      'missing-input.css',
    );
    await new Promise((resolve) => stream.on('end', resolve));
    assert.strictEqual(fileExists(outFile), false);
  });

  it('should handle custom sass options', async () => {
    const outFile = path.join(TMP_DIR, 'custom-options.css');
    const stream = await compileSass(TEST_SCSS, TMP_DIR, 'custom-options.css', [], {
      sassOptions: {
        outputStyle: 'compressed',
      },
    });
    await new Promise((resolve) => stream.on('end', resolve));
    assert.strictEqual(fileExists(outFile), true);
    const css = readCss(outFile);
    assert.ok(css.trim().split('\n').length < 5);
  });

  it('should work with custom postcss plugins', async () => {
    const outFile = path.join(TMP_DIR, 'custom-plugins.css');
    const customPlugin = () => ({
      postcssPlugin: 'test-plugin',
      Once(root) {
        root.append('/* Custom plugin was here */');
      },
    });
    customPlugin.postcss = true;

    const stream = await compileSass(TEST_SCSS, TMP_DIR, 'custom-plugins.css', [customPlugin()]);
    await new Promise((resolve) => stream.on('end', resolve));
    assert.strictEqual(fileExists(outFile), true);
    const css = readCss(outFile);
    assert.ok(css.includes('Custom plugin was here'));
  });

  it('should return a readable stream', async () => {
    const result = await compileSass(TEST_SCSS, TMP_DIR, 'stream-test.css');
    assert.ok(result);
    assert.strictEqual(typeof result.pipe, 'function');
  });

  describe('edge cases', () => {
    it('should handle non-existent files gracefully', async () => {
      const outFile = path.join(TMP_DIR, 'non-existent.css');
      const stream = await compileSass('does-not-exist.scss', TMP_DIR, 'non-existent.css');
      await new Promise((resolve) => stream.on('end', resolve));
      assert.strictEqual(fileExists(outFile), false);
    });
  });
});