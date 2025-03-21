import { CONFIG, saveConfig, debug } from "../utils/config";
import { getBlunderCount } from "../utils/storage";
import { showSettings } from "./settingsUI";
import { exportToJSON, clearAllData } from "../utils/storage";

// UI elements
let uiElements = {
	container: null,
	status: null,
	content: null,
	minimizeBtn: null,
};

// Function to update the UI
export function updateUI() {
	if (!uiElements.status) return;

	const count = getBlunderCount();
	const mapConfigured = CONFIG.mapId ? "Map configured" : "No map configured";
	uiElements.status.textContent = `${count} rounds locally stored | ${mapConfigured}`;
}

// Minimize/Maximize the UI
function toggleMinimize() {
	if (!uiElements.content || !uiElements.minimizeBtn) return;

	const isMinimized = uiElements.content.style.display === "none";
	uiElements.content.style.display = isMinimized ? "flex" : "none";
	uiElements.minimizeBtn.textContent = isMinimized ? "−" : "+";

	// Save status
	CONFIG.startMinimized = !isMinimized;
	saveConfig();
}

// Function to add the UI
export function addUI() {
	// Wait until page is loaded
	if (!document.body) {
		setTimeout(addUI, 100);
		return;
	}

	// If UI is disabled, do nothing
	if (!CONFIG.showUI) {
		debug("UI is disabled");
		return;
	}

	// Create UI container
	const container = document.createElement("div");
	container.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  `;

	// Header with title and minimize button
	const header = document.createElement("div");
	header.style.cssText =
		"display: flex; justify-content: space-between; align-items: center;";

	// Title
	const title = document.createElement("div");
	title.textContent = "Blunder-Guessr";
	title.style.fontWeight = "bold";

	// Minimize button
	const minimizeBtn = document.createElement("button");
	minimizeBtn.textContent = CONFIG.startMinimized ? "+" : "−";
	minimizeBtn.style.cssText =
		"border: none; background: none; color: white; cursor: pointer; font-size: 16px; padding: 0 5px;";
	minimizeBtn.onclick = toggleMinimize;

	header.appendChild(title);
	header.appendChild(minimizeBtn);

	// Content area
	const content = document.createElement("div");
	content.style.cssText = "display: flex; flex-direction: column; gap: 5px;";
	content.style.display = CONFIG.startMinimized ? "none" : "flex";

	// Status display
	const status = document.createElement("div");
	const mapConfigured = CONFIG.mapId ? "Map configured" : "No map configured";
	status.textContent = `${getBlunderCount()} rounds locally stored | ${mapConfigured}`;
	status.id = "blunder-status";

	// Button container
	const buttonContainer = document.createElement("div");
	buttonContainer.style.cssText = "display: flex; gap: 5px;";

	// Export button
	const exportBtn = document.createElement("button");
	exportBtn.textContent = "Export";
	exportBtn.onclick = exportToJSON;
	exportBtn.style.cssText =
		"cursor: pointer; background-color: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px;";

	// Settings button
	const settingsBtn = document.createElement("button");
	settingsBtn.textContent = "Settings";
	settingsBtn.onclick = showSettings;
	settingsBtn.style.cssText =
		"cursor: pointer; background-color: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 3px;";

	// Clear button
	const clearBtn = document.createElement("button");
	clearBtn.textContent = "Delete local";
	clearBtn.onclick = () => {
		if (clearAllData()) {
			updateUI();
		}
	};
	clearBtn.style.cssText =
		"cursor: pointer; background-color: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px;";

	// Add buttons
	buttonContainer.appendChild(exportBtn);
	buttonContainer.appendChild(settingsBtn);
	buttonContainer.appendChild(clearBtn);

	// Add elements to content
	content.appendChild(status);
	content.appendChild(buttonContainer);

	// Add all elements to container
	container.appendChild(header);
	container.appendChild(content);

	// Add container to page
	document.body.appendChild(container);

	// Save UI elements
	uiElements = {
		container,
		status,
		content,
		minimizeBtn,
	};

	debug("UI added");

	return uiElements;
}
