// Quick script to add "YOU" user to Supabase
import { supabase } from './lib/supabase.js';

async function addYouUser() {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username: 'YOU',
          email: 'you@coralcollective.app',
          avatar: '👤',
          location: 'Your Location',
          total_points: 0
        }
      ])
      .select();

    if (error) {
      console.error('Error adding user:', error);
    } else {
      console.log('User "YOU" added successfully:', data);
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

addYouUser();
