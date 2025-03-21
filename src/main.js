import { debug } from "./utils/config";
import { addUI, updateUI } from "./components/mainUI";
import { processRoundEnd, processGameEnd } from "./utils/gameProcessor";

// Main function to initialize the framework
function initBlunderGuessr() {
	debug("Initializing Blunder-Guessr...");

	// Initialize GeoGuessr Event Framework
	GeoGuessrEventFramework.init()
		.then((GEF) => {
			debug("Event Framework initialized");

			// Event listener for normal games (not duels)
			GEF.events.addEventListener("round_end", (event) => {
				processRoundEnd(event.detail);
			});

			// Event listener for game end
			GEF.events.addEventListener("game_end", (event) => {
				processGameEnd(event.detail);

				// Update UI
				updateUI();
			});

			// Add UI
			setTimeout(addUI, 2000);
		})
		.catch((error) => {
			console.error(
				"[Blunder-Guessr] Error initializing framework:",
				error
			);
		});
}

// Start script
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", async () => {
		initBlunderGuessr();
	});
} else {
	initBlunderGuessr();
}

// Make global for debugging
window.BlunderGuessr = {
	updateUI,
};
