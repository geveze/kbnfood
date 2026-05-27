/**
 * Aksiyon Planı Mail Gönderme Sistemi
 * Manus SMTP kullanarak sorumlu kişiye mail gönderir
 */

import { invokeLLM } from "./_core/llm";

interface ActionPlanEmailData {
  recipientEmail: string;
  recipientName: string;
  questionText: string;
  actionDescription: string;
  actionDeadline?: string;
  branchName: string;
  photoUrls?: string[];
}

/**
 * Aksiyon planı mail'i gönder
 */
export async function sendActionPlanEmail(data: ActionPlanEmailData): Promise<void> {
  try {
    // @ts-ignore
    const nodemailer = await import('nodemailer');
    
    // Transporter oluştur
    const transporter = (nodemailer as any).default.createTransport({
      host: process.env.GMAIL_USER ? 'smtp.gmail.com' : 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: process.env.GMAIL_USER ? {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      } : {
        user: process.env.MAILGUN_DOMAIN?.split('@')[1],
        pass: process.env.MAILGUN_API_KEY,
      },
    });

    // Mail template'i oluştur
    const emailContent = generateEmailContent(data);

    // Mail gönder
    await transporter.sendMail({
      from: process.env.GMAIL_USER || `noreply@${process.env.MAILGUN_DOMAIN}`,
      to: data.recipientEmail,
      subject: `Yeni Aksiyon Planı - ${data.branchName}`,
      html: emailContent,
      replyTo: process.env.PERFORMANCE_MONITORING_EMAIL || 'noreply@kebanfood.com',
    });

    console.log(`Mail başarıyla gönderildi: ${data.recipientEmail}`);
  } catch (error) {
    console.error("Aksiyon planı mail gönderme hatası:", error);
    throw error;
  }
}

/**
 * Mail template'i oluştur
 */
function generateEmailContent(data: ActionPlanEmailData): string {
  const deadlineDate = data.actionDeadline
    ? new Date(data.actionDeadline).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Belirlenmedi";

  return `
    <!DOCTYPE html>
    <html dir="ltr" lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #dc2626;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 20px 0;
        }
        .field {
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }
        .field:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: bold;
          color: #dc2626;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .value {
          margin-top: 8px;
          padding: 10px;
          background-color: #f9f9f9;
          border-left: 3px solid #dc2626;
          border-radius: 4px;
        }
        .footer {
          background-color: #f4f4f4;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background-color: #dc2626;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 15px;
        }
        .photos-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #eee;
        }
        .photos-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 15px;
        }
        .photo-item {
          text-align: center;
        }
        .photo-item img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          border: 1px solid #ddd;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Yeni Aksiyon Planı</h1>
          <p>Keban Food Şube Performans Yönetim Sistemi</p>
        </div>
        
        <div class="content">
          <p>Merhaba <strong>${data.recipientName}</strong>,</p>
          
          <p>Size yeni bir aksiyon planı atanmıştır. Lütfen aşağıdaki detayları inceleyiniz.</p>
          
          <div class="field">
            <div class="label">📍 Şube</div>
            <div class="value">${data.branchName}</div>
          </div>
          
          <div class="field">
            <div class="label">❓ Soru</div>
            <div class="value">${data.questionText}</div>
          </div>
          
          <div class="field">
            <div class="label">📋 Aksiyon Açıklaması</div>
            <div class="value">${data.actionDescription.replace(/\n/g, "<br>")}</div>
          </div>
          
          <div class="field">
            <div class="label">📅 Son Tarih</div>
            <div class="value"><strong>${deadlineDate}</strong></div>
          </div>
          
          ${data.photoUrls && data.photoUrls.length > 0 ? `
          <div class="photos-section">
            <div class="label">📸 Denetim Görselleri</div>
            <div class="photos-grid">
              ${data.photoUrls.map((photoUrl, index) => `
                <div class="photo-item">
                  <img src="${photoUrl}" alt="Denetim Görseli ${index + 1}" style="max-width: 280px;">
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 4px; border-left: 4px solid #f59e0b;">
            <strong>⚠️ Önemli:</strong> Bu aksiyonu belirtilen tarihte tamamlamanız gerekmektedir. 
            Lütfen ilerleme durumunu düzenli olarak güncelleyiniz.
          </p>
        </div>
        
        <div class="footer">
          <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıt vermeyiniz.</p>
          <p>Keban Food Şube Performans Yönetim Sistemi © 2026</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
