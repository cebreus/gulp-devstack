#!/usr/bin/env node
import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'

/**
 * Tests the extraction of front matter from a markdown file and checks for related JSON data.
 */
function testFrontMatterExtraction() {
  console.log('=== TESTING FRONT MATTER EXTRACTION ===')

  try {
    // Load the index markdown file.
    const indexMdPath = './src/routes/index.md'
    const mdContent = fs.readFileSync(indexMdPath, 'utf8')

    console.log('\nOriginal Markdown file:')
    console.log('--------------------------')
    console.log(mdContent.slice(0, 500) + '...')

    // Extract front matter from the markdown file.
    const { data, content } = matter(mdContent)

    console.log('\nExtracted Front Matter:')
    console.log('--------------------------')
    console.log(JSON.stringify(data, null, 2))

    console.log('\nExtracted Content (first 300 chars):')
    console.log('--------------------------')
    console.log(content.slice(0, 300) + '...')

    // Check if the corresponding JSON data file exists.
    const jsonDataDir = './.tmp/pages'
    const indexJsonPath = path.join(jsonDataDir, 'index.json')

    console.log('\nChecking if JSON data exists:')
    console.log('--------------------------')
    if (fs.existsSync(indexJsonPath)) {
      const jsonData = JSON.parse(fs.readFileSync(indexJsonPath, 'utf8'))
      console.log('JSON data exists!')
      console.log(JSON.stringify(jsonData, null, 2))
    } else {
      console.log('JSON data does not exist at:', indexJsonPath)

      // If the JSON file doesn't exist, list the contents of the directory.
      console.log('\nListing .tmp/pages directory:')
      console.log('--------------------------')
      if (fs.existsSync(jsonDataDir)) {
        fs.readdirSync(jsonDataDir).forEach((file) => {
          console.log(`- ${file}`)
        })
      } else {
        console.log('Directory does not exist')
      }
    }
  } catch (error) {
    console.error('Error testing front matter extraction:', error)
  }
}

/**
 * Tests and logs the directory structure and files in the routes directory.
 */
function testPaths() {
  console.log('\n=== TESTING PATHS AND DIRECTORY STRUCTURE ===')

  const routesDir = './src/routes'
  const tempDir = './.tmp'
  const datasetDir = path.join(tempDir, 'pages')

  console.log(`Routes source directory: ${routesDir}`)
  console.log(`Dataset directory: ${datasetDir}`)

  if (!fs.existsSync(routesDir)) {
    console.error(`Routes directory does not exist: ${routesDir}`)
    return
  }

  console.log('\nListing files in routes directory:')
  console.log('--------------------------')
  listFilesInDirectory(routesDir)
}

/**
 * Recursively lists files and directories in the specified directory.
 * @param {string} dir - The directory path to list.
 * @param {string} [indent] - Indentation for nested files/directories.
 */
function listFilesInDirectory(dir, indent = '') {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      console.log(`${indent}📁 ${file}/`)
      listFilesInDirectory(filePath, indent + '  ')
    } else {
      console.log(`${indent}📄 ${file}`)
    }
  })
}

// Run the tests.
testFrontMatterExtraction()
testPaths()

// Provide a diagnosis based on the test results.
console.log('\n===== DIAGNOSIS =====')
console.log(
  'If the JSON data does not exist or does not contain the correct metadata, the problem is in dataset-prepare.js'
)
console.log(
  'If the JSON data is correct but the HTML is missing meta tags, the problem is in html-build.js or in the templates'
)
