// Mobile sidebar toggle
document.querySelector('.navbar-toggler').addEventListener('click', function() {
  document.querySelector('.sidebar').classList.toggle('show');
});

// Fetch data and initialize everything
document.addEventListener('DOMContentLoaded', function() {
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      // --- Setup variables from data ---
      const franchiseNames = data.franchises.map(f => f.franchise_name);

      // Helper: Parse date in "DD/MM/YYYY"
      function parseDate(str) {
        const [d, m, y] = str.split('/').map(Number);
        return new Date(y, m - 1, d);
      }

      // Helper: Get months in range (inclusive)
      function getMonthsInRange(start, end) {
        const months = [];
        let d = new Date(start.getFullYear(), start.getMonth(), 1);
        // Fix: Only include months that exist in data.monthly_data
        const availableMonths = new Set(data.monthly_data.map(md => md.month));
        while (d <= end) {
          const ym = d.toISOString().slice(0, 7); // "YYYY-MM"
          if (availableMonths.has(ym)) {
            months.push(ym);
          }
          d.setMonth(d.getMonth() + 1);
        }
        return months;
      }

      // Helper: Aggregate data for a date range and franchise
      function aggregateData(dateRange, franchise) {
        // Parse dateRange string
        let [startStr, endStr] = dateRange.split(' - ');
        let start = parseDate(startStr);
        let end = parseDate(endStr);
        let months = getMonthsInRange(start, end);

        // Map franchise name to key in monthly_data
        function franchiseKey(name) {
          return name.toLowerCase().replace(/\s/g, '_');
        }

        let bookingAmounts = [];
        let commissions = [];
        let tests = [];
        let samples = [];

        if (franchise.toLowerCase() === "all") {
          // All franchises: sum for each franchise
          franchiseNames.forEach(name => {
            let key = franchiseKey(name);
            let booking = 0, commission = 0, test = 0, sample = 0;
            data.monthly_data.forEach(md => {
              if (months.includes(md.month) && md[key]) {
                booking += md[key].booking;
                commission += md[key].commission;
                test += md[key].tests;
                sample += md[key].samples;
              }
            });
            bookingAmounts.push(booking);
            commissions.push(commission);
            tests.push(test);
            samples.push(sample);
          });
          // If all values are zero (no data), show zeros for all franchises
          if (bookingAmounts.every(v => v === 0) && commissions.every(v => v === 0)) {
            // Optionally, you could show a message instead
            return {
              labels: [...franchiseNames],
              bookingAmounts: franchiseNames.map(() => 0),
              commissions: franchiseNames.map(() => 0),
              tests: franchiseNames.map(() => 0),
              samples: franchiseNames.map(() => 0)
            };
          }
          return {
            labels: [...franchiseNames],
            bookingAmounts,
            commissions,
            tests,
            samples
          };
        } else {
          // Single franchise
          let key = franchiseKey(franchise);
          let booking = 0, commission = 0, test = 0, sample = 0;
          data.monthly_data.forEach(md => {
            if (months.includes(md.month) && md[key]) {
              booking += md[key].booking;
              commission += md[key].commission;
              test += md[key].tests;
              sample += md[key].samples;
            }
          });
          // If all values are zero (no data), show zeros for the franchise
          return {
            labels: [franchise],
            bookingAmounts: [booking],
            commissions: [commission],
            tests: [test],
            samples: [sample]
          };
        }
      }

      // --- Update summary cards ---
      const totalBusiness = document.getElementById('totalBusiness');
      const totalCommission = document.getElementById('totalCommission');
      if (totalBusiness) {
        totalBusiness.textContent = '₹' + data.dashboard_summary.total_business.toLocaleString();
      }
      if (totalCommission) {
        totalCommission.textContent = '₹' + data.dashboard_summary.total_commission.toLocaleString();
      }

      // --- Populate franchise filter dropdown ---
      const franchiseFilter = document.getElementById('franchiseFilter');
      if (franchiseFilter) {
        // Clear existing options
        franchiseFilter.innerHTML = '';
        // Add 'All' option
        const allOption = document.createElement('option');
        allOption.value = 'All';
        allOption.textContent = 'All';
        franchiseFilter.appendChild(allOption);
        // Add options from data
        data.franchises.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f.franchise_name;
          opt.textContent = f.franchise_name;
          franchiseFilter.appendChild(opt);
        });
      }

      // --- Populate franchise table if exists ---
      const franchiseTableBody = document.querySelector('tbody.franchise-table-body');
      function renderTable(agg) {
        if (franchiseTableBody) {
          franchiseTableBody.innerHTML = '';
          for (let i = 0; i < agg.labels.length; i++) {
            const tr = document.createElement('tr');
            tr.classList.add('franchise-row');
            tr.innerHTML = `
              <td class="text-center">${agg.labels[i]}</td>
              <td class="text-center">₹${agg.bookingAmounts[i].toLocaleString()}</td>
              <td class="text-center">${agg.tests[i]}</td>
              <td class="text-center">${agg.samples[i]}</td>
              <td class="text-center">₹${agg.commissions[i].toLocaleString()}</td>
            `;
            franchiseTableBody.appendChild(tr);
          }
        }
      }

      // --- Initialize chart ---
      const ctx = document.getElementById('franchiseChart').getContext('2d');
      // Initial: use current filter values
      const dateFilter = document.getElementById('dateRangeFilter');
      let initialDateRange = dateFilter ? dateFilter.value : data.dashboard_summary.date_range;
      let initialFranchise = franchiseFilter ? franchiseFilter.value : "All";
      let agg = aggregateData(initialDateRange, initialFranchise);

      const franchiseChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: agg.labels,
          datasets: [
            {
              label: 'Booking Amount',
              data: agg.bookingAmounts,
              backgroundColor: '#3e59dfe3',
              borderRadius: 6
            },
            {
              label: 'Commission',
              data: agg.commissions,
              backgroundColor: '#5ad160ff',
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
                }
              }
            }
          }
        }
      });

      renderTable(agg);

      // --- Filter functionality ---
      const applyFilterBtn = document.querySelector('button.btn.w-100');
      applyFilterBtn.addEventListener('click', function() {
        const originalText = applyFilterBtn.innerHTML;
        applyFilterBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Applying...';
        applyFilterBtn.disabled = true;

        setTimeout(() => {
          const dateRange = dateFilter.value;
          const franchise = franchiseFilter.value;
          const agg = aggregateData(dateRange, franchise);

          franchiseChart.data.labels = agg.labels;
          franchiseChart.data.datasets[0].data = agg.bookingAmounts;
          franchiseChart.data.datasets[1].data = agg.commissions;
          franchiseChart.update();

          renderTable(agg);

          // Re-attach row click handlers
          document.querySelectorAll('.franchise-row').forEach(row => {
            row.addEventListener('click', function() {
              const franchiseName = this.children[0].textContent.trim();
              franchiseFilter.value = franchiseName;
              applyFilterBtn.click();
            });
          });

          applyFilterBtn.innerHTML = originalText;
          applyFilterBtn.disabled = false;
        }, 800);
      });

      // --- Table row interaction ---
      document.querySelectorAll('.franchise-row').forEach(row => {
        row.addEventListener('click', function() {
          const franchiseName = this.children[0].textContent.trim();
          franchiseFilter.value = franchiseName;
          applyFilterBtn.click();
        });
      });
    })
    .catch(err => {
      console.error('Failed to load data.json:', err);
      // Optionally show error to user
    });
});