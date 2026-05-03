import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useCreateStudyPlan, 
  useUpdateStudyPlan, 
  useListStudyPlans, 
  useListAnalyses,
  getListStudyPlansQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Loader2, CheckSquare, Clock, BookOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";

const formSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  examDate: z.string().min(1, "Exam date is required"),
  hoursPerDay: z.coerce.number().min(1).max(16),
  analysisId: z.coerce.number().min(1, "Analysis is required"),
});

export default function Planner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createPlan = useCreateStudyPlan();
  const updatePlan = useUpdateStudyPlan();
  
  const { data: plans, isLoading: isLoadingPlans } = useListStudyPlans();
  const { data: analyses } = useListAnalyses();
  
  const [activePlanId, setActivePlanId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      examDate: "",
      hoursPerDay: 4,
    },
  });

  // Automatically pick active plan if loaded
  if (plans && plans.length > 0 && activePlanId === null) {
    setActivePlanId(plans[0].id);
  }

  const activePlan = plans?.find(p => p.id === activePlanId);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createPlan.mutateAsync({
        data: values
      });
      
      toast({
        title: "Plan Created",
        description: "Your personalized study schedule is ready.",
      });
      
      form.reset();
      queryClient.invalidateQueries({ queryKey: getListStudyPlansQueryKey() });
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "Could not generate study plan.",
        variant: "destructive",
      });
    }
  };

  const handleToggleDay = async (planId: number, dayIndex: number, currentStatus: boolean) => {
    try {
      await updatePlan.mutateAsync({
        id: planId,
        data: {
          dayIndex,
          isCompleted: !currentStatus
        }
      });
      
      // Optimistic update locally could be done here, but invalidate is safer
      queryClient.invalidateQueries({ queryKey: getListStudyPlansQueryKey() });
    } catch (error) {
      toast({
        title: "Update failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Study Planner</h1>
        <p className="text-muted-foreground">Generate a schedule based on topic importance and time left.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Plan</CardTitle>
              <CardDescription>Configure parameters for AI scheduling.</CardDescription>
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select analysis run" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {analyses?.map(a => (
                              <SelectItem key={a.id} value={a.id.toString()}>
                                {a.subject} (ID: {a.id})
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
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input type="number" min="1" max="16" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={createPlan.isPending}>
                    {createPlan.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Generate Schedule
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {isLoadingPlans ? (
            <div className="flex items-center justify-center h-64 border rounded-xl bg-card">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !plans || plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-card text-muted-foreground p-6 text-center">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">No study plans yet</h3>
              <p>Create a plan on the left to get your day-by-day schedule.</p>
            </div>
          ) : (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{activePlan?.subject} Plan</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Calendar className="w-3.5 h-3.5 mr-1" /> Exam: {activePlan ? format(parseISO(activePlan.examDate), "MMMM d, yyyy") : ''}
                      <span className="mx-2">•</span>
                      <Clock className="w-3.5 h-3.5 mr-1" /> {activePlan?.hoursPerDay} hrs/day
                    </CardDescription>
                  </div>
                  {plans.length > 1 && (
                    <Select value={activePlanId?.toString()} onValueChange={(val) => setActivePlanId(parseInt(val))}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Switch plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.subject} (ID: {p.id})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="h-full overflow-y-auto p-6 space-y-4">
                  {activePlan?.days.map((day, index) => (
                    <div 
                      key={index} 
                      className={`flex gap-4 p-4 rounded-xl border transition-colors ${
                        day.isCompleted ? 'bg-muted/50 border-border/50' : 
                        day.isRevision ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
                      }`}
                    >
                      <div className="mt-1">
                        <Checkbox 
                          checked={day.isCompleted} 
                          onCheckedChange={() => handleToggleDay(activePlan.id, index, day.isCompleted)}
                          className="w-5 h-5 rounded-md"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-bold ${day.isCompleted ? 'text-muted-foreground line-through' : ''}`}>
                            Day {day.day} — {format(parseISO(day.date), "MMM d")}
                          </h4>
                          {day.isRevision && (
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary">
                              Revision Day
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {day.topics.map((topic, tIdx) => (
                            <div key={tIdx} className={`flex items-start ${day.isCompleted ? 'opacity-50' : ''}`}>
                              <BookOpen className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">{topic}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
