import { useState } from "react";
import { useListPracticeQuestions, useListTopics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, HelpCircle, Filter } from "lucide-react";

export default function Questions() {
  const [subject, setSubject] = useState<string>("all");
  const [topic, setTopic] = useState<string>("all");

  const { data: topicsData } = useListTopics(subject !== "all" ? { subject } : {});
  const subjects = Array.from(new Set(topicsData?.map(t => t.subject) || []));
  const uniqueTopics = Array.from(new Set(topicsData?.filter(t => subject === "all" || t.subject === subject).map(t => t.name) || []));

  const { data: questions, isLoading } = useListPracticeQuestions({
    subject: subject !== "all" ? subject : undefined,
    topic: topic !== "all" ? topic : undefined,
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'hard': return 'bg-destructive/10 text-destructive';
      case 'medium': return 'bg-chart-1/10 text-chart-1';
      case 'easy': return 'bg-chart-2/10 text-chart-2';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getTypeFormat = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Practice Questions</h1>
        <p className="text-muted-foreground">Extracted from past papers and categorized by topic.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-xl border">
        <div className="flex items-center text-sm font-medium text-muted-foreground px-2">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </div>
        <Select value={subject} onValueChange={(val) => { setSubject(val); setTopic(""); }}>
          <SelectTrigger className="w-full sm:w-[200px] bg-background">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="w-full sm:w-[300px] bg-background">
            <SelectValue placeholder="All Topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {uniqueTopics.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !questions || questions.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-1">No questions found</h3>
          <p>Try adjusting your filters or run an analysis on uploaded papers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {questions.map((q) => (
            <Card key={q.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Meta sidebar */}
                <div className="sm:w-64 bg-muted/30 p-4 border-b sm:border-b-0 sm:border-r flex flex-col gap-3">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Topic</div>
                    <div className="font-medium text-sm leading-tight">{q.topic}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 mt-auto">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
                      <Badge variant="secondary" className={getDifficultyColor(q.difficulty)}>
                        {q.difficulty}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Type</div>
                      <Badge variant="outline">{getTypeFormat(q.questionType)}</Badge>
                    </div>
                  </div>
                </div>
                
                {/* Question content */}
                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                      {q.subject} • {q.sourceYear || 'Unknown Year'}
                    </span>
                    {q.marksAllotted && (
                      <span className="text-sm font-bold text-muted-foreground">
                        [{q.marksAllotted} marks]
                      </span>
                    )}
                  </div>
                  
                  <div className="text-lg leading-relaxed whitespace-pre-wrap flex-1">
                    {q.questionText}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
