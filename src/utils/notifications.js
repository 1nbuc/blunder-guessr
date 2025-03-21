// Show a notification
export function showNotification(message, duration = 3000) {
	const notification = document.createElement("div");
	notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    animation: fadeIn 0.3s, fadeOut 0.3s ${duration / 1000 - 0.3}s forwards;
  `;

	// Add CSS animation
	const style = document.createElement("style");
	style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
    }
  `;
	document.head.appendChild(style);

	notification.textContent = message;
	document.body.appendChild(notification);

	setTimeout(() => {
		document.body.removeChild(notification);
	}, duration);
}
