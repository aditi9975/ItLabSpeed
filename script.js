// Mobile sidebar toggle
document.querySelector('.navbar-toggler').addEventListener('click', function() {
  document.querySelector('.sidebar').classList.toggle('show');
});

// Franchise data
const franchiseData = {
  labels: ['Franchise A', 'Franchise B', 'Franchise C', 'Franchise D'],
  bookingAmounts: [120000, 90000, 60000, 90000],
  commissions: [24000, 15000, 12000, 18000],
};

// Initialize chart
document.addEventListener('DOMContentLoaded', function() {

  const ctx = document.getElementById('franchiseChart').getContext('2d');

  const franchiseChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Franchise A', 'Franchise B', 'Franchise C', 'Franchise D'],
      datasets: [
        {
          label: 'Booking Amount',
          data: [120000, 90000, 60000, 90000],
          backgroundColor: '#3e59dfe3', // Blue
          borderRadius: 6
        },
        {
          label: 'Commission',
          data: [24000, 15000, 12000, 18000],
          backgroundColor: '#5ad160ff', // Green
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            color: '#6c757d',
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let value = context.parsed.y;
              return '₹' + value.toLocaleString();
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString();
            }
          },
          grid: {
            color: '#f0f0f0'
          }, title: {
            display: true,
            text: 'Amount (₹)',
            font: {
              size: 14,
              weight: 'bold'
            }
          }

        },
        x: {
          grid: {
            display: false
          },
           title: {
            display: true,
            text: 'Franchise Name',
            font: {
              size: 14,
              weight: 'bold'
            }}
        }
      }
    }
  });

  // Filter functionality
  const applyFilterBtn = document.querySelector('button.btn.w-100'); 
  const dateFilter = document.getElementById('dateRangeFilter');
  const franchiseFilter = document.getElementById('franchiseFilter');
  
  applyFilterBtn.addEventListener('click', function() {
    // Show loading state
    const originalText = applyFilterBtn.innerHTML;
    applyFilterBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Applying...';
    applyFilterBtn.disabled = true;
    
    setTimeout(() => {
      // Update chart based on filters
      const multiplier = getDateMultiplier(dateFilter.value);
      const franchise = franchiseFilter.value;
      
      // Fix value check for 'all'
      if (franchise.toLowerCase() === "all") {
        // Update all franchises
        franchiseChart.data.labels = franchiseData.labels;
        franchiseChart.data.datasets[0].data = franchiseData.bookingAmounts.map(v => v * multiplier);
        franchiseChart.data.datasets[1].data = franchiseData.commissions.map(v => v * multiplier);
        franchiseChart.data.growth = franchiseData.growth;
      } else {
        // Filter specific franchise
        const index = franchiseData.labels.indexOf(franchise);
        franchiseChart.data.labels = [franchise];
        franchiseChart.data.datasets[0].data = [franchiseData.bookingAmounts[index] * multiplier];
        franchiseChart.data.datasets[1].data = [franchiseData.commissions[index] * multiplier];
        franchiseChart.data.growth = [franchiseData.growth[index]];
      }
      
      franchiseChart.update();
      
      // Restore button state
      applyFilterBtn.innerHTML = originalText;
      applyFilterBtn.disabled = false;
    }, 800);
  });
  
  // Table row interaction
  document.querySelectorAll('.franchise-row').forEach(row => {
    row.addEventListener('click', function() {
      const franchiseName = this.children[0].textContent.trim();
      // Set filter and trigger update
      franchiseFilter.value = franchiseName;
      applyFilterBtn.click();
    });
  });
  
  // Helper function for date multiplier
  function getDateMultiplier(range) {
    const multipliers = {
      'Last 7 Days': 0.25,
      'Last Month': 1,
      'Last Quarter': 3
    };
    return multipliers[range] || 1;
  }
});