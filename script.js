// Coral Environmental Impact App - JavaScript Functionality
class CoralImpactApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('coralTasks')) || [];
        this.dailyStats = JSON.parse(localStorage.getItem('dailyStats')) || {
            co2Saved: 0,
            dayStreak: 0,
            dailyGoal: 100,
            completedTasks: 0
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTasks();
        this.updateStats();
        this.updateProgressRing();
        this.startSimulation();
    }

    setupEventListeners() {
        // Bottom navigation - allow default link behavior
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // All navigation items are now proper links, let browser handle navigation
            });
        });

        // Hamburger menu
        document.querySelector('.hamburger-menu').addEventListener('click', () => {
            this.showNotification('Menu coming soon! 🍔');
        });

        // User profile
        document.querySelector('.user-profile').addEventListener('click', () => {
            this.showNotification('Profile coming soon! 👤');
        });

        // View all tasks
        document.querySelector('.view-all').addEventListener('click', (e) => {
            e.preventDefault();
            this.showNotification('All tasks view coming soon! 📋');
        });
    }

    loadTasks() {
        if (this.tasks.length === 0) {
            this.tasks = [
                {
                    id: 1,
                    title: 'Bike to Work',
                    description: 'Use bike instead of car',
                    co2Saved: 1.2,
                    icon: 'bike',
                    iconClass: 'fas fa-bicycle',
                    completed: true
                },
                {
                    id: 2,
                    title: 'Reusable Water Bottle',
                    description: 'Skip plastic bottles today',
                    co2Saved: 0.8,
                    icon: 'bottle',
                    iconClass: 'fas fa-wine-bottle',
                    completed: false
                },
                {
                    id: 3,
                    title: 'Turn Off Lights',
                    description: 'Save energy at home',
                    co2Saved: 0.4,
                    icon: 'lights',
                    iconClass: 'fas fa-lightbulb',
                    completed: false
                }
            ];
            this.saveTasks();
        }

        this.renderTasks();
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        tasksList.innerHTML = '';

        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            tasksList.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-card';
        div.innerHTML = `
            <div class="task-icon ${task.icon}">
                <i class="${task.iconClass}"></i>
            </div>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-description">${task.description}</div>
            </div>
            <div class="task-right">
                <div class="task-co2">+${task.co2Saved}kg CO₂</div>
                <div class="task-status ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `;

        // Add click event for task completion
        const statusElement = div.querySelector('.task-status');
        statusElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleTaskCompletion(task.id);
        });

        return div;
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            
            // Update daily stats
            if (task.completed) {
                this.dailyStats.co2Saved += task.co2Saved;
                this.dailyStats.completedTasks += 1;
            } else {
                this.dailyStats.co2Saved -= task.co2Saved;
                this.dailyStats.completedTasks -= 1;
            }

            this.saveTasks();
            this.saveStats();
            this.renderTasks();
            this.updateStats();
            this.updateProgressRing();
            
            const message = task.completed ? 
                `Great job! You saved ${task.co2Saved}kg CO₂! 🌱` : 
                'Task unchecked. Keep going! 💪';
            this.showNotification(message);
        }
    }

    updateStats() {
        // Update CO₂ saved display
        const co2Element = document.querySelector('.co2-saved .stat-value');
        if (co2Element) {
            co2Element.textContent = `${this.dailyStats.co2Saved.toFixed(1)}kg`;
        }

        // Update day streak
        const streakElement = document.querySelector('.day-streak .stat-value');
        if (streakElement) {
            streakElement.textContent = this.dailyStats.dayStreak.toString();
        }
    }

    updateProgressRing() {
        const progress = Math.min((this.dailyStats.completedTasks / this.tasks.length) * 100, 100);
        const circle = document.querySelector('.progress-ring-circle');
        const percentage = document.querySelector('.impact-percentage');
        
        if (circle) {
            const circumference = 2 * Math.PI * 90; // radius = 90
            const offset = circumference - (progress / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
        
        if (percentage) {
            percentage.textContent = `${Math.round(progress)}%`;
        }
    }

    startSimulation() {
        // Simulate daily reset at midnight
        setInterval(() => {
            const now = new Date();
            const lastReset = new Date(localStorage.getItem('lastReset') || 0);
            const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
            
            if (daysSinceReset > 0) {
                this.resetDailyStats();
                localStorage.setItem('lastReset', now.toISOString());
            }
        }, 60000); // Check every minute

        // Update day streak based on completed tasks
        this.updateDayStreak();
    }

    updateDayStreak() {
        const today = new Date().toDateString();
        const lastActiveDate = localStorage.getItem('lastActiveDate');
        
        if (lastActiveDate !== today) {
            if (lastActiveDate) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastActiveDate === yesterday.toDateString()) {
                    // Consecutive day
                    this.dailyStats.dayStreak += 1;
                } else {
                    // Streak broken
                    this.dailyStats.dayStreak = 1;
                }
            } else {
                this.dailyStats.dayStreak = 1;
            }
            
            localStorage.setItem('lastActiveDate', today);
            this.saveStats();
            this.updateStats();
        }
    }

    resetDailyStats() {
        this.dailyStats.co2Saved = 0;
        this.dailyStats.completedTasks = 0;
        
        // Reset all tasks to incomplete
        this.tasks.forEach(task => {
            task.completed = false;
        });
        
        this.saveTasks();
        this.saveStats();
        this.renderTasks();
        this.updateStats();
        this.updateProgressRing();
        
        this.showNotification('New day! Let\'s make a positive impact! 🌅');
    }


    showProgress() {
        const totalCo2 = this.dailyStats.co2Saved;
        const streak = this.dailyStats.dayStreak;
        const completed = this.dailyStats.completedTasks;
        const total = this.tasks.length;
        
        const message = `Progress Summary:\n\n` +
            `CO₂ Saved Today: ${totalCo2.toFixed(1)}kg\n` +
            `Day Streak: ${streak} days\n` +
            `Tasks Completed: ${completed}/${total}\n\n` +
            `Keep up the great work! 🌱`;
        
        alert(message);
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

    saveTasks() {
        localStorage.setItem('coralTasks', JSON.stringify(this.tasks));
    }

    saveStats() {
        localStorage.setItem('dailyStats', JSON.stringify(this.dailyStats));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.coralApp = new CoralImpactApp();
});

// Add some sample data if no data exists
if (!localStorage.getItem('coralTasks')) {
    const sampleTasks = [
        {
            id: 1,
            title: 'Bike to Work',
            description: 'Use bike instead of car',
            co2Saved: 1.2,
            icon: 'bike',
            iconClass: 'fas fa-bicycle',
            completed: true
        },
        {
            id: 2,
            title: 'Reusable Water Bottle',
            description: 'Skip plastic bottles today',
            co2Saved: 0.8,
            icon: 'bottle',
            iconClass: 'fas fa-wine-bottle',
            completed: false
        },
        {
            id: 3,
            title: 'Turn Off Lights',
            description: 'Save energy at home',
            co2Saved: 0.4,
            icon: 'lights',
            iconClass: 'fas fa-lightbulb',
            completed: false
        }
    ];
    localStorage.setItem('coralTasks', JSON.stringify(sampleTasks));
}

if (!localStorage.getItem('dailyStats')) {
    const sampleStats = {
        co2Saved: 1.2,
        dayStreak: 7,
        dailyGoal: 100,
        completedTasks: 1
    };
    localStorage.setItem('dailyStats', JSON.stringify(sampleStats));
}