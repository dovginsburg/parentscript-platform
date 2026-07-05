/**
 * ParentScript Slack App
 *
 * Features:
 * 1. `/parentscript search <query>` — search skills
 * 2. Therapist DMs for skill unlocks
 * 3. Crisis alert notifications
 * 4. Weekly practice log summaries
 *
 * Built with @slack/bolt framework
 */

import 'dotenv/config';
import { App, LogLevel } from '@slack/bolt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: process.env.NODE_ENV === 'development',
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
});

/**
 * /parentscript search <query>
 *
 * Search published skills and return top 5 results.
 */
app.command('/parentscript', async ({ command, ack, respond }) => {
  await ack();

  const query = command.text.trim();

  if (!query) {
    return respond({
      response_type: 'ephemeral',
      text: 'Usage: `/parentscript search <query>`\nExample: `/parentscript search tantrum`',
    });
  }

  try {
    // Search skills by title, goal, use_when, or say_this
    const { data: skills, error } = await supabase
      .from('skills')
      .select('id, slug, title, level, goal, use_when')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,goal.ilike.%${query}%,use_when.ilike.%${query}%`)
      .order('level', { ascending: true })
      .limit(5);

    if (error) throw error;

    if (!skills || skills.length === 0) {
      return respond({
        response_type: 'ephemeral',
        text: `No skills found for "${query}". Try a different search term.`,
      });
    }

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Found ${skills.length} skill${skills.length > 1 ? 's' : ''} for "${query}":*`,
        },
      },
      { type: 'divider' },
    ];

    for (const skill of skills) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `*<https://parentscript.app/app/skill/${skill.slug}|${skill.title}>* (Level ${skill.level})`,
            `_${skill.goal}_`,
            `**When to use:** ${skill.use_when}`,
          ].join('\n'),
        },
      });
    }

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '<https://parentscript.app|View all skills on ParentScript>',
        },
      ],
    });

    return respond({
      response_type: 'ephemeral',
      blocks,
    });
  } catch (error) {
    console.error('Slack command error:', error);
    return respond({
      response_type: 'ephemeral',
      text: '⚠️ Error searching skills. Please try again later.',
    });
  }
});

/**
 * Send skill unlock notification to therapist
 * Called from backend when a skill is unlocked
 */
export async function sendSkillUnlockNotification({ therapistSlackId, skillTitle, clientLabel }) {
  try {
    await app.client.chat.postMessage({
      channel: therapistSlackId,
      text: `✅ Skill unlocked for ${clientLabel}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Skill Unlocked* 🎯\n\nYou've unlocked *${skillTitle}* for *${clientLabel}*.\n\nThe parent can now access this skill on their app.`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View in ParentScript',
              },
              url: 'https://parentscript.app/app/therapist/clients',
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Failed to send skill unlock notification:', error);
  }
}

/**
 * Send crisis alert to therapist
 * Called from backend when safety-guard detects crisis situation
 */
export async function sendCrisisAlert({ therapistSlackId, clientLabel, situation, riskLevel }) {
  try {
    const emoji = riskLevel === 'high' ? '🚨' : '⚠️';

    await app.client.chat.postMessage({
      channel: therapistSlackId,
      text: `${emoji} Crisis alert for ${clientLabel}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *Crisis Alert* — ${clientLabel}\n\n*Risk Level:* ${riskLevel.toUpperCase()}\n\n*Situation:*\n> ${situation.substring(0, 500)}${situation.length > 500 ? '...' : ''}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '⚠️ This parent received crisis resources. Follow up as appropriate.',
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Client',
              },
              url: 'https://parentscript.app/app/therapist/clients',
              style: 'danger',
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Failed to send crisis alert:', error);
  }
}

/**
 * Send weekly practice summary
 * Called from scheduled job (cron)
 */
export async function sendWeeklyPracticeSummary({ therapistSlackId, therapistEmail }) {
  try {
    // Fetch therapist's clients and their practice logs from past 7 days
    const { data: therapist } = await supabase
      .from('therapists')
      .select('id')
      .eq('email', therapistEmail)
      .single();

    if (!therapist) return;

    const { data: clients } = await supabase
      .from('clients')
      .select(
        `
        id,
        label,
        practice_logs (
          id,
          skill_title,
          rating,
          created_at
        )
      `
      )
      .eq('therapist_id', therapist.id)
      .gte(
        'practice_logs.created_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (!clients || clients.length === 0) return;

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "*📊 Weekly Practice Summary*\n\nYour clients' practice activity over the past 7 days:",
        },
      },
      { type: 'divider' },
    ];

    for (const client of clients) {
      const logs = client.practice_logs || [];
      const avgRating =
        logs.length > 0
          ? (logs.reduce((sum, log) => sum + log.rating, 0) / logs.length).toFixed(1)
          : 'N/A';

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `*${client.label}*`,
            `• ${logs.length} practice session${logs.length !== 1 ? 's' : ''}`,
            `• Average rating: ${avgRating}/5`,
          ].join('\n'),
        },
      });
    }

    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Dashboard',
          },
          url: 'https://parentscript.app/app/therapist/clients',
        },
      ],
    });

    await app.client.chat.postMessage({
      channel: therapistSlackId,
      text: '📊 Weekly practice summary',
      blocks,
    });
  } catch (error) {
    console.error('Failed to send weekly practice summary:', error);
  }
}

// Start the app
(async () => {
  const port = process.env.SLACK_PORT || 3001;
  await app.start(port);
  console.log(`⚡️ ParentScript Slack app is running on port ${port}`);
})();

export default app;
