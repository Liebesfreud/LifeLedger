
// api/cron.js
// Deploy this to Vercel and set up a Cron Job to run it daily.
// Requires Environment Variables: SUPABASE_URL, SUPABASE_KEY

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    // 1. Fetch users and their related subscriptions
    // Supabase (PostgREST) allows nested selection based on foreign keys
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        username, 
        settings, 
        subscriptions (*)
      `);

    if (error) throw error;

    let logs = [];

    // 2. Iterate through users
    for (const user of users) {
      if (!user.settings?.telegramBotToken || !user.settings?.telegramChatId) {
        continue;
      }

      const { settings, subscriptions } = user;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const notifyDays = settings.defaultNotifyDays || 3;

      if (!subscriptions) continue;

      for (const sub of subscriptions) {
        const nextDate = new Date(sub.nextPaymentDate);
        nextDate.setHours(0, 0, 0, 0);

        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Notify if exactly match days before OR on the day
        if (diffDays === notifyDays || diffDays === 0) {
          const msg = `🔔 *Renew Reminder*\n\nYour subscription *${sub.name}* is renewing ${diffDays === 0 ? 'TODAY' : `in ${diffDays} days`}!\nAmount: ${sub.currency} ${sub.price}`;
          
          try {
            const resp = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: settings.telegramChatId,
                text: msg,
                parse_mode: 'Markdown'
              })
            });
            
            if (resp.ok) {
              logs.push(`Sent to ${user.username} for ${sub.name}`);
            } else {
              logs.push(`Failed for ${user.username}: Telegram API Error`);
            }
          } catch (e) {
            logs.push(`Failed for ${user.username}: ${e.message}`);
          }
        }
      }
    }

    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
