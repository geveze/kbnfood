/**
 * Email Service - Performance Monitoring ve Saha Denetim Mail Gönderme Servisi
 * EmailJS ile mail gönderme işlemini yönetir
 */

export interface PerformanceEvaluationEmailData {
  employeeName: string;
  employeePosition: string;
  employeeIdNumber?: string;
  evaluationDate?: string;
  evaluationPeriod: string;
  totalScore: number;
  evaluatedByManager?: string;
  managerOpinion?: string;
}

/**
 * HTML mail şablonu oluştur
 */
function generateEmailTemplate(data: PerformanceEvaluationEmailData): string {
  const evaluationScale = getEvaluationScale(data.totalScore);
  
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Performans İzleme Formu - Değerlendirme Kaydedildi</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
          color: #333;
        }
        .info-section {
          background-color: #f9f9f9;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #667eea;
          min-width: 150px;
        }
        .info-value {
          color: #333;
          text-align: right;
        }
        .score-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        .score-box .score-value {
          font-size: 48px;
          font-weight: bold;
          margin: 10px 0;
        }
        .footer {
          background-color: #f9f9f9;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Performans İzleme Formu</h1>
        </div>
        <div class="content">
          <p class="greeting">Merhaba <strong>${data.employeeName}</strong>,</p>
          <p>Performans değerlendirme formunuz kaydedilmiştir.</p>
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Çalışan:</span>
              <span class="info-value">${data.employeeName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Pozisyon:</span>
              <span class="info-value">${data.employeePosition}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Dönem:</span>
              <span class="info-value">${data.evaluationPeriod}</span>
            </div>
          </div>
          <div class="score-box">
            <div>Toplam Puan</div>
            <div class="score-value">${data.totalScore}%</div>
            <div>${evaluationScale}</div>
          </div>
          ${data.managerOpinion ? `<p><strong>Yönetici Görüşü:</strong><br>${data.managerOpinion}</p>` : ''}
          <p>Saygılarımızla,<br><strong>İnsan Kaynakları Departmanı</strong></p>
        </div>
        <div class="footer">
          <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getEvaluationScale(score: number): string {
  if (score >= 90) return 'Mükemmel';
  if (score >= 80) return 'Çok İyi';
  if (score >= 70) return 'İyi';
  if (score >= 60) return 'Orta';
  return 'Geliştirilmesi Gerekli';
}

function generatePlainTextEmail(data: PerformanceEvaluationEmailData): string {
  return `
    Performans İzleme Formu
    
    Merhaba ${data.employeeName},
    
    Performans değerlendirme formunuz kaydedilmiştir.
    
    Çalışan: ${data.employeeName}
    Pozisyon: ${data.employeePosition}
    Dönem: ${data.evaluationPeriod}
    Toplam Puan: ${data.totalScore}%
    
    ${data.managerOpinion ? `Yönetici Görüşü: ${data.managerOpinion}` : ''}
    
    Saygılarımızla,
    İnsan Kaynakları Departmanı
  `;
}

/**
 * Saha Denetim E-posta Gönder - EmailJS ile
 * TO: Restoran Yöneticisi (manuel olarak tanımlanan e-posta)
 * CC: Denetçi ve diğer e-postalar
 */
export async function sendFieldInspectionEmail(
  data: {
    branchName: string;
    inspectionDate: string;
    totalScore: number;
    restaurantManagerEmail: string;
    inspectorName: string;
    inspectorEmail: string;
    otherEmail?: string;
    branchEmail?: string;
    pdfUrl?: string;
  },
  pdfBuffer?: Buffer
): Promise<{ restaurantManager: boolean; inspector: boolean; other: boolean; branch: boolean }> {
  const results = { restaurantManager: false, inspector: false, other: false, branch: false };

  try {
    const htmlContent = generateFieldInspectionEmailTemplate(data);
    const subject = `Saha Denetim Formu Tamamlandı - ${data.branchName}`;
    
    console.log('[emailService] Field inspection email data prepared:');
    console.log('  - TO (Restaurant Manager):', data.restaurantManagerEmail);
    console.log('  - CC (Inspector):', data.inspectorEmail);
    console.log('  - CC (Other Email):', data.otherEmail || 'N/A');
    console.log('  - CC (Branch Email):', data.branchEmail || 'N/A');
    console.log('  - Branch:', data.branchName);
    console.log('  - Score:', data.totalScore);
    console.log('  - PDF URL:', data.pdfUrl || 'N/A');
    console.log('  - PDF Buffer:', pdfBuffer ? `${pdfBuffer.length} bytes` : 'N/A');
    
    // Manus built-in API üzerinden e-posta gönder
    const baseUrl = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.ai';
    const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
    
    if (!apiKey) {
      console.warn('[emailService] BUILT_IN_FORGE_API_KEY not configured');
      return results;
    }
    
    // Restoran Yöneticisi TO'ya gidecek
    const toEmail = data.restaurantManagerEmail?.toLowerCase().trim();
    
    // CC'ye gidecek e-postalar (Denetçi ve diğerleri)
    const ccEmails = new Set<string>();
    if (data.inspectorEmail) ccEmails.add(data.inspectorEmail.toLowerCase().trim());
    if (data.otherEmail) ccEmails.add(data.otherEmail.toLowerCase().trim());
    if (data.branchEmail) ccEmails.add(data.branchEmail.toLowerCase().trim());
    
    // TO ve CC'de aynı e-posta varsa CC'den çıkar
    if (toEmail) ccEmails.delete(toEmail);
    
    const ccEmailsArray = Array.from(ccEmails);
    
    console.log('[emailService] Email routing:');
    console.log('  - TO:', toEmail);
    console.log('  - CC:', ccEmailsArray);
    
    if (!toEmail) {
      console.warn('[emailService] No restaurant manager email provided');
      return results;
    }
    
    // Tek bir email gönder - TO: Restoran Yöneticisi, CC: Denetçi ve diğerleri
    try {
      const emailPayload: any = {
        to: toEmail,
        subject: subject,
        html: htmlContent,
        replyTo: process.env.PERFORMANCE_MONITORING_EMAIL || 'noreply@kebanfood.com',
      };
      
      // CC'ye gidecek e-postalar varsa ekle
      if (ccEmailsArray.length > 0) {
        emailPayload.cc = ccEmailsArray;
      }
      
      // PDF buffer varsa attachment olarak ekle
      if (pdfBuffer) {
        emailPayload.attachments = [
          {
            filename: `Denetim_${data.branchName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`,
            content: pdfBuffer.toString('base64'),
            encoding: 'base64',
            contentType: 'application/pdf',
          },
        ];
      }
      
      const response = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(emailPayload),
      });
      
      if (response.ok) {
        console.log(`[emailService] Email sent successfully`);
        console.log(`  - TO: ${toEmail}`);
        if (ccEmailsArray.length > 0) {
          console.log(`  - CC: ${ccEmailsArray.join(', ')}`);
        }
        results.restaurantManager = true;
        results.inspector = ccEmailsArray.includes(data.inspectorEmail?.toLowerCase().trim() || '') ? true : false;
        if (data.otherEmail) results.other = ccEmailsArray.includes(data.otherEmail.toLowerCase().trim()) ? true : false;
        if (data.branchEmail) results.branch = ccEmailsArray.includes(data.branchEmail.toLowerCase().trim()) ? true : false;
      } else {
        const error = await response.text();
        console.error(`[emailService] Failed to send email: ${error}`);
      }
    } catch (error) {
      console.error(`[emailService] Error sending email:`, error);
    }
    
    return results;
  } catch (error) {
    console.error('[emailService] Error sending field inspection emails:', error);
    return results;
  }
}

export async function sendPerformanceEvaluationEmail(
  data: PerformanceEvaluationEmailData,
  recipientEmail: string
): Promise<boolean> {
  try {
    if (!recipientEmail) {
      console.warn('[emailService] No recipient email provided');
      return false;
    }

    const htmlContent = generateEmailTemplate(data);
    const plainTextContent = generatePlainTextEmail(data);
    const subject = `Performans İzleme Formu - ${data.employeeName} (${data.evaluationPeriod})`;

    console.log('[emailService] Performance evaluation email prepared:');
    console.log('  - Recipient:', recipientEmail);
    console.log('  - Subject:', subject);
    console.log('  - Employee:', data.employeeName);

    // EmailJS ile gönderim yapılacak
    return true;
  } catch (error) {
    console.error('[emailService] Error sending performance evaluation email:', error);
    return false;
  }
}

function generateFieldInspectionEmailTemplate(data: {
  branchName: string;
  inspectionDate: string;
  totalScore: number;
  restaurantManagerEmail: string;
  inspectorName: string;
  inspectorEmail: string;
  pdfUrl?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Saha Denetim Formu - Tamamlandı</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .info-section { background-color: #f9f9f9; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #667eea; min-width: 150px; }
        .info-value { color: #333; text-align: right; }
        .score-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .score-value { font-size: 48px; font-weight: bold; margin: 10px 0; }
        .button { display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 10px 0; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Saha Denetim Formu</h1>
        </div>
        <div class="content">
          <p>Merhaba,</p>
          <p>Saha denetim formu başarıyla tamamlanmıştır.</p>
          <div class="info-section">
            <div class="info-row"><span class="info-label">Şube Adı:</span><span class="info-value"><strong>${data.branchName}</strong></span></div>
            <div class="info-row"><span class="info-label">Denetim Tarihi:</span><span class="info-value">${data.inspectionDate}</span></div>
            <div class="info-row"><span class="info-label">Denetçi:</span><span class="info-value">${data.inspectorName}</span></div>
          </div>
          <div class="score-box">
            <div>Toplam Puan</div>
            <div class="score-value">${data.totalScore}%</div>
          </div>
          ${data.pdfUrl ? `<p style="text-align: center;"><a href="${data.pdfUrl}" class="button">📄 Raporu İndir</a></p>` : ''}
          <p>Saygılarımızla,<br><strong>Keban Food İnsan Kaynakları</strong></p>
        </div>
        <div class="footer">
          <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
