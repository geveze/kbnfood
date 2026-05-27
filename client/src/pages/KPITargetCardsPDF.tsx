import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function KPITargetCardsPDF() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const { data: periods } = (trpc as any).kpiTargetCards.getPeriods.useQuery();
  const { data: branches } = (trpc as any).branches.list.useQuery();
  const { data: targetCards } = (trpc as any).kpiTargetCards.list.useQuery({
    period: selectedPeriod || undefined,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (periods && periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0]);
    }
  }, [periods, selectedPeriod]);

  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].name);
    }
  }, [branches, selectedBranch]);

  const generatePDF = () => {
    if (!selectedPeriod || !selectedBranch) {
      toast.error("Lütfen dönem ve şube seçiniz");
      return;
    }

    // Seçili şubenin hedeflerini filtrele
    const branchTargets = targetCards?.filter(
      (card: any) => card.branchName === selectedBranch
    ) || [];

    if (branchTargets.length === 0) {
      toast.error("Bu şube için hedef kartı bulunamadı");
      return;
    }

    // PDF oluştur - A4 landscape
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Sarı renk (Excel şablonundan)
    const yellowColor: [number, number, number] = [255, 193, 7]; // RGB
    const darkGray: [number, number, number] = [64, 64, 64];
    const lightGray: [number, number, number] = [245, 245, 245];

    let currentY = 10;

    // Başlık
    doc.setFontSize(14);
    doc.setTextColor(...darkGray);
    doc.text("HEDEF DEĞERLENDİRME FORMU (RESTORAN YÖNETİMİ)", pageWidth / 2, currentY, {
      align: "center",
      maxWidth: pageWidth - 20,
    });

    currentY += 8;

    // Şube ve dönem bilgisi
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`ŞUBE: ${selectedBranch}`, 15, currentY);
    doc.text(`DEĞERLENDİRME DÖNEMİ: ${selectedPeriod}`, pageWidth - 80, currentY);

    currentY += 8;

    // Değerlendirmeci bilgileri
    doc.setFontSize(9);
    doc.text("İlgili Çalışanların Adı Soyadı / Görevi (Yönetim Kademesi):", 15, currentY);
    currentY += 5;
    doc.text("Değerlendirmeyi Yapan Yönetici / Görevi:", 15, currentY);

    currentY += 10;

    // Tablo başlıkları - Excel şablonuna uygun
    const headers = [
      ["No", "Boyut", "Hedef", "Hedef Açıklaması", "Birim", "Kaynak", "Sıklık", "Ağırlık %", "Hedef Tipi", "Hedef Alt\nLimit\n(80 P)", "Hedef\nDeğer\n(100 P)", "Hedef Üst\nLimit\n(120 P)"],
    ];

    // Tablo verileri
    const tableData = branchTargets.map((card: any, index: number) => [
      (index + 1).toString(),
      card.dimension || "",
      card.target || "",
      card.targetDescription || "",
      card.unit || "",
      card.source || "Sistem", // Kaynak
      card.frequency || "Aylık", // Sıklık
      card.weight?.toString() || "",
      card.targetType || "Artan", // Hedef Tipi
      card.lowerLimit?.toString() || "",
      card.targetValue?.toString() || "",
      card.upperLimit?.toString() || "",
    ]);

    // Tablo ekle
    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: currentY,
      margin: { left: 10, right: 10, top: 10, bottom: 20 },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        halign: "center",
        valign: "middle",
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: yellowColor,
        textColor: [0, 0, 0] as [number, number, number],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: lightGray,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { halign: "center", cellWidth: 12 },
        2: { halign: "left", cellWidth: 18 },
        3: { halign: "left", cellWidth: 28 },
        4: { halign: "center", cellWidth: 10 },
        5: { halign: "center", cellWidth: 12 },
        6: { halign: "center", cellWidth: 12 },
        7: { halign: "center", cellWidth: 10 },
        8: { halign: "center", cellWidth: 12 },
        9: { halign: "center", cellWidth: 12 },
        10: { halign: "center", cellWidth: 12 },
        11: { halign: "center", cellWidth: 12 },
      },
    });

    // Toplam ağırlık satırı
    const totalWeight = branchTargets.reduce(
      (sum: number, card: any) => sum + (parseFloat(card.weight) || 0),
      0
    );

    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 50;
    
    // Toplam ağırlık
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`TOPLAM AĞIRLIK: ${totalWeight}%`, 15, finalY + 5);

    // İmza alanları
    const signatureY = finalY + 15;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    // Bölge Müdürü
    doc.text("İlgili Bölge Müdürü", 15, signatureY);
    doc.text("AD / SOYAD:", 15, signatureY + 5);
    doc.line(15, signatureY + 7, 50, signatureY + 7);
    doc.text("TARİH / İMZA:", 15, signatureY + 12);
    doc.line(15, signatureY + 14, 50, signatureY + 14);

    // Operasyon Müdürü
    doc.text("İlgili Operasyon Müdürü", 75, signatureY);
    doc.text("AD / SOYAD:", 75, signatureY + 5);
    doc.line(75, signatureY + 7, 110, signatureY + 7);
    doc.text("TARİH / İMZA:", 75, signatureY + 12);
    doc.line(75, signatureY + 14, 110, signatureY + 14);

    // Marka Direktörü
    doc.text("Marka Direktörü", 135, signatureY);
    doc.text("AD / SOYAD:", 135, signatureY + 5);
    doc.line(135, signatureY + 7, 170, signatureY + 7);
    doc.text("TARİH / İMZA:", 135, signatureY + 12);
    doc.line(135, signatureY + 14, 170, signatureY + 14);

    // PDF'i indir
    doc.save(`Hedef_Degerlendirme_${selectedBranch}_${selectedPeriod}.pdf`);
    toast.success("PDF başarıyla indirildi");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/kpi-target-cards")}
                className="p-2 hover:bg-accent rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Hedef Değerlendirme Formu PDF
                </h1>
                <p className="text-muted-foreground">
                  Excel şablonuna uygun PDF formatında hedef kartlarını indir
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container">
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>PDF Çıktı Ayarları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dönem Seçiniz *
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="filter-input w-full"
                >
                  <option value="">Dönem Seçiniz</option>
                  {periods?.map((period: string) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Şube Seçiniz *
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="filter-input w-full"
                >
                  <option value="">Şube Seçiniz</option>
                  {branches?.map((branch: any) => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={generatePDF}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF İndir
            </Button>
          </CardContent>
        </Card>

        {/* Önizleme */}
        {selectedPeriod && selectedBranch && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Hedef Kartları Önizlemesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="data-table w-full text-sm">
                  <thead>
                    <tr className="bg-yellow-100">
                      <th>No</th>
                      <th>Boyut</th>
                      <th>Hedef</th>
                      <th>Hedef Açıklaması</th>
                      <th>Birim</th>
                      <th>Ağırlık %</th>
                      <th>Hedef Değer</th>
                      <th>Gerçekleşen</th>
                      <th>Hedef Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetCards
                      ?.filter((card: any) => card.branchName === selectedBranch)
                      .map((card: any, index: number) => (
                        <tr key={card.id}>
                          <td className="text-center">{index + 1}</td>
                          <td>{card.dimension}</td>
                          <td>{card.target}</td>
                          <td className="text-sm">{card.targetDescription}</td>
                          <td className="text-center">{card.unit}</td>
                          <td className="text-center">{card.weight}%</td>
                          <td className="text-center">{card.targetValue}</td>
                          <td className="text-center">{card.actualValue || "-"}</td>
                          <td className="text-center font-semibold">
                            {card.weightedScore}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
