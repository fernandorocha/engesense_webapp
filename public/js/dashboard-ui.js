/**
 * Dashboard UI module - handles dropdown interactions and UI state management
 */
class DashboardUI {
  constructor() {
    this.selectedBuckets = [];
    this.selectedMeasurements = [];
    this.allBuckets = [];
    this.allMeasurements = [];
  }

  // Display formatter for measurements: bucket:measurement -> bucket (measurement)
  measurementDisplayFormatter(measurement) {
    if (measurement.includes(':')) {
      const [bucket, m] = measurement.split(':', 2);
      return `${bucket} (${m})`;
    }
    return measurement;
  }

  // Custom dropdown functionality
  initializeDropdown(dropdownElement, onSelectionChange) {
    const trigger = dropdownElement.querySelector('.dropdown-trigger');
    const content = dropdownElement.querySelector('.dropdown-content');
    const textElement = trigger.querySelector('.dropdown-text');

    // Toggle dropdown
    trigger.addEventListener('click', () => {
      const isOpen = content.classList.contains('open');
      this.closeAllDropdowns();
      if (!isOpen) {
        content.classList.add('open');
        trigger.classList.add('open');
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdownElement.contains(e.target)) {
        content.classList.remove('open');
        trigger.classList.remove('open');
      }
    });

    // Handle checkbox changes
    content.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        onSelectionChange();
      }
    });

    return { trigger, content, textElement };
  }

  closeAllDropdowns() {
    document.querySelectorAll('.dropdown-content.open').forEach(content => {
      content.classList.remove('open');
    });
    document.querySelectorAll('.dropdown-trigger.open').forEach(trigger => {
      trigger.classList.remove('open');
    });
  }

  updateDropdownText(dropdownElement, items, selectedItems, displayFormatter = null) {
    const textElement = dropdownElement.querySelector('.dropdown-text');
    if (selectedItems.length === 0) {
      // Special case for measurements dropdown when no buckets are selected
      if (dropdownElement.id === 'measurementsDropdown' && this.allBuckets.length === 0) {
        textElement.textContent = 'No buckets available';
      } else if (dropdownElement.id === 'measurementsDropdown' && this.selectedBuckets.length === 0) {
        textElement.textContent = 'Select buckets first';
      } else {
        textElement.textContent = items.length === 0 ? 'No items available' : 'Select items...';
      }
    } else if (selectedItems.length === 1) {
      const displayText = displayFormatter ? displayFormatter(selectedItems[0]) : selectedItems[0];
      textElement.textContent = displayText;
    } else {
      textElement.textContent = `${selectedItems.length} items selected`;
    }
  }

  populateDropdown(dropdownElement, items, selectedItems, displayFormatter = null) {
    const content = dropdownElement.querySelector('.dropdown-content');
    content.innerHTML = '';

    if (items.length === 0) {
      content.innerHTML = '<div class="dropdown-item">No items available</div>';
      return;
    }

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'dropdown-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = item;
      checkbox.checked = selectedItems.includes(item);
      
      const label = document.createElement('label');
      const displayText = displayFormatter ? displayFormatter(item) : item;
      label.textContent = displayText;
      label.prepend(checkbox);
      
      itemDiv.appendChild(label);
      content.appendChild(itemDiv);
    });
  }

  getSelectedItems(dropdownElement) {
    const checkboxes = dropdownElement.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  showNoDataNotification() {
    const noDataDiv = document.getElementById('noDataMessage');
    if (noDataDiv) {
      noDataDiv.style.display = 'block';
    }
  }

  hideNoDataNotification() {
    const noDataDiv = document.getElementById('noDataMessage');
    if (noDataDiv) {
      noDataDiv.style.display = 'none';
    }
  }

  // Initialize time controls
  initializeTimeControls() {
    const btnRel = document.getElementById('btn-relative');
    const btnAbs = document.getElementById('btn-absolute');
    const relCtrls = document.getElementById('relative-controls');
    const rangeInput = document.getElementById('rangePicker');

    // Initialize relative time mode
    btnRel.onclick = () => {
      btnRel.classList.add('active');
      btnAbs.classList.remove('active');
      relCtrls.style.display = 'flex';
      document.getElementById('absolute-controls').style.display = 'none';
      this.updateTimeMode('relative');
    };

    // Initialize absolute time mode (if flatpickr is available)
    if (typeof flatpickr !== 'undefined') {
      btnAbs.onclick = () => {
        btnAbs.classList.add('active');
        btnRel.classList.remove('active');
        relCtrls.style.display = 'none';
        document.getElementById('absolute-controls').style.display = 'flex';
        this.updateTimeMode('absolute');
      };
    } else {
      // Disable calendar mode if flatpickr is not available
      btnAbs.disabled = true;
      btnAbs.style.opacity = '0.5';
      btnAbs.style.cursor = 'not-allowed';
    }

    return { btnRel, btnAbs, relCtrls, rangeInput };
  }

  updateTimeMode(mode) {
    // This can be overridden by the parent application
    console.log('Time mode changed to:', mode);
  }

  // Update form fields for export functionality
  updateExportFields(range, start, stop) {
    const csvRange = document.getElementById('csvRange');
    const csvStart = document.getElementById('csvStart');
    const csvStop = document.getElementById('csvStop');
    const excelRange = document.getElementById('excelRange');
    const excelStart = document.getElementById('excelStart');
    const excelStop = document.getElementById('excelStop');
    
    if (csvRange) csvRange.value = range;
    if (csvStart) csvStart.value = start;
    if (csvStop) csvStop.value = stop;
    if (excelRange) excelRange.value = range;
    if (excelStart) excelStart.value = start;
    if (excelStop) excelStop.value = stop;
  }

  updateCsvFields() {
    const csvBuckets = document.getElementById('csvBuckets');
    const csvMeasurements = document.getElementById('csvMeasurements');
    const excelBuckets = document.getElementById('excelBuckets');
    const excelMeasurements = document.getElementById('excelMeasurements');
    
    if (csvBuckets) csvBuckets.value = this.selectedBuckets.join(',');
    if (csvMeasurements) csvMeasurements.value = this.selectedMeasurements.join(',');
    if (excelBuckets) excelBuckets.value = this.selectedBuckets.join(',');
    if (excelMeasurements) excelMeasurements.value = this.selectedMeasurements.join(',');
  }
}

// Export for use in other modules
window.DashboardUI = DashboardUI;