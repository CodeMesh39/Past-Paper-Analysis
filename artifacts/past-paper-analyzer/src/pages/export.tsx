import { useState } from "react";
import { useGetDashboardSummary, useGetHighYieldTopics, useListAnalyses, useListStudyPlans, useGetSyllabusCoverage, useGetTopicFrequency } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, FileText, Printer, BookOpen, Zap, Target, Calendar, BarChart2 } from "lucide-react";
import { format, parseISO } from "date-fns";

const DIFF_COLOR: Record<string, string> = {
  hard: "bg-destructive/10 text-destructive",
  medium: "bg-amber-500/10 text-amber-600",
  easy: "bg-green-500/10 text-green-600",
};

export default function Export() {
  const [subject, setSubject] = useState<string>("all");

  const { data: analyses } = useListAnalyses();
  const subjects = Array.from(new Set(analyses?.map(a => a.subject) || []));
  const activeSubject = subject !== "all" ? subject : undefined;
  const params = activeSubject ? { subject: activeSubject } : {};

  const { data: summary, isLoading } = useGetDashboardSummary(params);
  const { data: topTopics } = useGetHighYieldTopics({ ...params, limit: 20 });
  const { data: syllabusCov } = useGetSyllabusCoverage(params);
  const { data: topicFreq } = useGetTopicFrequency(params);
  const { data: plans } = useListStudyPlans();

  const activePlan = plans && plans.length > 0 ? (activeSubject ? plans.find(p => p.subject === activeSubject) : plans[0]) : undefined;

  const handlePrint = () => window.print();

  const handleDownloadJSON = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      subject: activeSubject ?? "All Subjects",
      summary,
      topTopics,
      syllabusCoverage: syllabusCov,
      topicFrequency: topicFreq,
      studyPlan: activePlan ?? null,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pastpaper-report-${activeSubject ?? "all"}-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Controls — hidden when printing */}
      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Export Report</h1>
            <p className="text-muted-foreground">Generate a comprehensive analysis report for printing or download.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleDownloadJSON} className="gap-2">
              <Download className="w-4 h-4" /> Download JSON
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !summary ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground">No data to export</h3>
          <p className="text-sm">Upload papers and run an analysis first.</p>
        </div>
      ) : (
        <div id="report-content" className="space-y-6">
          {/* Report Header */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold">Past Paper Analysis Report</h2>
                  </div>
                  <p className="text-muted-foreground">Subject: <strong>{activeSubject ?? "All Subjects"}</strong></p>
                  <p className="text-sm text-muted-foreground mt-1">Generated: {format(new Date(), "MMMM d, yyyy 'at' HH:mm")}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary">{summary.totalPapers}</div>
                  <div className="text-sm text-muted-foreground">Papers Analyzed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Papers", value: summary.totalPapers, icon: <BookOpen className="w-4 h-4" /> },
              { label: "High-Yield Topics", value: summary.highYieldTopicsCount, icon: <Zap className="w-4 h-4 text-primary" /> },
              { label: "Practice Questions", value: summary.totalQuestions, icon: <Target className="w-4 h-4" /> },
              { label: "Syllabus Coverage", value: summary.syllabusCoverage != null ? `${summary.syllabusCoverage}%` : "N/A", icon: <BarChart2 className="w-4 h-4" /> },
            ].map(stat => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center mb-1 text-muted-foreground">{stat.icon}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Syllabus Coverage */}
          {syllabusCov && syllabusCov.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" />Syllabus Coverage Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span>Coverage Percentage</span>
                    <span className="text-primary font-bold">{syllabusCov.percentage}%</span>
                  </div>
                  <Progress value={syllabusCov.percentage} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                    <div className="text-2xl font-bold text-green-700">{syllabusCov.coveredTopics}</div>
                    <div className="text-sm text-green-600 mt-1">Topics Covered</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                    <div className="text-2xl font-bold text-red-700">{syllabusCov.uncoveredTopics}</div>
                    <div className="text-sm text-red-600 mt-1">Topics Missing</div>
                  </div>
                </div>
                {syllabusCov.missingTopics && syllabusCov.missingTopics.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">Missing Topics (prioritized)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {syllabusCov.missingTopics.map((t: { name: string; importanceScore: number; difficultyLevel: string }, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg text-sm border">
                          <span className="font-medium truncate">{t.name}</span>
                          <Badge variant="outline" className={`text-xs ml-2 ${DIFF_COLOR[t.difficultyLevel] ?? ""}`}>{t.difficultyLevel}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* High-Yield Topics */}
          {topTopics && topTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" />High-Yield Topics Ranking</CardTitle>
                <CardDescription>Ranked by importance score (frequency + recency + marks weightage)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topTopics.map((topic, index) => (
                    <div key={topic.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">{topic.name}</span>
                          <Badge variant="outline" className={`text-xs ${DIFF_COLOR[topic.difficultyLevel] ?? ""}`}>{topic.difficultyLevel}</Badge>
                          {!topic.inSyllabus && <Badge variant="destructive" className="text-xs">Not in Syllabus</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={topic.importanceScore * 10} className="h-1.5 flex-1" />
                          <span className="text-xs font-bold text-primary w-12 text-right">Score: {Math.round(topic.importanceScore)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Frequency: {topic.frequency}x • Years: {topic.yearsAppeared?.sort().join(", ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Study Plan */}
          {activePlan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Study Plan Summary</CardTitle>
                <CardDescription>
                  {activePlan.subject} • Exam: {format(parseISO(activePlan.examDate), "MMMM d, yyyy")} • {activePlan.hoursPerDay} hrs/day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{activePlan.totalDays}</div>
                    <div className="text-xs text-muted-foreground">Total Days</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{activePlan.days.filter(d => d.isCompleted).length}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{activePlan.days.filter(d => d.isRevision).length}</div>
                    <div className="text-xs text-muted-foreground">Revision Days</div>
                  </div>
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto print:max-h-none">
                  {activePlan.days.slice(0, 14).map((day, i) => (
                    <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg text-sm ${day.isCompleted ? "bg-green-50 border border-green-200" : day.isRevision ? "bg-primary/5 border border-primary/20" : "bg-muted/40"}`}>
                      <span className={`font-bold w-14 flex-shrink-0 ${day.isCompleted ? "text-green-600 line-through" : ""}`}>Day {day.day}</span>
                      <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{format(parseISO(day.date), "MMM d")}</span>
                      <span className={`flex-1 text-xs ${day.isCompleted ? "line-through text-muted-foreground" : ""}`}>{day.topics.join(", ")}</span>
                      {day.isRevision && <Badge variant="outline" className="text-[10px] py-0 h-4 flex-shrink-0">Revision</Badge>}
                    </div>
                  ))}
                  {activePlan.days.length > 14 && (
                    <p className="text-xs text-muted-foreground text-center py-2">... and {activePlan.days.length - 14} more days</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t print:block">
            PastPaper AI — AI-powered exam intelligence • Report generated {format(new Date(), "MMMM d, yyyy")}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
          #report-content { padding: 0; }
        }
      `}</style>
    </div>
  );
}
