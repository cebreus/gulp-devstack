import favicons from 'favicons';
import fs from 'fs';

const source = './src/gfx/favicon/favicons-source.png'; // Adjust the path to your image
const config = {
  appName: 'My App',                      // Your application's name
  appDescription: 'This is my application', // Your application's description
  developerName: 'Developer Name',         // Your name
  developerURL: 'https://developerwebsite.com/', // Your website
  background: '#000000',                   // Background color for icons
  path: '/assets/favicons/',               // Path for generated favicons
  url: 'https://urlofwebsite.com/',        // Your app's URL
  display: 'standalone',                   // Display mode for mobile
  orientation: 'portrait',                 // Orientation for mobile
  start_url: '/index.html',                // Start URL
  logging: true,                           // Log activity
  html: 'favicons.njk',                    // Output HTML template
  pipeHTML: true,                          // Pipe the HTML into a file
  replace: false,                          // Replace existing icons
  icons: {
    favicons: true,  // Enable favicon generation
  },
};

fs.readFile(source, (err, imageBuffer) => {
  if (err) {
    console.error('Error reading image file:', err);
    return;
  }

  favicons(imageBuffer, config)
    .then(response => {
      console.log('Favicons generated successfully.');
      console.log('Generated images:', response.images);
      console.log('Generated files:', response.files);
    })
    .catch(error => {
      console.error('Error during favicon generation:', error);
    });
});
