// apps/api/src/email/templates.ts
// Email templates for HabiTrack notifications
// All templates use simple string interpolation with {{variable}} syntax

/**
 * Email template definition
 */
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Replace template variables with values
 * Variables use {{variableName}} syntax
 */
export function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, string | number>,
): { subject: string; html: string; text: string } {
  const render = (str: string) => {
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = variables[key];
      // Escape HTML in values to prevent XSS
      if (value === undefined) return `{{${key}}}`;
      const strValue = String(value);
      return escapeHtml(strValue);
    });
  };

  return {
    subject: render(template.subject),
    html: render(template.html),
    text: render(template.text),
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, char => htmlEntities[char] || char);
}

/**
 * Common email wrapper with HabiTrack branding
 */
function wrapHtml(content: string, householdName?: string): string {
  const header = householdName || 'HabiTrack';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${header}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This notification was sent by HabiTrack.</p>
      <p>To manage your notification preferences, visit your Settings page.</p>
    </div>
  </div>
</body>
</html>`;
}

// =============================================================================
// CHORE TEMPLATES
// =============================================================================

export const CHORE_REMINDER: EmailTemplate = {
  subject: 'Reminder: {{choreName}} is due {{dueTime}}',
  html: wrapHtml(`
    <h2>Chore Reminder</h2>
    <p>Hi {{userName}},</p>
    <p>Just a reminder that <strong>{{choreName}}</strong> is due <strong>{{dueTime}}</strong>.</p>
    <p>Points: {{points}}</p>
  `),
  text: `Hi {{userName}},

Just a reminder that {{choreName}} is due {{dueTime}}.

Points: {{points}}

- HabiTrack`,
};

export const CHORE_ASSIGNED: EmailTemplate = {
  subject: 'New Chore Assigned: {{choreName}}',
  html: wrapHtml(`
    <h2>New Chore Assigned</h2>
    <p>Hi {{userName}},</p>
    <p>You've been assigned a new chore: <strong>{{choreName}}</strong></p>
    <p>Due: {{dueDate}}</p>
    <p>Points: {{points}}</p>
    <p>{{description}}</p>
  `),
  text: `Hi {{userName}},

You've been assigned a new chore: {{choreName}}

Due: {{dueDate}}
Points: {{points}}

{{description}}

- HabiTrack`,
};

export const CHORE_COMPLETED: EmailTemplate = {
  subject: 'Chore Update: {{choreName}}',
  html: wrapHtml(`
    <h2>Chore Update</h2>
    <p>Hi {{userName}},</p>
    <p>{{message}}</p>
    <p>Chore: <strong>{{choreName}}</strong></p>
    <p>Points: {{points}}</p>
  `),
  text: `Hi {{userName}},

{{message}}

Chore: {{choreName}}
Points: {{points}}

- HabiTrack`,
};

// =============================================================================
// EVENT TEMPLATES
// =============================================================================

export const EVENT_REMINDER: EmailTemplate = {
  subject: 'Reminder: {{eventName}} - {{eventTime}}',
  html: wrapHtml(`
    <h2>Event Reminder</h2>
    <p>Hi {{userName}},</p>
    <p>Reminder: <strong>{{eventName}}</strong> is happening <strong>{{eventTime}}</strong>.</p>
    <p>{{location}}</p>
    <p>{{description}}</p>
  `),
  text: `Hi {{userName}},

Reminder: {{eventName}} is happening {{eventTime}}.

Location: {{location}}

{{description}}

- HabiTrack`,
};

export const EVENT_CREATED: EmailTemplate = {
  subject: 'New Event: {{eventName}}',
  html: wrapHtml(`
    <h2>New Event Created</h2>
    <p><strong>{{createdBy}}</strong> created a new event: <strong>{{eventName}}</strong></p>
    <p>When: {{eventTime}}</p>
    <p>{{location}}</p>
  `),
  text: `{{createdBy}} created a new event: {{eventName}}

When: {{eventTime}}
Location: {{location}}

- HabiTrack`,
};

// =============================================================================
// SHOPPING TEMPLATES
// =============================================================================

export const SHOPPING_ITEM_ADDED: EmailTemplate = {
  subject: 'Shopping List: {{itemName}} added',
  html: wrapHtml(`
    <h2>Item Added to Shopping List</h2>
    <p><strong>{{addedBy}}</strong> added <strong>{{itemName}}</strong> to the shopping list.</p>
    <p>Category: {{category}}</p>
    <p>{{notes}}</p>
  `),
  text: `{{addedBy}} added {{itemName}} to the shopping list.

Category: {{category}}

{{notes}}

- HabiTrack`,
};

// =============================================================================
// MESSAGE TEMPLATES
// =============================================================================

export const NEW_MESSAGE: EmailTemplate = {
  subject: 'New message from {{senderName}}',
  html: wrapHtml(`
    <h2>New Message</h2>
    <p>You have a new message from <strong>{{senderName}}</strong>:</p>
    <blockquote style="border-left: 3px solid #10B981; padding-left: 15px; margin: 15px 0; color: #555;">
      {{messagePreview}}
    </blockquote>
  `),
  text: `New message from {{senderName}}:

"{{messagePreview}}"

- HabiTrack`,
};

// =============================================================================
// ACHIEVEMENT TEMPLATES
// =============================================================================

export const ACHIEVEMENT_EARNED: EmailTemplate = {
  subject: 'Achievement Unlocked: {{achievementName}}',
  html: wrapHtml(`
    <h2>Achievement Unlocked!</h2>
    <p>Congratulations, <strong>{{userName}}</strong>!</p>
    <p>You've earned a new achievement: <strong>{{achievementName}}</strong></p>
    <p>{{achievementDescription}}</p>
  `),
  text: `Congratulations, {{userName}}!

You've earned a new achievement: {{achievementName}}

{{achievementDescription}}

- HabiTrack`,
};

// =============================================================================
// SYSTEM TEMPLATES
// =============================================================================

export const TEST_EMAIL: EmailTemplate = {
  subject: 'HabiTrack Test Email',
  html: wrapHtml(`
    <h2>Test Email</h2>
    <p>This is a test email from HabiTrack.</p>
    <p>If you received this email, your email settings are configured correctly!</p>
    <p>Sent at: {{timestamp}}</p>
  `),
  text: `This is a test email from HabiTrack.

If you received this email, your email settings are configured correctly!

Sent at: {{timestamp}}

- HabiTrack`,
};

// =============================================================================
// ANNOUNCEMENT TEMPLATES
// =============================================================================

export const ANNOUNCEMENT: EmailTemplate = {
  subject: '📢 {{title}}',
  html: wrapHtml(`
    <h2>📢 Announcement</h2>
    <p>Hi {{userName}},</p>
    <p><strong>{{title}}</strong></p>
    <p>{{body}}</p>
    <p style="color: #666; font-size: 12px;">From: {{fromName}}</p>
  `),
  text: `📢 Announcement

Hi {{userName}},

{{title}}

{{body}}

From: {{fromName}}

- HabiTrack`,
};

// =============================================================================
// POINTS TEMPLATES
// =============================================================================

export const POINTS_ADJUSTED: EmailTemplate = {
  subject: 'Points Update: {{change}} points',
  html: wrapHtml(`
    <h2>Points Update</h2>
    <p>Hi {{userName}},</p>
    <p>Your points have been adjusted by <strong>{{change}}</strong> points.</p>
    <p>Reason: {{reason}}</p>
    <p>New total: <strong>{{newTotal}}</strong> points</p>
  `),
  text: `Hi {{userName}},

Your points have been adjusted by {{change}} points.

Reason: {{reason}}
New total: {{newTotal}} points

- HabiTrack`,
};

// =============================================================================
// CALENDAR TEMPLATES (ADDITIONAL)
// =============================================================================

export const EVENT_UPDATED: EmailTemplate = {
  subject: 'Event Updated: {{eventName}}',
  html: wrapHtml(`
    <h2>Event Updated</h2>
    <p>Hi {{userName}},</p>
    <p>The event <strong>{{eventName}}</strong> has been updated.</p>
    <p>{{message}}</p>
    <p>When: {{eventTime}}</p>
  `),
  text: `Hi {{userName}},

The event "{{eventName}}" has been updated.

{{message}}

When: {{eventTime}}

- HabiTrack`,
};

export const EVENT_CANCELLED: EmailTemplate = {
  subject: 'Event Cancelled: {{eventName}}',
  html: wrapHtml(`
    <h2>Event Cancelled</h2>
    <p>Hi {{userName}},</p>
    <p>The event <strong>{{eventName}}</strong> has been cancelled.</p>
    <p>Original time: {{eventTime}}</p>
  `),
  text: `Hi {{userName}},

The event "{{eventName}}" has been cancelled.

Original time: {{eventTime}}

- HabiTrack`,
};

// =============================================================================
// MEAL TEMPLATES
// =============================================================================

export const MEAL_FINALIZED: EmailTemplate = {
  subject: 'Meal Decided: {{mealName}} for {{mealDate}}',
  html: wrapHtml(`
    <h2>Meal Decision</h2>
    <p>Hi {{userName}},</p>
    <p>The meal for <strong>{{mealDate}}</strong> has been decided:</p>
    <p style="font-size: 18px;"><strong>{{mealName}}</strong></p>
  `),
  text: `Hi {{userName}},

The meal for {{mealDate}} has been decided: {{mealName}}

- HabiTrack`,
};

export const RECIPE_STATUS: EmailTemplate = {
  subject: 'Recipe {{status}}: {{recipeName}}',
  html: wrapHtml(`
    <h2>Recipe {{status}}</h2>
    <p>Hi {{userName}},</p>
    <p>Your recipe <strong>{{recipeName}}</strong> has been {{status}}.</p>
    <p>{{message}}</p>
  `),
  text: `Hi {{userName}},

Your recipe "{{recipeName}}" has been {{status}}.

{{message}}

- HabiTrack`,
};

export const VOTING_OPENED: EmailTemplate = {
  subject: 'Vote Now: What should we have for {{mealDate}}?',
  html: wrapHtml(`
    <h2>Voting Open!</h2>
    <p>Hi {{userName}},</p>
    <p>Voting is now open for the meal on <strong>{{mealDate}}</strong>.</p>
    <p>Cast your vote before {{deadline}}!</p>
  `),
  text: `Hi {{userName}},

Voting is now open for the meal on {{mealDate}}.

Cast your vote before {{deadline}}!

- HabiTrack`,
};

// =============================================================================
// STORE/SHOPPING TEMPLATES
// =============================================================================

export const STORE_REQUEST: EmailTemplate = {
  subject: 'Store Request: {{storeName}}',
  html: wrapHtml(`
    <h2>Store Request</h2>
    <p>Hi {{userName}},</p>
    <p>Your request for store <strong>{{storeName}}</strong> has been {{status}}.</p>
    <p>{{message}}</p>
  `),
  text: `Hi {{userName}},

Your store request for "{{storeName}}" has been {{status}}.

{{message}}

- HabiTrack`,
};

// =============================================================================
// FAMILY TEMPLATES
// =============================================================================

export const NEW_FAMILY_MEMBER: EmailTemplate = {
  subject: 'New Family Member: {{memberName}} joined!',
  html: wrapHtml(`
    <h2>New Family Member!</h2>
    <p>Hi {{userName}},</p>
    <p><strong>{{memberName}}</strong> has joined the family!</p>
    <p>They can now access HabiTrack and participate in family activities.</p>
  `),
  text: `Hi {{userName}},

{{memberName}} has joined the family!

They can now access HabiTrack and participate in family activities.

- HabiTrack`,
};

export const WELCOME_MEMBER: EmailTemplate = {
  subject: 'Welcome to {{householdName}} on HabiTrack!',
  html: wrapHtml(`
    <h2>Welcome to the Family!</h2>
    <p>Hi <strong>{{memberName}}</strong>,</p>
    <p>You've been added to <strong>{{householdName}}</strong> on HabiTrack by {{adminName}}.</p>
    <p>Here are your login details:</p>
    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 5px 0;"><strong>Login URL:</strong> {{loginUrl}}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> {{memberEmail}}</p>
      <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e0e0e0; padding: 2px 8px; border-radius: 4px; font-size: 16px;">{{tempPassword}}</code></p>
    </div>
    <p style="color: #e74c3c;"><strong>Important:</strong> You will be asked to change your password on first login.</p>
    <a href="{{loginUrl}}" class="button">Log In Now</a>
  `),
  text: `Hi {{memberName}},

You've been added to {{householdName}} on HabiTrack by {{adminName}}.

Here are your login details:

Login URL: {{loginUrl}}
Email: {{memberEmail}}
Temporary Password: {{tempPassword}}

IMPORTANT: You will be asked to change your password on first login.

- HabiTrack`,
};

// =============================================================================
// PAID CHORES TEMPLATES
// =============================================================================

export const PAID_CHORE_AVAILABLE: EmailTemplate = {
  subject: '💰 New Paid Chore: {{choreName}} - ${{amount}}',
  html: wrapHtml(`
    <h2>💰 New Paid Chore Available!</h2>
    <p>Hi {{userName}},</p>
    <p>A new paid chore is available: <strong>{{choreName}}</strong></p>
    <p>Reward: <strong>\${{amount}}</strong></p>
    <p>{{description}}</p>
  `),
  text: `Hi {{userName}},

A new paid chore is available: {{choreName}}

Reward: \${{amount}}

{{description}}

- HabiTrack`,
};

export const PAID_CHORE_UPDATE: EmailTemplate = {
  subject: 'Paid Chore Update: {{choreName}}',
  html: wrapHtml(`
    <h2>Paid Chore Update</h2>
    <p>Hi {{userName}},</p>
    <p>Update on <strong>{{choreName}}</strong>:</p>
    <p>{{message}}</p>
  `),
  text: `Hi {{userName}},

Update on "{{choreName}}":

{{message}}

- HabiTrack`,
};

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

export const EMAIL_TEMPLATES = {
  CHORE_REMINDER,
  CHORE_ASSIGNED,
  CHORE_COMPLETED,
  EVENT_REMINDER,
  EVENT_CREATED,
  EVENT_UPDATED,
  EVENT_CANCELLED,
  SHOPPING_ITEM_ADDED,
  NEW_MESSAGE,
  ACHIEVEMENT_EARNED,
  ANNOUNCEMENT,
  POINTS_ADJUSTED,
  MEAL_FINALIZED,
  RECIPE_STATUS,
  VOTING_OPENED,
  STORE_REQUEST,
  NEW_FAMILY_MEMBER,
  WELCOME_MEMBER,
  PAID_CHORE_AVAILABLE,
  PAID_CHORE_UPDATE,
  TEST_EMAIL,
} as const;

export type EmailTemplateType = keyof typeof EMAIL_TEMPLATES;
