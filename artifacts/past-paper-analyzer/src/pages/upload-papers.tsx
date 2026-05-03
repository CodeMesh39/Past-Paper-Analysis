import { useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUploadPaper, useListPapers, useDeletePaper, getListPapersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUp, File, CheckCircle2, Loader2, Trash2, CloudUpload, X } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  year: z.coerce.number().min(1900, "Valid year required").max(new Date().getFullYear(), "Year cannot be in the future"),
});

export default function UploadPapers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadPaper = useUploadPaper();
  const deletePaper = useDeletePaper();
  const { data: papers, isLoading: isLoadingPapers } = useListPapers({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDelete = async (id: number) => {
    try {
      await deletePaper.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListPapersQueryKey() });
      toast({ title: "Paper deleted" });
    } catch {
      toast({ title: "Delete failed", description: "Could not delete the paper.", variant: "destructive" });
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      year: new Date().getFullYear(),
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a PDF or image file to upload.", variant: "destructive" });
      return;
    }
    try {
      await uploadPaper.mutateAsync({ data: { subject: values.subject, year: values.year, file: selectedFile } });
      toast({ title: "Paper uploaded", description: "Your paper has been uploaded successfully." });
      form.reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: getListPapersQueryKey() });
    } catch {
      toast({ title: "Upload failed", description: "There was an error uploading your paper.", variant: "destructive" });
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    const valid = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!valid) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or image file.", variant: "destructive" });
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

  const statusVariant = (status: string) => {
    if (status === "processed") return "default";
    if (status === "failed") return "destructive";
    return "secondary";
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Past Paper</CardTitle>
            <CardDescription>Upload a past exam paper for AI analysis.</CardDescription>
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
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
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
                        <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
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
                        <p className="text-sm font-semibold text-foreground">Drag & drop or click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF or Image files supported</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,image/*" />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={uploadPaper.isPending}>
                  {uploadPaper.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><FileUp className="w-4 h-4 mr-2" />Upload Paper</>}
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
                <CardTitle>Uploaded Papers</CardTitle>
                <CardDescription>Your library of exam papers ready for analysis.</CardDescription>
              </div>
              {papers && papers.length > 0 && (
                <Badge variant="secondary" className="text-sm">{papers.length} paper{papers.length !== 1 ? "s" : ""}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPapers ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !papers || papers.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground">
                <File className="w-14 h-14 mx-auto mb-4 opacity-20" />
                <p className="font-medium text-foreground">No papers uploaded yet</p>
                <p className="text-sm mt-1">Upload your first past paper to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {papers.map((paper) => (
                  <div key={paper.id} className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/40 transition-colors group">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <File className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold truncate">{paper.subject} <span className="text-muted-foreground font-normal">({paper.year})</span></h4>
                        <div className="flex items-center text-xs text-muted-foreground space-x-2 mt-0.5">
                          <span className="truncate max-w-[120px]">{paper.fileName}</span>
                          <span>•</span>
                          <span>{format(new Date(paper.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                      <Badge variant={statusVariant(paper.status)} className="capitalize hidden sm:flex">
                        {paper.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={deletePaper.isPending}
                        onClick={() => handleDelete(paper.id)}
                      >
                        {deletePaper.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
