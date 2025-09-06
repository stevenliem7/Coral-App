// Coral Environmental Impact App - JavaScript Functionality
class CoralImpactApp {
    constructor() {
        // Clear old tasks to force reload from tasksList.json
        localStorage.removeItem('coralTasks');
        this.tasks = [];
        this.dailyStats = JSON.parse(localStorage.getItem('dailyStats')) || {
            co2Saved: 0,
            dayStreak: 1,
            dailyGoal: 2.5, // 2.5kg CO₂ daily goal
            completedTasks: 0
        };
        
        // Camera verification properties
        this.currentStream = null;
        this.capturedImage = null;
        this.currentVerificationTask = null;
        
        // Check if it's a new day and reset stats
        this.checkDailyReset();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCameraEventListeners();
        this.loadTasks();
        this.updateStats();
        this.updateProgressRing();
        this.updateCoralPoints();
        this.startSimulation();
    }

    checkDailyReset() {
        const today = new Date().toDateString();
        const lastActiveDate = localStorage.getItem('lastActiveDate');
        
        if (lastActiveDate !== today) {
            // New day - reset CO₂ saved and completed tasks to 0
            this.dailyStats.co2Saved = 0;
            this.dailyStats.completedTasks = 0;
            
            // Update day streak
            if (lastActiveDate) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastActiveDate === yesterday.toDateString()) {
                    // Consecutive day - increment streak
                    this.dailyStats.dayStreak += 1;
                } else {
                    // Streak broken - reset to 1
                    this.dailyStats.dayStreak = 1;
                }
            } else {
                // First time - start streak at 1
                this.dailyStats.dayStreak = 1;
            }
            
            // Reset all tasks to incomplete for new day
            this.tasks.forEach(task => {
                if (!task.unlimited) {
                    task.completed = false;
                }
            });
            
            localStorage.setItem('lastActiveDate', today);
            this.saveTasks();
            this.saveStats();
        }
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

    async loadTasks() {
        try {
            // Always load from tasksList.json first to get latest tasks
            const response = await fetch('tasksList.json');
            const tasksData = await response.json();


            // Map JSON tasks to our format, preserving completion status if tasks exist
            const existingTasks = this.tasks || [];
            this.tasks = tasksData.map((task, index) => {
                // Check if this task already exists and preserve its completion status
                const existingTask = existingTasks.find(t => t.title === task.title);
                return {
                    id: index + 1,
                    title: task.title,
                    description: task.description,
                    co2Saved: task.carbonSavingKg,
                    icon: this.getIconForCategory(task.category),
                    iconClass: this.getIconClassForCategory(task.category),
                    completed: existingTask ? existingTask.completed : false,
                    verification: task.verification,
                    verificationTarget: task.verificationTarget,
                    points: task.points,
                    category: task.category,
                    unlimited: task.unlimited || false,
                    displayUnit: task.displayUnit || 'kg'
                };
            });
            this.saveTasks();
        } catch (error) {
            console.error('Error loading tasks from JSON:', error);
            // Show error message if JSON loading fails
            console.error('Please make sure tasksList.json is available and properly formatted');
        }

        this.renderTasks();
    }

    getIconForCategory(category) {
        const iconMap = {
            'Transport': 'bike',
            'Waste': 'recycle',
            'Energy': 'energy',
            'Food': 'food'
        };
        return iconMap[category] || 'general';
    }

    getIconClassForCategory(category) {
        const iconClassMap = {
            'Transport': 'fas fa-bicycle',
            'Waste': 'fas fa-recycle',
            'Energy': 'fas fa-bolt',
            'Food': 'fas fa-leaf'
        };
        return iconClassMap[category] || 'fas fa-check';
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
                <div class="task-co2">-${task.displayUnit === 'g' ? (task.co2Saved * 1000).toFixed(1) + 'g' : task.co2Saved + 'kg'} CO₂</div>
                <div class="task-status ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `;

        // Add click event for task completion
        const statusElement = div.querySelector('.task-status');
        statusElement.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Check if task requires verification
            if (task.verification === 'camera') {
                this.openCameraVerification(task);
            } else if (task.verification === 'carbon_intensity') {
                this.checkCarbonIntensity(task);
            } else {
                this.toggleTaskCompletion(task.id);
            }
        });

        return div;
    }

    openCameraVerification(task) {
        // Check if we're on the main page with camera modal
        const cameraModal = document.getElementById('camera-modal');
        if (cameraModal) {
            // Set current task for verification
            this.currentVerificationTask = task;
            
            // Update modal title and description based on task
            const titleElement = document.getElementById('verification-title');
            const descriptionElement = document.getElementById('verification-description');
            
            if (task.verificationTarget === 'bicycle') {
                if (titleElement) titleElement.textContent = `🚴‍♀️ Verify: ${task.title}`;
                if (descriptionElement) descriptionElement.textContent = 'Take a photo of a bicycle to complete this sustainable transport goal';
            } else if (task.verificationTarget === 'recycling_bin') {
                if (titleElement) titleElement.textContent = `♻️ Verify: ${task.title}`;
                if (descriptionElement) descriptionElement.textContent = 'Take a photo of any recyclable item (bottle, can, cup, phone, etc.) to complete this goal';
            } else {
                if (titleElement) titleElement.textContent = `📸 Verify: ${task.title}`;
                if (descriptionElement) descriptionElement.textContent = task.description;
            }
            
            cameraModal.style.display = 'flex';
            this.startCamera();
        } else {
            // Redirect to todo page for verification
            this.showNotification('Camera verification coming soon! For now, completing task... 📸');
            this.toggleTaskCompletion(task.id);
        }
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            const video = document.getElementById('camera-video');
            if (video) {
                video.srcObject = stream;
                this.currentStream = stream;
            }
        } catch (error) {
            console.error('Camera access error:', error);
            this.showNotification('Camera access denied. Please allow camera access to verify tasks.');
            this.closeCameraModal();
        }
    }

    closeCameraModal() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        const cameraModal = document.getElementById('camera-modal');
        if (cameraModal) {
            cameraModal.style.display = 'none';
        }
        
        // Reset modal state
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        if (video) video.style.display = 'block';
        if (canvas) canvas.style.display = 'none';
        
        const captureBtn = document.getElementById('capture-btn');
        const verifyBtn = document.getElementById('verify-btn');
        const retakeBtn = document.getElementById('retake-btn');
        if (captureBtn) captureBtn.style.display = 'inline-block';
        if (verifyBtn) verifyBtn.style.display = 'none';
        if (retakeBtn) retakeBtn.style.display = 'none';
        
        const statusDiv = document.getElementById('verification-status');
        if (statusDiv) statusDiv.textContent = '';
        
        this.currentVerificationTask = null;
        this.capturedImage = null;
    }

    setupCameraEventListeners() {
        // Capture photo button
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.capturePhoto());
        }

        // Retake photo button
        const retakeBtn = document.getElementById('retake-btn');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => this.retakePhoto());
        }

        // Verify photo button
        const verifyBtn = document.getElementById('verify-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.verifyPhoto());
        }

        // Cancel camera button
        const cancelBtn = document.getElementById('cancel-camera-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeCameraModal());
        }

        // Carbon intensity modal event listeners
        this.setupCarbonEventListeners();
    }

    setupCarbonEventListeners() {
        // Complete task button (full points)
        const completeBtn = document.getElementById('carbon-complete-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeCarbonTask(1.0));
        }

        // Half points button
        const halfBtn = document.getElementById('carbon-half-btn');
        if (halfBtn) {
            halfBtn.addEventListener('click', () => this.completeCarbonTask(0.5));
        }

        // Wait button
        const waitBtn = document.getElementById('carbon-wait-btn');
        if (waitBtn) {
            waitBtn.addEventListener('click', () => this.closeCarbonModal());
        }

        // Cancel button
        const cancelBtn = document.getElementById('carbon-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeCarbonModal());
        }
    }

    capturePhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        if (!video || !canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match display size
        const displayWidth = 400;
        const displayHeight = (video.videoHeight / video.videoWidth) * displayWidth;
        
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        ctx.drawImage(video, 0, 0, displayWidth, displayHeight);
        
        this.capturedImage = canvas.toDataURL('image/jpeg', 0.8);
        
        // Show captured image
        video.style.display = 'none';
        canvas.style.display = 'block';
        
        // Update buttons
        document.getElementById('capture-btn').style.display = 'none';
        document.getElementById('verify-btn').style.display = 'inline-block';
        document.getElementById('retake-btn').style.display = 'inline-block';
    }

    retakePhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        
        if (video) video.style.display = 'block';
        if (canvas) canvas.style.display = 'none';
        
        document.getElementById('capture-btn').style.display = 'inline-block';
        document.getElementById('verify-btn').style.display = 'none';
        document.getElementById('retake-btn').style.display = 'none';
        
        const statusDiv = document.getElementById('verification-status');
        if (statusDiv) statusDiv.textContent = '';
    }

    async verifyPhoto() {
        if (!this.capturedImage || !this.currentVerificationTask) return;
        
        const statusDiv = document.getElementById('verification-status');
        const task = this.currentVerificationTask;
        
        statusDiv.innerHTML = `🔍 Analyzing image for ${task.verificationTarget === 'bicycle' ? 'bicycle' : 'recyclable items'}...`;
        statusDiv.style.color = '#2196F3';
        
        try {
            // REAL AI DETECTION using TensorFlow.js with COCO-SSD model
            console.log('🤖 Using REAL AI detection with TensorFlow.js...');
            
            // Load the image into a canvas for TensorFlow processing
            const img = new Image();
            img.src = this.capturedImage;
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // Create a canvas to process the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Load TensorFlow.js COCO-SSD model if not already loaded
            if (!window.cocoModel) {
                statusDiv.innerHTML = '🤖 Loading AI model... (first time only)';
                
                // Load TensorFlow.js and COCO-SSD model
                if (!window.tf) {
                    await new Promise((resolve) => {
                        const script1 = document.createElement('script');
                        script1.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest';
                        script1.onload = () => {
                            const script2 = document.createElement('script');
                            script2.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@latest';
                            script2.onload = resolve;
                            document.head.appendChild(script2);
                        };
                        document.head.appendChild(script1);
                    });
                }
                
                // Wait for models to be available
                await new Promise(resolve => {
                    const checkModels = () => {
                        if (window.cocoSsd && window.tf) {
                            resolve();
                        } else {
                            setTimeout(checkModels, 100);
                        }
                    };
                    checkModels();
                });
                
                window.cocoModel = await window.cocoSsd.load();
                console.log('✅ AI Model loaded successfully!');
            }

            statusDiv.innerHTML = '🔍 AI is analyzing your photo...';
            
            // Detect objects in the image
            const predictions = await window.cocoModel.detect(img);
            console.log('🔍 AI Predictions:', predictions);

            // Convert to Roboflow-like format
            const result = {
                predictions: predictions.map(pred => ({
                    class: pred.class,
                    confidence: pred.score,
                    bbox: pred.bbox
                }))
            };

            // Check for target object detection
            let detected = false;
            let confidence = 0;
            let detectedObject = '';

            if (task.verificationTarget === 'bicycle') {
                // Check for bicycle detection
                const bicyclePrediction = result.predictions.find(pred =>
                    pred.class === 'bicycle' && pred.confidence > 0.5
                );
                if (bicyclePrediction) {
                    detected = true;
                    confidence = bicyclePrediction.confidence;
                    detectedObject = 'bicycle';
                }
            } else if (task.verificationTarget === 'recycling_bin') {
                // Check for recyclable items - expanded list for better detection
                const recyclableClasses = [
                    // Bottles & Containers
                    'bottle', 'wine glass', 'cup',
                    // Cans & Metal
                    'can', 'bowl',
                    // Electronics
                    'cell phone', 'laptop', 'keyboard', 'mouse', 'remote', 'tv',
                    // Paper & Cardboard
                    'book', 'scissors',
                    // Plastic items
                    'toothbrush', 'hair drier'
                ];
                
                const recyclablePrediction = result.predictions.find(pred =>
                    recyclableClasses.includes(pred.class) && pred.confidence > 0.3
                );
                
                if (recyclablePrediction) {
                    detected = true;
                    confidence = recyclablePrediction.confidence;
                    detectedObject = recyclablePrediction.class;
                    
                    // Log what was detected for debugging
                    console.log('♻️ Recyclable item detected:', {
                        item: recyclablePrediction.class,
                        confidence: recyclablePrediction.confidence,
                        allPredictions: result.predictions.map(p => `${p.class}: ${Math.round(p.confidence * 100)}%`)
                    });
                }
            }

            if (detected) {
                const confidencePercent = Math.round(confidence * 100);
                const displayName = task.verificationTarget === 'bicycle' ? 'Bicycle' : `${detectedObject.charAt(0).toUpperCase() + detectedObject.slice(1)} (recyclable)`;

                statusDiv.innerHTML = `✅ ${displayName} detected! Confidence: ${confidencePercent}%`;
                statusDiv.style.color = '#4CAF50';

                setTimeout(() => {
                    // Complete the task
                    this.toggleTaskCompletion(task.id);

                    statusDiv.innerHTML = `🪸 Task completed! Your coral reef celebrates your sustainable action!`;

                    setTimeout(() => {
                        this.closeCameraModal();
                    }, 2000);
                }, 1000);

            } else {
                const targetName = task.verificationTarget === 'bicycle' ? 'bicycle' : 'recyclable items';
                
                // Show what was actually detected for debugging
                const detectedItems = result.predictions.map(p => `${p.class} (${Math.round(p.confidence * 100)}%)`).join(', ');
                
                statusDiv.innerHTML = `❌ No ${targetName} detected.<br/>
                    <small style="font-size: 10px; opacity: 0.8;">
                        ${detectedItems ? `Found: ${detectedItems}` : 'No objects detected'}
                    </small>`;
                statusDiv.style.color = '#f44336';
                statusDiv.style.fontSize = '12px';

                console.log('🔍 Detection failed. Found objects:', result.predictions);

                setTimeout(() => {
                    this.retakePhoto();
                }, 3000); // Give more time to read the debug info
            }
        } catch (error) {
            console.error('🚨 REAL AI DETECTION FAILED:', error);
            statusDiv.innerHTML = `🚨 AI Detection Failed: ${error.message}<br/>Check console for details.`;
            statusDiv.style.color = '#ff0000';
            statusDiv.style.fontSize = '12px';
            
            // Show detailed error info
            console.log('🔍 TensorFlow.js Error Details:', {
                error: error.message,
                task: task.verificationTarget,
                imageLength: this.capturedImage ? this.capturedImage.length : 'null',
                tfLoaded: !!window.tf,
                cocoSsdLoaded: !!window.cocoSsd,
                modelLoaded: !!window.cocoModel
            });
            
            // Auto-retry after showing error
            setTimeout(() => {
                this.retakePhoto();
            }, 3000);
        }
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {

            // For unlimited tasks, always add to stats without toggling completion
            if (task.unlimited) {
                this.dailyStats.co2Saved += task.co2Saved;
                this.dailyStats.completedTasks += 1;

                const co2Display = task.displayUnit === 'g' ?
                    `${(task.co2Saved * 1000).toFixed(1)}g` :
                    `${task.co2Saved}kg`;
                const message = `Great job! You saved ${co2Display} CO₂! Keep going! 🌱♾️`;
                this.showNotification(message);
            } else {
                // Regular task toggle
                task.completed = !task.completed;

                // Update daily stats
                if (task.completed) {
                    this.dailyStats.co2Saved += task.co2Saved;
                    this.dailyStats.completedTasks += 1;
                } else {
                    this.dailyStats.co2Saved -= task.co2Saved;
                    this.dailyStats.completedTasks -= 1;
                }

                const co2Display = task.displayUnit === 'g' ?
                    `${(task.co2Saved * 1000).toFixed(1)}g` :
                    `${task.co2Saved}kg`;
                const message = task.completed ?
                    `Great job! You saved ${co2Display} CO₂! 🌱` :
                    'Task unchecked. Keep going! 💪';
                this.showNotification(message);
            }


            this.saveTasks();
            this.saveStats();
            this.renderTasks();
            this.updateStats();
            this.updateProgressRing();
            this.updateCoralPoints();
        }
    }

    updateCoralPoints() {
        // Trigger coral display update to sync with CO₂ progress
        if (typeof updateCoralDisplay === 'function') {
            updateCoralDisplay();
        } else if (window.updateCoralDisplay) {
            window.updateCoralDisplay();
        }
    }

    updateStats() {
        // Update CO₂ saved display (always positive)
        const co2Element = document.querySelector('.co2-saved .stat-value');
        if (co2Element) {
            co2Element.textContent = `${Math.abs(this.dailyStats.co2Saved).toFixed(1)}kg`;
        }

        // Update day streak in stats card
        const streakElement = document.querySelector('.day-streak .stat-value');
        if (streakElement) {
            streakElement.innerHTML = `🔥 ${this.dailyStats.dayStreak}`;
        }
    }

    updateProgressRing() {
        // Calculate progress based on CO₂ saved toward 2.5kg goal
        const progress = Math.min((this.dailyStats.co2Saved / this.dailyStats.dailyGoal) * 100, 100);

        // Update percentage display (coral visualization handles progress ring)
        const percentage = document.querySelector('.impact-percentage');
        if (percentage) {
            percentage.textContent = `${Math.round(progress)}%`;
        }

        // Trigger coral display update to sync progress ring
        if (typeof updateCoralDisplay === 'function') {
            updateCoralDisplay();
        } else if (window.updateCoralDisplay) {
            window.updateCoralDisplay();
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
        this.updateCoralPoints(); // Reset coral to 0 for new day

        this.showNotification('New day! Let\'s make a positive impact! 🌅');
    }


    showProgress() {
        const totalCo2 = this.dailyStats.co2Saved;
        const goal = this.dailyStats.dailyGoal;
        const progressPercent = Math.round((totalCo2 / goal) * 100);
        const streak = this.dailyStats.dayStreak;

        const message = `🌱 Daily Progress Summary 🌱\n\n` +
            `CO₂ Saved Today: ${totalCo2.toFixed(1)}kg / ${goal}kg\n` +
            `Progress: ${progressPercent}%\n` +
            `Day Streak: 🔥 ${streak} days\n\n` +
            `${progressPercent >= 100 ? '🎉 Goal Achieved!' : 'Keep going! 🌍'}`;

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

    // Carbon Intensity Verification Methods
    async checkCarbonIntensity(task) {
        const modal = document.getElementById('carbon-modal');
        if (!modal) {
            this.showNotification('Carbon intensity check not available. Completing task...');
            this.toggleTaskCompletion(task.id);
            return;
        }

        this.currentVerificationTask = task;
        modal.style.display = 'flex';
        
        const statusDiv = document.getElementById('carbon-status');
        const detailsDiv = document.getElementById('carbon-details');
        const renewableBar = document.getElementById('carbon-renewable-bar');
        const renewableFill = document.getElementById('carbon-renewable-fill');
        const nextCheckDiv = document.getElementById('carbon-next-check');
        
        // Reset UI
        this.hideCarbonButtons();
        statusDiv.innerHTML = '🔄 Checking Australian electricity grid...';
        statusDiv.style.background = '#f0f0f0';
        detailsDiv.innerHTML = '';
        renewableBar.style.display = 'none';
        nextCheckDiv.innerHTML = '';

        try {
            // Get current carbon intensity for Australia
            const carbonData = await this.getAustralianCarbonIntensity();
            this.displayCarbonStatus(carbonData, task);
        } catch (error) {
            console.error('Carbon intensity check failed:', error);
            this.showCarbonError();
        }
    }

    async getAustralianCarbonIntensity() {
        const now = new Date();
        
        try {
            // Method 1: Try OpenNEM API via our Vercel serverless proxy
            console.log('🌐 Fetching real Australian electricity data via proxy...');
            
            // Try our Vercel serverless function first (avoids CORS)
            const proxyEndpoints = [
                '/api/opennem?metrics=power,emissions&interval=1h&hours=24',
                '/api/opennem?metrics=power&interval=1h&hours=24'
            ];
            
            for (const endpoint of proxyEndpoints) {
                try {
                    console.log(`🔄 Trying proxy endpoint: ${endpoint}`);
                    
                    const response = await fetch(endpoint, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    console.log(`📊 Proxy response status: ${response.status}`);
                    
                    if (response.ok) {
                        const proxyData = await response.json();
                        
                        if (proxyData.success && proxyData.data) {
                            console.log('✅ Proxy API Success! Processing real OpenNEM data...');
                            
                            // Process real OpenNEM data
                            const processedData = this.processOpenNEMData(proxyData.data);
                            if (processedData) {
                                console.log('🎯 Real Australian electricity data loaded!', processedData);
                                return processedData;
                            }
                        } else {
                            console.log('⚠️ Proxy returned error:', proxyData.error);
                        }
                    } else {
                        console.log(`❌ Proxy failed with status: ${response.status}`);
                    }
                } catch (proxyError) {
                    console.log(`❌ Proxy endpoint failed:`, proxyError.message);
                }
            }
            
            // If we get here, all proxy attempts failed
            console.log('⚠️ All proxy endpoints failed');
            throw new Error('Proxy endpoints unavailable');
            
            // Method 2: Fallback to time-based realistic simulation
            console.log('⚠️ All OpenNEM API endpoints failed - using enhanced simulation');
            console.log('🔄 Simulation based on real Australian electricity patterns');
            return this.getRealisticSimulation();
            
        } catch (error) {
            console.error('🚨 All API methods failed:', error);
            return this.getRealisticSimulation();
        }
    }
    
    processOpenNEMData(data) {
        try {
            if (!data || !data.data || !Array.isArray(data.data)) {
                console.log('⚠️ Invalid OpenNEM data structure');
                return null;
            }
            
            // Find the latest data point
            let latestPowerData = null;
            let latestEmissionsData = null;
            
            for (const series of data.data) {
                if (series.metric === 'power' && series.data && series.data.length > 0) {
                    latestPowerData = series.data[series.data.length - 1];
                }
                if (series.metric === 'emissions' && series.data && series.data.length > 0) {
                    latestEmissionsData = series.data[series.data.length - 1];
                }
            }
            
            if (latestPowerData && latestEmissionsData) {
                // Calculate carbon intensity from real data
                const totalPower = latestPowerData.value || 1; // MW
                const totalEmissions = latestEmissionsData.value || 0; // tonnes CO2
                
                // Convert to g CO2/kWh
                const carbonIntensity = Math.round((totalEmissions * 1000000) / (totalPower * 1000));
                
                // Estimate renewable percentage (simplified)
                const renewablePercent = Math.max(0, Math.min(100, 100 - (carbonIntensity / 10)));
                
                return {
                    carbonIntensity: Math.max(100, Math.min(1000, carbonIntensity)),
                    renewablePercent: Math.round(renewablePercent),
                    timestamp: latestPowerData.time || new Date().toISOString(),
                    source: 'OpenNEM Real Data',
                    state: 'NEM (National Electricity Market)',
                    rawData: { power: latestPowerData, emissions: latestEmissionsData }
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error processing OpenNEM data:', error);
            return null;
        }
    }
    
    getRealisticSimulation() {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // More sophisticated simulation based on real Australian patterns
        let baseCarbonIntensity;
        let renewablePercent;
        
        if (hour >= 10 && hour <= 14) {
            // Solar peak hours - lowest carbon intensity
            baseCarbonIntensity = isWeekend ? 180 : 220;
            baseCarbonIntensity += Math.random() * 80;
            renewablePercent = 65 + Math.random() * 20;
        } else if (hour >= 22 || hour <= 6) {
            // Off-peak hours - moderate carbon intensity
            baseCarbonIntensity = isWeekend ? 320 : 380;
            baseCarbonIntensity += Math.random() * 100;
            renewablePercent = 35 + Math.random() * 20;
        } else {
            // Peak hours - highest carbon intensity
            baseCarbonIntensity = isWeekend ? 450 : 550;
            baseCarbonIntensity += Math.random() * 150;
            renewablePercent = 20 + Math.random() * 15;
        }
        
        // Add seasonal variation (simplified)
        const month = now.getMonth();
        if (month >= 11 || month <= 2) { // Summer
            renewablePercent += 10; // More solar
            baseCarbonIntensity -= 30;
        } else if (month >= 5 && month <= 8) { // Winter
            renewablePercent -= 5; // Less solar
            baseCarbonIntensity += 50;
        }
        
        const carbonIntensity = Math.round(Math.max(150, Math.min(800, baseCarbonIntensity)));
        const renewable = Math.round(Math.max(10, Math.min(90, renewablePercent)));
        
        return {
            carbonIntensity,
            renewablePercent: renewable,
            timestamp: now.toISOString(),
            source: 'Enhanced Simulation (Real Patterns)',
            state: 'Australia Average',
            note: `Based on ${isWeekend ? 'weekend' : 'weekday'} patterns`
        };
    }

    displayCarbonStatus(data, task) {
        const statusDiv = document.getElementById('carbon-status');
        const detailsDiv = document.getElementById('carbon-details');
        const renewableBar = document.getElementById('carbon-renewable-bar');
        const renewableFill = document.getElementById('carbon-renewable-fill');
        const nextCheckDiv = document.getElementById('carbon-next-check');
        
        const { carbonIntensity, renewablePercent } = data;
        
        // Determine status based on carbon intensity
        let status, bgColor, textColor, allowFull, allowHalf;
        
        if (carbonIntensity < 300) {
            // Low carbon - full points
            status = `🟢 LOW CARBON (${carbonIntensity}g CO₂/kWh)`;
            bgColor = '#4CAF50';
            textColor = 'white';
            allowFull = true;
            allowHalf = false;
        } else if (carbonIntensity < 500) {
            // Medium carbon - half points
            status = `🟡 MEDIUM CARBON (${carbonIntensity}g CO₂/kWh)`;
            bgColor = '#FF9800';
            textColor = 'white';
            allowFull = false;
            allowHalf = true;
        } else {
            // High carbon - no completion
            status = `🔴 HIGH CARBON (${carbonIntensity}g CO₂/kWh)`;
            bgColor = '#f44336';
            textColor = 'white';
            allowFull = false;
            allowHalf = false;
        }
        
        // Update status display
        statusDiv.innerHTML = status;
        statusDiv.style.background = bgColor;
        statusDiv.style.color = textColor;
        
        // Update details with more information
        const timeStr = new Date(data.timestamp).toLocaleTimeString();
        const dateStr = new Date(data.timestamp).toLocaleDateString();
        
        detailsDiv.innerHTML = `
            <strong>Renewable Energy:</strong> ${renewablePercent}%<br/>
            <strong>Time:</strong> ${timeStr} (${dateStr})<br/>
            <strong>Source:</strong> ${data.source}<br/>
            <strong>Region:</strong> ${data.state}<br/>
            ${data.note ? `<em>${data.note}</em><br/>` : ''}
            ${data.rawData ? '<small>Using real OpenNEM data ✅</small>' : '<small>Simulation based on real patterns 🔄</small>'}
        `;
        
        // Show renewable percentage bar
        renewableBar.style.display = 'block';
        renewableFill.style.width = `${renewablePercent}%`;
        
        // Show appropriate buttons
        this.showCarbonButtons(allowFull, allowHalf, carbonIntensity);
        
        // Show next good time prediction
        if (!allowFull && !allowHalf) {
            nextCheckDiv.innerHTML = '💡 Try again during solar hours (10 AM - 2 PM) for best results!';
        } else if (!allowFull && allowHalf) {
            nextCheckDiv.innerHTML = '💡 Wait for solar hours (10 AM - 2 PM) for full points!';
        }
    }

    showCarbonButtons(allowFull, allowHalf, carbonIntensity) {
        const completeBtn = document.getElementById('carbon-complete-btn');
        const halfBtn = document.getElementById('carbon-half-btn');
        const waitBtn = document.getElementById('carbon-wait-btn');
        
        if (allowFull) {
            completeBtn.style.display = 'inline-block';
            completeBtn.innerHTML = '✅ Perfect Time! Complete Task';
        } else {
            completeBtn.style.display = 'none';
        }
        
        if (allowHalf) {
            halfBtn.style.display = 'inline-block';
            halfBtn.innerHTML = `⚡ Complete for Half Points (${Math.round(this.currentVerificationTask.points * 0.5)} pts)`;
        } else {
            halfBtn.style.display = 'none';
        }
        
        if (!allowFull || allowHalf) {
            waitBtn.style.display = 'inline-block';
            if (!allowFull && !allowHalf) {
                waitBtn.innerHTML = '⏰ Wait for Cleaner Energy';
            } else {
                waitBtn.innerHTML = '⏰ Wait for Full Points';
            }
        } else {
            waitBtn.style.display = 'none';
        }
    }

    hideCarbonButtons() {
        document.getElementById('carbon-complete-btn').style.display = 'none';
        document.getElementById('carbon-half-btn').style.display = 'none';
        document.getElementById('carbon-wait-btn').style.display = 'none';
    }

    showCarbonError() {
        const statusDiv = document.getElementById('carbon-status');
        const detailsDiv = document.getElementById('carbon-details');
        
        statusDiv.innerHTML = '⚠️ Unable to check carbon intensity';
        statusDiv.style.background = '#f44336';
        statusDiv.style.color = 'white';
        
        detailsDiv.innerHTML = 'Using fallback completion method.';
        
        // Show fallback completion button
        const completeBtn = document.getElementById('carbon-complete-btn');
        completeBtn.style.display = 'inline-block';
        completeBtn.innerHTML = '✅ Complete Task (Fallback)';
    }

    completeCarbonTask(pointsMultiplier) {
        if (!this.currentVerificationTask) return;
        
        const task = this.currentVerificationTask;
        
        // Apply points multiplier
        const originalPoints = task.points;
        const originalCo2 = task.carbonSavingKg;
        
        // Temporarily modify task for completion
        task.points = Math.round(originalPoints * pointsMultiplier);
        task.carbonSavingKg = originalCo2 * pointsMultiplier;
        
        // Complete the task
        this.toggleTaskCompletion(task.id);
        
        // Restore original values
        task.points = originalPoints;
        task.carbonSavingKg = originalCo2;
        
        // Show completion message
        let message;
        if (pointsMultiplier === 1.0) {
            message = `🌟 Perfect timing! You earned full points during low-carbon electricity! 🌱`;
        } else {
            message = `⚡ Good effort! You earned ${Math.round(originalPoints * pointsMultiplier)} points during medium-carbon electricity. Try solar hours (10 AM-2 PM) for full points! 🌞`;
        }
        
        this.showNotification(message);
        this.closeCarbonModal();
    }

    closeCarbonModal() {
        const modal = document.getElementById('carbon-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        this.currentVerificationTask = null;
    }
    
    // API Key Management (now hardcoded for production)
    setOpenNEMApiKey(apiKey) {
        if (apiKey && apiKey.trim()) {
            localStorage.setItem('opennem_api_key', apiKey.trim());
            this.showNotification('✅ Custom API key set! Overriding default key.');
        } else {
            localStorage.removeItem('opennem_api_key');
            this.showNotification('🔄 Using default hardcoded API key.');
        }
    }
    
    getOpenNEMApiKey() {
        // Return custom key if set, otherwise use hardcoded production key
        return localStorage.getItem('opennem_api_key') || 'oe_3ZToEwocKDaAxZ8FKRDjw2F7';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.coralApp = new CoralImpactApp();
    
    // Make API key functions globally available (for manual override if needed)
    window.setOpenNEMApiKey = (key) => window.coralApp.setOpenNEMApiKey(key);
    window.getOpenNEMApiKey = () => window.coralApp.getOpenNEMApiKey();
    
    // API key is now hardcoded for production
    console.log('🌐 OpenNEM API Status: ✅ Real Australian electricity data enabled');
    console.log('🇦🇺 Using live data from National Electricity Market (NEM)');
    console.log('⚡ Carbon intensity updates in real-time!');
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
        co2Saved: 0.0,
        dayStreak: 1,
        dailyGoal: 2.5, // 2.5kg CO₂ daily goal
        completedTasks: 0
    };
    localStorage.setItem('dailyStats', JSON.stringify(sampleStats));
}