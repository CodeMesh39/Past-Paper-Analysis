import { useState } from "react";
import { useGetHighYieldTopics, useListTopics, useListAnalyses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, Target, BarChart2, BookOpen, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

const DIFF_BADGE: Record<string, string> = {
  hard: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-200",
  easy: "bg-green-500/10 text-green-600 border-green-200",
};

export default function Topics() {
  const [subject, setSubject] = useState<string>("all");

  const { data: analyses } = useListAnalyses();
  const subjects = Array.from(new Set(analyses?.map(a => a.subject) || []));
  const activeSubject = subject !== "all" ? subject : undefined;

  const { data: topics, isLoading } = useGetHighYieldTopics({ subject: activeSubject, limit: 30 });
  const { data: allTopics } = useListTopics(activeSubject ? { subject: activeSubject } : {});

  const highYield = topics?.filter(t => t.importanceScore >= 7) ?? [];
  const medium = topics?.filter(t => t.importanceScore >= 4 && t.importanceScore < 7) ?? [];
  const low = topics?.filter(t => t.importanceScore < 4) ?? [];
  const notInSyllabus = allTopics?.filter(t => !t.inSyllabus).sort((a, b) => b.importanceScore - a.importanceScore).slice(0, 10) ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">High-Yield Topics</h1>
          <p className="text-muted-foreground">Ranked by importance score: frequency × recency × marks weightage.</p>
        </div>
        <div className="w-full sm:w-64">
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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !topics || topics.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground">No topics yet</h3>
          <p className="text-sm">Run an AI analysis first to see ranked topics.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{highYield.length}</div>
                <div className="text-xs font-medium text-muted-foreground mt-1">Critical Topics</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{medium.length}</div>
                <div className="text-xs font-medium text-muted-foreground mt-1">Important Topics</div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{low.length}</div>
                <div className="text-xs font-medium text-muted-foreground mt-1">Supporting Topics</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{topics.length}</div>
                <div className="text-xs font-medium text-muted-foreground mt-1">Total Topics</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="ranked">
            <TabsList className="mb-4">
              <TabsTrigger value="ranked" className="flex items-center gap-2"><Zap className="w-4 h-4" />Ranked List</TabsTrigger>
              <TabsTrigger value="missing" className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Not in Syllabus</TabsTrigger>
            </TabsList>

            <TabsContent value="ranked">
              <Card>
                <CardHeader>
                  <CardTitle>Topic Leaderboard</CardTitle>
                  <CardDescription>Sorted by importance score (frequency + recency + marks).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topics.map((topic, index) => (
                      <div
                        key={topic.id}
                        className={`relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-xl transition-colors ${
                          index < 3 ? "border-primary/30 bg-primary/5" : "bg-card hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            index === 0 ? "bg-yellow-100 text-yellow-700 border border-yellow-300" :
                            index === 1 ? "bg-gray-100 text-gray-600 border border-gray-300" :
                            index === 2 ? "bg-amber-100 text-amber-700 border border-amber-300" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-base leading-tight">{topic.name}</h3>
                              <Badge variant="outline" className={`text-xs ${DIFF_BADGE[topic.difficultyLevel] ?? ""}`}>
                                {topic.difficultyLevel}
                              </Badge>
                              {topic.inSyllabus ? (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />In Syllabus
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                                  Not in Syllabus
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {topic.subject} • Years: {topic.yearsAppeared?.sort().join(", ") || "N/A"}
                              {topic.questionTypes?.length > 0 && ` • ${topic.questionTypes.slice(0, 2).join(", ")}`}
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={topic.importanceScore * 10} className="h-1.5 flex-1" />
                              <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(topic.importanceScore * 10)}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 sm:flex-nowrap flex-shrink-0 pl-14 sm:pl-0">
                          <div className="flex flex-col items-center p-2.5 rounded-lg bg-primary/10 min-w-[70px]">
                            <Target className="w-3.5 h-3.5 text-primary mb-1" />
                            <span className="font-bold text-lg text-primary leading-none">{Math.round(topic.importanceScore)}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Score</span>
                          </div>
                          <div className="flex flex-col items-center p-2.5 rounded-lg bg-muted min-w-[70px]">
                            <BarChart2 className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                            <span className="font-bold text-lg leading-none">{topic.frequency}x</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Freq</span>
                          </div>
                          <div className="flex flex-col items-center p-2.5 rounded-lg bg-muted min-w-[70px]">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                            <span className="font-bold text-lg leading-none">{Math.round(topic.marksWeightage)}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Marks</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="missing">
              <Card>
                <CardHeader>
                  <CardTitle>Topics Not in Syllabus</CardTitle>
                  <CardDescription>High-importance topics that appeared in past papers but aren't in your syllabus. Consider reviewing these.</CardDescription>
                </CardHeader>
                <CardContent>
                  {notInSyllabus.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20 text-green-500" />
                      <p className="font-medium text-foreground">All topics are in the syllabus!</p>
                      <p className="text-sm">Upload a syllabus and run analysis to see coverage gaps.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notInSyllabus.map((topic) => (
                        <div key={topic.id} className="flex items-center justify-between p-4 border border-destructive/20 rounded-xl bg-destructive/5">
                          <div>
                            <h4 className="font-semibold">{topic.name}</h4>
                            <p className="text-xs text-muted-foreground">{topic.subject} • {topic.yearsAppeared?.sort().join(", ")}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={DIFF_BADGE[topic.difficultyLevel] ?? ""}>
                              {topic.difficultyLevel}
                            </Badge>
                            <div className="text-right">
                              <div className="text-lg font-bold text-destructive">{Math.round(topic.importanceScore)}</div>
                              <div className="text-[10px] text-muted-foreground">score</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
