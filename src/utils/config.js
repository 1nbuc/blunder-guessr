// Default configuration
const DEFAULT_CONFIG = {
	// Score threshold below which a round is considered "bad"
	scoreThreshold: 2000,

	// Enable/disable saving rounds to file
	enableSaving: true,

	// Show UI
	showUI: true,

	// Start minimized
	startMinimized: false,

	// Automatic reminder at the end of round
	showNotification: true,

	// GeoGuessr Map ID to add blunders to
	mapId: "",

	// Enable tracking on Duels mode
	enableOnDuels: true,

	debug: true,
};

// Load configuration
let CONFIG = GM_getValue("config", DEFAULT_CONFIG);

// Ensure all configurations are present
Object.keys(DEFAULT_CONFIG).forEach((key) => {
	if (CONFIG[key] === undefined) {
		CONFIG[key] = DEFAULT_CONFIG[key];
	}
});

// Function to save configuration
function saveConfig() {
	GM_setValue("config", CONFIG);
	debug("Configuration saved", CONFIG);
}

// Helper function for debug logs
function debug(...args) {
	if (CONFIG.debug) {
		console.log("[Blunder-Guessr]", ...args);
	}
}

export { CONFIG, saveConfig, debug, DEFAULT_CONFIG };
