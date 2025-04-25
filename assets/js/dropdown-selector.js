// Dropdown selector functionality
document.addEventListener('DOMContentLoaded', function() {
  // Age dropdown functionality
  const ageDropdown = document.querySelector('.age-dropdown');
  
  if (ageDropdown) {
    const dropdownButton = ageDropdown.querySelector('.dropdown-toggle');
    const dropdownMenu = ageDropdown.querySelector('.dropdown-menu');
    const dropdownItems = ageDropdown.querySelectorAll('.dropdown-item');
    const selectedText = document.getElementById('selectedAgeText');
    const hiddenInput = document.getElementById('age');
    
    // Toggle dropdown on button click
    dropdownButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle aria-expanded attribute
      const isExpanded = dropdownButton.getAttribute('aria-expanded') === 'true';
      dropdownButton.setAttribute('aria-expanded', !isExpanded);
      
      // Toggle dropdown menu visibility
      dropdownMenu.classList.toggle('show');
    });
    
    // Handle item selection
    dropdownItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const value = this.getAttribute('data-value');
        const text = this.textContent;
        
        // Update the button text
        selectedText.textContent = text;
        
        // Update the hidden input value
        hiddenInput.value = value;
        
        // Trigger a change event on the hidden input
        const event = new Event('change', { bubbles: true });
        hiddenInput.dispatchEvent(event);
        
        // Add selected class to this item and remove from others
        dropdownItems.forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        
        // Close the dropdown
        dropdownButton.setAttribute('aria-expanded', 'false');
        dropdownMenu.classList.remove('show');
      });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!ageDropdown.contains(e.target)) {
        dropdownButton.setAttribute('aria-expanded', 'false');
        dropdownMenu.classList.remove('show');
      }
    });
    
    // Set initial value if present (for form edits)
    if (hiddenInput.value) {
      const initialItem = Array.from(dropdownItems).find(
        item => item.getAttribute('data-value') === hiddenInput.value
      );
      
      if (initialItem) {
        selectedText.textContent = initialItem.textContent;
        initialItem.classList.add('active');
      }
    }
    
    // Form validation - mark dropdown as invalid if no selection
    const form = document.getElementById('napForm');
    
    if (form) {
      form.addEventListener('submit', function(e) {
        if (!hiddenInput.value) {
          e.preventDefault();
          dropdownButton.classList.add('is-invalid');
        } else {
          dropdownButton.classList.remove('is-invalid');
        }
      });
    }
  }
});
