-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    avatar VARCHAR(10) DEFAULT '🌊',
    location VARCHAR(100),
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activities table to track user actions
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- Insert some sample data
INSERT INTO users (username, email, avatar, location, total_points) VALUES
('OceanGuardian', 'ocean@example.com', '🌊', 'Sydney, AU', 1250),
('GreenThumb', 'green@example.com', '🌱', 'Melbourne, AU', 1180),
('EcoWarrior', 'eco@example.com', '🛡️', 'Brisbane, AU', 1120),
('CoralLover', 'coral@example.com', '🪸', 'Perth, AU', 980),
('SustainableSteve', 'steve@example.com', '♻️', 'Adelaide, AU', 920),
('ClimateChampion', 'climate@example.com', '🏆', 'Hobart, AU', 850),
('EarthDefender', 'earth@example.com', '🌍', 'Darwin, AU', 780),
('GreenMachine', 'machine@example.com', '⚡', 'Canberra, AU', 720),
('OceanSaver', 'saver@example.com', '🐠', 'Gold Coast, AU', 680),
('EcoExplorer', 'explorer@example.com', '🔍', 'Newcastle, AU', 620)
ON CONFLICT (username) DO NOTHING;

-- Insert some sample activities
INSERT INTO activities (user_id, activity_type, points_earned, description) VALUES
(1, 'cycling', 50, 'Cycled to work'),
(1, 'recycling', 30, 'Recycled plastic bottles'),
(2, 'energy_saving', 40, 'Turned off lights'),
(2, 'public_transport', 60, 'Used bus instead of car'),
(3, 'water_saving', 25, 'Used reusable water bottle'),
(3, 'cycling', 50, 'Cycled to work'),
(4, 'recycling', 30, 'Recycled materials'),
(4, 'energy_saving', 40, 'Unplugged unused devices'),
(5, 'public_transport', 60, 'Used train'),
(5, 'cycling', 50, 'Cycled to work');
