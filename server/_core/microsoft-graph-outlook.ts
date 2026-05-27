import axios from 'axios';

interface OutlookEvent {
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  bodyPreview?: string;
  body?: {
    contentType: 'HTML' | 'text';
    content: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
    type: 'required' | 'optional' | 'resource';
  }>;
}

/**
 * Create an event in Outlook calendar using Microsoft Graph API
 * @param accessToken - User's access token for Microsoft Graph
 * @param event - Event details
 * @returns Event ID or error
 */
export async function createOutlookEvent(
  accessToken: string,
  event: OutlookEvent
): Promise<{ eventId: string; success: boolean; error?: string }> {
  try {
    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/me/events',
      event,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      eventId: response.data.id,
      success: true,
    };
  } catch (error: any) {
    console.error('Outlook event creation failed:', error.response?.data || error.message);
    return {
      eventId: '',
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

/**
 * Format weekly plan data into Outlook event
 * @param plan - Weekly plan data
 * @param userEmail - User's email address
 * @returns Formatted Outlook event
 */
export function formatWeeklyPlanToOutlookEvent(
  plan: {
    date: string;
    saat: string;
    subeAdi: string;
    plan: number;
    gerceklesen: number;
  },
  userEmail: string
): OutlookEvent {
  // Parse date and time
  const [year, month, day] = plan.date.split('-').map(Number);
  const [hour, minute] = plan.saat.split(':').map(Number);

  const startDate = new Date(year, month - 1, day, hour, minute);
  const endDate = new Date(year, month - 1, day, hour + 1, minute);

  const subject = `Haftalık Plan - ${plan.subeAdi}`;
  const content = `
    <p><strong>Şube:</strong> ${plan.subeAdi}</p>
    <p><strong>Tarih:</strong> ${plan.date}</p>
    <p><strong>Saat:</strong> ${plan.saat}</p>
    <p><strong>Plan:</strong> ${plan.plan}</p>
    <p><strong>Gerçekleşen:</strong> ${plan.gerceklesen}</p>
    <p><strong>Durum:</strong> ${plan.gerceklesen >= plan.plan ? 'Başarılı' : 'Eksik'}</p>
  `;

  return {
    subject,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'Turkey Standard Time',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'Turkey Standard Time',
    },
    body: {
      contentType: 'HTML',
      content,
    },
    attendees: [
      {
        emailAddress: {
          address: userEmail,
          name: 'Bölge Müdürü',
        },
        type: 'required',
      },
    ],
  };
}
