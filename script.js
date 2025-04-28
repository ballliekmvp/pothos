// script.js

// Define the ranks with their points and emojis
const ranks = [
    {name: 'Turtle🐢', points: 0, emoji: '🐢'},
    {name: 'Lizard🦎', points: 400, emoji: '🦎'},
    {name: 'Snake🐍', points: 800, emoji: '🐍'},
    {name: 'Alligator🐊', points: 6400, emoji: '🐊'},
    {name: 'T-Rex🦖', points: 40960, emoji: '🦖'},
    {name: 'Dragon🐲', points: 167526, emoji: '🐲'}
];

// Data storage with localStorage - initialize activities array
let activities = JSON.parse(localStorage.getItem('activities')) || [];

// Chart instances - initialized to null
let lineChartInstance = null;
let pieChartInstance = null;

/**
 * Logs an activity and updates the UI.
 * @param {string} type - The type of activity (e.g., 'car', 'bike').
 * @param {number} points - The points associated with the activity.
 */
function logActivity(type, points) {
    const activity = {
        type: type,
        points: points,
        timestamp: new Date().toISOString() // Store timestamp in ISO format
    };
    activities.push(activity); // Add the new activity
    localStorage.setItem('activities', JSON.stringify(activities)); // Save to localStorage
    updateVisualizations(); // Update charts and progress
    updateStatus(type, points); // Update the status message
}

/**
 * Updates all visualizations and progress indicators.
 */
function updateVisualizations() {
    updateLineChart();
    updatePieChart();
    updateProgress();
    updateRank();
}

/**
 * Updates the line chart showing daily points over time.
 */
function updateLineChart() {
    const ctx = document.getElementById('lineChart').getContext('2d');
    const dailyPoints = getDailyPoints(); // Get points aggregated by day

    // Destroy previous chart instance if it exists
    if (lineChartInstance) {
        lineChartInstance.destroy();
    }

    // Create a new line chart
    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(dailyPoints), // Dates as labels
            datasets: [{
                label: 'Daily Points',
                data: Object.values(dailyPoints), // Points as data
                borderColor: '#78c078', // Green line color
                backgroundColor: 'rgba(120, 192, 120, 0.2)', // Semi-transparent green area below line
                tension: 0.4, // Add some curve to the line
                fill: true, // Fill the area below the line
                pointBackgroundColor: '#a8e0a8', // Point color
                pointBorderColor: '#353b40' // Point border color
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow chart to fill container
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Points: ${context.parsed.y}`;
                        }
                    },
                    backgroundColor: '#444b52', // Darker tooltip background
                    titleColor: '#d4d4d4', // Light gray tooltip title
                    bodyColor: '#d4d4d4' // Light gray tooltip body
                },
                legend: {
                   labels: {
                        color: '#d4d4d4' // Light gray legend text
                   }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#b0b0b0' // Muted gray x-axis labels
                    },
                    grid: {
                        color: '#444b52' // Darker grid lines
                    }
                },
                y: {
                    ticks: {
                        color: '#b0b0b0' // Muted gray y-axis labels
                    },
                     grid: {
                        color: '#444b52' // Darker grid lines
                    }
                }
            }
        }
    });
}

/**
 * Updates the pie chart showing today's goal progress.
 */
function updatePieChart() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    const todayPoints = getTodayPoints(); // Get points for the current day

    // Destroy previous chart instance if it exists
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    // Create a new pie chart
    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Earned', 'Remaining'],
            datasets: [{
                data: [todayPoints, Math.max(0, 50 - todayPoints)], // Earned vs Remaining points for goal (50)
                backgroundColor: ['#4CAF50', '#5a626b'], // Green and dark gray colors
                borderColor: '#353b40' // Border color for segments
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow chart to fill container
             plugins: {
                tooltip: {
                     backgroundColor: '#444b52', // Darker tooltip background
                    titleColor: '#d4d4d4', // Light gray tooltip title
                    bodyColor: '#d4d4d4' // Light gray tooltip body
                },
                 legend: {
                   labels: {
                        color: '#d4d4d4' // Light gray legend text
                   }
                }
            }
        }
    });
}

/**
 * Updates the user's rank based on total accumulated points.
 */
function updateRank() {
    // Calculate total points from all activities
    const totalPoints = activities.reduce((sum, a) => sum + a.points, 0);
    let currentRank = ranks[0]; // Start with the lowest rank
    let nextRank = null; // Initialize next rank

    // Determine the current rank and the next rank
    for (let i = 0; i < ranks.length; i++) {
        if (totalPoints >= ranks[i].points) {
            currentRank = ranks[i]; // User has reached at least this rank
            if (i < ranks.length - 1) {
                nextRank = ranks[i + 1]; // The next rank to aim for
            } else {
                nextRank = ranks[i]; // User is at the highest rank
            }
        } else {
            break; // User hasn't reached this rank, so the previous one is current
        }
    }

    const rankElement = document.getElementById('rank');
    const progressBar = document.getElementById('progress-bar');
    const rankStatus = document.getElementById('rank-status');

    // Update the rank emoji
    if (rankElement) {
        rankElement.innerHTML = currentRank.emoji;
    }

    // Update the progress bar and status text
    if (currentRank === nextRank) { // At the highest rank
         if (progressBar) {
            progressBar.style.width = '100%'; // Progress is 100%
         }
         if (rankStatus) {
            rankStatus.textContent = `Congratulations! You've reached the highest rank: ${currentRank.name}!`;
         }
    } else { // Not at the highest rank, calculate progress towards the next rank
        const progress = ((totalPoints - currentRank.points) / (nextRank.points - currentRank.points)) * 100;
         if (progressBar) {
            progressBar.style.width = `${Math.min(100, progress)}%`; // Ensure progress doesn't exceed 100%
         }
         if (rankStatus) {
            rankStatus.textContent = `Current rank: ${currentRank.name} (${totalPoints} total points) - Next rank: ${nextRank.name} (${nextRank.points} points)`;
         }
    }
}

/**
 * Aggregates points earned per day.
 * @returns {object} An object where keys are dates (YYYY-MM-DD) and values are total points for that day.
 */
function getDailyPoints() {
    const points = {};
    activities.forEach(activity => {
        // Extract date part (YYYY-MM-DD) from ISO timestamp
        const date = new Date(activity.timestamp).toISOString().split('T')[0];
        points[date] = (points[date] || 0) + activity.points; // Add points to the corresponding date
    });
    return points;
}

/**
 * Calculates the total points earned for the current day.
 * @returns {number} The total points for today.
 */
function getTodayPoints() {
    const today = new Date().toISOString().split('T')[0]; // Get today's date string
    return activities
        .filter(a => new Date(a.timestamp).toISOString().split('T')[0] === today) // Filter activities for today
        .reduce((sum, a) => sum + a.points, 0); // Sum the points
}

/**
 * Updates the daily goal progress and weekly achievement display.
 */
function updateProgress() {
    const todayPoints = getTodayPoints(); // Get points for today
    document.getElementById('goal-progress').textContent = todayPoints; // Update daily goal display

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7); // Get the date 7 days ago

    const dailyPoints = getDailyPoints(); // Get daily points for all recorded days
    const recentDates = Object.keys(dailyPoints)
        .filter(dateString => new Date(dateString) >= lastWeek) // Filter dates within the last 7 days
        .sort(); // Sort dates chronologically

    let daysMetGoalCount = 0;
    // Count how many of the last 7 recorded days met the goal
    const lastSevenDatesWithData = recentDates.slice(-7); // Take up to the last 7 dates with data

    lastSevenDatesWithData.forEach(date => {
         if (dailyPoints[date] >= 50) { // Check if the goal (50 points) was met on this day
            daysMetGoalCount++;
         }
    });

    document.getElementById('goal-days').textContent = daysMetGoalCount; // Update weekly achievement display
}

/**
 * Updates the status message after an activity is logged.
 * @param {string} type - The type of activity logged.
 * @param {number} points - The points gained/lost.
 */
function updateStatus(type, points) {
    const status = document.getElementById('activity-status');
    status.textContent = `Logged: ${type} (${points > 0 ? '+' : ''}${points} points)`; // Display the logged activity and points
}

/**
 * Filters the displayed data based on the selected date range.
 */
function filterData() {
    const startDateInput = document.getElementById('start-date').value;
    const endDateInput = document.getElementById('end-date').value;

    // Check if both start and end dates are selected
    if (startDateInput && endDateInput) {
         // Retrieve original activities from localStorage before filtering
        const originalActivities = JSON.parse(localStorage.getItem('activities')) || [];

        // Filter activities based on the selected date range
        const filteredActivities = originalActivities.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            const startDate = new Date(startDateInput);
            const endDate = new Date(endDateInput);

             // Set time to start/end of the day for inclusive filtering
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            return activityDate >= startDate && activityDate <= endDate;
        });

        // Temporarily replace the global activities array with filtered data
        activities = filteredActivities;
        updateVisualizations(); // Update charts and summary using the filtered data
        activities = originalActivities; // Restore the original activities array
    } else {
        // If filters are cleared (or not set), update with all data
         activities = JSON.parse(localStorage.getItem('activities')) || []; // Load all activities
         updateVisualizations(); // Update charts and summary with all data
    }
}

// Event listener for when the window finishes loading
window.onload = function() {
    updateVisualizations(); // Initial update of all UI elements
};
