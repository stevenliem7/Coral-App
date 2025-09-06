import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/users - Get leaderboard
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, avatar, location, total_points, created_at')
      .order('total_points', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Supabase error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch leaderboard'
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        users: users || [],
        total: users?.length || 0
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch leaderboard'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request) {
  try {
    const { username, email, avatar, location } = await request.json();

    if (!username) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Username is required'
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          email: email || null,
          avatar: avatar || '🌊',
          location: location || null,
          total_points: 0
        }
      ])
      .select('id, username, avatar, location, total_points')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Username already exists'
          }),
          { 
            status: 409, 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            } 
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create user'
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: user
      }),
      { 
        status: 201, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create user'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
}