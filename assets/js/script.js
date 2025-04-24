function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(totalMinutes) {
  totalMinutes = (totalMinutes + 1440) % 1440;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Function to get the site's baseurl
function getSiteBaseUrl() {
  // Get the path part of the current URL and match it against the site structure
  // This allows the site to work both locally and on GitHub Pages
  const pathArray = window.location.pathname.split('/');
  if (pathArray[1] === 'NapCalc') {
    return '/NapCalc'; // We're on GitHub Pages with correct repository name
  }
  return ''; // We're running locally
}

// Function to generate a shareable URL with encoded parameters
function generateShareableUrl(params) {
  // Get the host and protocol
  const hostname = window.location.protocol + '//' + window.location.host;
  
  // Get the path to the site root (handling GitHub Pages case)
  const baseUrl = hostname + getSiteBaseUrl() + '/';
  
  // Build the query string from parameters
  const queryString = Object.keys(params)
    .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  return `${baseUrl}?${queryString}`;
}

// Function to validate time format
function isValidTimeFormat(timeStr) {
  if (!timeStr) return false;
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

// Function to parse URL parameters when page loads
function parseUrlParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  
  if (queryString) {
    const pairs = queryString.split('&');
    pairs.forEach(pair => {
      if (pair) { // Make sure pair is not empty
        const [key, value] = pair.split('=');
        if (key && value) { // Make sure both key and value exist
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      }
    });
  }
  
  return params;
}

// Function to convert age number to text description
function getAgeRangeText(age) {
  if (age <= 3) return '0–3 months';
  if (age <= 8) return '4–8 months';
  if (age <= 12) return '9–12 months';
  if (age <= 17) return '13–17 months';
  if (age <= 24) return '18–24 months';
  if (age <= 30) return '25–30 months';
  return '31–36 months';
}

document.addEventListener('DOMContentLoaded', function() {
  // Check for URL parameters and auto-fill form if present
  const urlParams = parseUrlParams();
  if (Object.keys(urlParams).length > 0) {
    // Auto-fill form fields
    if (urlParams.age) document.getElementById('age').value = urlParams.age;
    if (urlParams.wakeTime) document.getElementById('wakeTime').value = urlParams.wakeTime;
    if (urlParams.bedTime) document.getElementById('bedTime').value = urlParams.bedTime;
    if (urlParams.napCount) document.getElementById('napCount').value = urlParams.napCount;
    if (urlParams.napLength) document.getElementById('napLength').value = urlParams.napLength;
    
    // Auto-calculate if we have the minimum required fields
    if (urlParams.age && urlParams.wakeTime && urlParams.bedTime) {
      // Give browser a bit more time to fully load and set form values
      setTimeout(() => {
        const form = document.getElementById('napForm');
        if (form) {
          console.log('Auto-calculating from URL parameters');
          form.dispatchEvent(new Event('submit'));
        }
      }, 800);
    }
  }
  
  // Initialize FAQ toggles
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      q.classList.toggle('active');
      const answer = q.nextElementSibling;
      answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
    });
  });

  // Initialize form submission handler
  document.getElementById('napForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const age = parseInt(document.getElementById('age').value);
    const wakeTime = document.getElementById('wakeTime').value;
    const bedTime = document.getElementById('bedTime').value;
    const customNaps = parseInt(document.getElementById('napCount').value);
    const customNapLength = parseInt(document.getElementById('napLength').value);
    const output = document.getElementById('output');

    if (!age || !wakeTime || !bedTime) {
      output.innerHTML = `<strong>Please fill out all required fields.</strong>`;
      output.classList.remove('d-none');
      return;
    }

    let naps = 1;
    let wakeWindow = 240;
    let napLength = 90;

    if (age <= 3) {
      naps = 4;
      wakeWindow = 90;
      napLength = 60;
    } else if (age <= 8) {
      naps = 3;
      wakeWindow = 120;
      napLength = 60;
    } else if (age <= 12) {
      naps = 2;
      wakeWindow = 150;
      napLength = 75;
    } else if (age <= 17) {
      naps = 2;
      wakeWindow = 180;
      napLength = 90;
    } else if (age <= 24) {
      naps = 1;
      wakeWindow = 240;
      napLength = 120;
    } else {
      naps = 1;
      wakeWindow = 300;
      napLength = 120;
    }

    if (!isNaN(customNaps) && customNaps > 0 && customNaps <= 4) {
      naps = customNaps;
    }
    if (!isNaN(customNapLength) && customNapLength >= 20 && customNapLength <= 180) {
      napLength = customNapLength;
    }

    const wakeMinutes = parseTime(wakeTime);
    const bedMinutes = parseTime(bedTime);
    const totalAvailable = (bedMinutes + 1440 - wakeMinutes) % 1440;

    if (totalAvailable < 360) {
      output.innerHTML = `<div class='text-danger'><strong>Warning:</strong> Not enough time for naps. Please adjust wake-up or bedtime.</div>`;
      output.classList.remove('d-none');
      return;
    }

    const totalWakeTime = totalAvailable - (naps * napLength);
    const adjustedWakeWindow = Math.floor(totalWakeTime / (naps + 1));

    let current = wakeMinutes;
    const schedule = [`<li><strong>Wake-up:</strong> ${formatTime(current)}</li>`];
    let warning = '';

    for (let i = 0; i < naps; i++) {
      current += adjustedWakeWindow;
      const napStart = current;
      const napEnd = napStart + napLength;

      if (napEnd >= bedMinutes) {
        warning = `<div class='text-danger'><strong>Warning:</strong> Last nap overlaps or is too close to bedtime.</div>`;
        break;
      }

      schedule.push(`<li><strong>Nap ${i + 1}:</strong> ${formatTime(napStart)} – ${formatTime(napEnd)} (${napLength} min)</li>`);
      current = napEnd;
    }

    schedule.push(`<li><strong>Bedtime:</strong> ${formatTime(bedMinutes)}</li>`);

    // Generate the shareable URL using the parameters
    const scheduleParams = {
      age: age,
      wakeTime: wakeTime,
      bedTime: bedTime,
      napCount: customNaps || naps,
      napLength: customNapLength || napLength
    };
    
    const shareableUrl = generateShareableUrl(scheduleParams);
    
    // Store the shareableUrl in a data attribute for easy access
    output.dataset.shareableUrl = shareableUrl;
    
    // Create a printable version that includes all the form parameters as context
    const printableVersion = `
      <div class="print-header">
        <h4>Nap Schedule for ${getAgeRangeText(age)} Toddler</h4>
        <p>Wake-up time: ${formatTime(wakeMinutes)} | Bedtime: ${formatTime(bedMinutes)}</p>
      </div>
      <ul class="timeline-list">${schedule.join('')}</ul>
    `;
    
    output.innerHTML = `
      <h6 class="mb-2">Your suggested schedule</h6>
      <ul class="timeline-list">${schedule.join('')}</ul>
      ${warning}
      <div class="action-buttons mt-4">
        <button id="printBtn" class="action-btn print-btn ripple">
          <i class="icon-print"></i>
          <span>Print</span>
        </button>
        <button id="copyBtn" class="action-btn copy-btn ripple">
          <i class="icon-copy"></i>
          <span>Copy Link</span>
        </button>
        <button id="shareBtn" class="action-btn ripple">
          <i class="icon-share"></i>
          <span>Share</span>
        </button>
      </div>
      <div id="shareOptions" class="share-options-container mt-3 d-none">
        <button id="nativeShareBtn" class="action-btn ripple">
          <i class="icon-share"></i>
          <span>Share</span>
        </button>
      </div>
      <div id="copyFeedback" class="copy-feedback">Link copied to clipboard!</div>
    `;
    
    // Store printable version in a hidden div for printing
    if (!document.getElementById('printContent')) {
      const printDiv = document.createElement('div');
      printDiv.id = 'printContent';
      printDiv.className = 'print-only';
      document.body.appendChild(printDiv);
    }
    document.getElementById('printContent').innerHTML = printableVersion;
    
    // Add events for print button
    document.getElementById('printBtn').addEventListener('click', function() {
      // Add ripple animation
      this.classList.add('active');
      
      // Create a dedicated print window
      const printWindow = window.open('', '_blank');
      
      // Create a complete, standalone document for printing
      const printDoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Nap Schedule for Print</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              padding: 20px; 
              max-width: 800px; 
              margin: 0 auto; 
            }
            .print-header { 
              text-align: center; 
              margin-bottom: 30px; 
            }
            .print-header h4 { 
              font-size: 24px; 
              margin-bottom: 8px; 
            }
            .timeline-list { 
              list-style: none; 
              padding-left: 30px; 
              border-left: 3px solid #e2e8f0; 
              margin: 20px 0; 
            }
            .timeline-list li { 
              position: relative; 
              padding: 10px 10px 10px 20px; 
              margin-bottom: 15px; 
            }
            .timeline-list li::before { 
              content: ''; 
              position: absolute; 
              left: -16px; 
              top: 12px; 
              width: 14px; 
              height: 14px; 
              border-radius: 50%; 
              background-color: #6366f1; 
            }
            .timeline-list li.event.wake-up::before { 
              background-color: #22c55e; 
            }
            .timeline-list li.event.nap::before { 
              background-color: #6366f1; 
            }
            .timeline-list li.event.bedtime::before { 
              background-color: #334155; 
            }
            @media print {
              body { padding: 0; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h4>Nap Schedule for ${getAgeRangeText(age)} Toddler</h4>
            <p>Wake-up time: ${formatTime(wakeMinutes)} | Bedtime: ${formatTime(bedMinutes)}</p>
          </div>
          <ul class="timeline-list">
            ${schedule.join('')}
          </ul>
          ${warning ? `<div style="margin-top: 20px; padding: 10px; border-left: 4px solid #FF9800; background-color: #FFF4E5;">${warning}</div>` : ''}
        </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(printDoc);
      printWindow.document.close();
      
      setTimeout(() => {
        this.classList.remove('active');
        setTimeout(() => {
          // Print the window
          printWindow.print();
          
          // Close window after printing (browser dependent)
          printWindow.onafterprint = function() {
            printWindow.close();
          };
        }, 300);
      }, 200);
    });
    
    // Handle copy link button
    const copyBtn = document.getElementById('copyBtn');
    const copyFeedback = document.getElementById('copyFeedback');
    
    copyBtn.addEventListener('click', function() {
      // Add ripple animation
      this.classList.add('active');
      
      // Copy the URL to clipboard
      navigator.clipboard.writeText(shareableUrl).then(() => {
        // Show feedback
        copyFeedback.classList.add('show');
        
        // Hide feedback after 2 seconds
        setTimeout(() => {
          copyFeedback.classList.remove('show');
        }, 2000);
        
        // Remove active class
        setTimeout(() => {
          this.classList.remove('active');
        }, 200);
      }).catch(err => {
        console.error('Could not copy text: ', err);
        alert('Failed to copy link to clipboard. Please copy it manually: ' + shareableUrl);
        setTimeout(() => {
          this.classList.remove('active');
        }, 200);
      });
    });
    
    // Handle share button
    const shareBtn = document.getElementById('shareBtn');
    
    // Use Web Share API if available
    if (navigator.share) {
      shareBtn.addEventListener('click', async () => {
        // Add ripple animation
        shareBtn.classList.add('active');
        
        try {
          // Create a share title and text that summarizes the schedule
          const shareTitle = `Nap Schedule for ${getAgeRangeText(age)} Toddler`;
          const wakeTimeStr = formatTime(wakeMinutes);
          const bedTimeStr = formatTime(bedMinutes);
          
          let shareText = `Nap Schedule for ${getAgeRangeText(age)} Toddler\n`;
          shareText += `Wake-up: ${wakeTimeStr} | Bedtime: ${bedTimeStr}\n\n`;
          
          // Add each nap time to the text
          for (let i = 0; i < naps; i++) {
            const napStart = wakeMinutes + (i+1) * adjustedWakeWindow + i * napLength;
            const napEnd = napStart + napLength;
            shareText += `Nap ${i+1}: ${formatTime(napStart)} – ${formatTime(napEnd)}\n`;
          }
          
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareableUrl
          });
        } catch (err) {
          console.error('Share failed:', err);
        } finally {
          setTimeout(() => {
            shareBtn.classList.remove('active');
          }, 200);
        }
      });
    } else {
      // If Web Share API is not available, create a fallback
      shareBtn.addEventListener('click', function() {
        // Add ripple animation
        this.classList.add('active');
        setTimeout(() => {
          this.classList.remove('active');
        }, 200);
        
        // Create a popup with the shareable URL
        const shareableUrl = generateShareableUrl({
          age: age,
          wakeTime: wakeTime,
          bedTime: bedTime,
          napCount: naps,
          napLength: napLength
        });
        
        // Create a fallback sharing UI
        const shareableLink = shareableUrl;
        
        // Create a temporary input field
        const tempInput = document.createElement('input');
        tempInput.value = shareableLink;
        document.body.appendChild(tempInput);
        tempInput.select();
        
        try {
          // Copy the link to clipboard
          document.execCommand('copy');
          copyFeedback.classList.add('show');
          setTimeout(() => {
            copyFeedback.classList.remove('show');
          }, 2000);
        } catch (err) {
          console.error('Could not copy text: ', err);
          alert('Copy this link to share: ' + shareableLink);
        }
        
        // Remove the temporary input
        document.body.removeChild(tempInput);
      });
    }
    output.classList.remove('d-none');
  });
});
