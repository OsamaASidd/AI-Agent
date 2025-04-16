/**
 * Utility functions for frontend chart operations
 * This provides additional functionality for handling chart data
 * and interaction within the browser
 */

// Chart utility object
const ChartUtils = {
    
    /**
     * Format numbers for display (adds commas, limits decimal places)
     * @param {number} value - The number to format
     * @param {number} decimals - Number of decimal places (default: 0)
     * @returns {string} Formatted number
     */
    formatNumber: function(value, decimals = 0) {
        if (value === null || value === undefined || isNaN(value)) {
            return '-';
        }
        return parseFloat(value).toLocaleString('en-US', { 
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },
    
    /**
     * Format currency values
     * @param {number} value - The value to format as currency
     * @param {string} currencySymbol - Currency symbol to use (default: $)
     * @returns {string} Formatted currency string
     */
    formatCurrency: function(value, currencySymbol = '$') {
        if (value === null || value === undefined || isNaN(value)) {
            return '-';
        }
        return currencySymbol + parseFloat(value).toLocaleString('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },
    
    /**
     * Format date for display
     * @param {string} dateString - Date string to format
     * @param {string} format - Output format (short, medium, long)
     * @returns {string} Formatted date
     */
    formatDate: function(dateString, format = 'medium') {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const options = {
            short: { month: 'numeric', day: 'numeric', year: 'numeric' },
            medium: { month: 'short', day: 'numeric', year: 'numeric' },
            long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
        };
        
        return date.toLocaleDateString('en-US', options[format] || options.medium);
    },
    
    /**
     * Save chart as image
     * @param {HTMLElement} chartElement - The chart image element
     * @param {string} filename - Filename for download
     */
    saveChartAsImage: function(chartElement, filename = 'chart') {
        if (!chartElement || !chartElement.src) {
            console.error('Invalid chart element');
            return;
        }
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = chartElement.src;
        link.download = `${filename}.png`;
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    
    /**
     * Export chart data as CSV
     * @param {Array} data - Array of data objects
     * @param {string} filename - Filename for download
     */
    exportDataAsCsv: function(data, filename = 'chart-data') {
        if (!Array.isArray(data) || data.length === 0) {
            console.error('Invalid data for CSV export');
            return;
        }
        
        // Get headers from first object
        const headers = Object.keys(data[0]);
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        
        // Add rows
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                // Handle strings with commas by wrapping in quotes
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value;
            });
            csvContent += values.join(',') + '\n';
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.csv`);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    
    /**
     * Add chart download functionality to the UI
     * @param {string} chartId - ID of the chart container element
     * @param {Array} data - Raw data for CSV export
     */
    addDownloadButtons: function(chartContainer, data) {
        if (!chartContainer) return;
        
        // Find the chart image within the container
        const chartImage = chartContainer.querySelector('img');
        if (!chartImage) return;
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'chart-actions';
        
        // Add PNG download button
        const pngButton = document.createElement('button');
        pngButton.className = 'chart-action-btn';
        pngButton.innerHTML = '<i class="fas fa-file-image"></i> Save PNG';
        pngButton.addEventListener('click', () => {
            this.saveChartAsImage(chartImage, 'chart-export');
        });
        
        // Add CSV download button if data available
        const csvButton = document.createElement('button');
        csvButton.className = 'chart-action-btn';
        csvButton.innerHTML = '<i class="fas fa-file-csv"></i> Download Data';
        csvButton.addEventListener('click', () => {
            this.exportDataAsCsv(data, 'chart-data');
        });
        
        // Add buttons to container
        buttonContainer.appendChild(pngButton);
        if (data && data.length > 0) {
            buttonContainer.appendChild(csvButton);
        }
        
        // Add container after the chart
        chartContainer.appendChild(buttonContainer);
    },
    
    /**
     * Generate a simple HTML table from data
     * @param {Array} data - Array of data objects
     * @returns {string} HTML table
     */
    generateDataTable: function(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return '<p>No data available</p>';
        }
        
        const headers = Object.keys(data[0]);
        
        let tableHtml = '<div class="data-table-container"><table class="data-table">';
        
        // Generate header row
        tableHtml += '<thead><tr>';
        headers.forEach(header => {
            tableHtml += `<th>${header}</th>`;
        });
        tableHtml += '</tr></thead>';
        
        // Generate data rows
        tableHtml += '<tbody>';
        data.forEach(row => {
            tableHtml += '<tr>';
            headers.forEach(header => {
                let cellValue = row[header];
                
                // Format numeric values
                if (typeof cellValue === 'number') {
                    if (header.toLowerCase().includes('price') || 
                        header.toLowerCase().includes('cost') || 
                        header.toLowerCase().includes('amount') || 
                        header.toLowerCase().includes('total')) {
                        cellValue = this.formatCurrency(cellValue);
                    } else {
                        cellValue = this.formatNumber(cellValue);
                    }
                }
                
                // Format date values
                if (header.toLowerCase().includes('date') || header.toLowerCase().includes('time')) {
                    const dateValue = new Date(cellValue);
                    if (!isNaN(dateValue.getTime())) {
                        cellValue = this.formatDate(cellValue);
                    }
                }
                
                tableHtml += `<td>${cellValue}</td>`;
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table></div>';
        
        return tableHtml;
    },
    
    /**
     * Add a toggle button to show/hide the data table
     * @param {HTMLElement} chartContainer - Container element
     * @param {Array} data - Data array for table generation
     */
    addDataTableToggle: function(chartContainer, data) {
        if (!chartContainer || !data || data.length === 0) return;
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'data-table-toggle';
        toggleButton.textContent = 'Show Data Table';
        
        // Create container for the table (initially hidden)
        const tableContainer = document.createElement('div');
        tableContainer.className = 'data-table-wrapper';
        tableContainer.style.display = 'none';
        
        // Generate the table HTML
        tableContainer.innerHTML = this.generateDataTable(data);
        
        // Add toggle functionality
        toggleButton.addEventListener('click', () => {
            const isHidden = tableContainer.style.display === 'none';
            tableContainer.style.display = isHidden ? 'block' : 'none';
            toggleButton.textContent = isHidden ? 'Hide Data Table' : 'Show Data Table';
        });
        
        // Append elements to the chart container
        chartContainer.appendChild(toggleButton);
        chartContainer.appendChild(tableContainer);
    }
};

// Export the ChartUtils object for use in other files
window.ChartUtils = ChartUtils;