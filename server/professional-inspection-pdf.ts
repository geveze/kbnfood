import PDFDocument from 'pdfkit';

/**
 * Profesyonel Saha Denetimi PDF Generator
 * - Türkçe karakter desteği
 * - Form yapısı ve çizgiler
 * - Soru-Cevap-Açıklama
 * - Denetim Değerlendirme Skalası
 * - İmza bölümü (Denetlenen, Restoran Yöneticisi, Denetçi)
 * - Max 2 sayfa
 * - Profesyonel ve kurumsal tasarım
 */

interface InspectionAnswer {
  categoryName: string;
  questionText: string;
  answer: string; // 'E' or 'H'
  explanation?: string;
}

interface ProfessionalInspectionPDFOptions {
  branchName: string;
  branchCode: string;
  inspectionDate: string;
  inspectorName: string;
  restaurantManagerName: string;
  restaurantManagerEmail: string;
  answers: InspectionAnswer[];
  totalScore: number;
  evaluationScale?: string; // "Yetersiz", "Gelişime Açık", vb.
}

export async function generateProfessionalInspectionPDF(
  options: ProfessionalInspectionPDFOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    console.log('[PDF] generateProfessionalInspectionPDF başladı');
    try {
      console.log('[PDF] PDFDocument oluşturuluyor...');
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', (data) => {
        console.log('[PDF] Data event, size:', data.length);
        buffers.push(data);
      });
      doc.on('end', () => {
        console.log('[PDF] End event, total buffers:', buffers.length, 'total size:', buffers.reduce((a, b) => a + b.length, 0));
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', (err) => {
        console.error('[PDF] Error event:', err);
        reject(err);
      });

      // Sayfa numarası ve footer
      const addFooter = () => {
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor('#999999');
          doc.text(
            `Sayfa ${i + 1} / ${pageCount}`,
            30,
            doc.page.height - 20,
            { align: 'center' }
          );
        }
      };

      // ===== BAŞLIK BÖLÜMÜ =====
      // Sol üst: Şirket logosu
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#DC143C');
      doc.text('KB', 40, 40, { width: 30, align: 'center' });
      
      doc.fontSize(9).font('Helvetica').fillColor('#333333');
      doc.text('Keban Food', 40, 58);
      doc.text('İnsan Kaynakları', 40, 68);

      // Ortaya hizalanmış başlık
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#DC143C');
      doc.text('SAHA DENETİMİ RAPORU', 0, 45, { align: 'center' });

      // Sağ üst: Tarih ve Rapor No
      const inspectionDateStr = new Date(options.inspectionDate).toLocaleDateString('tr-TR');
      const reportNumber = `DEN-${options.branchCode}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
      
      doc.fontSize(9).font('Helvetica').fillColor('#666666');
      doc.text(`Tarih: ${inspectionDateStr}`, 350, 40, { width: 150, align: 'right' });
      doc.text(`Rapor No: ${reportNumber}`, 350, 55, { width: 150, align: 'right' });

      // ===== ŞUBEBİLGİLERİ BÖLÜMÜ =====
      let yPos = 100;
      
      // Başlık
      doc.fontSize(11).font('Helvetica-Bold').fillColor('white');
      doc.rect(40, yPos, 520, 20).fill('#DC143C');
      doc.text('ŞUBEBİLGİLERİ', 50, yPos + 5);

      yPos += 25;

      // Bilgi satırları
      const infoRows = [
        { label: 'Şube Adı', value: options.branchName },
        { label: 'Şube Kodu', value: options.branchCode },
        { label: 'Denetim Tarihi', value: inspectionDateStr },
        { label: 'Denetçi Adı', value: options.inspectorName },
        { label: 'Restoran Müdürü', value: options.restaurantManagerName },
      ];

      const colWidth = 260;
      const rowHeight = 18;

      for (let i = 0; i < infoRows.length; i++) {
        const row = infoRows[i];
        const col = i % 2;
        const rowNum = Math.floor(i / 2);

        const xPos = 40 + col * (colWidth + 20);
        const rowYPos = yPos + rowNum * rowHeight;

        // Çizgi
        doc.strokeColor('#CCCCCC').lineWidth(0.5);
        doc.rect(xPos, rowYPos, colWidth, rowHeight).stroke();

        // İçerik
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333');
        doc.text(row.label, xPos + 8, rowYPos + 2);

        doc.fontSize(9).font('Helvetica').fillColor('#666666');
        doc.text(row.value, xPos + 8, rowYPos + 12);
      }

      yPos += 3 * rowHeight + 10;

      // ===== DENETIM DEĞERLENDIRME SKALASI =====
      doc.fontSize(11).font('Helvetica-Bold').fillColor('white');
      doc.rect(40, yPos, 520, 20).fill('#DC143C');
      doc.text('DENETİM DEĞERLENDİRME SKALASI', 50, yPos + 5);

      yPos += 25;

      const scaleItems = [
        { score: '0-20', label: 'Yetersiz', color: '#FF4444' },
        { score: '21-40', label: 'Gelişime Açık', color: '#FF8800' },
        { score: '41-60', label: 'Beklenen', color: '#FFBB33' },
        { score: '61-80', label: 'İyi', color: '#00AA00' },
        { score: '81-100', label: 'Çok İyi', color: '#00CC00' },
      ];

      const scaleColWidth = 104;
      for (let i = 0; i < scaleItems.length; i++) {
        const item = scaleItems[i];
        const xPos = 40 + i * (scaleColWidth + 2);

        // Arka plan
        doc.fillColor(item.color).opacity(0.2);
        doc.rect(xPos, yPos, scaleColWidth, 30).fill();
        doc.opacity(1);

        // Çizgi
        doc.strokeColor('#CCCCCC').lineWidth(0.5);
        doc.rect(xPos, yPos, scaleColWidth, 30).stroke();

        // Metin
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
        doc.text(item.score, xPos + 5, yPos + 5, { width: scaleColWidth - 10 });

        doc.fontSize(8).font('Helvetica').fillColor('#666666');
        doc.text(item.label, xPos + 5, yPos + 16, { width: scaleColWidth - 10 });
      }

      yPos += 40;

      // Toplam Puan
      const totalScoreColor = 
        options.totalScore < 20 ? '#FF4444' :
        options.totalScore < 40 ? '#FF8800' :
        options.totalScore < 60 ? '#FFBB33' :
        options.totalScore < 80 ? '#00AA00' : '#00CC00';

      doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
      doc.rect(40, yPos, 520, 25).fill(totalScoreColor);
      doc.text(
        `TOPLAM PUAN: ${options.totalScore.toFixed(2)}% - ${options.evaluationScale || 'Değerlendirilmedi'}`,
        50,
        yPos + 7
      );

      yPos += 30;

      // ===== SORU-CEVAP BÖLÜMÜ =====
      // Kategoriye göre grupla
      const groupedByCategory: { [key: string]: InspectionAnswer[] } = {};
      for (const answer of options.answers) {
        if (!groupedByCategory[answer.categoryName]) {
          groupedByCategory[answer.categoryName] = [];
        }
        groupedByCategory[answer.categoryName].push(answer);
      }

      // Her kategori için bölüm oluştur
      for (const [categoryName, answers] of Object.entries(groupedByCategory)) {
        // Kategori başlığı
        if (yPos > doc.page.height - 150) {
          doc.addPage();
          yPos = 30;
        }

        doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
        doc.rect(40, yPos, 520, 18).fill('#666666');
        doc.text(categoryName, 50, yPos + 4);

        yPos += 22;

        // Sorular
        for (const answer of answers) {
          if (yPos > doc.page.height - 100) {
            doc.addPage();
            yPos = 30;
          }

          // Soru
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333');
          doc.text(`S: ${answer.questionText}`, 50, yPos, { width: 480, align: 'left' });
          const questionHeight = doc.heightOfString(`S: ${answer.questionText}`, { width: 480 });
          yPos += questionHeight + 5;

          // Cevap
          const answerText = answer.answer === 'E' ? '✓ EVET' : '✗ HAYIR';
          const answerColor = answer.answer === 'E' ? '#00AA00' : '#FF4444';
          doc.fontSize(9).font('Helvetica-Bold').fillColor(answerColor);
          doc.text(`C: ${answerText}`, 50, yPos);
          yPos += 15;

          // Açıklama
          if (answer.explanation) {
            doc.fontSize(8).font('Helvetica').fillColor('#666666');
            doc.text(`A: ${answer.explanation}`, 50, yPos, { width: 480 });
            const explanationHeight = doc.heightOfString(answer.explanation, { width: 480 });
            yPos += explanationHeight + 5;
          }

          // Ayırıcı çizgi
          doc.strokeColor('#EEEEEE').lineWidth(0.5);
          doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
          yPos += 8;
        }

        yPos += 5;
      }

      // ===== İMZA BÖLÜMÜ =====
      if (yPos > doc.page.height - 120) {
        doc.addPage();
        yPos = 30;
      }

      doc.fontSize(11).font('Helvetica-Bold').fillColor('white');
      doc.rect(40, yPos, 520, 20).fill('#DC143C');
      doc.text('İMZA BÖLÜMÜ', 50, yPos + 5);

      yPos += 30;

      // 3 imza bölümü
      const signatureWidth = 160;
      const signatureHeight = 80;
      const signatureSpacing = 20;

      const signatures = [
        'DENETLENENİN ADI *',
        'RESTORAN YÖNETİCİSİ ADI *',
        'DENETÇİ ADI',
      ];

      for (let i = 0; i < 3; i++) {
        const xPos = 40 + i * (signatureWidth + signatureSpacing);

        // Çizgi ve başlık
        doc.strokeColor('#333333').lineWidth(1);
        doc.moveTo(xPos, yPos).lineTo(xPos + signatureWidth, yPos).stroke();

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
        doc.text(signatures[i], xPos, yPos + 10, { width: signatureWidth, align: 'center' });

        // Tarih satırı
        doc.fontSize(7).font('Helvetica').fillColor('#666666');
        doc.text('Tarih: ___/___/_____', xPos, yPos + 55, { width: signatureWidth, align: 'center' });
      }

      // Footer ekle
      addFooter();

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
