import { useState } from "react";
import { useGetHighYieldTopics, useListAnalyses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Target, BarChart2 } from "lucide-react";

export default function Topics() {
  const [subject, setSubject] = useState<string>("all");
  
  const { data: analyses } = useListAnalyses();
  const subjects = Array.from(new Set(analyses?.map(a => a.subject) || []));
  const activeSubject = subject !== "all" ? subject : (subjects.length > 0 ? subjects[0] : undefined);

  const { data: topics, isLoading } = useGetHighYieldTopics({ 
    subject: activeSubject,
    limit: 20 
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'hard': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-chart-1/10 text-chart-1 border-chart-1/20';
      case 'easy': return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">High-Yield Topics</h1>
          <p className="text-muted-foreground">The most critical concepts to study, ranked by importance.</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Topic Leaderboard</CardTitle>
          <CardDescription>Based on frequency, recency, and marks weightage across past papers.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !topics || topics.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No topics found. Run an analysis first.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topics.map((topic, index) => (
                <div 
                  key={topic.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors gap-4 relative overflow-hidden"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-0 left-0 bottom-0 w-12 bg-muted flex items-center justify-center font-bold text-lg text-muted-foreground border-r">
                    #{index + 1}
                  </div>
                  
                  <div className="pl-14 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{topic.name}</h3>
                      <Badge variant="outline" className={getDifficultyColor(topic.difficultyLevel)}>
                        {topic.difficultyLevel}
                      </Badge>
                      {topic.inSyllabus === false && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive">Not in Syllabus</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {topic.subject} • Appeared in {topic.yearsAppeared?.join(', ') || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="pl-14 sm:pl-0 flex flex-wrap gap-4 items-center">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 min-w-[80px]">
                      <span className="text-xs font-medium text-muted-foreground flex items-center"><Target className="w-3 h-3 mr-1"/>Score</span>
                      <span className="font-bold text-xl text-primary">{Math.round(topic.importanceScore)}</span>
                    </div>
                    
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 min-w-[80px]">
                      <span className="text-xs font-medium text-muted-foreground flex items-center"><BarChart2 className="w-3 h-3 mr-1"/>Freq</span>
                      <span className="font-bold text-lg">{topic.frequency}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
