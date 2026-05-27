import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import LoginLocal from "@/pages/LoginLocal";
import Dashboard from "@/pages/Dashboard";
import KPITargets from "@/pages/KPITargets";
import AdminPanel from "@/pages/AdminPanel";
import Performance from "@/pages/Performance";
import UserManagement from "@/pages/UserManagement";
import BranchManagement from "@/pages/BranchManagement";
import KPIManagement from "@/pages/KPIManagement";
import ExcelUpload from "@/pages/ExcelUpload";
import ReportGenerator from "@/pages/ReportGenerator";
import KPITargetCardsFilter from "@/pages/KPITargetCardsFilter";
import KPITargetCardsPDF from "@/pages/KPITargetCardsPDF";
import BranchComparison from "./pages/BranchComparison";
import BranchPerformanceRanking from "./pages/BranchPerformanceRanking";
import ChangePassword from "@/pages/ChangePassword";
import ActualValueInputForm from "@/pages/ActualValueInputForm";
import MonthlyComparison from "@/pages/MonthlyComparison";
import PerformanceMonitoring from "@/pages/PerformanceMonitoring";
import EvaluationHistory from "@/pages/EvaluationHistory";
import EvaluationReport from "@/pages/EvaluationReport";
import EvaluationsTable from "@/pages/EvaluationsTable";
import { OpenPIF } from "@/pages/OpenPIF";
import { OpenPIFReports } from "@/pages/OpenPIFReports";
import EvaluationReporting from "@/pages/EvaluationReporting";
import AllBranchesPerformanceReport from "@/pages/AllBranchesPerformanceReport";
import ProbationEvaluationForm from "@/pages/ProbationEvaluationForm";
import ProbationEvaluationsList from "@/pages/ProbationEvaluationsList";
import { ProbationEvaluation } from "@/pages/ProbationEvaluation";
import { ProbationEvaluationReport } from "@/pages/ProbationEvaluationReport";
import { ProbationMail } from "@/pages/ProbationMail";
import MailSystemDocumentation from "@/pages/MailSystemDocumentation";
import FieldInspection from "@/pages/FieldInspection";
import FieldInspectionPrint from "@/pages/FieldInspectionPrint";
import InspectionPrint from "@/pages/InspectionPrint";
import FieldInspectionHistory from "@/pages/FieldInspectionHistory";
import FieldInspectionDetail from "@/pages/FieldInspectionDetail";
import InspectionArchive from "@/pages/InspectionArchive";
import InspectionDashboard from "@/pages/InspectionDashboard";
import CriticalQuestionWarnings from "@/pages/CriticalQuestionWarnings";
import ActionTracking from "@/pages/ActionTracking";
import WeeklyPlan from "@/pages/WeeklyPlan";
import { WeeklyPlans } from "@/pages/WeeklyPlans";
import VisitPlans from "@/pages/VisitPlans";
import { Settings } from "@/pages/Settings";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={LoginLocal} />
      <Route path={"/login-local"} component={LoginLocal} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/kpi-targets"} component={KPITargets} />
        <Route path="/kpi-target-cards" component={KPITargetCardsFilter} />
        <Route path="/kpi-target-cards-pdf" component={KPITargetCardsPDF} />
      <Route path={"/branch-comparison"} component={BranchComparison} />
      <Route path={"/branch-performance-ranking"} component={BranchPerformanceRanking} />
      <Route path={"/performance"} component={Performance} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/users"} component={UserManagement} />
      <Route path={"/branches"} component={BranchManagement} />
      <Route path={"/kpi-management"} component={KPIManagement} />
      <Route path={"/excel-upload"} component={ExcelUpload} />
      <Route path={"/reports"} component={ReportGenerator} />
      <Route path={"/change-password"} component={ChangePassword} />
      <Route path="/actual-value-input" component={() => <ActualValueInputForm onClose={() => window.history.back()} />} />
      <Route path="/monthly-comparison" component={MonthlyComparison} />
      <Route path="/performance-monitoring" component={PerformanceMonitoring} />
      <Route path="/evaluation-history" component={EvaluationHistory} />
      <Route path="/evaluation-report" component={EvaluationReport} />
      <Route path="/evaluations-table" component={EvaluationsTable} />
      <Route path="/open-pif" component={OpenPIF} />
      <Route path="/open-pif-reports" component={OpenPIFReports} />
      <Route path="/evaluation-reporting" component={EvaluationReporting} />
      <Route path="/all-branches-performance-report" component={AllBranchesPerformanceReport} />
      <Route path="/all-branches-report" component={AllBranchesPerformanceReport} />
      <Route path="/probation-evaluation" component={ProbationEvaluation} />
      <Route path="/probation-evaluation-form" component={ProbationEvaluationForm} />
      <Route path="/probation-evaluation-report" component={ProbationEvaluationReport} />
      <Route path="/probation-mail" component={ProbationMail} />
      <Route path="/mail-system-documentation" component={MailSystemDocumentation} />
      <Route path="/field-inspection" component={FieldInspection} />
      <Route path="/field-inspection-print/:inspectionId" component={FieldInspectionPrint} />
      <Route path="/inspection-print/:inspectionId" component={InspectionPrint} />
      <Route path="/field-inspection-history" component={FieldInspectionHistory} />
      <Route path="/field-inspection-detail/:inspectionId" component={FieldInspectionDetail} />
      <Route path="/inspection-archive" component={InspectionArchive} />
      <Route path="/inspection-dashboard" component={InspectionDashboard} />
      <Route path="/critical-question-warnings" component={CriticalQuestionWarnings} />
      <Route path="/action-tracking" component={ActionTracking} />
      <Route path="/weekly-plan" component={WeeklyPlan} />
      <Route path="/weekly-plans" component={WeeklyPlans} />
      <Route path="/visit-plans" component={VisitPlans} />
      <Route path="/settings" component={Settings} />
      <Route path="/" component={() => <LoginLocal />} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
