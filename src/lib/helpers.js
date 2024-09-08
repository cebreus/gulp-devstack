import log from 'fancy-log';
import fs from 'fs';
import path from 'path';
import process from 'process';

export const sortByDate = (a, b) => {
  const dateA = new Date(a.date).getTime();
  const dateB = new Date(b.date).getTime();
  return dateA > dateB ? 1 : -1;
};

export const groupBy = (array, key) => {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(
      currentValue,
    );
    return result;
  }, {});
};



export const readFilesSync = (dir) => {
  const files = [];

  fs.readdirSync(dir).forEach((filename) => {
    const { name } = path.parse(filename);
    const filepath = path.resolve(dir, filename);
    const stat = fs.statSync(filepath);
    const isFile = stat.isFile();

    if (isFile) files.push({ filepath, name, stat });
  });

  files.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  return files;
};

export const mkdirr = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }
};

export const loadPlugin = async (plugin) => {
  try {
    const module = await import(plugin);
    return module.default || module;
  } catch (error) {
    log.error(`Failed to load plugin: ${plugin}`);
    throw error;
  }
};

export const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
  } catch (error) {
    log.error(`Error loading JSON data from ${filePath}`);
    throw error;
  }
};

export const fileExists = (filePath) => {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (error) {
    log.error(`File ${filePath} doesn't exist.`);
    return false;
  }
};

export const loadEnvVariables = (requiredVariables) => {
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
