import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListPapers, 
  useListSyllabi, 
  useListAnalyses, 
  useTriggerAnalysis,
  getListAnalysesQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  paperIds: z.array(z.number()).min(1, "Select at least one paper to analyze"),
  syllabusId: z.string().optional(),
});

export default function Analysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const triggerAnalysis = useTriggerAnalysis();
  
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  
  // Data hooks
  const { data: papers } = useListPapers({});
  const { data: syllabi } = useListSyllabi();
  const { data: analyses, isLoading: isLoadingAnalyses } = useListAnalyses();

  // Unique subjects from uploaded papers
  const subjects = Array.from(new Set(papers?.map(p => p.subject) || []));
  const filteredPapers = papers?.filter(p => p.subject === selectedSubject) || [];
  const filteredSyllabi = syllabi?.filter(s => s.subject === selectedSubject) || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      paperIds: [],
      syllabusId: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await triggerAnalysis.mutateAsync({
        data: {
          subject: values.subject,
          paperIds: values.paperIds,
          syllabusId: values.syllabusId ? parseInt(values.syllabusId) : undefined,
        }
      });
      
      toast({
        title: "Analysis Triggered",
        description: "AI is now analyzing the selected papers.",
      });
      
      form.reset();
      setSelectedSubject("");
      queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
    } catch (error) {
      toast({
        title: "Trigger failed",
        description: "There was an error triggering the analysis.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'processing': return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-destructive" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Run Analysis</CardTitle>
            <CardDescription>Trigger AI to process papers and extract high-yield topics.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map(sub => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
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
                          <div className="mb-4">
                            <FormLabel className="text-base">Select Papers</FormLabel>
                            <FormDescription>Choose which papers to include in this analysis run.</FormDescription>
                          </div>
                          {filteredPapers.map((paper) => (
                            <FormField
                              key={paper.id}
                              control={form.control}
                              name="paperIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={paper.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(paper.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, paper.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== paper.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="font-medium cursor-pointer">
                                        {paper.year} Paper
                                      </FormLabel>
                                      <p className="text-xs text-muted-foreground">{paper.fileName}</p>
                                    </div>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
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
                            <FormLabel>Syllabus Reference (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a syllabus" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredSyllabi.map(syl => (
                                  <SelectItem key={syl.id} value={syl.id.toString()}>{syl.fileName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>Link a syllabus to calculate coverage metrics.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}

                <Button type="submit" className="w-full" disabled={triggerAnalysis.isPending || !selectedSubject}>
                  {triggerAnalysis.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Brain className="w-4 h-4 mr-2" />
                  {triggerAnalysis.isPending ? "Processing..." : "Run AI Analysis"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Analysis History</CardTitle>
            <CardDescription>View status of past and current analysis runs.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAnalyses ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !analyses || analyses.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No analyses run yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analyses.map((analysis) => (
                  <div key={analysis.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">{getStatusIcon(analysis.status)}</div>
                      <div>
                        <h4 className="font-bold text-lg">{analysis.subject} Analysis</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            {analysis.paperIds.length} Papers
                          </span>
                          {analysis.topicCount !== undefined && (
                            <span>• {analysis.topicCount} Topics</span>
                          )}
                          {analysis.questionCount !== undefined && (
                            <span>• {analysis.questionCount} Questions</span>
                          )}
                          <span>• {format(new Date(analysis.createdAt), "MMM d, yyyy HH:mm")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge variant={
                        analysis.status === 'completed' ? 'default' : 
                        analysis.status === 'failed' ? 'destructive' : 
                        analysis.status === 'processing' ? 'outline' : 'secondary'
                      } className="capitalize">
                        {analysis.status}
                      </Badge>
                    </div>
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
