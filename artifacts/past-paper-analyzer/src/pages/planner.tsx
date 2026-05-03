import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateStudyPlan,
  useUpdateStudyPlan,
  useListStudyPlans,
  useListAnalyses,
  getListStudyPlansQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Calendar, Loader2, CheckSquare, Clock, BookOpen, Trash2, ChevronDown, ChevronUp, RotateCcw, Zap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  examDate: z.string().min(1, "Exam date is required"),
  hoursPerDay: z.coerce.number().min(1).max(16),
  analysisId: z.coerce.number().min(1, "Analysis is required"),
});

export default function Planner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const baseUrl = import.meta.env.BASE_URL;

  const createPlan = useCreateStudyPlan();
  const updatePlan = useUpdateStudyPlan();

  const { data: plans, isLoading: isLoadingPlans } = useListStudyPlans();
  const { data: analyses } = useListAnalyses();

  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0, 1]));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", examDate: "", hoursPerDay: 4 },
  });

  if (plans && plans.length > 0 && activePlanId === null) {
    setActivePlanId(plans[0].id);
  }

  const activePlan = plans?.find(p => p.id === activePlanId);
  const completedDays = activePlan?.days.filter(d => d.isCompleted).length ?? 0;
  const totalDays = activePlan?.days.length ?? 0;
  const progressPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  const daysUntilExam = activePlan ? differenceInDays(parseISO(activePlan.examDate), new Date()) : null;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const plan = await createPlan.mutateAsync({ data: values });
      toast({ title: "Plan Created", description: "Your personalized study schedule is ready." });
      form.reset();
      queryClient.invalidateQueries({ queryKey: getListStudyPlansQueryKey() });
      setActivePlanId(plan.id);
    } catch {
      toast({ title: "Creation failed", description: "Could not generate study plan.", variant: "destructive" });
    }
  };

  const handleToggleDay = async (planId: number, dayIndex: number, currentStatus: boolean) => {
    try {
      await updatePlan.mutateAsync({ id: planId, data: { dayIndex, isCompleted: !currentStatus } });
      queryClient.invalidateQueries({ queryKey: getListStudyPlansQueryKey() });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleDeletePlan = async (id: number) => {
    try {
      await fetch(`${baseUrl}api/studyplan/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListStudyPlansQueryKey() });
      setActivePlanId(null);
      toast({ title: "Plan deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const toggleDay = (index: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const expandAll = () => setExpandedDays(new Set(activePlan?.days.map((_, i) => i) ?? []));
  const collapseAll = () => setExpandedDays(new Set());

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Study Planner</h1>
        <p className="text-muted-foreground">AI-generated schedule based on topic importance and your exam date.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Plan</CardTitle>
              <CardDescription>Generate a priority-based day-by-day schedule.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="analysisId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Analysis</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            const analysis = analyses?.find(a => a.id.toString() === val);
                            if (analysis) form.setValue("subject", analysis.subject);
                          }}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select analysis" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {analyses?.filter(a => a.status === "completed").map(a => (
                              <SelectItem key={a.id} value={a.id.toString()}>
                                {a.subject} — {a.topicCount ?? 0} topics
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="examDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Date</FormLabel>
                        <FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hoursPerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Hours / Day</FormLabel>
                        <FormControl><Input type="number" min="1" max="16" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createPlan.isPending}>
                    {createPlan.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Zap className="w-4 h-4 mr-2" />Generate Schedule</>}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {plans && plans.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">My Plans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {plans.map(p => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-colors",
                      p.id === activePlanId ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50 border-transparent"
                    )}
                    onClick={() => setActivePlanId(p.id)}
                  >
                    <div>
                      <div className="font-medium text-sm">{p.subject}</div>
                      <div className="text-xs text-muted-foreground">Exam: {format(parseISO(p.examDate), "MMM d")}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); handleDeletePlan(p.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Plan View */}
        <div className="lg:col-span-2">
          {isLoadingPlans ? (
            <div className="flex items-center justify-center h-64 border rounded-xl bg-card">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !activePlan ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-card text-muted-foreground p-6 text-center">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">No plan selected</h3>
              <p className="text-sm">Create a plan or select one from the list.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan header */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">{activePlan.subject} Study Plan</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Exam: {format(parseISO(activePlan.examDate), "MMMM d, yyyy")}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{activePlan.hoursPerDay} hrs/day</span>
                        {daysUntilExam !== null && (
                          <Badge variant={daysUntilExam <= 7 ? "destructive" : daysUntilExam <= 14 ? "secondary" : "outline"}>
                            {daysUntilExam > 0 ? `${daysUntilExam} days left` : daysUntilExam === 0 ? "Exam today!" : "Exam passed"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{progressPct}%</div>
                      <div className="text-xs text-muted-foreground">completed</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{completedDays} of {totalDays} days done</span>
                      <span>{totalDays - completedDays} remaining</span>
                    </div>
                    <Progress value={progressPct} className="h-2.5" />
                  </div>
                </CardContent>
              </Card>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">{totalDays} day schedule</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={expandAll} className="text-xs gap-1">
                    <ChevronDown className="w-3 h-3" /> Expand all
                  </Button>
                  <Button variant="outline" size="sm" onClick={collapseAll} className="text-xs gap-1">
                    <ChevronUp className="w-3 h-3" /> Collapse
                  </Button>
                </div>
              </div>

              {/* Days */}
              <div className="space-y-2">
                {activePlan.days.map((day, index) => {
                  const isExpanded = expandedDays.has(index);
                  return (
                    <div
                      key={index}
                      className={cn(
                        "border rounded-xl overflow-hidden transition-all",
                        day.isCompleted ? "opacity-60" : "",
                        day.isRevision ? "border-primary/30" : "border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 cursor-pointer",
                          day.isCompleted ? "bg-muted/40" : day.isRevision ? "bg-primary/5" : "bg-card hover:bg-muted/30"
                        )}
                        onClick={() => toggleDay(index)}
                      >
                        <Checkbox
                          checked={day.isCompleted}
                          onCheckedChange={() => handleToggleDay(activePlan.id, index, day.isCompleted)}
                          onClick={e => e.stopPropagation()}
                          className="w-5 h-5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-semibold text-sm", day.isCompleted && "line-through text-muted-foreground")}>
                              Day {day.day} — {format(parseISO(day.date), "EEE, MMM d")}
                            </span>
                            {day.isRevision && <Badge className="text-xs py-0 h-5 bg-primary/15 text-primary border-primary/30" variant="outline">Revision</Badge>}
                            {day.isCompleted && <Badge className="text-xs py-0 h-5 bg-green-500/10 text-green-600 border-green-200" variant="outline">Done</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{day.topics.length} topic{day.topics.length !== 1 ? "s" : ""} • {day.hours}h</div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t bg-card">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {day.topics.map((topic, tIdx) => (
                              <div key={tIdx} className={cn(
                                "flex items-start gap-2 p-3 rounded-lg border text-sm",
                                day.isCompleted ? "bg-muted/30 text-muted-foreground" : "bg-muted/50"
                              )}>
                                <BookOpen className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                                <span className="font-medium leading-snug">{topic}</span>
                              </div>
                            ))}
                          </div>
                          {day.isRevision && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-primary bg-primary/5 rounded-lg p-2.5">
                              <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Revision day — review these topics thoroughly before the exam.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
