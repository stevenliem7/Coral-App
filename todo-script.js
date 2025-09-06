// Coral Todo List App - JavaScript Functionality
class CoralTodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('coralTodos')) || [];
        this.tasksData = [];
        this.init();
    }

    init() {
        this.loadTasksData();
        this.setupEventListeners();
        this.renderTodos();
    }

    async loadTasksData() {
        try {
            const response = await fetch('tasksList.json');
            this.tasksData = await response.json();
            this.initializeTodosFromTasks();
        } catch (error) {
            console.error('Error loading tasks data:', error);
            this.initializeDefaultTodos();
        }
    }

    initializeTodosFromTasks() {
        // Always reload tasks from the JSON file to ensure we have the latest 5 tasks
        const limitedTasksData = this.tasksData.slice(0, 5);
        this.todos = limitedTasksData.map((task, index) => ({
            id: index + 1,
            title: task.title,
            description: task.description,
            category: task.category,
            points: task.points,
            carbonSaving: task.carbonSavingKg,
            status: 'unfinished', // unfinished, in-progress, waiting, completed
            priority: task.points > 100 ? 'high' : task.points > 50 ? 'medium' : 'low',
            isSubtask: false,
            parentId: null
        }));
        this.saveTodos();
    }

    initializeDefaultTodos() {
        if (this.todos.length === 0) {
            // Only show 5 default tasks
            this.todos = [
                {
                    id: 1,
                    title: 'Task Unfinished',
                    description: 'This is an unfinished task',
                    category: 'General',
                    points: 10,
                    carbonSaving: 0.1,
                    status: 'unfinished',
                    priority: 'low',
                    isSubtask: false,
                    parentId: null
                },
                {
                    id: 2,
                    title: 'Important/Priority Task',
                    description: 'This is an important task that needs attention',
                    category: 'Priority',
                    points: 50,
                    carbonSaving: 0.5,
                    status: 'unfinished',
                    priority: 'high',
                    isSubtask: false,
                    parentId: null
                },
                {
                    id: 3,
                    title: 'Task in Progress ...',
                    description: 'This task is currently being worked on',
                    category: 'Work',
                    points: 30,
                    carbonSaving: 0.3,
                    status: 'in-progress',
                    priority: 'medium',
                    isSubtask: false,
                    parentId: null
                },
                {
                    id: 4,
                    title: 'Waiting for Approval',
                    description: 'This task is completed but waiting for approval',
                    category: 'Review',
                    points: 25,
                    carbonSaving: 0.25,
                    status: 'waiting',
                    priority: 'medium',
                    isSubtask: false,
                    parentId: null
                },
                {
                    id: 5,
                    title: 'Task Done',
                    description: 'This task has been completed successfully',
                    category: 'Completed',
                    points: 20,
                    carbonSaving: 0.2,
                    status: 'completed',
                    priority: 'low',
                    isSubtask: false,
                    parentId: null
                }
            ];
            this.saveTodos();
        }
    }

    setupEventListeners() {
        // Add todo button
        document.getElementById('addTodoBtn').addEventListener('click', () => {
            this.addNewTodo();
        });

        // Add todo on Enter key
        document.getElementById('newTodoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewTodo();
            }
        });

        // Reset todos button

        // Hamburger menu
        document.querySelector('.hamburger-menu').addEventListener('click', () => {
            this.showNotification('Menu coming soon! 🍔');
        });

        // User profile
        document.querySelector('.user-profile').addEventListener('click', () => {
            this.showNotification('Profile coming soon! 👤');
        });
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = '';

        // Group todos by status for better organization
        const statusGroups = {
            'unfinished': this.todos.filter(todo => todo.status === 'unfinished'),
            'in-progress': this.todos.filter(todo => todo.status === 'in-progress'),
            'waiting': this.todos.filter(todo => todo.status === 'waiting'),
            'completed': this.todos.filter(todo => todo.status === 'completed')
        };

        // Render each status group
        Object.keys(statusGroups).forEach(status => {
            const todos = statusGroups[status];
            if (todos.length > 0) {
                todos.forEach(todo => {
                    const todoElement = this.createTodoElement(todo);
                    todoList.appendChild(todoElement);
                });
            }
        });
    }

    createTodoElement(todo) {
        const div = document.createElement('div');
        div.className = `todo-item ${todo.status} ${todo.isSubtask ? 'subtask' : ''}`;
        
        const statusIcon = this.getStatusIcon(todo.status);
        const priorityIcon = todo.priority === 'high' ? '<i class="fas fa-exclamation priority-icon"></i>' : '';
        
        div.innerHTML = `
            <div class="todo-status-icon">
                ${statusIcon}
            </div>
            <div class="todo-content">
                <div class="todo-title">${todo.title}</div>
                <div class="todo-description">${todo.description}</div>
                <div class="todo-meta">
                    <span class="todo-category">${todo.category}</span>
                    <span class="todo-points">${todo.points} pts</span>
                    <span class="todo-carbon">${todo.carbonSaving}kg CO₂</span>
                </div>
            </div>
            <div class="todo-actions">
                ${priorityIcon}
                <div class="todo-status-buttons">
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
                return '<i class="fas fa-check"></i>';
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
            this.renderTodos();
            
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
        if (confirm('Are you sure you want to delete this todo?')) {
            this.todos = this.todos.filter(t => t.id !== todoId);
            this.saveTodos();
            this.renderTodos();
            this.showNotification('Todo deleted! 🗑️');
        }
    }

    addNewTodo() {
        const input = document.getElementById('newTodoInput');
        const title = input.value.trim();
        
        if (title) {
            const newTodo = {
                id: Date.now(),
                title: title,
                description: 'New todo item',
                category: 'General',
                points: 10,
                carbonSaving: 0.1,
                status: 'unfinished',
                priority: 'low',
                isSubtask: false,
                parentId: null
            };
            
            this.todos.unshift(newTodo);
            this.saveTodos();
            this.renderTodos();
            input.value = '';
            this.showNotification('New todo added! 📝');
        }
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

    resetTodos() {
        if (confirm('Are you sure you want to reset all todos? This will reload the 5 default tasks.')) {
            localStorage.removeItem('coralTodos');
            this.todos = [];
            this.initializeTodosFromTasks();
            this.renderTodos();
            this.showNotification('Todos reset! All tasks reloaded. 🔄');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.coralTodoApp = new CoralTodoApp();
});
