import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface InspectionData {
  id: number;
  branchName: string;
  branchCode: string;
  restaurantManagerEmail: string;
  restaurantManagerName?: string;
  inspectionDate: string;
  createdAt?: string;
  inspectorName: string;
  answers: Array<{
    questionId?: number;
    questionText: string;
    categoryName: string;
    categoryId?: number;
    categoryWeight?: number;
    score: number;
    explanation?: string;
    isCritical?: boolean;
    photoUrls?: string[];
    answer?: string;
    earnedPoints?: number;
    questionPoints?: number;
  }>;
  totalScore: number;
  generalAssessment?: string;
  actionPlans?: Array<{
    action?: string;
    description?: string;
    responsiblePerson?: string;
    dueDate?: string;
  }>;
  previousInspectionScore?: number;
  previousInspectionDate?: string;
}

/**
 * Profesyonel Saha Denetim Raporu PDF Generator (jsPDF kullanarak)
 * - Türkçe karakter desteği (UTF-8) ✓
 * - Kategori-Soru-Puan yapısı
 * - Soru-Cevap-Açıklama bilgileri
 * - Yeni Denetim Skalası (79 ve altı başarısız, 80-85 Geliştirilebilir, 86-90 Beklenen, 91+ Başarılı)
 * - 4 İmza bölümü (Izgara Şefi, Restoran Yöneticisi, Denetçi, Bölge Müdürü)
 */
export async function generateInspectionPDF(inspectionData: InspectionData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 15;

      // ===== BAŞLIK BÖLÜMÜ =====
      // Sol üst: Logo (KB daire)
      doc.setFillColor(220, 20, 60); // Kırmızı
      doc.circle(20, yPos + 5, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text('KB', 20, yPos + 8, { align: 'center' });

      // Şirket adı
      doc.setTextColor(51, 51, 51);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Keban Food', 30, yPos + 3);
      doc.text('Şube Denetimi', 30, yPos + 8);

      // Ortada başlık
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(220, 20, 60);
      doc.text('ŞUBE DENETİM RAPORU', pageWidth / 2, yPos + 5, { align: 'center' });

      // Sağ üst: Tarih ve Rapor No
      // Tarih string'den parse et (YYYY-MM-DD formatında)
      let inspectionDateStr = '';
      let dateStr = '';
      if (typeof inspectionData.inspectionDate === 'string') {
        // String formatında tarih (YYYY-MM-DD)
        const parts = inspectionData.inspectionDate.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Month is 0-indexed
          const day = parseInt(parts[2]);
          const dateObj = new Date(year, month, day);
          inspectionDateStr = dateObj.toLocaleDateString('tr-TR');
          dateStr = inspectionData.inspectionDate.replace(/-/g, '');
        } else {
          const dateObj = new Date(inspectionData.inspectionDate);
          inspectionDateStr = dateObj.toLocaleDateString('tr-TR');
          dateStr = dateObj.toISOString().split('T')[0].replace(/-/g, '');
        }
      } else {
        const dateObj = new Date(inspectionData.inspectionDate);
        inspectionDateStr = dateObj.toLocaleDateString('tr-TR');
        dateStr = dateObj.toISOString().split('T')[0].replace(/-/g, '');
      }
      const reportNumber = `DEN-${inspectionData.branchCode}-${dateStr}`;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(102, 102, 102);
      doc.text(`Tarih: ${inspectionDateStr}`, pageWidth - 20, yPos + 3, { align: 'right' });
      doc.text(`Rapor No: ${reportNumber}`, pageWidth - 20, yPos + 8, { align: 'right' });

      yPos += 20;

      // ===== ŞUBE BİLGİLERİ =====
      doc.setFillColor(220, 20, 60);
      doc.rect(15, yPos, pageWidth - 30, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('ŞUBE BİLGİLERİ', 20, yPos + 5);

      yPos += 10;

      // Bilgi tablosu
      const infoData = [
        ['Şube Adı', inspectionData.branchName],
        ['Şube Kodu', inspectionData.branchCode],
        ['Denetim Tarihi', inspectionDateStr],
        ['Restoran Yöneticisi', inspectionData.restaurantManagerName || '-'],
        ['Yönetici E-posta', inspectionData.restaurantManagerEmail],
        ['Denetçi', inspectionData.inspectorName],
      ];

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 51, 51);

      for (const [label, value] of infoData) {
        doc.setFont('Helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('Helvetica', 'normal');
        doc.text(String(value), 80, yPos);
        yPos += 6;
      }

      yPos += 5;

      // ===== DENETIM SKALASI =====
      doc.setFillColor(220, 20, 60);
      doc.rect(15, yPos, pageWidth - 30, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('DENETİM DEĞERLENDİRME SKALASI', 20, yPos + 5);

      yPos += 10;

      const scaleItems: Array<{ score: string; label: string; color: [number, number, number] }> = [
        { score: '79 ve altı', label: 'Başarısız', color: [255, 68, 68] },
        { score: '80-85', label: 'Geliştirilebilir', color: [255, 136, 0] },
        { score: '86-90', label: 'Beklenen', color: [255, 187, 51] },
        { score: '91+', label: 'Başarılı', color: [0, 170, 0] },
      ];

      const colWidth = (pageWidth - 30) / 4;
      for (let i = 0; i < scaleItems.length; i++) {
        const item = scaleItems[i];
        const xPos = 15 + i * colWidth;

        // Arka plan
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.rect(xPos, yPos, colWidth, 12, 'F');

        // Çizgi
        doc.setDrawColor(200, 200, 200);
        doc.rect(xPos, yPos, colWidth, 12);

        // Metin
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(51, 51, 51);
        doc.text(item.score, xPos + colWidth / 2, yPos + 4, { align: 'center' });

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(item.label, xPos + colWidth / 2, yPos + 8, { align: 'center' });
      }

      yPos += 15;

      // ===== TOPLAM PUAN =====
      const totalScoreColor: [number, number, number] =
        inspectionData.totalScore <= 79 ? [255, 68, 68] :
        inspectionData.totalScore <= 85 ? [255, 136, 0] :
        inspectionData.totalScore <= 90 ? [255, 187, 51] : [0, 170, 0];

      const evaluationLabel =
        inspectionData.totalScore <= 79 ? 'Başarısız' :
        inspectionData.totalScore <= 85 ? 'Geliştirilebilir' :
        inspectionData.totalScore <= 90 ? 'Beklenen' : 'Başarılı';

      doc.setFillColor(totalScoreColor[0], totalScoreColor[1], totalScoreColor[2]);
      doc.rect(15, yPos, pageWidth - 30, 12, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(
        `TOPLAM PUAN: ${inspectionData.totalScore.toFixed(2)}% - ${evaluationLabel.toUpperCase()}`,
        pageWidth / 2,
        yPos + 7,
        { align: 'center' }
      );

      yPos += 18;

      // ===== SORULAR VE CEVAPLAR =====
      doc.setFillColor(220, 20, 60);
      doc.rect(15, yPos, pageWidth - 30, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('DENETIM SORULARI VE CEVAPLARI', 20, yPos + 5);

      yPos += 10;

      // Soruları kategoriye göre grupla
      const groupedByCategory = new Map<string, typeof inspectionData.answers>();
      for (const answer of inspectionData.answers) {
        if (!groupedByCategory.has(answer.categoryName)) {
          groupedByCategory.set(answer.categoryName, []);
        }
        groupedByCategory.get(answer.categoryName)!.push(answer);
      }

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);

      for (const [categoryName, items] of Array.from(groupedByCategory.entries())) {
        // Sayfa kontrolü
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 15;
        }

        // Kategori başlığı
        doc.setFillColor(44, 82, 130);
        doc.rect(15, yPos, pageWidth - 30, 7, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(categoryName.toUpperCase(), 20, yPos + 4);
        yPos += 8;

        // Sorular
        for (const item of items) {
          // Sayfa kontrolü
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 15;
          }

          // Soru metni
          const questionText = (item.isCritical ? '[KRİTİK] ' : '') + item.questionText;
          const answerText = item.answer === 'E' ? '✓ Evet' : item.answer === 'H' ? '✗ Hayır' : '-';
          const pointsText = `${item.earnedPoints || item.score}/${item.questionPoints || item.score}`;

          // Kritik sorular için arka plan
          if (item.isCritical) {
            doc.setFillColor(255, 230, 230);
            doc.rect(15, yPos, pageWidth - 30, 8, 'F');
          }

          // Çizgi
          doc.setDrawColor(200, 200, 200);
          doc.rect(15, yPos, pageWidth - 30, 8);

          // Soru metni
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 51, 51);
          doc.text(questionText, 20, yPos + 4, { maxWidth: pageWidth - 100 });

          // Cevap ve puan (sağ taraf)
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(220, 20, 60);
          doc.text(`${answerText} | ${pointsText}`, pageWidth - 25, yPos + 4, { align: 'right' });

          yPos += 8;

          // Açıklama varsa
          if (item.explanation && item.explanation.trim()) {
            if (yPos > pageHeight - 25) {
              doc.addPage();
              yPos = 15;
            }

            doc.setFillColor(245, 245, 245);
            doc.rect(20, yPos, pageWidth - 40, 6, 'F');

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(102, 102, 102);
            doc.text(`Açıklama: ${item.explanation}`, 25, yPos + 3, { maxWidth: pageWidth - 50 });

            yPos += 7;
          }
        }

        yPos += 3;
      }

      // ===== İMZA BÖLÜMÜ =====
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 15;
      }

      doc.setFillColor(220, 20, 60);
      doc.rect(15, yPos, pageWidth - 30, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('İMZA BÖLÜMÜ', 20, yPos + 5);

      yPos += 15;

      // 4 imza bölümü
      const signatures = [
        'IZGARA ŞEFİ',
        'RESTORAN YÖNETİCİSİ',
        'DENETÇİ',
        'BÖLGE MÜDÜRÜ',
      ];

      const signatureWidth = (pageWidth - 30) / 4;
      const signatureHeight = 25;

      for (let i = 0; i < 4; i++) {
        const xPos = 15 + i * signatureWidth;

        // İmza çizgisi
        doc.setDrawColor(51, 51, 51);
        doc.setLineWidth(0.5);
        doc.line(xPos + 5, yPos, xPos + signatureWidth - 5, yPos);

        // Başlık
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(51, 51, 51);
        doc.text(signatures[i], xPos + signatureWidth / 2, yPos + 5, { align: 'center' });

        // Tarih satırı
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(102, 102, 102);
        doc.text('Tarih: ___/___/_____', xPos + signatureWidth / 2, yPos + 18, { align: 'center' });
      }

      // ===== FOOTER =====
      // ===== GENEL DEĞERLENDİRME =====
      if (inspectionData.generalAssessment && inspectionData.generalAssessment.trim()) {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 15;
        }

        doc.setFillColor(220, 20, 60);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text('GENEL DEĞERLENDİRME', 20, yPos + 5);
        yPos += 10;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 51, 51);
        const splitText = doc.splitTextToSize(inspectionData.generalAssessment, pageWidth - 30);
        doc.text(splitText, 20, yPos);
        yPos += (splitText.length * 5) + 5;
      }

      // ===== AKSIYON BİLGİLERİ =====
      if (inspectionData.actionPlans && inspectionData.actionPlans.length > 0) {
        const hasActions = inspectionData.actionPlans.some(a => a.action || a.description);
        if (hasActions) {
          if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 15;
          }

          doc.setFillColor(220, 20, 60);
          doc.rect(15, yPos, pageWidth - 30, 8, 'F');
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(255, 255, 255);
          doc.text('AKSIYON BİLGİLERİ', 20, yPos + 5);
          yPos += 10;

          for (const action of inspectionData.actionPlans) {
            if (!action.action && !action.description) continue;
            
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = 15;
            }

            doc.setFillColor(245, 245, 245);
            doc.rect(15, yPos, pageWidth - 30, 20, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(15, yPos, pageWidth - 30, 20);

            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(51, 51, 51);
            doc.text('Aksiyon: ' + (action.action || action.description || ''), 20, yPos + 4, { maxWidth: pageWidth - 40 });
            
            if (action.responsiblePerson) {
              doc.setFont('Helvetica', 'normal');
              doc.setFontSize(7);
              doc.text('Sorumlu: ' + action.responsiblePerson, 20, yPos + 9);
            }
            
            if (action.dueDate) {
              doc.text('Bitiş Tarihi: ' + action.dueDate, 20, yPos + 13);
            }

            yPos += 22;
          }
        }
      }

      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(153, 153, 153);
        doc.text(
          `Sayfa ${i} / ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // PDF'yi buffer olarak al
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      resolve(pdfBuffer);
    } catch (error) {
      reject(error);
    }
  });
}
