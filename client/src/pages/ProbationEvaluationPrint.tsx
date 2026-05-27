import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface ProbationEvaluationPrintProps {
  data: {
    employeeTCNumber: string;
    employeeName: string;
    branchName: string;
    department: string;
    hireDate: string;
    evaluationPeriod: "1.5_months" | "5.5_months";
    evaluationDate: string;
    criteria: number[];
    competencies: number[];
    totalScore: number;
    successPercentage: number;
    evaluationScale: string;
    continueEmployment: boolean;
    continueEmploymentReason: string;
    managerOpinion: string;
    overallComments: string;
  };
  onClose?: () => void;
}

const CRITERIA = [
  "Teknik ve mesleki bilgi",
  "Yöneticileriyle iletişim",
  "İş arkadaşları ile iletişim becerisi ve işbirliği içinde çalışma",
  "Şirketi temsil yeteneği (kılık kıyafet, genel görünüm vb.)",
  "Verilen işi doğru bir şekilde ve zamanında yerine getirme, iş disiplini",
  "Şirket kural ve talimatlarına uyma",
  "Araştırmaya ve öğrenmeye ilgisi",
  "Sorumluluk alma ve işi sahiplenme",
  "İşe değer katma, yeni fikirler üretme",
  "Değişen koşullara uyum sağlama, esneklik",
  "Olumlu, yapıcı ve pozitif yaklaşım",
  "Etkin planlama ve zaman yönetimi",
  "İşe adapte olma ve motive çalışma",
  "Muhakeme yeteneği",
  "Etik ve dürüst çalışma",
];

const COMPETENCIES = [
  "Analiz Etme ve Problem Çözme",
  "Görev Bilinci",
  "İletişim Becerisi",
  "Kalite Odaklılık",
];

const SCALE_LABELS: { [key: number]: string } = {
  1: "Yetersiz",
  2: "Gelişime Açık",
  3: "Beklenen",
  4: "İyi",
  5: "Çok İyi",
};

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663398746000/6XmnMHSGkmqmcvGw6sxZ3M/logo_713716c1.jpg";

export function ProbationEvaluationPrint({ data, onClose }: ProbationEvaluationPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const periodLabel = data.evaluationPeriod === "1.5_months" ? "1,5 Ay" : "5,5 Ay";

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "", "width=900,height=700");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <style>
                @media print {
                  body { margin: 0; padding: 0; }
                  .page { page-break-after: always; }
                  .page:last-child { page-break-after: avoid; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownloadPDF = () => {
    if (printRef.current) {
      const printWindow = window.open("", "", "width=900,height=700");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <style>
                @media print {
                  body { margin: 0; padding: 0; }
                  .page { page-break-after: always; }
                  .page:last-child { page-break-after: avoid; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Deneme Süresi Değerlendirmesi - Yazdırma Önizlemesi</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ✕
          </button>
        </div>

        {/* İçerik */}
        <div ref={printRef} style={{ padding: "20px", fontFamily: "Arial, sans-serif", fontSize: "11px", overflow: "auto", maxHeight: "calc(90vh - 70px)" }}>
          {/* SAYFA 1 - DEĞERLENDİRME */}
          <div className="page" style={{ pageBreakAfter: "always", marginBottom: "20px" }}>
            {/* Logo */}
            <div style={{ marginBottom: "15px" }}>
              <img src={LOGO_URL} alt="Keban Food" style={{ height: "40px", objectFit: "contain" }} />
            </div>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
              <h1 style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold" }}>
                DENEME SÜRESİ DEĞERLENDİRME FORMU
              </h1>
              <p style={{ margin: "0", fontSize: "10px" }}>Doküman No: IKY.P.01_f11 | Revizyon No: 1 | Revizyon Tarihi: 10.12.2025</p>
            </div>

            {/* Çalışan Bilgileri */}
            <div style={{ marginBottom: "15px" }}>
              <h2 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid #000", paddingBottom: "5px" }}>
                ÇALIŞAN BİLGİLERİ
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "25%", padding: "5px", border: "1px solid #ccc" }}>
                      <strong>TC Numarası:</strong>
                    </td>
                    <td style={{ width: "25%", padding: "5px", border: "1px solid #ccc" }}>{data.employeeTCNumber}</td>
                    <td style={{ width: "25%", padding: "5px", border: "1px solid #ccc" }}>
                      <strong>Adı Soyadı:</strong>
                    </td>
                    <td style={{ width: "25%", padding: "5px", border: "1px solid #ccc" }}>{data.employeeName}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>
                      <strong>Şube:</strong>
                    </td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>{data.branchName}</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>
                      <strong>Bölüm/Görevi:</strong>
                    </td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>{data.department || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>
                      <strong>İşe Giriş Tarihi:</strong>
                    </td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>{data.hireDate || "-"}</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>
                      <strong>Değerlendirme Dönemi:</strong>
                    </td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>{periodLabel}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>
                      <strong>Değerlendirme Tarihi:</strong>
                    </td>
                    <td colSpan={3} style={{ padding: "5px", border: "1px solid #ccc" }}>
                      {data.evaluationDate}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Değerlendirme Kriterleri - Kompakt */}
            <div style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
              <h2 style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "5px", borderBottom: "1px solid #000", paddingBottom: "3px" }}>
                DEĞERLENDİRME KRİTERLERİ (15 KRİTER)
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ padding: "3px", border: "1px solid #ccc", textAlign: "left" }}>No</th>
                    <th style={{ padding: "3px", border: "1px solid #ccc", textAlign: "left" }}>Kriter</th>
                    <th style={{ padding: "3px", border: "1px solid #ccc", textAlign: "center", width: "50px" }}>Puan</th>
                    <th style={{ padding: "3px", border: "1px solid #ccc", textAlign: "center", width: "60px" }}>Skala</th>
                  </tr>
                </thead>
                <tbody>
                  {CRITERIA.map((criterion, index) => (
                    <tr key={index}>
                      <td style={{ padding: "3px", border: "1px solid #ccc", textAlign: "center" }}>{index + 1}</td>
                      <td style={{ padding: "3px", border: "1px solid #ccc" }}>{criterion}</td>
                      <td style={{ padding: "3px", border: "1px solid #ccc", textAlign: "center" }}>{data.criteria[index] || "-"}</td>
                      <td style={{ padding: "3px", border: "1px solid #ccc", textAlign: "center" }}>
                        {data.criteria[index] ? SCALE_LABELS[data.criteria[index]] : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Temel Yetkinlikler - Kompakt */}
            <div style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
              <h2 style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "5px", borderBottom: "1px solid #000", paddingBottom: "3px" }}>
                TEMEL YETKİNLİKLER (4 YETKİNLİK)
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ padding: "3px", border: "1px solid #ccc", textAlign: "left" }}>No</th>
                    <th style={{ padding: "3px", border: "1px solid #ccc", textAlign: "left" }}>Yetkinlik</th>
                    <th style={{ padding: "3px", border: "1px solid #ccc", textAlign: "center", width: "50px" }}>Puan</th>
                    <th style={{ padding: "3px", border: "1px solid #ccc", textAlign: "center", width: "60px" }}>Skala</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPETENCIES.map((competency, index) => (
                    <tr key={index}>
                      <td style={{ padding: "3px", border: "1px solid #ccc", textAlign: "center" }}>{index + 1}</td>
                      <td style={{ padding: "3px", border: "1px solid #ccc" }}>{competency}</td>
                      <td style={{ padding: "3px", border: "1px solid #ccc", textAlign: "center" }}>{data.competencies[index] || "-"}</td>
                      <td style={{ padding: "3px", border: "1px solid #ccc", textAlign: "center" }}>
                        {data.competencies[index] ? SCALE_LABELS[data.competencies[index]] : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sonuçlar - Kompakt */}
            <div style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
              <h2 style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "5px", borderBottom: "1px solid #000", paddingBottom: "3px" }}>
                SONUÇLAR
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "3px", border: "1px solid #ccc", width: "50%" }}>
                      <strong>Başarı Yüzdesi:</strong> %{data.successPercentage}
                    </td>
                    <td style={{ padding: "3px", border: "1px solid #ccc", width: "50%" }}>
                      <strong>Devam Kararı:</strong> {data.continueEmployment ? "Evet" : "Hayır"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Karar ve Görüşler - Kompakt */}
            <div style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
              <h2 style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "5px", borderBottom: "1px solid #000", paddingBottom: "3px" }}>
                KARAR VE GÖRÜŞLER
              </h2>
              {data.continueEmploymentReason && (
                <div style={{ marginBottom: "8px", fontSize: "9px" }}>
                  <strong>Devam Kararı Nedeni:</strong>
                  <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>{data.continueEmploymentReason}</p>
                </div>
              )}
              {data.managerOpinion && (
                <div style={{ marginBottom: "8px", fontSize: "9px" }}>
                  <strong>Yönetici Görüşü:</strong>
                  <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>{data.managerOpinion}</p>
                </div>
              )}
            </div>

            {/* İmza Alanları */}
            <div style={{ marginTop: "15px", pageBreakInside: "avoid" }}>
              <h2 style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid #000", paddingBottom: "5px" }}>
                İMZA ALANLARI
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #000", textAlign: "center", width: "25%" }}>
                      <strong>Değerlendirilen Çalışan</strong>
                      <div style={{ height: "40px" }}></div>
                      <div>Ad Soyadı: _______________</div>
                      <div>Tarih: _______________</div>
                      <div>İmza: _______________</div>
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #000", textAlign: "center", width: "25%" }}>
                      <strong>1. Amir</strong>
                      <div style={{ height: "40px" }}></div>
                      <div>Ad Soyadı: _______________</div>
                      <div>Tarih: _______________</div>
                      <div>İmza: _______________</div>
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #000", textAlign: "center", width: "25%" }}>
                      <strong>2. Amir</strong>
                      <div style={{ height: "40px" }}></div>
                      <div>Ad Soyadı: _______________</div>
                      <div>Tarih: _______________</div>
                      <div>İmza: _______________</div>
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #000", textAlign: "center", width: "25%" }}>
                      <strong>İnsan Kaynakları</strong>
                      <div style={{ height: "40px" }}></div>
                      <div>Ad Soyadı: _______________</div>
                      <div>Tarih: _______________</div>
                      <div>İmza: _______________</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SAYFA 2 - YÖNERGE */}
          <div className="page" style={{ pageBreakAfter: "avoid" }}>
            {/* Logo */}
            <div style={{ marginBottom: "15px" }}>
              <img src={LOGO_URL} alt="Keban Food" style={{ height: "40px", objectFit: "contain" }} />
            </div>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
              <h1 style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold" }}>
                DEĞERLENDİRME YÖNERGESİ
              </h1>
            </div>

            {/* Temel Yetkinlikler Açıklaması */}
            <div style={{ marginBottom: "15px" }}>
              <h2 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid #000", paddingBottom: "5px" }}>
                TEMEL YETKİNLİKLER AÇIKLAMASI
              </h2>
              <div style={{ fontSize: "10px", lineHeight: "1.5" }}>
                <p><strong>1. Analiz Etme ve Problem Çözme:</strong> Sorunları tanımlama, nedenleri araştırma ve çözüm geliştirme yeteneği</p>
                <p><strong>2. Görev Bilinci:</strong> Verilen görevleri önemseyen, sorumluluğu alan ve başarıyla tamamlama yeteneği</p>
                <p><strong>3. İletişim Becerisi:</strong> Etkili dinleme, anlaşılır ifade etme ve ilişki kurma yeteneği</p>
                <p><strong>4. Kalite Odaklılık:</strong> Yüksek kaliteli iş çıkarmaya önem veren, detaylara dikkat eden tutum</p>
              </div>
            </div>

            {/* Değerlendirme Skalası */}
            <div style={{ marginBottom: "15px" }}>
              <h2 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid #000", paddingBottom: "5px" }}>
                DEĞERLENDİRME SKALASI
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center", width: "10%" }}>Puan</th>
                    <th style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center", width: "15%" }}>%</th>
                    <th style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center", width: "20%" }}>Skala</th>
                    <th style={{ padding: "5px", border: "1px solid #ccc", textAlign: "left" }}>Tanım</th>
                    <th style={{ padding: "5px", border: "1px solid #ccc", textAlign: "left" }}>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>1</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>0-20%</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>Yetersiz</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>Beklentileri karşılamıyor</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>Görev gereklerini yerine getiremiyor</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>2</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>21-40%</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>Gelişime Açık</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>Kısmen beklentileri karşılıyor</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>Gelişim gerektiriyor</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>3</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>41-60%</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>Beklenen</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>Beklentileri karşılıyor</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>Standart performans</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>4</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>61-80%</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>İyi</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>Beklentileri aşıyor</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>Üstün performans</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>5</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>81-100%</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc", textAlign: "center" }}>Çok İyi</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>Beklentileri önemli ölçüde aşıyor</td>
                    <td style={{ padding: "5px", border: "1px solid #ccc" }}>Olağanüstü performans</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notlar */}
            <div style={{ fontSize: "9px", lineHeight: "1.4", marginTop: "15px", paddingTop: "10px", borderTop: "1px solid #ccc" }}>
              <p><strong>Notlar:</strong></p>
              <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                <li>Değerlendirme, çalışanın deneme süresi boyunca gösterdiği performansa dayalı olarak yapılır.</li>
                <li>Her kriter ve yetkinlik bağımsız olarak değerlendirilir.</li>
                <li>Başarı yüzdesi, tüm puan ortalaması alınarak hesaplanır.</li>
                <li>Devam kararı, başarı yüzdesine ve genel performansa dayalı olarak verilir.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            Yazdır
          </Button>
          <Button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700">
            PDF İndir
          </Button>
          <Button onClick={onClose} variant="outline">
            Kapat
          </Button>
        </div>
      </div>
    </div>
  );
}
