import { useState, useCallback, useRef } from "react";
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
import { FileUp, BookOpen, CheckCircle2, Loader2, Trash2, CloudUpload, X, Tag } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
});

export default function UploadSyllabus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const baseUrl = import.meta.env.BASE_URL;
  const uploadSyllabus = useUploadSyllabus();
  const syllabiQuery = useListSyllabi();
  const { data: syllabi, isLoading: isLoadingSyllabi } = syllabiQuery;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDeleteSyllabus = async (id: number) => {
    try {
      const response = await fetch(`${baseUrl}api/syllabus/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error("Failed to delete syllabus");
      await queryClient.invalidateQueries({ queryKey: syllabiQuery.queryKey });
      toast({ title: "Syllabus deleted" });
    } catch {
      toast({ title: "Delete failed", description: "Could not delete the syllabus.", variant: "destructive" });
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a PDF or text file.", variant: "destructive" });
      return;
    }
    try {
      await uploadSyllabus.mutateAsync({ data: { subject: values.subject, file: selectedFile } });
      toast({ title: "Syllabus uploaded", description: "Your syllabus has been processed." });
      form.reset();
      setSelectedFile(null);
      await queryClient.invalidateQueries({ queryKey: syllabiQuery.queryKey });
    } catch {
      toast({ title: "Upload failed", description: "There was an error uploading your syllabus.", variant: "destructive" });
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    const valid = file.type === "application/pdf" || file.type === "text/plain" || file.name.endsWith(".txt");
    if (!valid) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or .txt file.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Syllabus</CardTitle>
            <CardDescription>Upload a syllabus to enable coverage analysis and topic mapping.</CardDescription>
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
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
                      isDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : selectedFile
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center p-4 text-center">
                        <CheckCircle2 className="w-8 h-8 mb-2 text-primary" />
                        <p className="text-sm font-medium text-primary truncate max-w-[160px]">{selectedFile.name}</p>
                        <button
                          type="button"
                          className="mt-2 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                        >
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center p-6 text-center">
                        <CloudUpload className={cn("w-10 h-10 mb-2 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
                        <p className="text-sm font-semibold text-foreground">Drag & drop or click</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF or plain text (.txt)</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.txt" />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={uploadSyllabus.isPending}>
                  {uploadSyllabus.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><FileUp className="w-4 h-4 mr-2" />Upload Syllabus</>}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Uploaded Syllabi</CardTitle>
                <CardDescription>Syllabi registered for cross-referencing with past papers.</CardDescription>
              </div>
              {syllabi && syllabi.length > 0 && (
                <Badge variant="secondary">{syllabi.length} syllabus{syllabi.length !== 1 ? "es" : ""}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSyllabi ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !syllabi || syllabi.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground">
                <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-20" />
                <p className="font-medium text-foreground">No syllabi uploaded yet</p>
                <p className="text-sm mt-1">Upload a syllabus to unlock coverage metrics.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {syllabi.map((syl) => (
                  <div key={syl.id} className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/40 transition-colors group">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-chart-2" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold truncate">{syl.subject}</h4>
                        <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-2 mt-0.5">
                          <span className="truncate max-w-[120px]">{syl.fileName}</span>
                          <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{syl.topics.length} topics</span>
                          <span>{format(new Date(syl.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => handleDeleteSyllabus(syl.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
