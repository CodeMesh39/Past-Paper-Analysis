import { useState } from "react";
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
import { FileUp, File, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      toast({
        title: "No file selected",
        description: "Please select a PDF or image file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadPaper.mutateAsync({
        data: {
          subject: values.subject,
          year: values.year,
          file: selectedFile,
        }
      });
      
      toast({
        title: "Success",
        description: "Paper uploaded successfully.",
      });
      
      form.reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: getListPapersQueryKey() });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your paper.",
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
            <CardTitle>Upload Past Paper</CardTitle>
            <CardDescription>Upload a past exam paper for analysis.</CardDescription>
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
                          <p className="text-xs text-muted-foreground">PDF or Image</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,image/*" />
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={uploadPaper.isPending}>
                  {uploadPaper.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {uploadPaper.isPending ? "Uploading..." : "Upload Paper"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Uploaded Papers</CardTitle>
            <CardDescription>Your library of exam papers ready for analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPapers ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !papers || papers.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                <File className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No papers uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {papers.map((paper) => (
                  <div key={paper.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        <File className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{paper.subject} ({paper.year})</h4>
                        <div className="flex items-center text-xs text-muted-foreground space-x-2 mt-1">
                          <span>{paper.fileName}</span>
                          <span>•</span>
                          <span>{format(new Date(paper.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={paper.status === 'processed' ? 'default' : paper.status === 'failed' ? 'destructive' : 'secondary'}>
                        {paper.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={deletePaper.isPending}
                        onClick={() => handleDelete(paper.id)}
                        data-testid={`button-delete-paper-${paper.id}`}
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
