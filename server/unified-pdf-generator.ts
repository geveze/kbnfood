import PDFDocument from 'pdfkit';

/**
 * Unified PDF Generator - Field Inspection ve Performance Monitoring için aynı format
 * Keban Food logosu, başlık, bilgi kartları, kategoriye göre bölümler, footer
 */

interface InfoCard {
  label: string;
  value: string;
}

interface PDFSection {
  title: string;
  content?: Array<{ label: string; value: string }>;
  items?: Array<any>;
  type?: 'cards' | 'table' | 'text';
}

interface UnifiedPDFOptions {
  title: string;
  subtitle: string;
  reportType: 'inspection' | 'performance';
  infoCards: InfoCard[];
  totalScore: number;
  date: string;
  inspector: string;
  sections: PDFSection[];
  logoUrl?: string; // Şirket logosu URL'si
  inspectionDate?: string; // Denetim tarihi
  companyName?: string; // Şirket adı
  reportNumber?: string; // Rapor numarası
}

export async function generateUnifiedPDF(options: UnifiedPDFOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Keban Food Logo ve Şirket Bilgileri
      const logoWidth = 30;
      const logoHeight = 30;
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#DC143C');
      doc.text('KB', 50, 50, { width: logoWidth, align: 'center' });
      
      // Şirket adı
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333');
      doc.text(options.companyName || 'Keban Food', 50, 70);
      
      // Denetim/Değerlendirme Tarihi (sağ üst)
      doc.fontSize(9).font('Helvetica').fillColor('#666666');
      const inspectionDateStr = options.inspectionDate 
        ? new Date(options.inspectionDate).toLocaleDateString('tr-TR')
        : new Date(options.date).toLocaleDateString('tr-TR');
      doc.text(`Tarih: ${inspectionDateStr}`, 350, 50, { width: 150, align: 'right' });
      
      // Rapor Numarası
      if (options.reportNumber) {
        doc.fontSize(9).font('Helvetica').fillColor('#666666');
        doc.text(`Rapor No: ${options.reportNumber}`, 350, 65, { width: 150, align: 'right' });
      }

      // Başlık
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#DC143C');
      doc.text(options.title, 100, 50, { width: 250, align: 'left' });

      // Alt başlık
      doc.fontSize(11).font('Helvetica').fillColor('#666666');
      doc.text(options.subtitle, 100, 75, { width: 250, align: 'left' });

      // Bilgi Kartları (2x3 grid)
      let yPos = 120;
      const cardWidth = (doc.page.width - 80 - 20) / 2;
      const cardHeight = 50;
      const cardSpacing = 10;

      for (let i = 0; i < options.infoCards.length; i++) {
        const card = options.infoCards[i];
        const col = i % 2;
        const row = Math.floor(i / 2);

        const xPos = 40 + col * (cardWidth + cardSpacing);
        const cardYPos = yPos + row * (cardHeight + cardSpacing);

        // Kart arka planı
        doc.rect(xPos, cardYPos, cardWidth, cardHeight).fillAndStroke('#F5F5F5', '#CCCCCC');

        // Kart içeriği
        doc.fontSize(9).font('Helvetica').fillColor('#666666');
        doc.text(card.label, xPos + 10, cardYPos + 8, { width: cardWidth - 20 });

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333');
        doc.text(card.value, xPos + 10, cardYPos + 25, { width: cardWidth - 20 });
      }

      yPos += 3 * (cardHeight + cardSpacing) + 20;

      // Toplam Puan Gösterimi
      const scoreColor =
        options.totalScore >= 85
          ? '#27AE60' // Yeşil
          : options.totalScore >= 70
          ? '#F39C12' // Turuncu
          : '#E74C3C'; // Kırmızı

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333');
      doc.text('Toplam Puan:', 40, yPos);

      doc.fontSize(16).font('Helvetica-Bold').fillColor(scoreColor);
      doc.text(`${options.totalScore.toFixed(2)}%`, 150, yPos);

      yPos += 30;

      // Bölüm Başlıkları ve İçerik
      for (const section of options.sections) {
        // Sayfa kontrolü
        if (yPos > doc.page.height - 80) {
          doc.addPage();
          yPos = 40;
        }

        // Bölüm başlığı
        doc.rect(40, yPos, doc.page.width - 80, 25).fill('#DC143C');
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text(section.title, 50, yPos + 6, { width: doc.page.width - 100 });

        yPos += 30;

        // Bölüm içeriği
        const sectionItems = section.content || section.items || [];
        if (section.type === 'cards') {
          // Kart olarak göster (2x3 grid)
          const itemsPerRow = 2;
          const itemWidth = (doc.page.width - 100) / itemsPerRow;

          for (let i = 0; i < sectionItems.length; i++) {
            if (yPos > doc.page.height - 100) {
              doc.addPage();
              yPos = 40;
            }

            const itemXPos = 50 + (i % itemsPerRow) * itemWidth;
            const itemYPos = yPos + Math.floor(i / itemsPerRow) * 50;

            // Kart arka planı
            doc.rect(itemXPos, itemYPos, itemWidth - 10, 40).fill('#f5f5f5');

            // Kart başlığı
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#d32f2f');
            doc.text(sectionItems[i].label, itemXPos + 8, itemYPos + 8, {
              width: itemWidth - 16,
            });

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333');
            doc.text(sectionItems[i].value, itemXPos + 8, itemYPos + 28, {
              width: itemWidth - 16,
            });
          }

          const itemCount = sectionItems.length;
          yPos += Math.ceil(itemCount / itemsPerRow) * 50 + 10;
        } else if (section.type === 'table') {
          // Tablo olarak göster
          doc.fontSize(10).font('Helvetica');

          const tableItems = section.content || section.items || [];
          for (const item of tableItems) {
            if (yPos > doc.page.height - 80) {
              doc.addPage();
              yPos = 40;
            }

            doc.fillColor('#333333').text(`${item.label || item.question}: `, 50, yPos, { continued: true });
            doc.fillColor('#666666').text(item.value || item.answer);
            yPos += 20;
          }

          yPos += 10;
        } else {
          // Metin olarak göster
          doc.fontSize(10).font('Helvetica').fillColor('#333333');

          const items = Array.isArray(section.content) ? section.content : (section.items || []);
          for (const item of items) {
            if (yPos > doc.page.height - 80) {
              doc.addPage();
              yPos = 40;
            }

            doc.text(`${item.label}: ${item.value}`, 50, yPos, {
              width: doc.page.width - 100,
            });
            yPos += 20;
          }

          yPos += 10;
        }
      }

      // Footer
      const pages = doc.bufferedPageRange().count;
      for (let i = 0; i < pages; i++) {
        doc.switchToPage(i);

        // Sayfa numarası
        doc.fontSize(9).font('Helvetica').fillColor('#999999');
        doc.text(
          `Sayfa ${i + 1} / ${pages}`,
          40,
          doc.page.height - 30,
          { width: doc.page.width - 80, align: 'center' }
        );

        // Tarih
        doc.fontSize(8).fillColor('#AAAAAA');
        doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`, 40, doc.page.height - 15, {
          width: doc.page.width - 80,
          align: 'right',
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
