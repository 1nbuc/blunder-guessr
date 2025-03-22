import { CONFIG, saveConfig } from "../utils/config";
import { showNotification } from "../utils/notifications";
import { updateUI } from "./mainUI";

// Function to create a settings element
function createSettingElement(label, type, value, onChange) {
	const container = document.createElement("div");
	container.style.cssText =
		"display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;";

	const labelElement = document.createElement("label");
	labelElement.textContent = label;
	labelElement.style.marginRight = "10px";

	let inputElement;

	if (type === "checkbox") {
		inputElement = document.createElement("input");
		inputElement.type = "checkbox";
		inputElement.checked = value;
		inputElement.addEventListener("change", () =>
			onChange(inputElement.checked)
		);
	} else if (type === "number") {
		inputElement = document.createElement("input");
		inputElement.type = "number";
		inputElement.value = value;
		inputElement.style.width = "70px";
		inputElement.addEventListener("change", () =>
			onChange(parseInt(inputElement.value, 10))
		);
	} else if (type === "text") {
		inputElement = document.createElement("input");
		inputElement.type = "text";
		inputElement.value = value;
		inputElement.style.width = "200px";
		inputElement.addEventListener("change", () =>
			onChange(inputElement.value)
		);
	}

	container.appendChild(labelElement);
	container.appendChild(inputElement);

	return container;
}

// Show settings menu
export function showSettings() {
	// Create menu
	const settingsContainer = document.createElement("div");
	settingsContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(20, 20, 20, 0.9);
    color: white;
    padding: 20px;
    border-radius: 8px;
    z-index: 10001;
    font-family: Arial, sans-serif;
    min-width: 300px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  `;

	// Heading
	const title = document.createElement("h2");
	title.textContent = "Blunder-Guessr Settings";
	title.style.textAlign = "center";
	title.style.marginTop = "0";

	// Settings container
	const settingsContent = document.createElement("div");
	settingsContent.style.cssText =
		"display: flex; flex-direction: column; margin: 15px 0;";

	// Score threshold
	settingsContent.appendChild(
		createSettingElement(
			"Score threshold:",
			"number",
			CONFIG.scoreThreshold,
			(value) => {
				CONFIG.scoreThreshold = value;
			}
		)
	);

	// Enable saving
	settingsContent.appendChild(
		createSettingElement(
			"Enable saving:",
			"checkbox",
			CONFIG.enableSaving,
			(checked) => {
				CONFIG.enableSaving = checked;
			}
		)
	);

	// Show UI
	settingsContent.appendChild(
		createSettingElement(
			"Show UI:",
			"checkbox",
			CONFIG.showUI,
			(checked) => {
				CONFIG.showUI = checked;
			}
		)
	);

	// Start minimized
	settingsContent.appendChild(
		createSettingElement(
			"Start minimized:",
			"checkbox",
			CONFIG.startMinimized,
			(checked) => {
				CONFIG.startMinimized = checked;
			}
		)
	);

	// Show notifications
	settingsContent.appendChild(
		createSettingElement(
			"Notifications:",
			"checkbox",
			CONFIG.showNotification,
			(checked) => {
				CONFIG.showNotification = checked;
			}
		)
	);

	// Enable on Duels
	settingsContent.appendChild(
		createSettingElement(
			"Enable on Duels:",
			"checkbox",
			CONFIG.enableOnDuels,
			(checked) => {
				CONFIG.enableOnDuels = checked;
			}
		)
	);

	// Map ID Setting
	settingsContent.appendChild(
		createSettingElement(
			"GeoGuessr Map ID:",
			"text",
			CONFIG.mapId,
			(value) => {
				CONFIG.mapId = value;
			}
		)
	);

	// Map ID Help
	const mapIdHelp = document.createElement("p");
	mapIdHelp.style.cssText = "font-size: 12px; margin-top: 0; color: #ccc;";
	mapIdHelp.innerHTML =
		"You can find the Map ID in your map's URL:<br>https://www.geoguessr.com/map-maker/<b>your-map-id</b>";
	settingsContent.appendChild(mapIdHelp);

	// Buttons Container
	const buttons = document.createElement("div");
	buttons.style.cssText =
		"display: flex; justify-content: space-between; margin-top: 20px;";

	// Save Button
	const saveButton = document.createElement("button");
	saveButton.textContent = "Save";
	saveButton.style.cssText =
		"cursor: pointer; background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 3px;";
	saveButton.onclick = () => {
		saveConfig();
		document.body.removeChild(settingsContainer);
		document.body.removeChild(overlay);
		showNotification("Settings saved!");
		updateUI();
	};

	// Cancel Button
	const cancelButton = document.createElement("button");
	cancelButton.textContent = "Cancel";
	cancelButton.style.cssText =
		"cursor: pointer; background-color: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 3px;";
	cancelButton.onclick = () => {
		document.body.removeChild(settingsContainer);
		document.body.removeChild(overlay);
	};

	buttons.appendChild(cancelButton);
	buttons.appendChild(saveButton);

	// Combine all elements
	settingsContainer.appendChild(title);
	settingsContainer.appendChild(settingsContent);
	settingsContainer.appendChild(buttons);

	// Background overlay
	const overlay = document.createElement("div");
	overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10000;
  `;
	overlay.onclick = () => {
		document.body.removeChild(settingsContainer);
		document.body.removeChild(overlay);
	};

	// Add to page
	document.body.appendChild(overlay);
	document.body.appendChild(settingsContainer);
}
