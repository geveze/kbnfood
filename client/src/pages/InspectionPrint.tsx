import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Printer, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface InspectionData {
  id: number;
  branchName: string;
  branchCode: string;
  inspectionDate: string | Date;
  restaurantManagerEmail: string;
  restaurantManagerName?: string;
  inspectorName: string;
  inspectorEmail: string;
  totalScore: number;
  criticalPenalty: number;
  answers: Array<{
    questionId: number;
    answer: string;
    earnedPoints: number;
    questionPoints: number;
    penaltyPoints?: number;
    explanation: string | null;
    isCritical: boolean | null;
    questionText?: string;
    id?: number;
    inspectionId?: number;
    categoryName?: string;
    photoUrls?: unknown;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
  generalEvaluation?: {
    comments: string;
    strengths: string;
    improvementAreas: string;
    suggestions: string;
  };
  actions?: Array<{
    id?: number;
    inspectionId?: number;
    questionId?: number;
    actionDescription?: string;
    actionDeadline?: string | Date | null;
    status?: string;
    responsiblePerson?: string;
    responsiblePersonEmail?: string;
  }>;
}

interface CategoryData {
  id: number;
  name: string;
  weight: string | number | null;
  questions: Array<{
    id: number;
    questionText: string;
    points: number | null;
    isCritical: boolean | null;
    penaltyPoints?: number | null;
    categoryId?: number;
    maxScore?: number | null;
    order?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
}

export default function InspectionPrint() {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  // tRPC kullanarak denetim verilerini getir
  const { data, isLoading, isError } = trpc.fieldInspection.getInspectionById.useQuery(
    { inspectionId: parseInt(inspectionId || "0") },
    { enabled: !!inspectionId }
  );

  const categoriesQuery = trpc.fieldInspection.getCategoriesWithQuestions.useQuery({});

  useEffect(() => {
    if (data) {
      const inspectionData: InspectionData = {
        id: data.inspection?.id || 0,
        branchName: data.inspection?.branchName || "",
        branchCode: data.inspection?.branchCode || "",
        inspectionDate: data.inspection?.inspectionDate || new Date(),

        restaurantManagerEmail: data.inspection?.restaurantManagerEmail || "",
        restaurantManagerName: data.inspection?.restaurantManagerName || "",
        inspectorName: data.inspection?.inspectorName || "",
        inspectorEmail: data.inspection?.inspectorEmail || "",
        totalScore: typeof data.inspection?.totalScore === "string" ? parseFloat(data.inspection.totalScore) : (data.inspection?.totalScore || 0),
        criticalPenalty: 0,
        answers: data.answers || [],
        actions: data.actions || [],
        generalEvaluation: {
          comments: data.inspection?.generalAssessment || "",
          strengths: "",
          improvementAreas: "",
          suggestions: "",
        },
      };
      setInspection(inspectionData);
    } else if (isError) {
      setError("Denetim yüklenirken hata oluştu");
    }
  }, [data, isError]);

  useEffect(() => {
    if (categoriesQuery.data) {
      setCategories(categoriesQuery.data);
    }
  }, [categoriesQuery.data]);

  const getSuccessLabel = (score: number): string => {
    if (score >= 91) return "BAŞARILI";
    if (score >= 86) return "BEKLENEN";
    if (score >= 80) return "GELİŞTİRİLEBİLİR";
    return "BAŞARISIZ";
  };

  const formatDate = (dateStr: string | Date): string => {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString("tr-TR");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById("pdf-report");
    if (element && typeof (window as any).html2pdf !== "undefined") {
      const opt = {
        margin: [4, 0, 6, 0],
        filename: `denetim_${formatDate(inspection?.inspectionDate || "")}_${inspection?.branchCode}_DEN-${inspectionId}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };
      (window as any).html2pdf().set(opt).from(element).save();
    }
  };

  const handleClose = () => {
    navigate("/field-inspection-history");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Denetim raporu yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Denetim bulunamadı"}</p>
          <Button onClick={handleClose} variant="outline">
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  const reportNo = `DEN-${new Date().getFullYear()}-${String(inspectionId).padStart(4, "0")}`;
  const successScore = Math.round(inspection.totalScore);
  const successLabel = getSuccessLabel(successScore);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Kontrol Paneli */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
            ← Ana Sayfa
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Denetim Raporu</h1>
            <p className="text-sm text-gray-500">Rapor No: {reportNo}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Yazdır
          </Button>

          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            İndir
          </Button>

          <Button onClick={handleClose} variant="ghost" size="icon">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Rapor */}
      <div className="flex-1 overflow-auto p-4 print:p-0 print:bg-white">
        <div className="mx-auto bg-white shadow-lg print:shadow-none" style={{ maxWidth: "210mm" }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
            #pdf-report {
              width: 210mm; margin: 0 auto; background: #fff;
              font-family: 'Roboto', Arial, sans-serif; color: #222;
            }
            .hdr { background: #222; color: #fff; padding: 10px 8mm;
              display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 20px; font-weight: 900; }
            .hdr-t { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; flex: 1; text-align: center; }
            .hdr-m { font-size: 9px; text-align: right; line-height: 1.5; }
            .bar { height: 2px; background: #222; }
            .info { display: flex; padding: 6px 8mm; border-bottom: 1px solid #ccc; }
            .info div { flex: 1; padding: 6px 10px; font-size: 9px; line-height: 1.5; }
            .info .l { color: #888; font-size: 7.5px; text-transform: uppercase; }
            .info .v { font-weight: 700; font-size: 10px; }
            .ss { display: flex; align-items: center; gap: 10px;
              padding: 6px 8mm; border-bottom: 2px solid #222; }
            .circ { width: 58px; height: 58px; border-radius: 50%; border: 4px solid #222;
              display: flex; flex-direction: column; align-items: center;
              justify-content: center; flex-shrink: 0; }
            .circ .n { font-size: 20px; font-weight: 900; line-height: 1; }
            .circ .lb { font-size: 7px; font-weight: 700; margin-top: 1px; }
            .cats { flex: 1; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
            .ct { border: 1px solid #ccc; border-radius: 3px; padding: 4px 5px; text-align: center; }
            .ct-n { font-size: 6px; font-weight: 600; text-transform: uppercase; color: #666; line-height: 1.2; }
            .ct-v { font-size: 12px; font-weight: 900; }
            .ct-d { font-size: 6px; color: #999; }
            .sk { display: flex; margin: 0 8mm; border: 1px solid #222; font-size: 7px; font-weight: 600; }
            .sk > div { flex: 1; text-align: center; padding: 2px 0; border-right: 1px solid #222; }
            .sk > div:last-child { border-right: none; }
            .sk .a { background: #222; color: #fff; }
            .ch { background: #333; color: #fff; padding: 4px 8mm; font-size: 8.5px;
              font-weight: 700; display: flex; justify-content: space-between; margin-top: 3px; }
            .ch .cs { font-weight: 400; font-size: 7.5px; opacity: 0.8; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f0f0f0; padding: 2px 5px; font-size: 6.5px;
              font-weight: 700; color: #666; text-transform: uppercase;
              border-bottom: 1.5px solid #222; text-align: left; }
            td { padding: 2px 5px; border-bottom: 1px solid #e0e0e0;
              font-size: 7.5px; vertical-align: top; }
            .no { width: 3%; text-align: center; font-weight: 600; color: #888; }
            .qt { width: 55%; }
            .qa { width: 7%; text-align: center; font-weight: 700; }
            .qp { width: 7%; text-align: center; }
            .qk { width: 10%; text-align: center; font-size: 6.5px; }
            .hr td { background: #f0f0f0; }
            .kr { font-weight: 900; border: 1px solid #222; padding: 0 3px; font-size: 6px; }
            .pd { font-size: 6px; border: 1px dashed #666; padding: 0 3px; margin-left: 2px; }
            .sr td { border-bottom: 1px solid #eee; padding: 1px 5px 2px 24px;
              font-size: 7px; font-style: italic; }
            .sr .tg { font-size: 6px; font-weight: 700; font-style: normal;
              border: 1px solid #888; padding: 0 3px; margin-right: 3px; }
            .sec { font-size: 10px; font-weight: 700; padding: 6px 8mm 2px;
              border-bottom: 1px solid #ccc; margin-top: 4px; }
            .gc { margin: 3px 8mm; border: 1px solid #ccc; padding: 5px 10px;
              font-size: 8px; line-height: 1.4; font-style: italic; color: #555; min-height: 16px; }
            .sg { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
              padding: 5px 8mm; text-align: center; }
            .sg-t { font-size: 7px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }
            .sg-l { border-top: 1.5px solid #222; width: 70%; margin: 0 auto 3px; }
            .sg-i { font-size: 6.5px; color: #888; line-height: 1.3; }
            .ft { border-top: 1px solid #999; padding: 3px 8mm; display: flex;
              justify-content: space-between; font-size: 6.5px; color: #aaa; margin-top: 4px; }
            @media print {
              body { margin: 0; padding: 0; background: white; }
              .print\\:hidden { display: none !important; }
            }
          `}</style>

          <div id="pdf-report">
            {/* HEADER */}
            <div className="hdr">
              <div className="logo">KebanFood™</div>
              <div className="hdr-t">SAHA DENETİM RAPORU</div>
              <div className="hdr-m">
                No: <b>{reportNo}</b>
                <br />
                Tarih: <b>{formatDate(inspection.inspectionDate)}</b>
              </div>
            </div>
            <div className="bar"></div>

            {/* ZİYARET BİLGİLERİ */}
            <div className="info">
              <div>
                <span className="l">Şube</span>
                <br />
                <span className="v">{inspection.branchName}</span>
              </div>

              <div>
                <span className="l">Restoran Yöneticisi</span>
                <br />
                <span className="v">{inspection.restaurantManagerName || ""}</span>
              </div>

              <div>
                <span className="l">Denetçi</span>
                <br />
                <span className="v">{inspection.inspectorName}</span>
              </div>
              <div>
                <span className="l">E-posta</span>
                <br />
                <span className="v">{inspection.inspectorEmail}</span>
              </div>
            </div>

            {/* ÖZET PUAN */}
            <div className="ss">
              <div className="circ">
                <div className="n">{successScore}%</div>
                <div className="lb">{successLabel}</div>
              </div>
              <div className="cats">
                {categories.map((cat) => {
                  const catAnswers = inspection.answers.filter((a) =>
                    cat.questions.some((q) => q.id === a.questionId)
                  );
                  const earnedPoints = catAnswers
                    .filter((a) => a.answer === "E")
                    .reduce((sum, a) => sum + a.earnedPoints, 0);
                  const totalPoints = catAnswers.reduce((sum, a) => sum + a.questionPoints, 0);
                  const catScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

                  return (
                    <div key={cat.id} className="ct">
                      <div className="ct-n">{cat.name.substring(0, 15)}</div>
                      <div className="ct-v">%{catScore}</div>
                      <div className="ct-d">Ağr: %{cat.weight}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DEĞERLENDİRME SKALASI */}
            <div className="sk">
              <div>79↓ BAŞARISIZ</div>
              <div>80-85 GELİŞTİRİLEBİLİR</div>
              <div>86-90 BEKLENEN</div>
              <div className="a">91+ BAŞARILI</div>
            </div>

            {/* SORULAR */}
            {categories.map((category, catIndex) => {
              const categoryQuestions = category.questions;
              const categoryAnswers = inspection.answers.filter((a) =>
                categoryQuestions.some((q) => q.id === a.questionId)
              );

              if (categoryAnswers.length === 0) return null;

              const earnedPoints = categoryAnswers
                .filter((a) => a.answer === "E")
                .reduce((sum, a) => sum + a.earnedPoints, 0);
              const totalPoints = categoryAnswers.reduce((sum, a) => sum + a.questionPoints, 0);
              const categoryScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

              return (
                <div key={category.id}>
                  <div className="ch">
                    <span>
                      {catIndex + 1}. {category.name} ({categoryQuestions.length} Soru)
                    </span>
                    <span className="cs">
                      {earnedPoints}/{totalPoints} Puan · %{categoryScore} · Ağırlık: %{category.weight}
                    </span>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th className="no">#</th>
                        <th className="qt">Soru</th>
                        <th className="qa">Cevap</th>
                        <th className="qp">Puan</th>
                        <th className="qk">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryAnswers.map((answer, qIndex) => {
                        const question = categoryQuestions.find((q) => q.id === answer.questionId);
                        if (!question) return null;

                        return [
                          <tr key={`q-${answer.questionId}`} className={answer.answer === "H" ? "hr" : ""}>
                            <td className="no">{qIndex + 1}</td>
                            <td className="qt">{question.questionText || ""}</td>
                            <td className="qa">{answer.answer === "E" ? "✓ Evet" : "✗ Hayır"}</td>
                            <td className="qp">
                              {answer.answer === "E" ? answer.earnedPoints : 0}/{answer.questionPoints}
                            </td>
                            <td className="qk">
                              {question.isCritical && <span className="kr">⚠ KRİTİK</span>}
                              {answer.penaltyPoints && answer.penaltyPoints > 0 && (
                                <span className="pd">-{answer.penaltyPoints} Düşüm</span>
                              )}
                            </td>
                          </tr>,
                          answer.answer === "H" && answer.explanation && (
                            <tr key={`exp-${answer.questionId}`} className="sr">
                              <td></td>
                              <td colSpan={4}>
                                <span className="tg">AÇIKLAMA</span> {answer.explanation}
                              </td>
                            </tr>
                          ),
                          answer.answer === "H" && inspection.actions?.find((a) => a.questionId === answer.questionId) && (
                            <tr key={`action-${answer.questionId}`} className="sr">
                              <td></td>
                              <td colSpan={4}>
                                <span style={{ color: "#d32f2f", fontWeight: "bold" }}>AKSİYON:</span> {inspection.actions?.find((a) => a.questionId === answer.questionId)?.actionDescription}
                              </td>
                            </tr>
                          ),
                        ].filter(Boolean);
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* GENEL DEĞERLENDİRME */}
            <div className="sec">GENEL DEĞERLENDİRME</div>
            <div className="gc">{inspection.generalEvaluation?.comments || "Değerlendirme yapılmamıştır."}</div>

            {/* İMZA */}
            <div className="sec">İMZA BÖLÜMÜ</div>
            <div className="sg">
              <div>
                <div className="sg-t">Izgara Şefi</div>
                <div className="sg-l"></div>
                <div className="sg-i">
                  Ad Soyad:
                  <br />
                  Tarih: __/__/____
                </div>
              </div>
              <div>
                <div className="sg-t">Restoran Yöneticisi</div>
                <div className="sg-l"></div>
                <div className="sg-i">
                  Ad Soyad:
                  <br />
                  Tarih: __/__/____
                </div>
              </div>
              <div>
                <div className="sg-t">KEBAN</div>
                <div className="sg-l"></div>
                <div className="sg-i">
                  Ad Soyad:
                  <br />
                  Tarih: __/__/____
                </div>
              </div>
              <div>
                <div className="sg-t">Bölge Müdürü</div>
                <div className="sg-l"></div>
                <div className="sg-i">
                  Ad Soyad:
                  <br />
                  Tarih: __/__/____
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="ft">
              <div>Keban Food™ - Gizli</div>
              <div>Bu rapor otomatik olarak oluşturulmuştur.</div>
              <div>{formatDate(inspection.inspectionDate)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
