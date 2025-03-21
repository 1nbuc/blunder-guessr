import { debug } from "./config";
import { showNotification } from "./notifications";

// Temporary storage for blunders
let blunders = GM_getValue("blunders", []);

// Storage for duels - we save data during the game and write only at the end
export let duelData = {
	inProgress: false,
	badRounds: [],
};

// Save a blunder to local storage
export function saveLocalBlunder(newLocation) {
	blunders.push(newLocation);
	GM_setValue("blunders", blunders);
	debug("Blunder saved locally", newLocation);
}

// Function to export locally stored data
export function exportToJSON() {
	try {
		if (!blunders.length) {
			showNotification(
				"No locally stored rounds available for export.",
				5000
			);
			return;
		}

		const jsonData = {
			name: "blunders",
			customCoordinates: blunders,
			extra: {
				tags: {},
			},
		};

		// Create download for JSON file
		const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "blunder-guessr.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		debug("Data exported", jsonData);
		showNotification(`${blunders.length} rounds successfully exported!`);
	} catch (error) {
		console.error("[Blunder-Guessr] Error exporting:", error);
		showNotification("Error exporting data.", 5000);
	}
}

// Function to delete all collected data
export function clearAllData() {
	if (
		confirm(
			"Do you really want to delete all locally stored blunder rounds?"
		)
	) {
		GM_setValue("blunders", []);
		blunders = [];
		showNotification("All locally stored data has been deleted!", 5000);
		return true;
	}
	return false;
}

// Get the number of locally stored blunders
export function getBlunderCount() {
	return blunders.length;
}

// Get all locally stored blunders
export function getBlunders() {
	return blunders;
}
