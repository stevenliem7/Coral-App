'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CommunityPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinedChallenges, setJoinedChallenges] = useState({
    cycling: false,
    zerowaste: false
  });
  const [challengeProgress, setChallengeProgress] = useState({
    cycling: 68,
    zerowaste: 42
  });
  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/users?limit=10');
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.users);
      } else {
        setError(data.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // Load joined challenges from localStorage
    const savedJoinedChallenges = localStorage.getItem('joinedChallenges');
    if (savedJoinedChallenges) {
      setJoinedChallenges(JSON.parse(savedJoinedChallenges));
    }

    // Load challenge progress from localStorage
    const savedChallengeProgress = localStorage.getItem('challengeProgress');
    if (savedChallengeProgress) {
      setChallengeProgress(JSON.parse(savedChallengeProgress));
    }
  }, []);

  const joinChallenge = (challengeType, challengeName) => {
    if (!joinedChallenges[challengeType]) {
      // Mark challenge as joined
      const updatedJoined = { ...joinedChallenges, [challengeType]: true };
      setJoinedChallenges(updatedJoined);
      localStorage.setItem('joinedChallenges', JSON.stringify(updatedJoined));

      // Increase progress by 10%
      const currentProgress = challengeProgress[challengeType];
      const newProgress = Math.min(100, currentProgress + 10);
      const updatedProgress = { ...challengeProgress, [challengeType]: newProgress };
      setChallengeProgress(updatedProgress);
      localStorage.setItem('challengeProgress', JSON.stringify(updatedProgress));

      // Show success message
      alert(`Joined ${challengeName} challenge! 🚀\nYour participation increased the completion percentage!`);
    }
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="coral-spinner"></div>
          <p>Loading community...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <header className="header">
          <div className="header-content">
            <Link href="/" className="hamburger-menu">
              <i className="fas fa-arrow-left" style={{ color: 'white' }}></i>
            </Link>
            <div className="logo">
              <h1>Community</h1>
              <p className="subtitle">Leaderboard</p>
            </div>
            <div className="user-profile">
              <i className="fas fa-users" style={{ color: 'white' }}></i>
            </div>
          </div>
        </header>
        <main className="main-content">
          <div className="error-message">
            <h3>⚠️ Error Loading Leaderboard</h3>
            <p>{error}</p>
            <button onClick={fetchLeaderboard} className="retry-btn">
              <i className="fas fa-refresh"></i>
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Link href="/" className="hamburger-menu">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <div className="logo">
            <h1>Community</h1>
            <p className="subtitle">Leaderboard</p>
          </div>
          <div className="user-profile">
            <i className="fas fa-users"></i>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Community Stats */}
        <section className="community-stats">
          <div className="stats-grid">
            <div className="stat-card community-impact">
              <div className="stat-value">2,847</div>
              <div className="stat-label">Total CO₂ Saved (kg)</div>
            </div>
            <div className="stat-card community-members">
              <div className="stat-value">1,234</div>
              <div className="stat-label">Active Members</div>
            </div>
          </div>
        </section>

        {/* Leaderboard Section */}
        <section className="leaderboard-section">
          <div className="section-header">
            <h2>Top Contributors</h2>
            <button
              className="refresh-btn"
              onClick={fetchLeaderboard}
              disabled={isLoading}
            >
              <i className="fas fa-sync-alt"></i>
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="leaderboard">
            {leaderboard.map((member, index) => (
              <div key={member.id} className={`leaderboard-entry ${index < 3 ? 'top-three' : ''} ${member.username === 'YOU' ? 'current-user' : ''}`}>
                <div className="rank-section">
                  <div className={`rank ${index < 3 ? 'medal' : ''}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                </div>
                
                <div className="member-info">
                  <div className="member-avatar">
                    {member.avatar}
                  </div>
                  <div className="member-details">
                    <div className="member-name">{member.username}</div>
                    <div className="member-location">{member.location}</div>
                  </div>
                </div>
                
                <div className="member-stats">
                  <div className="stat-item">
                    <div className="stat-value">{member.total_points}</div>
                    <div className="stat-label">Points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Challenges Section */}
        <section className="challenges-section">
          <h3>Community Challenges</h3>
          <div className="challenges-grid">
            <div className="challenge-card">
              <div className="challenge-icon">
                <i className="fas fa-bicycle"></i>
              </div>
              <div className="challenge-content">
                <h3>Cycle to Work Week</h3>
                <p>Join 500+ members cycling to work this week</p>
                <div className="challenge-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${challengeProgress.cycling}%` }}></div>
                  </div>
                  <div className="progress-text">{challengeProgress.cycling}% Complete</div>
                </div>
                <button
                  className="join-challenge-btn"
                  onClick={() => joinChallenge('cycling', 'Cycle to Work Week')}
                  disabled={joinedChallenges.cycling}
                  style={{
                    background: joinedChallenges.cycling
                      ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                      : 'linear-gradient(135deg, #4ade80, #22c55e)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: joinedChallenges.cycling ? 'not-allowed' : 'pointer',
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    opacity: joinedChallenges.cycling ? 0.7 : 1
                  }}
                >
                  <i className={joinedChallenges.cycling ? 'fas fa-check' : 'fas fa-users'}></i>
                  {joinedChallenges.cycling ? '' : 'Join Initiative'}
                </button>
              </div>
            </div>
            
            <div className="challenge-card">
              <div className="challenge-icon">
                <i className="fas fa-recycle"></i>
              </div>
              <div className="challenge-content">
                <h3>Zero Waste Challenge</h3>
                <p>Reduce waste to zero for 7 days</p>
                <div className="challenge-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${challengeProgress.zerowaste}%` }}></div>
                  </div>
                  <div className="progress-text">{challengeProgress.zerowaste}% Complete</div>
                </div>
                <button
                  className="join-challenge-btn"
                  onClick={() => joinChallenge('zerowaste', 'Zero Waste Challenge')}
                  disabled={joinedChallenges.zerowaste}
                  style={{
                    background: joinedChallenges.zerowaste
                      ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                      : 'linear-gradient(135deg, #4ade80, #22c55e)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: joinedChallenges.zerowaste ? 'not-allowed' : 'pointer',
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    opacity: joinedChallenges.zerowaste ? 0.7 : 1
                  }}
                >
                  <i className={joinedChallenges.zerowaste ? 'fas fa-check' : 'fas fa-users'}></i>
                  {joinedChallenges.zerowaste ? '' : 'Join Initiative'}
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
