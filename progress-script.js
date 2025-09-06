// Coral Progress & Analytics App - JavaScript Functionality
class CoralProgressApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('coralTodos')) || [];
        this.tasks = JSON.parse(localStorage.getItem('coralTasks')) || [];
        this.dailyStats = JSON.parse(localStorage.getItem('dailyStats')) || {
            co2Saved: 0,
            dayStreak: 0,
            dailyGoal: 100,
            completedTasks: 0
        };
        this.progressData = JSON.parse(localStorage.getItem('coralProgressData')) || this.initializeProgressData();
        this.currentPeriod = 'week';
        this.currentFilter = 'all';
        this.charts = {};
        
        this.init();
    }

    initializeProgressData() {
        const data = {
            weeklyGoal: 500,
            totalCo2Saved: 0,
            totalTasksCompleted: 0,
            longestStreak: 0,
            achievements: [],
            activity: [],
            categoryStats: {
                'Energy': { completed: 0, total: 0, co2Saved: 0 },
                'Waste': { completed: 0, total: 0, co2Saved: 0 },
                'Transport': { completed: 0, total: 0, co2Saved: 0 },
                'Water': { completed: 0, total: 0, co2Saved: 0 },
                'Food': { completed: 0, total: 0, co2Saved: 0 },
                'Nature': { completed: 0, total: 0, co2Saved: 0 },
                'Community': { completed: 0, total: 0, co2Saved: 0 }
            },
            weeklyData: this.generateWeeklyData(),
            monthlyData: this.generateMonthlyData(),
            yearlyData: this.generateYearlyData()
        };
        localStorage.setItem('coralProgressData', JSON.stringify(data));
        return data;
    }

    generateWeeklyData() {
        const data = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toISOString().split('T')[0],
                co2Saved: Math.random() * 5,
                tasksCompleted: Math.floor(Math.random() * 8)
            });
        }
        return data;
    }

    generateMonthlyData() {
        const data = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toISOString().split('T')[0],
                co2Saved: Math.random() * 10,
                tasksCompleted: Math.floor(Math.random() * 15)
            });
        }
        return data;
    }

    generateYearlyData() {
        const data = [];
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - i);
            data.push({
                date: date.toISOString().substring(0, 7),
                co2Saved: Math.random() * 50,
                tasksCompleted: Math.floor(Math.random() * 100)
            });
        }
        return data;
    }

    init() {
        this.setupEventListeners();
        this.updateOverviewCards();
        this.renderCategories();
        this.renderActivity();
        this.renderAchievements();
        this.renderTasks();
        this.initializeCharts();
        this.updateProgressData();
    }

    setupEventListeners() {
        // Chart period buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveChartBtn(e.target);
                this.currentPeriod = e.target.dataset.period;
                this.updateCharts();
            });
        });

        // Task filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilterBtn(e.target);
                this.currentFilter = e.target.dataset.filter;
                this.renderTasks();
            });
        });

        // Add task modal
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showAddTaskModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideAddTaskModal();
        });

        document.getElementById('cancelTask').addEventListener('click', () => {
            this.hideAddTaskModal();
        });

        document.getElementById('saveTask').addEventListener('click', () => {
            this.saveNewTask();
        });

        // View all activity
        document.getElementById('viewAllActivity').addEventListener('click', () => {
            this.showNotification('Full activity history coming soon! 📊');
        });

        // Hamburger menu
        document.querySelector('.hamburger-menu').addEventListener('click', () => {
            this.showNotification('Menu coming soon! 🍔');
        });

        // User profile
        document.querySelector('.user-profile').addEventListener('click', () => {
            this.showNotification('Profile coming soon! 👤');
        });

        // Close modal on overlay click
        document.getElementById('addTaskModal').addEventListener('click', (e) => {
            if (e.target.id === 'addTaskModal') {
                this.hideAddTaskModal();
            }
        });
    }

    updateOverviewCards() {
        // Calculate totals from all data sources
        const totalCo2 = this.progressData.totalCo2Saved + this.dailyStats.co2Saved;
        const totalTasks = this.progressData.totalTasksCompleted + this.dailyStats.completedTasks;
        const currentStreak = this.dailyStats.dayStreak;
        const weeklyProgress = Math.min((totalTasks / this.progressData.weeklyGoal) * 100, 100);

        document.getElementById('totalCo2Saved').textContent = `${totalCo2.toFixed(1)}kg`;
        document.getElementById('totalTasksCompleted').textContent = totalTasks.toString();
        document.getElementById('currentStreak').textContent = currentStreak.toString();
        document.getElementById('weeklyProgress').textContent = `${Math.round(weeklyProgress)}%`;
    }

    renderCategories() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        categoriesGrid.innerHTML = '';

        Object.keys(this.progressData.categoryStats).forEach(category => {
            const stats = this.progressData.categoryStats[category];
            const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
            
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.innerHTML = `
                <div class="category-header">
                    <div class="category-icon">
                        <i class="fas ${this.getCategoryIcon(category)}"></i>
                    </div>
                    <div class="category-name">${category}</div>
                </div>
                <div class="category-stats">
                    <div class="stat-item">
                        <div class="stat-value">${stats.completed}/${stats.total}</div>
                        <div class="stat-label">Tasks</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.co2Saved.toFixed(1)}kg</div>
                        <div class="stat-label">CO₂ Saved</div>
                    </div>
                </div>
                <div class="category-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${completionRate}%"></div>
                    </div>
                    <div class="progress-text">${Math.round(completionRate)}% Complete</div>
                </div>
            `;
            categoriesGrid.appendChild(categoryCard);
        });
    }

    getCategoryIcon(category) {
        const icons = {
            'Energy': 'fa-bolt',
            'Waste': 'fa-recycle',
            'Transport': 'fa-car',
            'Water': 'fa-tint',
            'Food': 'fa-apple-alt',
            'Nature': 'fa-tree',
            'Community': 'fa-users'
        };
        return icons[category] || 'fa-circle';
    }

    renderActivity() {
        const activityList = document.getElementById('activityList');
        activityList.innerHTML = '';

        // Generate recent activity from todos and tasks
        const recentActivity = this.generateRecentActivity();
        
        recentActivity.slice(0, 5).forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
                <div class="activity-value">${activity.value}</div>
            `;
            activityList.appendChild(activityItem);
        });
    }

    generateRecentActivity() {
        const activities = [];
        const now = new Date();

        // Add activities from completed todos
        this.todos.filter(todo => todo.status === 'completed').forEach(todo => {
            activities.push({
                icon: 'fa-check-circle',
                text: `Completed: ${todo.title}`,
                time: this.getTimeAgo(now),
                value: `+${todo.points}pts`
            });
        });

        // Add activities from completed tasks
        this.tasks.filter(task => task.completed).forEach(task => {
            activities.push({
                icon: 'fa-leaf',
                text: `Saved CO₂: ${task.title}`,
                time: this.getTimeAgo(now),
                value: `+${task.co2Saved}kg`
            });
        });

        return activities.sort((a, b) => Math.random() - 0.5);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }

    renderAchievements() {
        const achievementsGrid = document.getElementById('achievementsGrid');
        achievementsGrid.innerHTML = '';

        const achievements = this.getAchievements();
        
        achievements.forEach(achievement => {
            const achievementCard = document.createElement('div');
            achievementCard.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            achievementCard.innerHTML = `
                <div class="achievement-icon">
                    <i class="fas ${achievement.icon}"></i>
                </div>
                <div class="achievement-content">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${achievement.progress}%"></div>
                        </div>
                        <div class="progress-text">${achievement.progress}%</div>
                    </div>
                </div>
            `;
            achievementsGrid.appendChild(achievementCard);
        });
    }

    getAchievements() {
        const totalCo2 = this.progressData.totalCo2Saved + this.dailyStats.co2Saved;
        const totalTasks = this.progressData.totalTasksCompleted + this.dailyStats.completedTasks;
        const streak = this.dailyStats.dayStreak;

        return [
            {
                title: 'First Steps',
                description: 'Complete your first task',
                icon: 'fa-baby',
                unlocked: totalTasks >= 1,
                progress: Math.min((totalTasks / 1) * 100, 100)
            },
            {
                title: 'CO₂ Saver',
                description: 'Save 10kg of CO₂',
                icon: 'fa-leaf',
                unlocked: totalCo2 >= 10,
                progress: Math.min((totalCo2 / 10) * 100, 100)
            },
            {
                title: 'Task Master',
                description: 'Complete 50 tasks',
                icon: 'fa-trophy',
                unlocked: totalTasks >= 50,
                progress: Math.min((totalTasks / 50) * 100, 100)
            },
            {
                title: 'Streak Keeper',
                description: 'Maintain a 7-day streak',
                icon: 'fa-fire',
                unlocked: streak >= 7,
                progress: Math.min((streak / 7) * 100, 100)
            },
            {
                title: 'Eco Warrior',
                description: 'Save 100kg of CO₂',
                icon: 'fa-shield-alt',
                unlocked: totalCo2 >= 100,
                progress: Math.min((totalCo2 / 100) * 100, 100)
            },
            {
                title: 'Consistency King',
                description: 'Maintain a 30-day streak',
                icon: 'fa-crown',
                unlocked: streak >= 30,
                progress: Math.min((streak / 30) * 100, 100)
            }
        ];
    }

    renderTasks() {
        const tasksList = document.getElementById('progressTasksList');
        tasksList.innerHTML = '';

        let filteredTodos = this.todos;
        
        if (this.currentFilter !== 'all') {
            filteredTodos = this.todos.filter(todo => todo.status === this.currentFilter);
        }

        filteredTodos.forEach(todo => {
            const taskElement = this.createTaskElement(todo);
            tasksList.appendChild(taskElement);
        });
    }

    createTaskElement(todo) {
        const div = document.createElement('div');
        div.className = `task-item ${todo.status}`;
        
        const statusIcon = this.getStatusIcon(todo.status);
        const priorityIcon = todo.priority === 'high' ? '<i class="fas fa-exclamation priority-icon"></i>' : '';
        
        div.innerHTML = `
            <div class="task-status-icon">
                ${statusIcon}
            </div>
            <div class="task-content">
                <div class="task-title">${todo.title}</div>
                <div class="task-description">${todo.description}</div>
                <div class="task-meta">
                    <span class="task-category">${todo.category}</span>
                    <span class="task-points">${todo.points} pts</span>
                    <span class="task-carbon">${todo.carbonSaving}kg CO₂</span>
                </div>
            </div>
            <div class="task-actions">
                ${priorityIcon}
                <div class="task-buttons">
                    <button class="status-btn" data-todo-id="${todo.id}" data-action="cycle-status">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="delete-btn" data-todo-id="${todo.id}" data-action="delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        const statusBtn = div.querySelector('[data-action="cycle-status"]');
        const deleteBtn = div.querySelector('[data-action="delete"]');

        statusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.cycleTodoStatus(todo.id);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTodo(todo.id);
        });

        return div;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'unfinished':
                return '<i class="fas fa-times"></i>';
            case 'in-progress':
                return '<i class="fas fa-sync-alt"></i>';
            case 'waiting':
                return '<i class="fas fa-clock"></i>';
            case 'completed':
                return '<i class="fas fa-check"></i>';
            default:
                return '<i class="fas fa-circle"></i>';
        }
    }

    cycleTodoStatus(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            const statusCycle = ['unfinished', 'in-progress', 'waiting', 'completed'];
            const currentIndex = statusCycle.indexOf(todo.status);
            const nextIndex = (currentIndex + 1) % statusCycle.length;
            todo.status = statusCycle[nextIndex];
            
            this.saveTodos();
            this.updateProgressData();
            this.renderTasks();
            this.updateOverviewCards();
            this.renderCategories();
            this.renderAchievements();
            this.renderActivity();
            
            const statusMessages = {
                'unfinished': 'Task marked as unfinished',
                'in-progress': 'Task in progress! Keep going! 💪',
                'waiting': 'Task waiting for approval',
                'completed': 'Great job! Task completed! 🎉'
            };
            
            this.showNotification(statusMessages[todo.status]);
        }
    }

    deleteTodo(todoId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.todos = this.todos.filter(t => t.id !== todoId);
            this.saveTodos();
            this.updateProgressData();
            this.renderTasks();
            this.updateOverviewCards();
            this.renderCategories();
            this.renderAchievements();
            this.renderActivity();
            this.showNotification('Task deleted! 🗑️');
        }
    }

    showAddTaskModal() {
        document.getElementById('addTaskModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideAddTaskModal() {
        document.getElementById('addTaskModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetAddTaskForm();
    }

    resetAddTaskForm() {
        document.getElementById('addTaskForm').reset();
    }

    saveNewTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const category = document.getElementById('taskCategory').value;
        const points = parseInt(document.getElementById('taskPoints').value);
        const carbonSaving = parseFloat(document.getElementById('taskCarbonSaving').value);
        const priority = document.getElementById('taskPriority').value;

        if (!title) {
            this.showNotification('Please enter a task title! 📝');
            return;
        }

        const newTodo = {
            id: Date.now(),
            title: title,
            description: description || 'New task',
            category: category,
            points: points,
            carbonSaving: carbonSaving,
            status: 'unfinished',
            priority: priority,
            isSubtask: false,
            parentId: null
        };

        this.todos.unshift(newTodo);
        this.saveTodos();
        this.updateProgressData();
        this.renderTasks();
        this.updateOverviewCards();
        this.renderCategories();
        this.renderAchievements();
        this.renderActivity();
        this.hideAddTaskModal();
        this.showNotification('New task added! 📝');
    }

    initializeCharts() {
        this.updateCharts();
    }

    updateCharts() {
        this.updateCO2Chart();
        this.updateTasksChart();
    }

    updateCO2Chart() {
        const ctx = document.getElementById('co2Chart').getContext('2d');
        
        if (this.charts.co2) {
            this.charts.co2.destroy();
        }

        const data = this.getChartData();
        
        this.charts.co2 = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'CO₂ Saved (kg)',
                    data: data.co2Data,
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }

    updateTasksChart() {
        const ctx = document.getElementById('tasksChart').getContext('2d');
        
        if (this.charts.tasks) {
            this.charts.tasks.destroy();
        }

        const data = this.getChartData();
        
        this.charts.tasks = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Tasks Completed',
                    data: data.tasksData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: '#3b82f6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }

    getChartData() {
        let data;
        switch (this.currentPeriod) {
            case 'week':
                data = this.progressData.weeklyData;
                break;
            case 'month':
                data = this.progressData.monthlyData;
                break;
            case 'year':
                data = this.progressData.yearlyData;
                break;
            default:
                data = this.progressData.weeklyData;
        }

        return {
            labels: data.map(d => this.formatDateLabel(d.date, this.currentPeriod)),
            co2Data: data.map(d => d.co2Saved),
            tasksData: data.map(d => d.tasksCompleted)
        };
    }

    formatDateLabel(date, period) {
        const d = new Date(date);
        switch (period) {
            case 'week':
                return d.toLocaleDateString('en-US', { weekday: 'short' });
            case 'month':
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            case 'year':
                return d.toLocaleDateString('en-US', { month: 'short' });
            default:
                return d.toLocaleDateString('en-US', { weekday: 'short' });
        }
    }

    updateProgressData() {
        // Update category stats
        Object.keys(this.progressData.categoryStats).forEach(category => {
            this.progressData.categoryStats[category] = { completed: 0, total: 0, co2Saved: 0 };
        });

        this.todos.forEach(todo => {
            const category = todo.category || 'General';
            if (this.progressData.categoryStats[category]) {
                this.progressData.categoryStats[category].total++;
                if (todo.status === 'completed') {
                    this.progressData.categoryStats[category].completed++;
                    this.progressData.categoryStats[category].co2Saved += todo.carbonSaving;
                }
            }
        });

        // Update totals
        this.progressData.totalCo2Saved = Object.values(this.progressData.categoryStats)
            .reduce((sum, cat) => sum + cat.co2Saved, 0);
        this.progressData.totalTasksCompleted = Object.values(this.progressData.categoryStats)
            .reduce((sum, cat) => sum + cat.completed, 0);

        this.saveProgressData();
    }

    setActiveChartBtn(activeBtn) {
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    setActiveFilterBtn(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
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

    saveTodos() {
        localStorage.setItem('coralTodos', JSON.stringify(this.todos));
    }

    saveProgressData() {
        localStorage.setItem('coralProgressData', JSON.stringify(this.progressData));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.coralProgressApp = new CoralProgressApp();
});