import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Brain, LineChart, UploadCloud } from "lucide-react";
import { useGetDashboardSummary } from "@workspace/api-client-react";

export default function Home() {
  const { data: summary, isLoading } = useGetDashboardSummary({});

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <section className="py-12 md:py-20 flex flex-col items-center text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl">
          Decode your exams. <br/>
          <span className="text-primary">Study what matters.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Upload your past papers and syllabus. Let our AI extract the high-yield topics, analyze difficulty trends, and generate a personalized study plan for you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link href="/upload">
            <Button size="lg" className="px-8 h-12 text-base font-medium">
              <UploadCloud className="w-5 h-5 mr-2" />
              Upload Papers
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

      <section className="grid md:grid-cols-3 gap-6 pt-8">
        <Card className="bg-card">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>AI Analysis</CardTitle>
            <CardDescription>
              We analyze years of past papers to find patterns, frequent topics, and difficulty distribution so you don't have to.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="bg-card">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-chart-2" />
            </div>
            <CardTitle>Syllabus Coverage</CardTitle>
            <CardDescription>
              Upload your syllabus to cross-reference with past papers. See exactly what you've covered and what you're missing.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4">
              <LineChart className="w-6 h-6 text-chart-4" />
            </div>
            <CardTitle>Smart Planning</CardTitle>
            <CardDescription>
              Generate a day-by-day study schedule based on topic importance and your exam date to maximize efficiency.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {summary && !isLoading && (
        <section className="mt-16 pt-8 border-t">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Stats</h2>
            <Link href="/dashboard" className="text-sm text-primary font-medium flex items-center hover:underline">
              Full Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 bg-muted rounded-xl">
              <div className="text-sm font-medium text-muted-foreground mb-2">Total Papers</div>
              <div className="text-3xl font-bold">{summary.totalPapers}</div>
            </div>
            <div className="p-6 bg-muted rounded-xl">
              <div className="text-sm font-medium text-muted-foreground mb-2">High-Yield Topics</div>
              <div className="text-3xl font-bold">{summary.highYieldTopicsCount}</div>
            </div>
            <div className="p-6 bg-muted rounded-xl">
              <div className="text-sm font-medium text-muted-foreground mb-2">Questions Found</div>
              <div className="text-3xl font-bold">{summary.totalQuestions}</div>
            </div>
            <div className="p-6 bg-muted rounded-xl">
              <div className="text-sm font-medium text-muted-foreground mb-2">Subjects</div>
              <div className="text-3xl font-bold">{summary.subjectsAnalyzed}</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
