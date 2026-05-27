import axios from 'axios';

interface TeamsMessage {
  body: {
    content: string;
    contentType: string;
  };
}

/**
 * Send a message to Teams chat using Microsoft Graph API
 * @param accessToken - User's access token for Microsoft Graph
 * @param chatId - Teams chat ID
 * @param message - Message content
 * @returns Message ID or error
 */
export async function sendTeamsMessage(
  accessToken: string,
  chatId: string,
  message: TeamsMessage
): Promise<{ messageId: string; success: boolean; error?: string }> {
  try {
    const response = await axios.post(
      `https://graph.microsoft.com/v1.0/chats/${chatId}/messages`,
      message,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      messageId: response.data.id,
      success: true,
    };
  } catch (error: any) {
    console.error('Teams message sending failed:', error.response?.data || error.message);
    return {
      messageId: '',
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

/**
 * Format weekly plan data into Teams message
 * @param plan - Weekly plan data
 * @returns Formatted Teams message
 */
export function formatWeeklyPlanToTeamsMessage(
  plan: {
    date: string;
    saat: string;
    subeAdi: string;
    plan: number;
    gerceklesen: number;
  }
): TeamsMessage {
  const status = plan.gerceklesen >= plan.plan ? '✅ Başarılı' : '⚠️ Eksik';
  const difference = plan.gerceklesen - plan.plan;

  const content = `
**Haftalık Plan Güncellemesi**

**Şube:** ${plan.subeAdi}
**Tarih:** ${plan.date}
**Saat:** ${plan.saat}

**Plan:** ${plan.plan}
**Gerçekleşen:** ${plan.gerceklesen}
**Fark:** ${difference > 0 ? '+' : ''}${difference}

**Durum:** ${status}
  `.trim();

  return {
    body: {
      content,
      contentType: 'text',
    },
  };
}

/**
 * Create a Teams chat from email addresses
 * @param accessToken - User's access token for Microsoft Graph
 * @param members - Array of email addresses
 * @returns Chat ID or error
 */
export async function createTeamsChat(
  accessToken: string,
  members: string[]
): Promise<{ chatId: string; success: boolean; error?: string }> {
  try {
    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/chats',
      {
        chatType: 'group',
        members: members.map((email) => ({
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users/${email}`,
        })),
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      chatId: response.data.id,
      success: true,
    };
  } catch (error: any) {
    console.error('Teams chat creation failed:', error.response?.data || error.message);
    return {
      chatId: '',
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
}
