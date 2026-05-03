import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboardSummary,
  useGetTopicFrequency,
  useGetYearTrends,
  useGetDifficultyDistribution,
  useGetSyllabusCoverage,
  useListAnalyses,
  useGetHighYieldTopics,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from "recharts";
import { Loader2, TrendingUp, AlertTriangle, BookOpen, Target, RotateCcw, Zap, Award, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const DIFF_COLORS = {
  easy: "#22c55e",
  medium: "#f59e0b",
  hard: "#ef4444",
};

export default function Dashboard() {
  const [subject, setSubject] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: analyses } = useListAnalyses();
  const subjects = Array.from(new Set(analyses?.map(a => a.subject) || []));
  const activeSubject = subject !== "all" ? subject : undefined;
  const params = activeSubject ? { subject: activeSubject } : {};

  const { data: summary, isLoading: load1 } = useGetDashboardSummary(params);
  const { data: topicFreq, isLoading: load2 } = useGetTopicFrequency(params);
  const { data: yearTrends, isLoading: load3 } = useGetYearTrends(params);
  const { data: diffDist, isLoading: load4 } = useGetDifficultyDistribution(params);
  const { data: syllabusCov, isLoading: load5 } = useGetSyllabusCoverage(params);
  const { data: topTopics } = useGetHighYieldTopics({ ...params, limit: 5 });

  const isLoading = load1 || load2 || load3 || load4 || load5;

  const resetDashboard = () => {
    setSubject("all");
    queryClient.invalidateQueries();
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center space-y-4">
        <Target className="w-16 h-16 text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-bold">No Data Available</h2>
        <p className="text-muted-foreground">Upload and analyze papers to populate the dashboard.</p>
        <Link href="/upload"><Button>Upload Papers</Button></Link>
      </div>
    );
  }

  const diffData = (diffDist ?? []).map(d => ({
    ...d,
    fill: DIFF_COLORS[d.difficulty as keyof typeof DIFF_COLORS] ?? "#888",
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Insights across {summary.totalPapers} papers and {summary.subjectsAnalyzed} subjects.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-full sm:w-56">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={resetDashboard} className="gap-2 flex-shrink-0">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Papers Analyzed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPapers}</div>
            <p className="text-xs text-muted-foreground">Across {summary.subjectsAnalyzed} subject{(summary.subjectsAnalyzed ?? 0) !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Questions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">Extracted and tagged</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High-Yield Topics</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{summary.highYieldTopicsCount}</div>
            <p className="text-xs text-muted-foreground">Score ≥ 7/10</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Syllabus Coverage</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.syllabusCoverage != null ? `${summary.syllabusCoverage}%` : "N/A"}</div>
            {summary.syllabusCoverage != null ? (
              <Progress value={summary.syllabusCoverage} className="h-1.5 mt-2" />
            ) : (
              <p className="text-xs text-muted-foreground">Upload syllabus</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Topic Frequency</CardTitle>
            <CardDescription>Top topics ranked by importance score.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {topicFreq && topicFreq.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicFreq} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="topic" type="category" width={110} tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{ backgroundColor: "var(--popover)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="frequency" name="Frequency" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No topic data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yearly Trends</CardTitle>
            <CardDescription>Papers and questions over the years.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {yearTrends && yearTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearTrends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "var(--popover)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line yAxisId="left" type="monotone" dataKey="papers" name="Papers" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line yAxisId="left" type="monotone" dataKey="topicCount" name="Topics" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No trend data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Difficulty Distribution</CardTitle>
            <CardDescription>Breakdown by difficulty level.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {diffData && diffData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={diffData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="count" nameKey="difficulty">
                    {diffData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: "var(--popover)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Syllabus Coverage</CardTitle>
            <CardDescription>Topics covered vs. missing.</CardDescription>
          </CardHeader>
          <CardContent>
            {syllabusCov && syllabusCov.total > 0 ? (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span>Coverage</span>
                    <span className="text-primary">{syllabusCov.percentage ?? 0}%</span>
                  </div>
                  <Progress value={syllabusCov.percentage ?? 0} className="h-3 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-green-500/10 rounded-xl text-center border border-green-200">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-green-600">{syllabusCov.coveredTopics}</div>
                    <div className="text-xs text-muted-foreground mt-1">Covered</div>
                  </div>
                  <div className="p-4 bg-destructive/10 rounded-xl text-center border border-destructive/20">
                    <XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
                    <div className="text-2xl font-bold text-destructive">{syllabusCov.uncoveredTopics}</div>
                    <div className="text-xs text-muted-foreground mt-1">Missing</div>
                  </div>
                </div>
                {syllabusCov.missingTopics && syllabusCov.missingTopics.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Missing Topics</p>
                    <div className="space-y-1.5">
                      {syllabusCov.missingTopics.slice(0, 4).map((t: { name: string; importanceScore: number }, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-lg">
                          <span className="font-medium truncate max-w-[140px]">{t.name}</span>
                          <Badge variant="destructive" className="text-[10px] h-4 flex-shrink-0">Score {Math.round(t.importanceScore)}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm text-center border-2 border-dashed rounded-xl gap-2 p-4">
                <BookOpen className="w-8 h-8 opacity-20" />
                Upload a syllabus and run analysis to see coverage
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top 5 Topics</CardTitle>
              <CardDescription>Highest importance score.</CardDescription>
            </div>
            <Link href="/topics" className="text-xs text-primary hover:underline">View all →</Link>
          </CardHeader>
          <CardContent>
            {topTopics && topTopics.length > 0 ? (
              <div className="space-y-3">
                {topTopics.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{t.name}</span>
                        <span className="text-xs font-bold text-primary ml-2 flex-shrink-0">{Math.round(t.importanceScore)}</span>
                      </div>
                      <Progress value={t.importanceScore * 10} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No topics yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
