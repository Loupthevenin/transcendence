const fs = require("fs");
const path = require('path');

// Define the source and destination directories
const sourceDir = path.resolve(__dirname); // Current project root
const destDir = path.resolve(__dirname, "dist"); // 'dist' folder

// Function to recursively copy files and folders while excluding certain patterns
const copyFiles = (source, destination) => {
  try {
    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
      console.log(`Created destination folder: "${destination}"`);
    }

    // Read all items in the source directory
    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
      // Exclude node_modules, dist, and .ts files
      if (
        entry.name === "node_modules" || // Exclude node_modules
        entry.name === "dist" || // Exclude dist
        entry.name === __filename || // Exclude self
        entry.name.endsWith(".ts") // Exclude .ts files
      ) continue;

      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      const stats = fs.statSync(sourcePath);

      if (stats.isDirectory()) {
        // Recursively copy directories
        copyFiles(sourcePath, destPath);
      } else if (stats.isFile()) {
        // Copy files
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copying '${sourcePath}' to '${destPath}'`);
      }
    }
  } catch (error) {
    console.error(`Error copying files from '${source}' to '${destination}':`, error.message);
    process.exit(1); // Exit the script with an error code
  }
};

// Check if source directory exists, or create it if it doesn't
try {
  if (!fs.existsSync(sourceDir)) {
    console.warn(`Source directory '${sourceDir}' does not exist (this should not happen). Creating it now...`);
    fs.mkdirSync(sourceDir, { recursive: true });
  }

  console.log(`Copying files from '${sourceDir}' to '${destDir}'...`);
  copyFiles(sourceDir, destDir);
  console.log("Copy completed successfully!");
} catch (error) {
  console.error("Error during the process:", error.message);
  process.exit(1);
}