// Coral Community Leaderboard App - JavaScript Functionality
class CoralCommunityApp {
    constructor() {
        this.leaderboardData = [];
        this.currentPeriod = 'week';
        this.currentLocation = 'San Francisco, CA';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLeaderboardData();
        this.renderLeaderboard();
    }

    setupEventListeners() {
        // Time filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTimeFilter(e.target.dataset.period);
            });
        });

        // Location selector
        document.querySelector('.location-selector').addEventListener('click', () => {
            this.showLocationModal();
        });

        // Hamburger menu
        document.querySelector('.hamburger-menu').addEventListener('click', () => {
            this.showNotification('Menu coming soon! 🍔');
        });

        // User profile
        document.querySelector('.user-profile').addEventListener('click', () => {
            this.showNotification('Profile coming soon! 👤');
        });
    }

    loadLeaderboardData() {
        // Simulate loading leaderboard data
        this.leaderboardData = [
            {
                id: 1,
                name: 'Sarah Chen',
                co2Saved: 12.4,
                tasksCompleted: 8,
                streak: 15,
                rank: 1,
                avatar: '👩‍💼',
                location: 'San Francisco, CA'
            },
            {
                id: 2,
                name: 'Mike Rodriguez',
                co2Saved: 11.8,
                tasksCompleted: 7,
                streak: 12,
                rank: 2,
                avatar: '👨‍💻',
                location: 'San Francisco, CA'
            },
            {
                id: 3,
                name: 'Emma Johnson',
                co2Saved: 10.2,
                tasksCompleted: 6,
                streak: 9,
                rank: 3,
                avatar: '👩‍🎨',
                location: 'San Francisco, CA'
            },
            {
                id: 4,
                name: 'Alex Kim',
                co2Saved: 9.7,
                tasksCompleted: 5,
                streak: 8,
                rank: 4,
                avatar: '👨‍🔬',
                location: 'San Francisco, CA'
            },
            {
                id: 5,
                name: 'Lisa Wang',
                co2Saved: 8.9,
                tasksCompleted: 4,
                streak: 6,
                rank: 5,
                avatar: '👩‍🏫',
                location: 'San Francisco, CA'
            },
            {
                id: 6,
                name: 'David Park',
                co2Saved: 8.1,
                tasksCompleted: 4,
                streak: 5,
                rank: 6,
                avatar: '👨‍🎓',
                location: 'San Francisco, CA'
            },
            {
                id: 7,
                name: 'You',
                co2Saved: 7.5,
                tasksCompleted: 3,
                streak: 4,
                rank: 7,
                avatar: '👤',
                location: 'San Francisco, CA',
                isCurrentUser: true
            }
        ];
    }

    renderLeaderboard() {
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = '';

        this.leaderboardData.forEach((member, index) => {
            const memberElement = this.createLeaderboardEntry(member, index);
            leaderboard.appendChild(memberElement);
        });
    }

    createLeaderboardEntry(member, index) {
        const div = document.createElement('div');
        div.className = `leaderboard-entry ${member.isCurrentUser ? 'current-user' : ''}`;
        
        const rankIcon = this.getRankIcon(member.rank);
        const medalClass = member.rank <= 3 ? 'medal' : '';
        
        div.innerHTML = `
            <div class="rank-section">
                <div class="rank ${medalClass}">${rankIcon}</div>
            </div>
            <div class="member-info">
                <div class="member-avatar">${member.avatar}</div>
                <div class="member-details">
                    <div class="member-name">${member.name}</div>
                    <div class="member-location">${member.location}</div>
                </div>
            </div>
            <div class="member-stats">
                <div class="stat-item">
                    <div class="stat-value">${member.co2Saved}kg</div>
                    <div class="stat-label">CO₂ Saved</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${member.tasksCompleted}</div>
                    <div class="stat-label">Tasks</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${member.streak}</div>
                    <div class="stat-label">Day Streak</div>
                </div>
            </div>
        `;

        return div;
    }

    getRankIcon(rank) {
        switch(rank) {
            case 1:
                return '<i class="fas fa-crown" style="color: #ffd700;"></i>';
            case 2:
                return '<i class="fas fa-medal" style="color: #c0c0c0;"></i>';
            case 3:
                return '<i class="fas fa-medal" style="color: #cd7f32;"></i>';
            default:
                return rank;
        }
    }

    setTimeFilter(period) {
        // Remove active class from all filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        this.currentPeriod = period;
        this.updateLeaderboardForPeriod();
    }

    updateLeaderboardForPeriod() {
        // Simulate different data for different time periods
        const multipliers = {
            'week': 1,
            'month': 4,
            'all': 12
        };

        const multiplier = multipliers[this.currentPeriod];
        
        this.leaderboardData.forEach(member => {
            member.co2Saved = (member.co2Saved * multiplier).toFixed(1);
            member.tasksCompleted = Math.floor(member.tasksCompleted * multiplier);
            member.streak = Math.floor(member.streak * multiplier);
        });

        this.renderLeaderboard();
    }

    showLocationModal() {
        const locations = [
            'San Francisco, CA',
            'New York, NY',
            'Los Angeles, CA',
            'Chicago, IL',
            'Austin, TX',
            'Seattle, WA',
            'Boston, MA',
            'Denver, CO'
        ];

        const modal = document.createElement('div');
        modal.className = 'location-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Select Your Location</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="location-list">
                    ${locations.map(location => `
                        <div class="location-item ${location === this.currentLocation ? 'active' : ''}" data-location="${location}">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${location}</span>
                            ${location === this.currentLocation ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelectorAll('.location-item').forEach(item => {
            item.addEventListener('click', () => {
                const newLocation = item.dataset.location;
                this.updateLocation(newLocation);
                document.body.removeChild(modal);
            });
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    updateLocation(newLocation) {
        this.currentLocation = newLocation;
        document.getElementById('currentLocation').textContent = newLocation;
        
        // Simulate loading new location data
        this.showNotification(`Loading leaderboard for ${newLocation}... 📍`);
        
        // In a real app, this would fetch data for the new location
        setTimeout(() => {
            this.renderLeaderboard();
            this.showNotification(`Leaderboard updated for ${newLocation}! 🎉`);
        }, 1000);
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #4ade80, #22c55e);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-weight: 600;
            z-index: 10000;
            animation: slideDown 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            max-width: 90%;
            text-align: center;
        `;
        notification.textContent = message;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-50px); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
                if (document.head.contains(style)) {
                    document.head.removeChild(style);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.coralCommunityApp = new CoralCommunityApp();
});
