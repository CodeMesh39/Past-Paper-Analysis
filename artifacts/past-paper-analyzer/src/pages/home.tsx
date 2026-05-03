import { Link } from "wouter";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, BookOpen, Brain, LineChart, UploadCloud, Zap, Target, TrendingUp } from "lucide-react";
import { useGetDashboardSummary, useGetHighYieldTopics } from "@workspace/api-client-react";

export default function Home() {
  const { data: summary, isLoading } = useGetDashboardSummary({});
  const { data: topTopics } = useGetHighYieldTopics({ limit: 3 });
  const hasData = summary && (summary.totalPapers ?? 0) > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      {/* Hero */}
      <section className="py-12 md:py-16 flex flex-col items-center text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-primary/5 text-primary text-sm font-medium">
          <Zap className="w-4 h-4" /> AI-Powered Exam Intelligence
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl">
          Decode your exams.<br />
          <span className="text-primary">Study what matters.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Upload past papers and let AI extract high-yield topics, analyze trends, map syllabus coverage, and generate your personalized study plan.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link href="/upload">
            <Button size="lg" className="px-8 h-12 text-base font-medium shadow-lg">
              <UploadCloud className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="px-8 h-12 text-base font-medium">
              <LineChart className="w-5 h-5 mr-2" />
              View Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-5">
        {[
          {
            icon: <Brain className="w-6 h-6 text-primary" />,
            bg: "bg-primary/10",
            title: "Deep AI Analysis",
            desc: "GPT-4 analyzes years of papers to detect patterns, frequency trends, difficulty levels, and marks distribution.",
          },
          {
            icon: <BookOpen className="w-6 h-6 text-chart-2" />,
            bg: "bg-chart-2/10",
            title: "Syllabus Mapping",
            desc: "Cross-reference topics from past papers against your syllabus to identify coverage gaps and missing areas.",
          },
          {
            icon: <LineChart className="w-6 h-6 text-chart-4" />,
            bg: "bg-chart-4/10",
            title: "Smart Study Plan",
            desc: "Day-by-day schedule with priority-based topic ordering, revision slots, and progress tracking.",
          },
        ].map((f) => (
          <Card key={f.title} className="bg-card hover:shadow-md transition-shadow">
            <CardHeader>
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-3`}>{f.icon}</div>
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* Workflow steps */}
      <section className="bg-muted/40 rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-bold mb-6 text-center">How it works</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: "1", label: "Upload Papers", sub: "PDF or image files", href: "/upload" },
            { step: "2", label: "Add Syllabus", sub: "Optional but recommended", href: "/syllabus" },
            { step: "3", label: "Run Analysis", sub: "AI extracts insights", href: "/analysis" },
            { step: "4", label: "Study Smart", sub: "Planner + practice Qs", href: "/planner" },
          ].map((s) => (
            <Link key={s.step} href={s.href}>
              <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-card border border-transparent hover:border-border transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mb-3">{s.step}</div>
                <div className="font-semibold text-sm">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Live stats */}
      {!isLoading && hasData && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold">Your Progress</h2>
            <Link href="/dashboard" className="text-sm text-primary font-medium flex items-center hover:underline">
              Full Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Papers", value: summary.totalPapers, icon: <UploadCloud className="w-4 h-4" /> },
              { label: "Subjects", value: summary.subjectsAnalyzed, icon: <BookOpen className="w-4 h-4" /> },
              { label: "High-Yield Topics", value: summary.highYieldTopicsCount, icon: <Zap className="w-4 h-4 text-primary" /> },
              { label: "Practice Questions", value: summary.totalQuestions, icon: <Target className="w-4 h-4" /> },
            ].map((stat) => (
              <div key={stat.label} className="p-5 bg-muted rounded-xl">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  {stat.icon}{stat.label}
                </div>
                <div className="text-3xl font-bold">{stat.value ?? 0}</div>
              </div>
            ))}
          </div>

          {/* Syllabus coverage bar */}
          {summary.syllabusCoverage != null && (
            <div className="p-5 bg-muted rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Syllabus Coverage</span>
                <span className="text-2xl font-bold text-primary">{summary.syllabusCoverage}%</span>
              </div>
              <Progress value={summary.syllabusCoverage} className="h-3" />
            </div>
          )}

          {/* Top topics */}
          {topTopics && topTopics.length > 0 && (
            <div className="mt-5 p-5 bg-muted rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Top High-Yield Topics</span>
                <Link href="/topics" className="text-xs text-primary hover:underline">See all →</Link>
              </div>
              <div className="space-y-2">
                {topTopics.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</div>
                    <span className="text-sm font-medium flex-1 truncate">{t.name}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Progress value={t.importanceScore * 10} className="w-20 h-1.5" />
                      <span className="text-xs font-bold text-primary w-6 text-right">{Math.round(t.importanceScore)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* CTA for empty state */}
      {!isLoading && !hasData && (
        <section className="text-center py-10 border-2 border-dashed rounded-2xl text-muted-foreground space-y-4">
          <Brain className="w-14 h-14 mx-auto opacity-20" />
          <h3 className="text-lg font-semibold text-foreground">No data yet</h3>
          <p className="text-sm">Start by uploading your first past paper to unlock AI analysis.</p>
          <Link href="/upload"><Button>Upload First Paper</Button></Link>
        </section>
      )}
    </div>
  );
}
