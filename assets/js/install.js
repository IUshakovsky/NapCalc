let deferredPrompt;
const installButton = document.getElementById('installApp');
const installContainer = document.getElementById('installContainer');

// Hide the install button initially
if (installContainer) {
  installContainer.style.display = 'none';
}

// Check if the browser supports PWA installation
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show the install button
  if (installContainer) {
    installContainer.style.display = 'block';
  }
});

// Handle the install button click
if (installButton) {
  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We no longer need the prompt
    deferredPrompt = null;
    // Hide the install button
    if (installContainer) {
      installContainer.style.display = 'none';
    }
  });
}

// Listen for successful installation
window.addEventListener('appinstalled', () => {
  // Clear the deferredPrompt
  deferredPrompt = null;
  // Hide the install button
  if (installContainer) {
    installContainer.style.display = 'none';
  }
  // Optionally log or show a success message
  console.log('TinyRests was successfully installed');
});
