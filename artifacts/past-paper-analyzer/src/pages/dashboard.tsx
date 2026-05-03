import { useState } from "react";
import { 
  useGetDashboardSummary, 
  useGetTopicFrequency, 
  useGetYearTrends, 
  useGetDifficultyDistribution,
  useGetSyllabusCoverage,
  useListAnalyses
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { Loader2, TrendingUp, AlertTriangle, BookOpen, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const DIFF_COLORS = {
  easy: 'hsl(var(--chart-2))',   // Yellow/Greenish
  medium: 'hsl(var(--chart-1))', // Blue
  hard: 'hsl(var(--destructive))' // Red
};

export default function Dashboard() {
  const [subject, setSubject] = useState<string>("all");
  
  const { data: analyses } = useListAnalyses();
  const subjects = Array.from(new Set(analyses?.map(a => a.subject) || []));
  const activeSubject = subject !== "all" ? subject : (subjects.length > 0 ? subjects[0] : undefined);

  const { data: summary, isLoading: load1 } = useGetDashboardSummary(activeSubject ? { subject: activeSubject } : {});
  const { data: topicFreq, isLoading: load2 } = useGetTopicFrequency(activeSubject ? { subject: activeSubject } : {});
  const { data: yearTrends, isLoading: load3 } = useGetYearTrends(activeSubject ? { subject: activeSubject } : {});
  const { data: diffDist, isLoading: load4 } = useGetDifficultyDistribution(activeSubject ? { subject: activeSubject } : {});
  const { data: syllabusCov, isLoading: load5 } = useGetSyllabusCoverage(activeSubject ? { subject: activeSubject } : {});

  const isLoading = load1 || load2 || load3 || load4 || load5;

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
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Insights from {summary.totalPapers} past papers.</p>
        </div>
        
        <div className="w-full sm:w-64">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Papers Analyzed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPapers}</div>
            <p className="text-xs text-muted-foreground">Across {summary.subjectsAnalyzed} subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">Extracted and tagged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High-Yield Topics</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.highYieldTopicsCount}</div>
            <p className="text-xs text-muted-foreground">Crucial for revision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Syllabus Coverage</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.syllabusCoverage ? `${summary.syllabusCoverage}%` : 'N/A'}</div>
            {syllabusCov ? (
              <Progress value={summary.syllabusCoverage} className="h-2 mt-2" />
            ) : (
              <p className="text-xs text-muted-foreground">Upload syllabus to see</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Topic Frequency</CardTitle>
            <CardDescription>Most frequently tested topics across all years.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {topicFreq && topicFreq.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicFreq} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                  <XAxis type="number" />
                  <YAxis dataKey="topic" type="category" width={100} tick={{fontSize: 12}} />
                  <RechartsTooltip 
                    cursor={{fill: 'var(--muted)'}}
                    contentStyle={{backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px'}}
                  />
                  <Bar dataKey="frequency" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Yearly Trends</CardTitle>
            <CardDescription>Question count & average difficulty over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {yearTrends && yearTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip contentStyle={{backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px'}} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="questionCount" name="Questions" stroke="var(--color-primary)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="avgDifficulty" name="Avg Difficulty" stroke="var(--color-chart-2)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 divide-y lg:divide-y-0 lg:divide-x">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-1">Difficulty Distribution</h3>
            <p className="text-sm text-muted-foreground mb-4">Breakdown of question difficulty.</p>
            <div className="h-[250px]">
              {diffDist && diffDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diffDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="difficulty"
                    >
                      {diffDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DIFF_COLORS[entry.difficulty as keyof typeof DIFF_COLORS] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px'}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No data</div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-1">Syllabus Coverage</h3>
            <p className="text-sm text-muted-foreground mb-4">Topics covered vs. missing in past papers.</p>
            {syllabusCov ? (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-sm">Coverage</span>
                    <span className="font-medium text-sm">{syllabusCov.coveragePercentage}%</span>
                  </div>
                  <Progress value={syllabusCov.coveragePercentage} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{syllabusCov.coveredTopics}</div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Covered Topics</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-destructive">{syllabusCov.uncoveredTopics}</div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Missing Topics</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-6">
                Upload and link a syllabus to see coverage data
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
