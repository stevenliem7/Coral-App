'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [coralHealth, setCoralHealth] = useState(25);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load tasks from localStorage or API
    let savedTasks = JSON.parse(localStorage.getItem('coralTasks') || '[]');

    // Filter out invalid tasks
    savedTasks = savedTasks.filter(task => {
      if (!task.timestamp) return false;
      const date = new Date(task.timestamp);
      return !isNaN(date.getTime()) && task.name && task.name.trim() !== '';
    });

    setTasks(savedTasks);
    localStorage.setItem('coralTasks', JSON.stringify(savedTasks));

    // Calculate coral health based on completed tasks
    const completedTasks = savedTasks.filter(task => task.completed);
    const healthPercentage = Math.min(100, 25 + (completedTasks.length * 15));
    setCoralHealth(healthPercentage);

    setIsLoading(false);
  }, []);

  const addTask = (taskName) => {
    const newTask = {
      id: Date.now(),
      name: taskName,
      completed: false,
      timestamp: new Date().toISOString(),
      points: Math.floor(Math.random() * 50) + 10 // Random points 10-60
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem('coralTasks', JSON.stringify(updatedTasks));
  };

  const clearAllTasks = () => {
    if (confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
      setTasks([]);
      localStorage.setItem('coralTasks', JSON.stringify([]));
      setCoralHealth(25); // Reset coral health to base level
    }
  };

  const formatTaskDate = (timestamp) => {
    if (!timestamp) return 'No date';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString();
  };

  const deleteTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem('coralTasks', JSON.stringify(updatedTasks));

    // Update coral health
    const completedTasks = updatedTasks.filter(task => task.completed);
    const healthPercentage = Math.min(100, 25 + (completedTasks.length * 15));
    setCoralHealth(healthPercentage);

    // Subtract points from database if task was completed
    if (task.completed) {
      try {
        const activityType = getActivityType(task.name);
        const response = await fetch('/api/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: 11, // User "YOU" will be ID 11
            activityType: activityType,
            pointsEarned: -task.points,
            description: `Deleted completed task: ${task.name}`
          })
        });

        if (response.ok) {
          console.log('Points subtracted for deleted task!');
        } else {
          console.error('Failed to subtract points for deleted task');
        }
      } catch (error) {
        console.error('Error subtracting points for deleted task:', error);
      }
    }
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const wasCompleted = task.completed;
    const pointsChange = wasCompleted ? -task.points : task.points;

    // Mark task as completed/uncompleted
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? {
        ...t,
        completed: !t.completed,
        completedAt: !t.completed ? new Date().toISOString() : null
      } : t
    );
    setTasks(updatedTasks);
    localStorage.setItem('coralTasks', JSON.stringify(updatedTasks));

    // Update coral health
    const completedTasks = updatedTasks.filter(t => t.completed);
    const healthPercentage = Math.min(100, 25 + (completedTasks.length * 15));
    setCoralHealth(healthPercentage);

    // Add/subtract activity to/from database
    try {
      const activityType = getActivityType(task.name);
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 11, // User "YOU" will be ID 11
          activityType: activityType,
          pointsEarned: pointsChange,
          description: wasCompleted ? `Uncompleted: ${task.name}` : task.name
        })
      });

      if (response.ok) {
        console.log(wasCompleted ? 'Points subtracted successfully!' : 'Activity added successfully!');
      } else {
        console.error('Failed to update activity');
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const getActivityType = (taskName) => {
    const name = taskName.toLowerCase();
    if (name.includes('bike') || name.includes('cycling') || name.includes('bicycle')) {
      return 'cycling';
    } else if (name.includes('recycle') || name.includes('waste')) {
      return 'recycling';
    } else if (name.includes('transport') || name.includes('bus') || name.includes('train')) {
      return 'public_transport';
    } else if (name.includes('water') || name.includes('bottle')) {
      return 'water_saving';
    } else if (name.includes('energy') || name.includes('light') || name.includes('electricity')) {
      return 'energy_saving';
    } else {
      return 'general';
    }
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="coral-spinner"></div>
          <p>Growing your coral reef...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Link href="/community" className="hamburger-menu">
            <i className="fas fa-users" style={{ color: 'white' }}></i>
          </Link>
          <div className="logo">
            <h1>Coral</h1>
            <p className="subtitle">Today's Impact</p>
          </div>
          <div className="user-profile">
            <i className="fas fa-user-circle" style={{ color: 'white' }}></i>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Impact Display */}
        <section className="impact-display">
          <div className="impact-circle">
            <div className="progress-ring">
              <svg className="progress-ring-svg" width="200" height="200">
                <circle
                  className="progress-ring-circle-bg"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="8"
                  fill="transparent"
                  r="90"
                  cx="100"
                  cy="100"
                />
                <circle
                  className="progress-ring-circle"
                  stroke="#4ade80"
                  strokeWidth="8"
                  fill="transparent"
                  r="90"
                  cx="100"
                  cy="100"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 90}`,
                    strokeDashoffset: `${2 * Math.PI * 90 * (1 - coralHealth / 100)}`
                  }}
                />
              </svg>
              <div className="impact-text">
                <div className="impact-number">{coralHealth}%</div>
                <div className="impact-label">Coral Health</div>
              </div>
            </div>
          </div>
        </section>

        {/* Coral Visualization */}
        <section className="coral-visualization">
          <div className="coral-canvas" id="coralCanvas">
            {/* p5.js coral will be rendered here */}
          </div>
        </section>

        {/* Tasks Section */}
        <section className="tasks-section">
          <div className="tasks-header">
            <div>
              <h2>Today's Tasks</h2>
              <Link href="/community" className="nav-link">
                <small>View Leaderboard →</small>
              </Link>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="clear-btn"
                onClick={clearAllTasks}
                title="Delete all tasks"
              >
                <i className="fas fa-trash"></i>
              </button>
              <button
                className="add-task-btn"
                onClick={() => {
                  const taskName = prompt('Enter a new sustainable task:');
                  if (taskName) addTask(taskName);
                }}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
          
          <div className="tasks-list">
            {tasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`} style={{ position: 'relative' }}>
                <div className="task-checkbox" onClick={() => toggleTask(task.id)}>
                  <i className={`fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}`}></i>
                </div>
                <div className="task-content">
                  <span className="task-name">{task.name}</span>
                  <div className="task-meta">
                    <span className="task-points">+{task.points} pts</span>
                    <span className="task-date">
                      {formatTaskDate(task.timestamp)}
                    </span>
                  </div>
                </div>
                <button
                  className="delete-task-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  title="Delete this task"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="no-tasks">
                <p>No tasks yet. Add your first sustainable action!</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button 
              className="action-btn"
              onClick={() => addTask('Used public transport')}
            >
              <i className="fas fa-bus"></i>
              <span>Public Transport</span>
            </button>
            <button 
              className="action-btn"
              onClick={() => addTask('Recycled materials')}
            >
              <i className="fas fa-recycle"></i>
              <span>Recycle</span>
            </button>
            <button 
              className="action-btn"
              onClick={() => addTask('Used reusable water bottle')}
            >
              <i className="fas fa-tint"></i>
              <span>Reusable Bottle</span>
            </button>
            <button 
              className="action-btn"
              onClick={() => addTask('Turned off lights when not needed')}
            >
              <i className="fas fa-lightbulb"></i>
              <span>Save Energy</span>
            </button>
          </div>
        </section>
      </main>

      {/* Coral Growth Script */}
      <script src="https://cdn.jsdelivr.net/npm/p5@1.9.3/lib/p5.min.js"></script>
      <script dangerouslySetInnerHTML={{
        __html: `
          let coralHealth = ${coralHealth};
          let coralBranches = [];
          
          function setup() {
            const canvas = createCanvas(350, 200);
            canvas.parent('coralCanvas');
            background(0, 50, 100);
            
            // Initialize coral branches
            for (let i = 0; i < 5; i++) {
              coralBranches.push({
                x: width / 2 + random(-50, 50),
                y: height,
                length: random(30, 80),
                angle: random(-PI/4, PI/4),
                thickness: random(3, 8),
                color: color(255, coralHealth * 2, coralHealth * 1.5)
              });
            }
          }
          
          function draw() {
            background(0, 50, 100);
            
            // Draw coral branches
            coralBranches.forEach(branch => {
              push();
              translate(branch.x, branch.y);
              rotate(branch.angle);
              
              stroke(branch.color);
              strokeWeight(branch.thickness);
              line(0, 0, 0, -branch.length);
              
              // Add coral polyps
              fill(branch.color);
              noStroke();
              for (let i = 0; i < branch.length; i += 10) {
                ellipse(0, -i, branch.thickness * 0.8, branch.thickness * 0.8);
              }
              
              pop();
            });
            
            // Add fish if coral is healthy
            if (coralHealth > 50) {
              drawFish();
            }
          }
          
          function drawFish() {
            fill(255, 200, 100);
            ellipse(mouseX, mouseY, 20, 10);
            triangle(mouseX + 10, mouseY, mouseX + 15, mouseY - 3, mouseX + 15, mouseY + 3);
            fill(0);
            ellipse(mouseX - 5, mouseY, 3, 3);
          }
        `
      }} />
    </div>
  );
}