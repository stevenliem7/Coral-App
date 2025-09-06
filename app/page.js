'use client';

import { useEffect, useState, useRef } from 'react';

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
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const coralCanvasRef = useRef(null);
  
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

  // Initialize p5.js coral visualization with exact HTML implementation
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    
    const tryInitialize = () => {
      if (!coralCanvasRef.current) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Coral container not ready, retry ${retryCount}/${maxRetries}...`);
          setTimeout(tryInitialize, 100);
        }
        return;
      }

      // Load p5.js if not already loaded
      if (typeof window !== 'undefined' && !window.p5) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/p5@1.9.3/lib/p5.min.js';
        script.onload = () => initializeCoral();
        document.head.appendChild(script);
      } else if (window.p5) {
        initializeCoral();
      }
    };

    // Start trying to initialize immediately
    tryInitialize();

    function initializeCoral() {
      // Remove existing canvas if any
      const existingCanvas = coralCanvasRef.current.querySelector('canvas');
      if (existingCanvas) {
        existingCanvas.remove();
      }

      // Coral visualization variables - EXACT from HTML
      let coralPoints = 0;
      let coralMaxPoints = 200;
      let coralGrowth = 0;
      let coralTargetPoints = 0;
      let coralSeed = 42;
      let breezeT = 0;
      let coralCanvas;

      // Visual scales - coral 1.3x bigger - EXACT from HTML
      const baseLen = 26;  // 1.3x bigger (20 * 1.3 = 26)
      const minLen = 2.0;  // 1.3x bigger (1.5 * 1.3 = 1.95 ≈ 2.0)
      const maxDepth = 7;
      const splitAngle = Math.PI / 4;
      const sway = 0.15;
      const baseThickness = 3.5;  // 1.3x bigger (2.7 * 1.3 = 3.51 ≈ 3.5)

      // p5.js sketch - exact from HTML
      const sketch = (p) => {
        // Define setCoralPoints function - exact from HTML
        function setCoralPoints(points) {
          coralTargetPoints = Math.max(0, Math.min(points, coralMaxPoints));
        }

        function coralGrowthToColor(g) {
          // Coral bleaching to vibrant life progression - EXACT from HTML
          if (g < 0.05) {
            // Dead/bleached coral - very pale white/grey
            return p.color(220, 215, 210); // Bleached white
          } else if (g < 0.15) {
            // Starting to recover - pale grey to light brown
            const t = (g - 0.05) / 0.1;
            return p.lerpColor(p.color(220, 215, 210), p.color(180, 160, 140), t);
          } else if (g < 0.3) {
            // Early recovery - brown to pale green
            const t = (g - 0.15) / 0.15;
            return p.lerpColor(p.color(180, 160, 140), p.color(140, 170, 130), t);
          } else if (g < 0.5) {
            // Growing healthy - green to orange
            const t = (g - 0.3) / 0.2;
            return p.lerpColor(p.color(140, 170, 130), p.color(255, 150, 80), t);
          } else if (g < 0.75) {
            // Thriving - orange to pink
            const t = (g - 0.5) / 0.25;
            return p.lerpColor(p.color(255, 150, 80), p.color(255, 120, 160), t);
          } else {
            // Magnificent - pink to vibrant coral
            const t = (g - 0.75) / 0.25;
            return p.lerpColor(p.color(255, 120, 160), p.color(255, 90, 140), t);
          }
        }

        function easeOutCubic(t) { 
          return 1 - Math.pow(1 - t, 3); 
        }

        p.setup = () => {
          // Create bigger canvas - 1.3x larger (120 * 1.3 = 156) - EXACT from HTML
          coralCanvas = p.createCanvas(156, 156);
          coralCanvas.parent(coralCanvasRef.current);
          
          // Style the canvas - EXACT from HTML
          coralCanvas.elt.style.borderRadius = '50%';
          coralCanvas.elt.style.position = 'absolute';
          coralCanvas.elt.style.top = '50%';
          coralCanvas.elt.style.left = '50%';
          coralCanvas.elt.style.transform = 'translate(-50%, -50%)';
          coralCanvas.elt.style.zIndex = '10';
          
          p.pixelDensity(window.devicePixelRatio || 1);
          p.noiseSeed(coralSeed);
          p.randomSeed(coralSeed);
          
          // Start with no progress - coral will be visible due to 5% minimum growth
          setCoralPoints(0);
        };

        p.draw = () => {
          // Clear with transparent background - EXACT from HTML
          p.clear();
          
          coralPoints = p.lerp(coralPoints, coralTargetPoints, 0.06);
          const raw = p.constrain(coralPoints / coralMaxPoints, 0, 1);
          // Always show at least 5% growth so coral is visible
          coralGrowth = Math.max(0.05, easeOutCubic(raw));
          breezeT += 0.008;

          // Draw underwater background (circular) - EXACT from HTML
          p.push();
          p.noStroke();
          // Create circular mask effect - 1.3x bigger
          let gradient = p.drawingContext.createRadialGradient(78, 78, 0, 78, 78, 78);
          gradient.addColorStop(0, 'rgba(4, 21, 32, 0.9)');
          gradient.addColorStop(1, 'rgba(10, 37, 53, 0.9)');
          p.drawingContext.fillStyle = gradient;
          p.circle(78, 78, 156);
          p.pop();

          // Position coral at bottom center of circle - 1.3x bigger - EXACT from HTML
          p.push();
          p.translate(78, 124);

          // Draw simple seabed - 1.3x bigger - EXACT from HTML
          p.noStroke();
          p.fill(15, 35, 40, 120);
          p.arc(0, 0, 104, 39, 0, p.PI);

          // Draw coral - EXACT from HTML
          p.strokeCap(p.ROUND);
          const col = coralGrowthToColor(coralGrowth);
          const grey = p.color(120, 120, 130);
          const branchCol = p.lerpColor(grey, col, coralGrowth);

          drawCoralBranch({
            len: baseLen * (0.8 + 0.2 * coralGrowth), // Starts big (80%), grows slightly bigger
            angle: -Math.PI / 2,
            depth: 0,
            thickness: baseThickness * (1.2 - 0.4 * coralGrowth), // Starts thick, gets thinner as it recovers
            colorA: branchCol
          });

          p.pop();

          // Add fish - dead or alive based on coral health - EXACT from HTML
          drawFish();

          // Add some tiny bubbles - EXACT from HTML
          drawTinyBubbles();
        };

        function easeOutCubic(t) {
          return 1 - Math.pow(1 - t, 3);
        }

        function drawCoralBranch(opts) {
          const { len, angle, depth, thickness, colorA } = opts;

          if (len < minLen || depth > maxDepth) return;

          // More branches unlock as coral grows, but height stays same - EXACT from HTML
          const needed = depth === 0 ? 0.01 : 0.03 + depth * 0.08;
          if (coralGrowth < needed) {
            // Bleached/dead branches - very pale and translucent
            p.stroke(230, 225, 220, 80);
          } else {
            p.stroke(colorA);
          }
          p.strokeWeight(thickness);

          const n = p.noise(depth * 1.5, p.frameCount * 0.005 + depth);
          const bend = p.map(n, 0, 1, -sway, sway);
          const a = angle + bend + 0.1 * p.sin(breezeT + depth);

          const x2 = len * p.cos(a);
          const y2 = len * p.sin(a);
          p.line(0, 0, x2, y2);

          p.push();
          p.translate(x2, y2);

          // Coral tips - get bigger and more numerous - EXACT from HTML
          if (len < minLen * 4) {
            p.noStroke();
            const t = 0.8 + 0.2 * p.noise(p.frameCount * 0.03, depth);
            
            if (coralGrowth < 0.1) {
              // Dead coral tips - pale white/grey, bigger and more prominent when bleached
              const deadTip = p.lerpColor(p.color(240, 235, 230), p.color(210, 205, 200), t);
              p.fill(deadTip);
              // Bigger tips when bleached - looks like dead coral polyps
              p.circle(0, 0, 2 + coralGrowth * 2);
            } else {
              // Living coral tips - bright and colorful, smaller and more refined
              const brightTip = p.lerpColor(colorA, p.color(255, 200, 100), 0.4);
              const tip = p.lerpColor(p.color(200, 200, 210), brightTip, t * coralGrowth);
              p.fill(tip);
              // Smaller, more refined tips as it recovers
              p.circle(0, 0, 1 + coralGrowth * 2);
            }
          }

          // Branches get shorter but fatter as we go deeper - EXACT from HTML
          const childLen = len * (0.65 + 0.15 * p.noise(depth, p.frameCount * 0.015));
          const childThick = p.max(0.8, thickness * (0.8 - 0.1 * coralGrowth)); // Start thick, get more refined as it recovers

          // More splits as coral grows - creates bushier, wider coral - EXACT from HTML
          const maxSplits = depth < 2 ? 3 : (depth < 4 ? 4 : 2);
          const splits = Math.floor(2 + coralGrowth * (maxSplits - 2));
          
          for (let i = 0; i < splits; i++) {
            // Wider spread creates bushier coral that fills the circle
            const spread = splitAngle * (1 + 0.3 * coralGrowth) * (1 + 0.2 * p.noise(depth, i));
            const angleOffset = (i - (splits - 1) / 2) * spread;
            const aChild = a + angleOffset + 0.05 * i;
            
            drawCoralBranch({
              len: childLen,
              angle: aChild,
              depth: depth + 1,
              thickness: childThick,
              colorA
            });
          }

          p.pop();
        }

        function drawTinyBubbles() {
          p.push();
          p.noFill();
          p.stroke(200, 230, 255, 150);
          p.strokeWeight(1);
          
          for (let i = 0; i < 5; i++) {
            const x = 39 + 78 * p.noise(i * 2, p.frameCount * 0.01);
            const y = 26 + 104 * p.noise(i * 3 + 10, p.frameCount * 0.008);
            const size = 2 + 3 * p.noise(i * 5 + 20, p.frameCount * 0.012);
            p.circle(x, y, size);
          }
          p.pop();
        }

        function drawFish() {
          p.push();
          
          if (coralGrowth < 0.5) {
            // Dead fish floating around - belly up, pale - EXACT from HTML
            drawDeadFish();
          } else {
            // Living fish swimming - colorful and active - EXACT from HTML
            drawAliveFish();
          }
          
          p.pop();
        }

        function drawDeadFish() {
          // Draw 1-2 dead fish floating belly up - EXACT from HTML
          for (let i = 0; i < 2; i++) {
            p.push();
            
            // Slow, drifting movement - wider range, 1.3x bigger
            const fishX = 33 + 78 * p.noise(i * 3, p.frameCount * 0.003 + i);
            const fishY = 26 + 65 * p.noise(i * 4 + 5, p.frameCount * 0.002 + i);
            
            p.translate(fishX, fishY);
            
            // Belly-up rotation with slight drift
            p.rotate(p.PI + p.sin(p.frameCount * 0.01 + i) * 0.2);
            
            // Dead fish body - pale and lifeless
            p.fill(160, 160, 160, 200);
            p.noStroke();
            p.ellipse(0, 0, 13, 8); // 1.3x bigger (10*1.3=13, 6*1.3=8)
            
            // Dead fish tail
            p.fill(140, 140, 140, 180);
            p.triangle(-6.5, 0, -10.4, -2.6, -10.4, 2.6); // 1.3x bigger
            
            // X eyes for clearly dead fish - single X per eye
            p.stroke(100, 50, 50, 200);
            p.strokeWeight(1.3); // 1.3x bigger
            p.line(1.3, -1.3, 3.9, 1.3); // right eye X - 1.3x bigger
            p.line(3.9, -1.3, 1.3, 1.3);
            
            p.pop();
          }
        }

        function drawAliveFish() {
          // Draw 2-4 living fish swimming around - EXACT from HTML
          const numFish = Math.floor(2 + coralGrowth * 2); // 2-4 fish based on growth
          
          for (let i = 0; i < numFish; i++) {
            p.push();
            
            // Active swimming movement - wider range, 1.3x bigger
            const fishX = 26 + 91 * p.noise(i * 2, p.frameCount * 0.008 + i);
            const fishY = 20 + 78 * p.noise(i * 3 + 10, p.frameCount * 0.006 + i);
            
            p.translate(fishX, fishY);
            
            // Fish swimming direction - EXACT from HTML
            const swimAngle = p.noise(i * 5, p.frameCount * 0.01 + i) * p.PI * 2;
            p.rotate(swimAngle);
            
            // Colorful living fish - more vibrant and opaque - EXACT from HTML
            const fishHue = (i * 60 + p.frameCount * 0.5) % 360;
            p.fill(
              120 + 120 * p.sin(p.radians(fishHue)),
              140 + 100 * p.sin(p.radians(fishHue + 120)),
              200 + 55 * p.sin(p.radians(fishHue + 240)),
              220
            );
            p.noStroke();
            p.ellipse(0, 0, 13, 8); // 1.3x bigger (10*1.3=13, 6*1.3=8)
            
            // Living fish tail
            p.fill(
              100 + 100 * p.sin(p.radians(fishHue + 60)),
              120 + 80 * p.sin(p.radians(fishHue + 180)),
              180 + 40 * p.sin(p.radians(fishHue + 300)),
              200
            );
            p.triangle(-6.5, 0, -10.4, -2.6, -10.4, 2.6); // 1.3x bigger
            
            // Bigger living eye - more prominent
            p.fill(255, 255, 255, 250);
            p.circle(3, -0.5, 2.5);
            p.fill(0, 0, 0);
            p.circle(3.3, -0.5, 1);
            
            // Add colorful fins for more visibility
            p.fill(
              140 + 80 * p.sin(p.radians(fishHue + 180)),
              190 + 60 * p.sin(p.radians(fishHue + 300)),
              240 + 40 * p.sin(p.radians(fishHue + 60)),
              200
            );
            p.ellipse(0, 3, 5, 2.5); // bottom fin
            p.ellipse(0, -3, 5, 2.5); // top fin
            
            p.pop();
          }
        }

        // Global functions to update coral
        window.setCoralPoints = (points) => {
          setCoralPoints(points);
        };

        window.updateCoralDisplay = () => {
          // This will be called from React when health changes
        };
      };

      // Create p5 instance
      new window.p5(sketch);
    }

    // Cleanup function
    return () => {
      if (coralCanvasRef.current) {
        const canvas = coralCanvasRef.current.querySelector('canvas');
        if (canvas) {
          canvas.remove();
        }
      }
    };
  }, []); // Run once on mount

  // Update coral when health changes - using 0-200 scale like HTML version
  useEffect(() => {
    if (typeof window !== 'undefined' && window.setCoralPoints) {
      const coralPoints = Math.floor((coralHealth / 100) * 200);
      window.setCoralPoints(coralPoints);
    }
  }, [coralHealth]);
  
  const checkDailyReset = () => {
    // Only run on client side to avoid hydration mismatch
    if (typeof window === 'undefined') return;
    
    const today = new Date().toDateString();
    const lastActiveDate = localStorage.getItem('lastActiveDate');
    
    if (lastActiveDate !== today) {
      // New day - reset CO₂ saved and completed tasks
      const newStats = {
        ...dailyStats,
        co2Saved: 0,
        completedTasks: 0
      };
      setDailyStats(newStats);
      localStorage.setItem('dailyStats', JSON.stringify(newStats));
      localStorage.setItem('lastActiveDate', today);
      
      // Reset task completion status
      localStorage.removeItem('coralTasksData');
      const resetTasks = CORAL_TASKS.map(task => ({ ...task, completed: false }));
      setTasks(resetTasks);
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
    
    // For unlimited tasks, always add CO₂/points without toggling completion
    if (isUnlimited) {
      await addTaskActivity(task, task.points);
      updateDailyStats(task.carbonSavingKg, task.points);
      return;
    }

    // For regular tasks, toggle completion
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? {
        ...t,
        completed: !t.completed,
        completedAt: !t.completed ? new Date().toISOString() : null
      } : t
    );
    
    setTasks(updatedTasks);
    
    // Save completion status
    const taskCompletionStatus = {};
    updatedTasks.forEach(t => {
      taskCompletionStatus[t.id] = t.completed;
      if (t.completedAt) {
        taskCompletionStatus[`${t.id}_completedAt`] = t.completedAt;
      }
    });
    localStorage.setItem('coralTasksData', JSON.stringify(taskCompletionStatus));

    // Update stats and database
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
    
    // Update coral health based on CO₂ progress
    const progress = Math.min(100, (newStats.co2Saved / newStats.dailyGoal) * 100);
    setCoralHealth(progress);
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
          userId: 11, // User "YOU" will be ID 11
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

  // Camera verification functions
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
      
      // Load TensorFlow.js COCO-SSD model for real AI detection
      if (!window.cocoModel) {
        setVerificationStatus('📥 Loading TensorFlow.js library...');
        
        // Dynamically load TensorFlow.js
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
      
      // Create image element for detection
      const img = new Image();
      img.onload = async () => {
        const predictions = await window.cocoModel.detect(img);
        
        // Show detected objects with confidence
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
          
          // Show what was detected instead
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

  // Carbon intensity checking
  const checkCarbonIntensity = async (task) => {
    setCurrentVerificationTask(task);
    setShowCarbonModal(true);
    
    try {
      const response = await fetch('/api/opennem?metrics=power,emissions&interval=1h&hours=24');
      const data = await response.json();
      
      if (data.success) {
        // Process real data and determine carbon intensity
        const intensity = calculateCarbonIntensity(data.data);
        await displayCarbonStatus(intensity, task);
      } else {
        // Fallback to simulation
        await displayCarbonStatus('medium', task);
      }
    } catch (error) {
      console.error('Carbon intensity check failed:', error);
      await displayCarbonStatus('medium', task);
    }
  };

  const calculateCarbonIntensity = (data) => {
    // Simplified calculation - in reality this would be more complex
    const now = new Date().getHours();
    if (now >= 10 && now <= 14) return 'low'; // Solar peak hours
    if (now >= 18 && now <= 22) return 'high'; // Peak demand hours
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
        // Give half points for medium intensity
        await addTaskActivity(task, task.points / 2);
        updateDailyStats(task.carbonSavingKg / 2, task.points / 2);
        setShowCarbonModal(false);
      }
    } else {
      alert(message);
      setShowCarbonModal(false);
    }
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
      {/* Header with Community Button */}
      <header className="header">
        <div className="header-content">
          <div className="hamburger-menu">
            <button 
              onClick={() => window.location.href = '/community'}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
            >
              <i className="fas fa-users"></i>
            </button>
          </div>
          <div className="logo">
            <h1>Coral</h1>
            <p className="subtitle">Today's Impact</p>
          </div>
          <div className="user-profile">
            <i className="fas fa-user-circle" style={{ color: 'white', fontSize: '24px' }}></i>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Impact Display - EXACT from HTML */}
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
                  strokeDasharray="565.48"
                  style={{
                    strokeDashoffset: `${565.48 * (1 - coralHealth / 100)}`
                  }}
                />
              </svg>
              <div className="impact-icon" ref={coralCanvasRef} id="coral-container">
                {/* Coral visualization will be inserted here */}
              </div>
            </div>
            <div className="impact-text">
              <div className="impact-percentage">{Math.round(coralHealth)}%</div>
              <div className="impact-label">2.5kg CO₂ Goal</div>
            </div>
          </div>
        </section>

        {/* Statistics Cards - EXACT from HTML */}
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

        {/* Today's Tasks - EXACT from HTML */}
        <section className="tasks-section">
          <div className="section-header">
              <h2>Today's Tasks</h2>
            <a href="#" className="view-all">View All</a>
            </div>
          <div className="tasks-list" id="tasksList">
            {tasks.map((task) => (
              <div key={task.id} className="task-card" onClick={() => handleTaskClick(task)}>
                <div className={`task-icon ${task.icon}`}>
                  <i className={task.iconClass}></i>
            </div>
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  <div className="task-description">{task.description}</div>
          </div>
                <div className="task-right">
                  <div className="task-co2">
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

      {/* Bottom Navigation - EXACT from HTML */}
      <nav className="bottom-nav">
        <a href="#" className="nav-item active">
          <i className="fas fa-home"></i>
          <span>Home</span>
        </a>
        <a href="#" className="nav-item">
          <i className="fas fa-leaf"></i>
          <span>Tasks</span>
        </a>
        <a href="#" className="nav-item">
          <i className="fas fa-chart-line"></i>
          <span>Progress</span>
        </a>
        <a href="#" className="nav-item">
          <i className="fas fa-users"></i>
          <span>Community</span>
        </a>
      </nav>

      {/* Camera Modal */}
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

      {/* Carbon Intensity Modal */}
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