import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUploadSyllabus, useListSyllabi, getListSyllabiQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUp, BookOpen, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
});

export default function UploadSyllabus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadSyllabus = useUploadSyllabus();
  const { data: syllabi, isLoading: isLoadingSyllabi } = useListSyllabi();

  const handleDeleteSyllabus = async (id: number) => {
    try {
      await fetch(`/api/syllabus/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListSyllabiQueryKey() });
      toast({ title: "Syllabus deleted" });
    } catch {
      toast({ title: "Delete failed", description: "Could not delete the syllabus.", variant: "destructive" });
    }
  };
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF or text file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadSyllabus.mutateAsync({
        data: {
          subject: values.subject,
          file: selectedFile,
        }
      });
      
      toast({
        title: "Success",
        description: "Syllabus uploaded successfully.",
      });
      
      form.reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: getListSyllabiQueryKey() });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your syllabus.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Syllabus</CardTitle>
            <CardDescription>Upload a syllabus for coverage analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Physics, History" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">File</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted border-border transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {selectedFile ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                        </>
                      ) : (
                        <>
                          <FileUp className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                          <p className="text-xs text-muted-foreground">PDF or Text</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.txt" />
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={uploadSyllabus.isPending}>
                  {uploadSyllabus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {uploadSyllabus.isPending ? "Uploading..." : "Upload Syllabus"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Uploaded Syllabi</CardTitle>
            <CardDescription>Your registered syllabi for cross-referencing.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSyllabi ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !syllabi || syllabi.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No syllabi uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {syllabi.map((syl) => (
                  <div key={syl.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded bg-chart-2/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-chart-2" />
                      </div>
                      <div>
                        <h4 className="font-medium">{syl.subject}</h4>
                        <div className="flex items-center text-xs text-muted-foreground space-x-2 mt-1">
                          <span>{syl.fileName}</span>
                          <span>•</span>
                          <span>{syl.topics.length} topics extracted</span>
                          <span>•</span>
                          <span>{format(new Date(syl.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteSyllabus(syl.id)}
                        data-testid={`button-delete-syllabus-${syl.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
