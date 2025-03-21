#!/usr/bin/env node

/**
 * Script to update the version in the meta.js file
 * Usage: node scripts/update-version.js <version>
 */

const fs = require("fs");
const path = require("path");

// Get version from command line args
const version = process.argv[2];

if (!version) {
	console.error("Please provide a version number as an argument");
	process.exit(1);
}

// Path to meta.js
const metaFile = path.join(__dirname, "../src/meta.js");

// Read the file
let metaContent;
try {
	metaContent = fs.readFileSync(metaFile, "utf8");
} catch (err) {
	console.error(`Error reading meta.js: ${err.message}`);
	process.exit(1);
}

// Update the version
const updatedContent = metaContent.replace(
	/(\/\/ @version\s+)(\d+\.\d+\.\d+)/,
	`$1${version}`
);

// Write the file back
try {
	fs.writeFileSync(metaFile, updatedContent, "utf8");
	console.log(`Updated version in meta.js to ${version}`);
} catch (err) {
	console.error(`Error writing meta.js: ${err.message}`);
	process.exit(1);
}
