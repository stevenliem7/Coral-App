'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function Home() {
  const [coralHealth, setCoralHealth] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState({
    co2Saved: 0,
    dayStreak: 1,
    dailyGoal: 2.5,
    completedTasks: 0
  });
  
  // Camera verification state
  const [currentStream, setCurrentStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentVerificationTask, setCurrentVerificationTask] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCarbonModal, setShowCarbonModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [pointsGained, setPointsGained] = useState(0);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Define the 3 specific tasks from tasksList.json
  const CORAL_TASKS = [
    {
      id: 1,
      title: "Ride 'n' Shine",
      description: "Swap the car for your bike today and enjoy a brighter, greener commute!",
      points: 150,
      category: "Transport",
      carbonSavingKg: 1.5,
      verification: "camera",
      verificationTarget: "bicycle",
      icon: "bike",
      iconClass: "fas fa-bicycle"
    },
    {
      id: 2,
      title: "Bin It to Win It", 
      description: "Recycle items correctly — take a photo to prove you nailed it! (Unlimited daily)",
      points: 50,
      category: "Waste",
      carbonSavingKg: 0.0987,
      verification: "camera",
      verificationTarget: "recycling_bin",
      unlimited: true,
      displayUnit: "g",
      icon: "recycle",
      iconClass: "fas fa-recycle"
    },
    {
      id: 3,
      title: "Watt's the Right Time?",
      description: "Use electricity only when carbon intensity is low for full points!",
      points: 100,
      category: "Energy", 
      carbonSavingKg: 0.8,
      verification: "carbon_intensity",
      verificationTarget: "low_carbon",
      icon: "energy",
      iconClass: "fas fa-bolt"
    }
  ];

  useEffect(() => {
    // Set loading to false immediately to show the UI
    setIsLoading(false);
    
    // Only run initialization on client side to avoid hydration mismatch
    if (typeof window === 'undefined') {
      return;
    }

    // Initialize with the 3 coral tasks
    const savedTasksData = localStorage.getItem('coralTasksData');
    let taskCompletionStatus = {};
    
    if (savedTasksData) {
      taskCompletionStatus = JSON.parse(savedTasksData);
    }
    
    // Map coral tasks with completion status
    const initializedTasks = CORAL_TASKS.map(task => ({
      ...task,
      completed: taskCompletionStatus[task.id] || false,
      completedAt: taskCompletionStatus[`${task.id}_completedAt`] || null
    }));
    
    setTasks(initializedTasks);
    
    // Load daily stats
    const savedStats = localStorage.getItem('dailyStats');
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      setDailyStats(stats);
      
      // Calculate coral health based on CO₂ progress
      const progress = Math.min(100, (stats.co2Saved / stats.dailyGoal) * 100);
      setCoralHealth(progress);
    }
    
    // Check for daily reset
    checkDailyReset();
  }, []);
  
  const checkDailyReset = () => {
    if (typeof window === 'undefined') return;
    
    const today = new Date().toDateString();
    const lastActiveDate = localStorage.getItem('lastActiveDate');
    
    if (lastActiveDate !== today) {
      const newStats = {
        ...dailyStats,
        co2Saved: 0,
        completedTasks: 0
      };
      setDailyStats(newStats);
      localStorage.setItem('dailyStats', JSON.stringify(newStats));
      localStorage.setItem('lastActiveDate', today);
      
      const resetTasks = CORAL_TASKS.map(task => ({ ...task, completed: false }));
      setTasks(resetTasks);
      localStorage.removeItem('coralTasksData');
    }
  };

  const handleTaskClick = (task) => {
    if (task.verification === 'camera') {
      openCameraVerification(task);
    } else if (task.verification === 'carbon_intensity') {
      checkCarbonIntensity(task);
    } else {
      toggleTaskCompletion(task.id);
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const wasCompleted = task.completed;
    const isUnlimited = task.unlimited;
    
    if (isUnlimited) {
      await addTaskActivity(task, task.points);
      updateDailyStats(task.carbonSavingKg, task.points);
      return;
    }

    const updatedTasks = tasks.map(t =>
      t.id === taskId ? {
        ...t,
        completed: !t.completed,
        completedAt: !t.completed ? new Date().toISOString() : null
      } : t
    );
    
    setTasks(updatedTasks);
    
    const taskCompletionStatus = {};
    updatedTasks.forEach(t => {
      taskCompletionStatus[t.id] = t.completed;
      if (t.completedAt) {
        taskCompletionStatus[`${t.id}_completedAt`] = t.completedAt;
      }
    });
    localStorage.setItem('coralTasksData', JSON.stringify(taskCompletionStatus));

    const pointsChange = wasCompleted ? -task.points : task.points;
    const co2Change = wasCompleted ? -task.carbonSavingKg : task.carbonSavingKg;
    
    await addTaskActivity(task, pointsChange);
    updateDailyStats(co2Change, pointsChange);
  };

  const updateDailyStats = (co2Change, pointsChange) => {
    const newStats = {
      ...dailyStats,
      co2Saved: Math.max(0, dailyStats.co2Saved + co2Change),
      completedTasks: dailyStats.completedTasks + (pointsChange > 0 ? 1 : -1)
    };
    
    setDailyStats(newStats);
    localStorage.setItem('dailyStats', JSON.stringify(newStats));
    
    const progress = Math.min(100, (newStats.co2Saved / newStats.dailyGoal) * 100);
    setCoralHealth(progress);

    if (pointsChange > 0) {
      showPointsPopupNotification(pointsChange);
    }
  };

  const showPointsPopupNotification = (points) => {
    setPointsGained(points);
    setShowPointsPopup(true);

    setTimeout(() => {
      setShowPointsPopup(false);
    }, 3000);
  };

  const addTaskActivity = async (task, pointsChange) => {
    try {
      const activityType = getActivityType(task.category);
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 11,
          activityType: activityType,
          pointsEarned: pointsChange,
          description: task.title
        })
      });

      if (response.ok) {
        console.log('Activity added successfully!');
      } else {
        console.error('Failed to add activity');
      }
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const openCameraVerification = (task) => {
    setCurrentVerificationTask(task);
    setShowCameraModal(true);
    setVerificationStatus('');
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCurrentStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
  };

  const verifyPhoto = async () => {
    if (!capturedImage || !currentVerificationTask) return;

    try {
      setVerificationStatus('🤖 Initializing AI detection...');
      
      if (!window.cocoModel) {
        setVerificationStatus('📥 Loading TensorFlow.js library...');
        
        if (!window.tf) {
          await new Promise((resolve) => {
            const script1 = document.createElement('script');
            script1.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js';
            script1.onload = resolve;
            document.head.appendChild(script1);
          });
        }
        
        setVerificationStatus('🧠 Loading COCO-SSD model...');
        if (!window.cocoSsd) {
          await new Promise((resolve) => {
            const script2 = document.createElement('script');
            script2.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js';
            script2.onload = resolve;
            document.head.appendChild(script2);
          });
        }
        
        setVerificationStatus('⚡ Initializing neural network...');
        window.cocoModel = await window.cocoSsd.load();
        setVerificationStatus('✅ AI model loaded successfully!');
      }

      setVerificationStatus('🔍 Analyzing image for objects...');
      
      const img = new Image();
      img.onload = async () => {
        const predictions = await window.cocoModel.detect(img);
        
        if (predictions.length > 0) {
          const detectedObjects = predictions
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(pred => `${pred.class} (${(pred.score * 100).toFixed(1)}%)`)
            .join(', ');
          setVerificationStatus(`🔍 Detected: ${detectedObjects}`);
        } else {
          setVerificationStatus('❌ No objects detected in image');
        }
        
        let detectionSuccess = false;
        let targetFound = null;
        
        if (currentVerificationTask.verificationTarget === 'bicycle') {
          const bicyclePrediction = predictions.find(pred => 
            pred.class === 'bicycle' && pred.score > 0.5
          );
          detectionSuccess = !!bicyclePrediction;
          if (bicyclePrediction) {
            targetFound = `bicycle (${(bicyclePrediction.score * 100).toFixed(1)}%)`;
          }
        } else if (currentVerificationTask.verificationTarget === 'recycling_bin') {
          const recyclableClasses = [
            'bottle', 'wine glass', 'cup', 'can', 'bowl', 'cell phone', 'laptop', 
            'keyboard', 'mouse', 'remote', 'tv', 'book', 'scissors', 'toothbrush', 'hair drier'
          ];
          const recyclablePrediction = predictions.find(pred =>
            recyclableClasses.includes(pred.class) && pred.score > 0.3
          );
          detectionSuccess = !!recyclablePrediction;
          if (recyclablePrediction) {
            targetFound = `${recyclablePrediction.class} (${(recyclablePrediction.score * 100).toFixed(1)}%)`;
          }
        }
        
        if (detectionSuccess) {
          const co2Amount = currentVerificationTask.displayUnit === 'g' 
            ? `${(currentVerificationTask.carbonSavingKg * 1000).toFixed(1)}g`
            : `${currentVerificationTask.carbonSavingKg.toFixed(1)}kg`;
          setVerificationStatus(`✅ I see a ${targetFound}! You just saved ${co2Amount} CO₂!`);
          setTimeout(async () => {
            await toggleTaskCompletion(currentVerificationTask.id);
            closeCameraModal();
          }, 2000);
        } else {
          const targetType = currentVerificationTask.verificationTarget === 'bicycle' ? 'bicycle' : 'recyclable item';
          let errorMessage = `❌ No ${targetType} detected.`;
          
          if (predictions.length > 0) {
            const detectedObjects = predictions
              .sort((a, b) => b.score - a.score)
              .slice(0, 2)
              .map(pred => `${pred.class} (${(pred.score * 100).toFixed(1)}%)`)
              .join(', ');
            errorMessage += ` I see: ${detectedObjects}. Please try again with a clearer photo.`;
          } else {
            errorMessage += ` Please try again with a clearer photo.`;
          }
          
          setVerificationStatus(errorMessage);
        }
      };
      
      img.src = capturedImage;
      
    } catch (error) {
      console.error('🚨 AI Detection failed:', error);
      setVerificationStatus('❌ AI detection failed. Please try again.');
    }
  };

  const closeCameraModal = () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }
    setShowCameraModal(false);
    setCapturedImage(null);
    setCurrentVerificationTask(null);
  };

  const checkCarbonIntensity = async (task) => {
    setCurrentVerificationTask(task);
    setShowCarbonModal(true);
    
    try {
      const response = await fetch('/api/opennem?metrics=power,emissions&interval=1h&hours=24');
      const data = await response.json();
      
      if (data.success) {
        const intensity = calculateCarbonIntensity(data.data);
        await displayCarbonStatus(intensity, task);
      } else {
        await displayCarbonStatus('medium', task);
      }
    } catch (error) {
      console.error('Carbon intensity check failed:', error);
      await displayCarbonStatus('medium', task);
    }
  };

  const calculateCarbonIntensity = (data) => {
    const now = new Date().getHours();
    if (now >= 10 && now <= 14) return 'low';
    if (now >= 18 && now <= 22) return 'high';
    return 'medium';
  };

  const displayCarbonStatus = async (intensity, task) => {
    const statusMessages = {
      low: '✅ Perfect timing! Carbon intensity is LOW. Complete for full points!',
      medium: '⚡ Moderate carbon intensity. Complete for half points?',
      high: '❌ High carbon intensity. Wait for cleaner energy times.'
    };
    
    const message = statusMessages[intensity] || statusMessages.medium;
    
    if (intensity === 'low') {
      if (confirm(message)) {
        toggleTaskCompletion(task.id);
        setShowCarbonModal(false);
      }
    } else if (intensity === 'medium') {
      if (confirm(message)) {
        await addTaskActivity(task, task.points / 2);
        updateDailyStats(task.carbonSavingKg / 2, task.points / 2);
        toggleTaskCompletion(task.id);
        setShowCarbonModal(false);
      }
    } else {
      alert(message);
      setShowCarbonModal(false);
    }
  };

  const resetUserProgress = () => {
    const resetStats = {
      co2Saved: 0,
      dayStreak: 0,
      dailyGoal: 2.5,
      completedTasks: 0
    };
    setDailyStats(resetStats);
    localStorage.setItem('dailyStats', JSON.stringify(resetStats));

    setCoralHealth(0);

    const resetTasks = CORAL_TASKS.map(task => ({ ...task, completed: false, completedAt: null }));
    setTasks(resetTasks);
    localStorage.removeItem('coralTasksData');

    localStorage.removeItem('lastActiveDate');
    localStorage.removeItem('joinedChallenges');
    localStorage.removeItem('challengeProgress');

    console.log('User progress reset to 0');
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
      <header className="header">
        <div className="header-content">
          <div className="hamburger-menu">
            <Link href="/community">
              <i className="fas fa-users" style={{ color: 'white', cursor: 'pointer' }}></i>
            </Link>
          </div>
          <div className="user-profile">
            <i className="fas fa-user-circle" style={{ color: 'white', fontSize: '24px' }}></i>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="impact-display">
          <div className="impact-circle">
            <div className="progress-ring" style={{ position: 'relative', display: 'inline-block' }}>
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
                  strokeDasharray="565.48"
                  style={{
                    strokeDashoffset: `${565.48 * (1 - coralHealth / 100)}`
                  }}
                />
              </svg>
              <div className="impact-icon" style={{
                width: `${120 + (coralHealth * 1.2)}px`,
                height: `${120 + (coralHealth * 1.2)}px`,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: coralHealth < 33 ? 'linear-gradient(135deg, #e0f2fe, #bae6fd)' :
                           coralHealth < 66 ? 'linear-gradient(135deg, #bbf7d0, #86efac)' :
                           'linear-gradient(135deg, #4ade80, #22c55e)',
                boxShadow: `0 4px ${20 + (coralHealth * 0.3)}px rgba(74, 222, 128, ${0.2 + (coralHealth * 0.003)})`,
                transition: 'all 0.8s ease-in-out',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: `${30 + (coralHealth * 1.4)}px`,
                  transition: 'all 0.8s ease-in-out',
                  opacity: coralHealth > 0 ? 1 : 0.3,
                  transform: coralHealth > 0 ? 'scale(1)' : 'scale(0.8)',
                  zIndex: 2,
                  lineHeight: 1,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%'
                }}>
                  {coralHealth === 0 ? '🌱' :
                   coralHealth < 25 ? '🌿' :
                   coralHealth < 50 ? '🌾' :
                   coralHealth < 75 ? '🌺' :
                   coralHealth < 100 ? '🌸' : '🌊'
                  }
                </div>

                {/* Coral growth particles */}
                {coralHealth > 10 && (
                  <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '20%',
                    fontSize: `${10 + (coralHealth * 0.2)}px`,
                    opacity: 0.6,
                    animation: 'float 3s ease-in-out infinite',
                    animationDelay: '0s'
                  }}>
                    ✨
                  </div>
                )}
                {coralHealth > 30 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '15%',
                    right: '25%',
                    fontSize: `${8 + (coralHealth * 0.15)}px`,
                    opacity: 0.5,
                    animation: 'float 4s ease-in-out infinite',
                    animationDelay: '1s'
                  }}>
                    🌊
                  </div>
                )}
                {coralHealth > 60 && (
                  <div style={{
                    position: 'absolute',
                    top: '25%',
                    right: '15%',
                    fontSize: `${12 + (coralHealth * 0.1)}px`,
                    opacity: 0.7,
                    animation: 'float 2.5s ease-in-out infinite',
                    animationDelay: '2s'
                  }}>
                    🐠
                  </div>
                )}
                {coralHealth > 80 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '25%',
                    left: '15%',
                    fontSize: `${6 + (coralHealth * 0.08)}px`,
                    opacity: 0.6,
                    animation: 'float 3.5s ease-in-out infinite',
                    animationDelay: '0.5s'
                  }}>
                    🐟
                  </div>
                )}
              </div>
            </div>
            <div className="impact-text">
              <div className="impact-percentage">{Math.round(coralHealth)}%</div>
              <div className="impact-label">2.5kg CO₂ Goal</div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card co2-saved">
              <div className="stat-value">{Math.abs(dailyStats.co2Saved).toFixed(1)}kg</div>
              <div className="stat-label">CO₂ Saved Today</div>
            </div>
            <div className="stat-card day-streak">
              <div className="stat-value">🔥 {dailyStats.dayStreak}</div>
              <div className="stat-label">Day Streak</div>
            </div>
          </div>
        </section>

        <section className="tasks-section">
          <div className="section-header">
              <h2>Today's Tasks</h2>
            <a href="#" className="view-all">View All</a>
            </div>
          <div className="tasks-list" id="tasksList">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.completed ? 'completed-task' : ''}`}
                onClick={() => handleTaskClick(task)}
                style={task.completed ? {
                  opacity: '0.4',
                  backgroundColor: '#e5e5e5',
                  border: '2px solid #ccc',
                  pointerEvents: 'none',
                  filter: 'grayscale(100%)',
                  transform: 'scale(0.98)'
                } : {}}
              >
                <div className={`task-icon ${task.icon}`} style={task.completed ? { backgroundColor: '#bbb', color: '#888' } : {}}>
                  <i className={task.iconClass}></i>
            </div>
                <div className="task-content">
                  <div className="task-title" style={task.completed ? { textDecoration: 'line-through', color: '#666' } : {}}>{task.title}</div>
                  <div className="task-description" style={task.completed ? { color: '#888' } : {}}>{task.description}</div>
          </div>
                <div className="task-right">
                  <div className="task-co2" style={task.completed ? { color: '#888' } : {}}>
                    -{task.displayUnit === 'g'
                      ? `${(task.carbonSavingKg * 1000).toFixed(1)}g`
                      : `${task.carbonSavingKg.toFixed(1)}kg`} CO₂
                </div>
                  <div className={`task-status ${task.completed ? 'completed' : ''}`}>
                    {task.completed ? '✓' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>


      {showPointsPopup && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              color: 'white',
          padding: '15px 25px',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(74, 222, 128, 0.3)',
          zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
          gap: '10px',
          animation: 'slideIn 0.3s ease-out',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '24px' }}>🎉</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>+{pointsGained} Points!</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Great job!</div>
          </div>
        </div>
      )}

      {showCameraModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '15px',
            textAlign: 'center',
            maxWidth: '90%',
            width: '400px'
          }}>
            <h3>
              {currentVerificationTask?.verificationTarget === 'bicycle' 
                ? '🚴‍♀️ Verify: Ride \'n\' Shine' 
                : '♻️ Verify: Bin It to Win It'}
            </h3>
            <p style={{ marginBottom: '15px' }}>
              {currentVerificationTask?.verificationTarget === 'bicycle'
                ? 'Take a photo of a bicycle to complete this sustainable transport goal'
                : 'Take a photo of any recyclable item (bottle, can, cup, phone, etc.) to complete this goal'}
            </p>
            
            {!capturedImage ? (
              <div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    borderRadius: '8px',
                    marginBottom: '15px'
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                    onClick={capturePhoto}
                    style={{
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    📸 Capture Photo
            </button>
            <button 
                    onClick={closeCameraModal}
                    style={{
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Cancel
                </button>
              </div>
              </div>
            ) : (
              <div>
                <img
                  src={capturedImage}
                  alt="Captured"
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    borderRadius: '8px',
                    marginBottom: '15px'
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
                    onClick={verifyPhoto}
                    style={{
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Verify Photo
            </button>
            <button 
                    onClick={() => setCapturedImage(null)}
                    style={{
                      background: '#FFC107',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    📸 Retake
            </button>
            <button 
                    onClick={closeCameraModal}
                    style={{
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Cancel
            </button>
                </div>
              </div>
            )}
            {verificationStatus && (
              <div style={{ 
                marginTop: '15px', 
                fontWeight: 'bold',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: verificationStatus.includes('✅') ? '#d4edda' : 
                                verificationStatus.includes('❌') ? '#f8d7da' : 
                                verificationStatus.includes('🔍') ? '#d1ecf1' : '#fff3cd',
                color: verificationStatus.includes('✅') ? '#155724' : 
                       verificationStatus.includes('❌') ? '#721c24' : 
                       verificationStatus.includes('🔍') ? '#0c5460' : '#856404',
                border: `1px solid ${verificationStatus.includes('✅') ? '#c3e6cb' : 
                                    verificationStatus.includes('❌') ? '#f5c6cb' : 
                                    verificationStatus.includes('🔍') ? '#bee5eb' : '#ffeeba'}`,
                textAlign: 'center'
              }}>
                {verificationStatus}
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {showCarbonModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '15px',
            textAlign: 'center',
            maxWidth: '90%'
          }}>
            <h3>⚡ Carbon Intensity Check</h3>
            <p>Checking electricity grid...</p>
            <button 
              onClick={() => setShowCarbonModal(false)}
              style={{
                background: '#9E9E9E',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}