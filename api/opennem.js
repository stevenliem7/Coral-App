// Vercel serverless function to proxy OpenNEM API requests
// This avoids CORS issues by making server-side requests

export default async function handler(req, res) {
    // Enable CORS for our frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        // Get query parameters with proper defaults
        const { 
            metrics = 'power,emissions', 
            interval = '1h', 
            hours = '24' 
        } = req.query;
        
        // Calculate time range
        const endTime = new Date().toISOString();
        const startTime = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000).toISOString();
        
        // Build proper OpenNEM API URL (correct endpoint structure)
        const baseUrl = 'https://api.openelectricity.org.au';
        const endpoint = '/data/network/NEM'; // Correct endpoint without v4 prefix
        
        // Build URL with proper parameter encoding
        const params = new URLSearchParams({
            metrics: metrics,
            interval: interval,
            date_start: startTime,
            date_end: endTime
        });
        
        const apiUrl = `${baseUrl}${endpoint}?${params.toString()}`;
        
        console.log('Fetching from OpenNEM:', apiUrl);
        console.log('Using metrics:', metrics);
        console.log('Time range:', { startTime, endTime });
        
        // Make request to OpenNEM API with authentication
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer oe_3ZToEwocKDaAxZ8FKRDjw2F7',
                'User-Agent': 'CoralCollective-App/1.0'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenNEM API error:', response.status, errorText);
            throw new Error(`OpenNEM API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Return the data with success flag
        res.status(200).json({
            success: true,
            source: 'OpenNEM Real Data',
            timestamp: new Date().toISOString(),
            data: data
        });
        
    } catch (error) {
        console.error('Proxy error:', error);
        
        // Return error response
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'Proxy Error'
        });
    }
}
