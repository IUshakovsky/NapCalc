/*!
 * Bootstrap v5.3.2 (Custom Build for TinyRests)
 * Only includes Dropdown component functionality
 * Includes specific TinyRests form validation
 */
(function() {
  'use strict';

  // Dropdown component minimal implementation
  const initDropdowns = () => {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dropdown = this.closest('.dropdown');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        // Close any other open dropdowns first
        document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
          if (openMenu !== menu) {
            openMenu.classList.remove('show');
          }
        });
        
        // Toggle current dropdown
        menu.classList.toggle('show');
      });
      
      // Handle dropdown item selection
      const dropdownItems = toggle.nextElementSibling.querySelectorAll('.dropdown-item');
      dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
          e.preventDefault();
          
          const dropdown = this.closest('.dropdown');
          const menu = dropdown.querySelector('.dropdown-menu');
          const toggle = dropdown.querySelector('.dropdown-toggle');
          const selectedText = toggle.querySelector('span');
          const hiddenInput = dropdown.querySelector('input[type="hidden"]');
          
          // Update selected text and hidden input value
          if (selectedText) {
            selectedText.textContent = this.textContent;
          }
          
          if (hiddenInput) {
            hiddenInput.value = this.getAttribute('data-value');
          }
          
          // Close the dropdown
          menu.classList.remove('show');
        });
      });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
          menu.classList.remove('show');
        });
      }
    });
  };
  
  // Age dropdown specific implementation for TinyRests
  const initTinyRestsDropdown = () => {
    const ageDropdown = document.querySelector('.age-dropdown');
    
    if (ageDropdown) {
      const dropdownButton = ageDropdown.querySelector('.dropdown-toggle');
      const selectedText = document.getElementById('selectedAgeText');
      const hiddenInput = document.getElementById('age');
      
      // Set initial value if present (for form edits)
      if (hiddenInput && hiddenInput.value) {
        const dropdownItems = ageDropdown.querySelectorAll('.dropdown-item');
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
      
      if (form && hiddenInput) {
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
  };

  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    initDropdowns();
    initTinyRestsDropdown();
  });
})();
