import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useListPapers,
  useListSyllabi,
  useListAnalyses,
  useTriggerAnalysis,
  useGetAnalysis,
  getListAnalysesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, FileText, CheckCircle2, Clock, AlertCircle, Zap, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  paperIds: z.array(z.number()).min(1, "Select at least one paper"),
  syllabusId: z.string().optional(),
});

function AnalysisPoller({ analysisId }: { analysisId: number }) {
  const queryClient = useQueryClient();
  const { data: analysis } = useGetAnalysis({ id: analysisId });

  useEffect(() => {
    if (!analysis) return;
    if (analysis.status === "processing" || analysis.status === "pending") {
      const timer = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [analysis?.status, queryClient, analysisId]);

  return null;
}

export default function Analysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const triggerAnalysis = useTriggerAnalysis();

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [pollingIds, setPollingIds] = useState<number[]>([]);

  const { data: papers } = useListPapers({});
  const { data: syllabi } = useListSyllabi();
  const { data: analyses, isLoading: isLoadingAnalyses } = useListAnalyses();

  const subjects = Array.from(new Set(papers?.map(p => p.subject) || []));
  const filteredPapers = papers?.filter(p => p.subject === selectedSubject) || [];
  const filteredSyllabi = syllabi?.filter(s => s.subject === selectedSubject) || [];

  const processingAnalyses = analyses?.filter(a => a.status === "processing" || a.status === "pending") ?? [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", paperIds: [], syllabusId: undefined },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = await triggerAnalysis.mutateAsync({
        data: {
          subject: values.subject,
          paperIds: values.paperIds,
          syllabusId: values.syllabusId ? parseInt(values.syllabusId) : undefined,
        }
      });
      toast({ title: "Analysis Started", description: "AI is processing your papers. This may take 30–60 seconds." });
      form.reset();
      setSelectedSubject("");
      setPollingIds(prev => [...prev, result.id]);
      queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
    } catch {
      toast({ title: "Trigger failed", description: "Could not start the analysis.", variant: "destructive" });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "processing": return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case "failed": return <AlertCircle className="w-5 h-5 text-destructive" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "failed": return "destructive";
      case "processing": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Run AI Analysis</CardTitle>
            <CardDescription>Extract high-yield topics, patterns, and practice questions from past papers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          setSelectedSubject(val);
                          form.setValue("paperIds", []);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedSubject && (
                  <>
                    <FormField
                      control={form.control}
                      name="paperIds"
                      render={() => (
                        <FormItem>
                          <div className="mb-3">
                            <FormLabel className="text-base">Select Papers</FormLabel>
                            <FormDescription>Choose papers to include in this analysis.</FormDescription>
                          </div>
                          <div className="space-y-2">
                            {filteredPapers.map((paper) => (
                              <FormField
                                key={paper.id}
                                control={form.control}
                                name="paperIds"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(paper.id)}
                                        onCheckedChange={(checked) =>
                                          checked
                                            ? field.onChange([...field.value, paper.id])
                                            : field.onChange(field.value?.filter(v => v !== paper.id))
                                        }
                                      />
                                    </FormControl>
                                    <div className="space-y-0.5 leading-none">
                                      <FormLabel className="font-semibold cursor-pointer">{paper.year} Paper</FormLabel>
                                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">{paper.fileName}</p>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {filteredSyllabi.length > 0 && (
                      <FormField
                        control={form.control}
                        name="syllabusId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Syllabus (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Link a syllabus" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredSyllabi.map(syl => <SelectItem key={syl.id} value={syl.id.toString()}>{syl.fileName}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormDescription>Enables syllabus coverage metrics.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}

                <Button type="submit" className="w-full" disabled={triggerAnalysis.isPending || !selectedSubject}>
                  {triggerAnalysis.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting...</>
                    : <><Zap className="w-4 h-4 mr-2" />Run AI Analysis</>
                  }
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {processingAnalyses.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysis in progress…
              </div>
              <Progress value={undefined} className="h-1.5 animate-pulse" />
              <p className="text-xs text-muted-foreground">This typically takes 30–90 seconds. The page will update automatically.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Polling helpers */}
      {pollingIds.map(id => <AnalysisPoller key={id} analysisId={id} />)}

      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Analysis History</CardTitle>
                <CardDescription>Past and current analysis runs.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() })}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAnalyses ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !analyses || analyses.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground">
                <Brain className="w-14 h-14 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-foreground">No analyses yet</h3>
                <p className="text-sm">Start your first analysis using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analyses.map((analysis) => (
                  <div key={analysis.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/40 transition-colors gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="mt-0.5">{getStatusIcon(analysis.status)}</div>
                      <div>
                        <h4 className="font-bold text-base">{analysis.subject}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{analysis.paperIds.length} paper{analysis.paperIds.length !== 1 ? "s" : ""}</span>
                          {analysis.topicCount != null && <span>• {analysis.topicCount} topics</span>}
                          {analysis.questionCount != null && <span>• {analysis.questionCount} questions</span>}
                          {analysis.syllabusCoverage != null && <span>• {Math.round(analysis.syllabusCoverage)}% coverage</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(analysis.createdAt), "MMM d, yyyy HH:mm")}
                        </div>
                        {(analysis.status === "processing" || analysis.status === "pending") && (
                          <div className="mt-2">
                            <Progress value={undefined} className="h-1 w-40 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={getStatusColor(analysis.status) as "default" | "destructive" | "outline" | "secondary"} className="capitalize self-start sm:self-center">
                      {analysis.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
