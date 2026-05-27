import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface ExpandableQuestionRowProps {
  questionId: number;
  category: string;
  question: string;
  noRatio: string;
  noCount: string;
}

export function ExpandableQuestionRow({
  questionId,
  category,
  question,
  noRatio,
  noCount,
}: ExpandableQuestionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: details, isLoading } = (trpc as any).fieldInspection.getQuestionDetails.useQuery(
    { questionId },
    { enabled: isExpanded }
  );

  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0 h-auto"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{category}</td>
        <td className="px-6 py-4 text-sm text-gray-700">{question}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{noRatio}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{noCount}</td>
      </tr>
      {isExpanded && (
        <tr className="bg-blue-50">
          <td colSpan={5} className="px-6 py-4">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Hayır Cevapları Veren Şubeler</h4>
              {isLoading ? (
                <p className="text-gray-600">Yükleniyor...</p>
              ) : details && details.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                          Şube Adı
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                          Şube Kodu
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                          Denetim Tarihi
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                          Denetçi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((detail: any) => (
                        <tr key={detail.id} className="border-b border-gray-200 hover:bg-gray-100">
                          <td className="px-4 py-2 text-sm text-gray-900">{detail.branchName}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{detail.branchCode}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {new Date(detail.inspectionDate).toLocaleDateString("tr-TR")}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">{detail.inspectorName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">Veri bulunamadı</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
