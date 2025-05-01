let deferredPrompt;
const installButton = document.getElementById('installApp');
const installContainer = document.getElementById('installContainer');

// Development mode - set to true to force show the install button
const devMode = false;

// Hide the install button initially (unless in dev mode)
if (installButton) {
  installButton.style.display = devMode ? 'inline-flex' : 'none';
}

// Check if the browser supports PWA installation
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt event fired');
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show the install button
  if (installButton) {
    installButton.style.display = 'inline-flex';
  }
});

// If dev mode is enabled, show the button always for testing purposes
if (devMode && installContainer) {
  installContainer.style.display = 'block';
}

// Handle the install button click
if (installButton) {
  installButton.addEventListener('click', (e) => {
    // Show the prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          // Hide button after installation
          installContainer.style.display = 'none';
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
    }
  });
}

// Listen for successful installation
window.addEventListener('appinstalled', () => {
  // Clear the deferredPrompt
  deferredPrompt = null;
  // Hide the install button
  if (installButton) {
    installButton.style.display = 'none';
  }
  // Optionally log or show a success message
  console.log('TinyRests was successfully installed');
});
