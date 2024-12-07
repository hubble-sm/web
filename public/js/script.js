// Check if service workers are supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('ServiceWorker registration successful');
    } catch (err) {
      console.error('ServiceWorker registration failed:', err);
    }
  });
}

// Handle the "Add to Home Screen" (Install) prompt
let deferredPrompt;
const installButton = document.getElementById("install-button");

// Listen for the "beforeinstallprompt" event
window.addEventListener("beforeinstallprompt", (event) => {
  // Prevent the default prompt
  event.preventDefault();
  deferredPrompt = event;

  // Show the install button
  installButton.style.display = "block";

  // Add event listener to the install button
  installButton.addEventListener("click", () => {
    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log(choiceResult.outcome);
      deferredPrompt = null;
    });
  });
});