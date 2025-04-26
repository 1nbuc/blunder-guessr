import { CONFIG } from "../utils/config";
import { debug } from "../utils/config";
import { showNotification } from "../utils/notifications";
import { saveLocalBlunder } from "../utils/storage";

// Function to fetch current map data
export async function fetchMapData() {
	if (!CONFIG.mapId) {
		showNotification("No Map ID configured. Please set in settings.", 5000);
		return null;
	}

	try {
		const response = await fetch(
			`https://www.geoguessr.com/api/v4/user-maps/drafts/${CONFIG.mapId}`,
			{
				headers: {
					accept: "application/json",
					"content-type": "application/json",
					"x-client": "web",
				},
				method: "GET",
				credentials: "include",
			}
		);

		if (!response.ok) {
			throw new Error(`Error fetching map data: ${response.status}`);
		}

		const data = await response.json();
		debug("Map data retrieved", data);
		return data;
	} catch (error) {
		console.error("[Blunder-Guessr] Error fetching map data:", error);
		showNotification(`Error fetching map data: ${error.message}`, 5000);
		return null;
	}
}

// Function to update the map with new locations
export async function updateMap(newLocation) {
	if (!CONFIG.mapId) {
		showNotification(
			"No Map ID configured. The round was saved locally.",
			3000
		);
		// Local storage as fallback
		saveLocalBlunder(newLocation);
		return false;
	}

	try {
		// Fetch current map data
		const mapData = await fetchMapData();
		if (!mapData) return false;


		mapData.customCoordinates = [
			...mapData.coordinates,
			{
				lat: newLocation.lat,
				lng: newLocation.lng,
				heading: newLocation.heading,
				pitch: newLocation.pitch,
				zoom: newLocation.zoom || 0,
				panoId: newLocation.panoId,
				countryCode: newLocation.countryCode,
				stateCode: newLocation.stateCode,
			},
		];

		delete mapData.coordinates;

		mapData.version = mapData.version += 1;

		// Update map
		const updateResponse = await fetch(
			`https://www.geoguessr.com/api/v4/user-maps/drafts/${CONFIG.mapId}`,
			{
				headers: {
					accept: "application/json",
					"content-type": "application/json",
					"x-client": "web",
				},
				method: "PUT",
				body: JSON.stringify(mapData),
				credentials: "include",
			}
		);

		if (!updateResponse.ok) {
			console.error(updateResponse);
			throw new Error(`Error updating map: ${updateResponse.status}`);
		}

		debug("Map successfully updated");
		return true;
	} catch (error) {
		console.error("[Blunder-Guessr] Error updating map:", error);
		showNotification(
			`Error updating map: ${error.message}. The round was saved locally.`,
			5000
		);

		// Local storage as fallback
		saveLocalBlunder(newLocation);
		return false;
	}
}
