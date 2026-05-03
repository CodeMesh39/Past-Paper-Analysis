import { useState } from "react";
import { useListPracticeQuestions, useListTopics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, HelpCircle, Filter, Search, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useState as useLocalState } from "react";

const DIFF_COLOR: Record<string, string> = {
  hard: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-200",
  easy: "bg-green-500/10 text-green-600 border-green-200",
};

const TYPE_LABELS: Record<string, string> = {
  theory: "Theory",
  numerical: "Numerical",
  definition: "Definition",
  long_answer: "Long Answer",
  mcq: "MCQ",
  case_study: "Case Study",
  diagram: "Diagram",
};

export default function Questions() {
  const [subject, setSubject] = useState<string>("all");
  const [topic, setTopic] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data: topicsData } = useListTopics(subject !== "all" ? { subject } : {});
  const subjects = Array.from(new Set(topicsData?.map(t => t.subject) || []));
  const uniqueTopics = Array.from(new Set(topicsData?.map(t => t.name) || [])).sort();

  const { data: questions, isLoading } = useListPracticeQuestions({
    subject: subject !== "all" ? subject : undefined,
    topic: topic !== "all" ? topic : undefined,
  });

  const filtered = (questions ?? []).filter(q => {
    const matchDiff = difficulty === "all" || q.difficulty === difficulty;
    const matchSearch = !search || q.questionText.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase());
    return matchDiff && matchSearch;
  });

  const byTopic = filtered.reduce<Record<string, typeof filtered>>((acc, q) => {
    if (!acc[q.topic]) acc[q.topic] = [];
    acc[q.topic].push(q);
    return acc;
  }, {});

  const toggleExpand = (id: number) => {
    setExpanded(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const totalMarks = filtered.reduce((s, q) => s + (q.marksAllotted ?? 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice Questions</h1>
          <p className="text-muted-foreground">AI-generated exam-style questions grouped by topic.</p>
        </div>
        {filtered.length > 0 && (
          <div className="flex gap-3 text-sm text-muted-foreground bg-muted/50 rounded-xl p-3 flex-shrink-0">
            <span><strong className="text-foreground">{filtered.length}</strong> questions</span>
            <span>•</span>
            <span><strong className="text-foreground">{totalMarks}</strong> total marks</span>
            <span>•</span>
            <span><strong className="text-foreground">{Object.keys(byTopic).length}</strong> topics</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 p-4 bg-muted/40 rounded-xl border">
        <div className="flex items-center text-sm font-medium text-muted-foreground px-1">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background h-9"
          />
        </div>
        <Select value={subject} onValueChange={v => { setSubject(v); setTopic("all"); }}>
          <SelectTrigger className="w-full sm:w-[160px] bg-background h-9"><SelectValue placeholder="All Subjects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="w-full sm:w-[200px] bg-background h-9"><SelectValue placeholder="All Topics" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {uniqueTopics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-full sm:w-[140px] bg-background h-9"><SelectValue placeholder="All Levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        {(subject !== "all" || topic !== "all" || difficulty !== "all" || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setSubject("all"); setTopic("all"); setDifficulty("all"); setSearch(""); }} className="text-muted-foreground h-9">
            Clear filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-1">No questions found</h3>
          <p className="text-sm">{questions && questions.length > 0 ? "Try adjusting your filters." : "Run an AI analysis on your papers to generate questions."}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byTopic).map(([topicName, qs]) => (
            <Card key={topicName} className="overflow-hidden">
              <CardHeader className="bg-muted/30 border-b py-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                    <div>
                      <CardTitle className="text-base">{topicName}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{qs.length} question{qs.length !== 1 ? "s" : ""} • {qs.reduce((s, q) => s + (q.marksAllotted ?? 0), 0)} marks total</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from(new Set(qs.map(q => q.difficulty))).map(d => (
                      <Badge key={d} variant="outline" className={`text-xs ${DIFF_COLOR[d] ?? ""}`}>{d}</Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {qs.map((q, idx) => (
                  <div key={q.id} className="p-5">
                    <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={() => toggleExpand(q.id)}>
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground flex-shrink-0 mt-0.5">Q{idx + 1}</span>
                        <p className="text-sm leading-relaxed font-medium line-clamp-2">{q.questionText}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`text-xs ${DIFF_COLOR[q.difficulty] ?? ""}`}>{q.difficulty}</Badge>
                        {q.marksAllotted != null && (
                          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">[{q.marksAllotted}m]</span>
                        )}
                        {expanded.has(q.id) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    {expanded.has(q.id) && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{q.questionText}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-muted-foreground">
                            <strong>Type:</strong> {TYPE_LABELS[q.questionType] ?? q.questionType}
                          </span>
                          <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-muted-foreground">
                            <strong>Subject:</strong> {q.subject}
                          </span>
                          {q.sourceYear && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-muted-foreground">
                              <strong>Year:</strong> {q.sourceYear}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
