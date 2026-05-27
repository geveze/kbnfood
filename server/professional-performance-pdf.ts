import PDFDocument from 'pdfkit';

/**
 * Profesyonel Performans Değerlendirme PDF Generator
 * - Türkçe karakter desteği
 * - Form yapısı ve çizgiler
 * - Kategori-Item-Puan
 * - Değerlendirme Skalası
 * - İmza bölümü (Çalışan, Yönetici, Değerlendiren)
 * - Max 2 sayfa
 * - Profesyonel ve kurumsal tasarım
 */

interface PerformanceItem {
  category: string;
  subcategory: string;
  score: number;
}

interface ProfessionalPerformancePDFOptions {
  employeeName: string;
  employeePosition: string;
  employeeTCNumber?: string;
  hireDate?: string;
  evaluationDate: string;
  evaluationPeriod?: string;
  evaluatedByManager?: string;
  managerOpinion?: string;
  items: PerformanceItem[];
  totalScore: number;
  evaluationScale?: string;
}

export async function generateProfessionalPerformancePDF(
  options: ProfessionalPerformancePDFOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

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
      doc.text('PERFORMANS DEĞERLENDİRME RAPORU', 0, 45, { align: 'center' });

      // Sağ üst: Tarih ve Rapor No
      const evaluationDateStr = new Date(options.evaluationDate).toLocaleDateString('tr-TR');
      const reportNumber = `PER-${options.employeeTCNumber || 'UNKNOWN'}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
      
      doc.fontSize(9).font('Helvetica').fillColor('#666666');
      doc.text(`Tarih: ${evaluationDateStr}`, 350, 40, { width: 150, align: 'right' });
      doc.text(`Rapor No: ${reportNumber}`, 350, 55, { width: 150, align: 'right' });

      // ===== ÇALIŞAN BİLGİLERİ BÖLÜMÜ =====
      let yPos = 100;
      
      // Başlık
      doc.fontSize(11).font('Helvetica-Bold').fillColor('white');
      doc.rect(40, yPos, 520, 20).fill('#DC143C');
      doc.text('ÇALIŞAN BİLGİLERİ', 50, yPos + 5);

      yPos += 25;

      // Bilgi satırları
      const infoRows = [
        { label: 'Çalışan Adı', value: options.employeeName },
        { label: 'Ünvan', value: options.employeePosition },
        { label: 'Sicil No', value: options.employeeTCNumber || '-' },
        { label: 'İşe Başlama Tarihi', value: options.hireDate ? new Date(options.hireDate).toLocaleDateString('tr-TR') : '-' },
        { label: 'Değerlendirme Dönemi', value: options.evaluationPeriod || '-' },
        { label: 'Değerlendiren Yönetici', value: options.evaluatedByManager || '-' },
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

      // ===== DEĞERLENDIRME SKALASI =====
      doc.fontSize(11).font('Helvetica-Bold').fillColor('white');
      doc.rect(40, yPos, 520, 20).fill('#DC143C');
      doc.text('DEĞERLENDİRME SKALASI', 50, yPos + 5);

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

      // ===== KATEGORİ-ITEM-PUAN BÖLÜMÜ =====
      // Kategoriye göre grupla
      const groupedByCategory: { [key: string]: PerformanceItem[] } = {};
      for (const item of options.items) {
        if (item.score === 0) continue;
        if (!groupedByCategory[item.category]) {
          groupedByCategory[item.category] = [];
        }
        groupedByCategory[item.category].push(item);
      }

      // Her kategori için bölüm oluştur
      for (const [categoryName, items] of Object.entries(groupedByCategory)) {
        // Kategori başlığı
        if (yPos > doc.page.height - 150) {
          doc.addPage();
          yPos = 30;
        }

        doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
        doc.rect(40, yPos, 520, 18).fill('#666666');
        doc.text(categoryName, 50, yPos + 4);

        yPos += 22;

        // Items
        for (const item of items) {
          if (yPos > doc.page.height - 80) {
            doc.addPage();
            yPos = 30;
          }

          // Item başlığı
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333');
          doc.text(`• ${item.subcategory}`, 50, yPos);
          yPos += 12;

          // Puan
          const scoreColor = 
            item.score < 20 ? '#FF4444' :
            item.score < 40 ? '#FF8800' :
            item.score < 60 ? '#FFBB33' :
            item.score < 80 ? '#00AA00' : '#00CC00';

          doc.fontSize(9).font('Helvetica-Bold').fillColor(scoreColor);
          doc.text(`Puan: ${item.score}`, 70, yPos);
          yPos += 12;

          // Ayırıcı çizgi
          doc.strokeColor('#EEEEEE').lineWidth(0.5);
          doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
          yPos += 8;
        }

        yPos += 5;
      }

      // Yönetici Görüşü
      if (options.managerOpinion) {
        if (yPos > doc.page.height - 100) {
          doc.addPage();
          yPos = 30;
        }

        doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
        doc.rect(40, yPos, 520, 18).fill('#666666');
        doc.text('YÖNETİCİ GÖRÜŞÜ', 50, yPos + 4);

        yPos += 22;

        doc.fontSize(9).font('Helvetica').fillColor('#333333');
        doc.text(options.managerOpinion, 50, yPos, { width: 480 });
        yPos += doc.heightOfString(options.managerOpinion, { width: 480 }) + 10;
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
        'ÇALIŞAN ADI *',
        'RESTORAN YÖNETİCİSİ ADI *',
        'DEĞERLENDİREN YÖNETİCİ',
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
