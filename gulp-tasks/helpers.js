const fs = require('fs');
const log = require('fancy-log');
const path = require('path');

/**
 * Sorts an array of objects by date.
 * @param {object} a - The first object to compare.
 * @param {object} b - The second object to compare.
 * @returns {number} - Returns 1 if `a` is greater than `b`, -1 if `a` is less than `b`, or 0 if they are equal.
 */
const sortByDate = (a, b) => {
  const dateA = new Date(a.date).getTime();
  const dateB = new Date(b.date).getTime();
  return dateA > dateB ? 1 : -1;
};

/**
 * Groups an array of objects by a specified key.
 * @param {Array} array - The array of objects to be grouped.
 * @param {string} key - The key to group the objects by.
 * @returns {object} - An object containing the grouped objects.
 */
const groupBy = (array, key) => {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(
      currentValue,
    );
    return result;
  }, {});
};

/**
 * Reads all files in a directory synchronously and returns an array of file objects.
 * @param {string} dir - The directory path to read files from.
 * @returns {Array} - An array of file objects containing the file path, name, and stat information.
 */
const readFilesSync = (dir) => {
  const files = [];

  fs.readdirSync(dir).forEach((filename) => {
    const { name } = path.parse(filename);
    const filepath = path.resolve(dir, filename);
    const stat = fs.statSync(filepath);
    const isFile = stat.isFile();

    if (isFile) files.push({ filepath, name, stat });
  });

  files.sort((a, b) => {
    // natural sort alphanumeric strings
    // https://stackoverflow.com/a/38641281
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  return files;
};

/**
 * Creates a directory if it doesn't already exist.
 * @param {string} dir - The directory path to create.
 */
const mkdirr = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }
};

/**
 * Loads a plugin dynamically using the specified plugin path.
 * @param {string} plugin - The path to the plugin module.
 * @returns {Promise<*>} - A promise that resolves to the loaded plugin module.
 * @throws {Error} - If the plugin fails to load.
 */
const loadPlugin = async (plugin) => {
  try {
    const module = await import(plugin);
    return module.default || module;
  } catch (error) {
    log.error(`Failed to load plugin: ${plugin}`);
    throw error;
  }
};

/**
 * Reads and parses a JSON file.
 * @param {string} filePath - The path to the JSON file.
 * @returns {object} - The parsed JSON object.
 * @throws {Error} - If there is an error reading or parsing the JSON file.
 */
const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
  } catch (error) {
    log.error(`Error loading JSON data from ${filePath}`);
    throw error;
  }
};

/**
 * Checks if a file exists at the specified file path.
 * @param {string} filePath - The path to the file.
 * @returns {boolean} - Returns true if the file exists, false otherwise.
 */
const fileExists = (filePath) => {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (error) {
    log.error(`File ${filePath} doesn't exist.`);
    return false;
  }
};

/**
 * Loads the specified environment variables and returns an object containing their values.
 * @param {string[]} requiredVariables - An array of environment variable names that are required.
 * @returns {object} - An object containing the values of the required environment variables.
 * @throws {Error} - If any of the required environment variables are not set.
 */
const loadEnvVariables = (requiredVariables) => {
  const envVariables = {};

  requiredVariables.forEach((variable) => {
    const value = process.env[variable];
    if (!value) {
      throw new Error(`Environment variable ${variable} is not set`);
    }
    envVariables[variable] = value;
  });

  return envVariables;
};

module.exports = {
  fileExists,
  groupBy,
  loadEnvVariables,
  loadPlugin,
  mkdirr,
  readFilesSync,
  readJson,
  sortByDate,
};
