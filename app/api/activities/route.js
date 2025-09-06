import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/activities - Add user activity and update points
export async function POST(request) {
  try {
    const { userId, activityType, pointsEarned, description } = await request.json();

    if (!userId || !activityType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User ID and activity type are required'
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

    // Start a transaction by inserting activity first
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert([
        {
          user_id: userId,
          activity_type: activityType,
          points_earned: pointsEarned || 0,
          description: description || null
        }
      ])
      .select('id, created_at')
      .maybeSingle();

    if (activityError) {
      console.error('Activity insert error:', activityError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to add activity'
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

    // Get current user points first
    const { data: currentUser, error: getUserError } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', userId)
      .maybeSingle();

    if (getUserError) {
      console.error('Get user error:', getUserError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to get user data'
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

    if (!currentUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User not found'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Update user's total points
    const newPoints = (currentUser.total_points || 0) + (pointsEarned || 0);
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({
        total_points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, username, total_points')
      .maybeSingle();

    if (userError) {
      console.error('User update error:', userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update user points'
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
        activity: activity,
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
        error: 'Failed to add activity'
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

// GET /api/activities - Get user activities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User ID is required'
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

    const { data: activities, error } = await supabase
      .from('activities')
      .select(`
        id,
        activity_type,
        points_earned,
        description,
        created_at,
        users!inner(username)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch activities'
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
        activities: activities || []
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
        error: 'Failed to fetch activities'
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