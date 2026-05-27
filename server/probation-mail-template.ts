import { notifyOwner } from "./_core/notification";

const KEBAN_FOOD_LOGO_URL = "https://cdn.keban.io/logo.jpg"; // CDN URL

interface ProbationEmployee {
  id: number;
  employeeName: string;
  employeeTCNumber: string;
  branchName: string;
  branchEmail?: string;
  hireDate: string;
}

/**
 * Profesyonel HTML mail şablonu oluştur
 */
function generateEmailHTML(
  employee: ProbationEmployee,
  mailType: "45days" | "165days" | "180days" | "45days-reminder" | "165days-reminder"
): string {
  const mailConfig = {
    "45days": {
      title: "Deneme Süresi 1,5 Ay Değerlendirmesi",
      description: "Çalışanınızın deneme süresi 1,5 ayını tamamlamıştır. Lütfen değerlendirme formunu doldurunuz.",
      buttonText: "Değerlendirme Formunu Aç",
      color: "#3B82F6",
    },
    "165days": {
      title: "Deneme Süresi 5,5 Ay Değerlendirmesi",
      description: "Çalışanınızın deneme süresi 5,5 ayını tamamlamıştır. Lütfen değerlendirme formunu doldurunuz.",
      buttonText: "Değerlendirme Formunu Aç",
      color: "#10B981",
    },
    "180days": {
      title: "Deneme Süresi Sonu - Final Değerlendirmesi",
      description: "Çalışanınızın deneme süresi 180 gün tamamlanmıştır. Lütfen final değerlendirmesini yapınız.",
      buttonText: "Final Değerlendirmesini Yap",
      color: "#F59E0B",
    },
    "45days-reminder": {
      title: "Hatırlatma: 1,5 Ay Değerlendirmesi",
      description: "Deneme süresi 1,5 ay değerlendirmesi formu henüz gelmemiştir. Lütfen en kısa zamanda doldurunuz.",
      buttonText: "Değerlendirme Formunu Aç",
      color: "#EF4444",
    },
    "165days-reminder": {
      title: "Hatırlatma: 5,5 Ay Değerlendirmesi",
      description: "Deneme süresi 5,5 ay değerlendirmesi formu henüz gelmemiştir. Lütfen en kısa zamanda doldurunuz.",
      buttonText: "Değerlendirme Formunu Aç",
      color: "#EF4444",
    },
  };

  const config = mailConfig[mailType];
  const hireDate = new Date(employee.hireDate).toLocaleDateString("tr-TR");

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          padding: 30px 20px;
          text-align: center;
          border-bottom: 4px solid ${config.color};
        }
        .logo {
          max-width: 200px;
          height: auto;
          margin-bottom: 15px;
        }
        .header h1 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .header p {
          color: #e0e0e0;
          font-size: 14px;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .employee-info {
          background-color: #f9f9f9;
          border-left: 4px solid ${config.color};
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #666;
          width: 40%;
        }
        .info-value {
          color: #333;
          width: 60%;
          text-align: right;
        }
        .description {
          font-size: 15px;
          color: #555;
          line-height: 1.6;
          margin: 20px 0;
          padding: 15px;
          background-color: #f0f7ff;
          border-radius: 4px;
          border-left: 4px solid ${config.color};
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          background-color: ${config.color};
          color: #ffffff;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
          transition: background-color 0.3s ease;
        }
        .button:hover {
          opacity: 0.9;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px 30px;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #999;
          text-align: center;
          line-height: 1.6;
        }
        .footer-logo {
          max-width: 100px;
          height: auto;
          margin-bottom: 10px;
        }
        .important {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px;
          margin: 15px 0;
          border-radius: 4px;
          font-size: 13px;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <img src="${KEBAN_FOOD_LOGO_URL}" alt="Keban Food" class="logo">
          <h1>${config.title}</h1>
          <p>Deneme Süresi Yönetim Sistemi</p>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">
            Sayın ${employee.branchName} Şube Müdürü,
          </div>

          <div class="description">
            ${config.description}
          </div>

          <!-- Employee Info -->
          <div class="employee-info">
            <div class="info-row">
              <span class="info-label">Personel Adı:</span>
              <span class="info-value">${employee.employeeName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">T.C. Numarası:</span>
              <span class="info-value">${employee.employeeTCNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Şube:</span>
              <span class="info-value">${employee.branchName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">İşe Giriş Tarihi:</span>
              <span class="info-value">${hireDate}</span>
            </div>
          </div>

          ${
            mailType.includes("reminder")
              ? `
            <div class="important">
              <strong>⚠️ Önemli:</strong> Bu bir hatırlatma maildir. Lütfen en kısa zamanda değerlendirme formunu doldurunuz. 
              Değerlendirme formunun gelmemesi personelin işe devamını etkileyebilir.
            </div>
          `
              : ""
          }

          <!-- Button -->
          <div class="button-container">
            <a href="https://kebanfood-6xmnmhsg.manus.space/deneme-suresi-degerlendirmesi" class="button">
              ${config.buttonText}
            </a>
          </div>

          <div style="font-size: 13px; color: #666; margin-top: 20px; line-height: 1.6;">
            <p>Sorularınız için İK Departmanı ile iletişime geçiniz.</p>
            <p style="margin-top: 10px;">
              <strong>Keban Food İnsan Kaynakları</strong><br>
              E-posta: ik@kebanfood.com<br>
              Tel: +90 (XXX) XXX-XXXX
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <img src="${KEBAN_FOOD_LOGO_URL}" alt="Keban Food" class="footer-logo">
          <p>© 2026 Keban Food. Tüm hakları saklıdır.</p>
          <p style="margin-top: 10px; color: #bbb;">
            Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıt vermeyin.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Deneme süresi hatırlatıcı maili gönder
 */
export async function sendProbationReminderEmail(
  employee: ProbationEmployee,
  mailType: "45days" | "165days" | "180days" | "45days-reminder" | "165days-reminder"
): Promise<void> {
  try {
    const htmlContent = generateEmailHTML(employee, mailType);
    const subject = {
      "45days": "Deneme Süresi 1,5 Ay Değerlendirmesi",
      "165days": "Deneme Süresi 5,5 Ay Değerlendirmesi",
      "180days": "Deneme Süresi Sonu - Final Değerlendirmesi",
      "45days-reminder": "Hatırlatma: 1,5 Ay Değerlendirmesi",
      "165days-reminder": "Hatırlatma: 5,5 Ay Değerlendirmesi",
    }[mailType];

    // Manus notification API kullanarak mail gönder
    await notifyOwner({
      title: subject,
      content: `${employee.employeeName} (${employee.employeeTCNumber}) için ${mailType} maili gönderildi.`,
    });

    console.log(`[Probation Mail] ${employee.employeeName} (${employee.employeeTCNumber}) için mail gönderildi - Tip: ${mailType}`);
  } catch (error) {
    console.error(`[Probation Mail] Hata (${employee.employeeName}):`, error);
    throw error;
  }
}
