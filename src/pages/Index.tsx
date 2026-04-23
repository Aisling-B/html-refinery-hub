import { useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Download, FileCode2, Sparkles } from "lucide-react";
import { generateFiles, generateCSV, type GeneratedFile, type Metadata } from "@/lib/contentGenerator";

const Index = () => {
  const [baseHTML, setBaseHTML] = useState("");
  const [meta, setMeta] = useState<Metadata>({
    courseName: "",
    courseCode: "",
    pageTitle: "",
    topicClassName: "",
    fosteringSectionCode: "",
  });
  const [generated, setGenerated] = useState<GeneratedFile[] | null>(null);
  const [csv, setCsv] = useState<string>("");

  const placeholderFiles = [
    "Safer Schools ZM (Base)",
    "Great Schools Trust & NBA",
    "Safer Schools NI",
    "David Game College",
    "Bromley Permanency",
    "Fostering in a Digital World",
  ];

  const handleGenerate = () => {
    if (!baseHTML.trim()) {
      toast.error("Base HTML is required", { description: "Paste your ZM 3.0 HTML to continue." });
      return;
    }
    const missing = (Object.keys(meta) as (keyof Metadata)[]).filter((k) => !meta[k].trim());
    if (missing.length) {
      toast.error("Missing metadata", { description: `Please fill in all metadata fields.` });
      return;
    }
    try {
      const files = generateFiles(baseHTML, meta);
      const csvData = generateCSV(files, meta);
      setGenerated(files);
      setCsv(csvData);
      toast.success("6 files generated", { description: "Ready to download as a ZIP bundle." });
    } catch (err) {
      console.error(err);
      toast.error("Generation failed", { description: "Could not parse the provided HTML." });
    }
  };

  const handleDownload = async () => {
    if (!generated) return;
    const zip = new JSZip();
    generated.forEach((f) => zip.file(f.fileName, f.content));
    zip.file("Content_Tracker_Update.csv", csv);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.courseCode || "content"}_bundle.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Bundle downloaded");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Content Auto-Formatter Prototype</h1>
            <p className="text-xs text-muted-foreground">Local, client-side HTML transformation & CSV tracker</p>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input column */}
          <Card className="p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Input</h2>
              <span className="text-xs text-muted-foreground">All processing runs locally</span>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="html" className="mb-1.5 block">Paste Base ZM 3.0 HTML Here</Label>
                <Textarea
                  id="html"
                  value={baseHTML}
                  onChange={(e) => setBaseHTML(e.target.value)}
                  placeholder="<!DOCTYPE html>&#10;<html>...</html>"
                  className="min-h-[260px] font-mono text-xs resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseName" className="mb-1.5 block">Course Name</Label>
                  <Input id="courseName" value={meta.courseName} onChange={(e) => setMeta({ ...meta, courseName: e.target.value })} placeholder="Healthy Tech Use" />
                </div>
                <div>
                  <Label htmlFor="courseCode" className="mb-1.5 block">Course Code</Label>
                  <Input id="courseCode" value={meta.courseCode} onChange={(e) => setMeta({ ...meta, courseCode: e.target.value })} placeholder="ENGHT" />
                </div>
                <div>
                  <Label htmlFor="pageTitle" className="mb-1.5 block">Page Title</Label>
                  <Input id="pageTitle" value={meta.pageTitle} onChange={(e) => setMeta({ ...meta, pageTitle: e.target.value })} placeholder="Hot Topics" />
                </div>
                <div>
                  <Label htmlFor="topicClassName" className="mb-1.5 block">Topic Class Name</Label>
                  <Input id="topicClassName" value={meta.topicClassName} onChange={(e) => setMeta({ ...meta, topicClassName: e.target.value })} placeholder="hot topics" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="fostering" className="mb-1.5 block">Fostering Section Code</Label>
                  <Input id="fostering" value={meta.fosteringSectionCode} onChange={(e) => setMeta({ ...meta, fosteringSectionCode: e.target.value })} placeholder="is" />
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                size="lg"
                className="w-full text-primary-foreground border-0 shadow-[var(--shadow-elegant)] hover:opacity-95 transition-opacity"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate App Content
              </Button>
            </div>
          </Card>

          {/* Output column */}
          <Card className="p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Output</h2>
              <span className="text-xs text-muted-foreground">{generated ? `${generated.length} files + CSV` : "Awaiting generation"}</span>
            </div>

            <ul className="space-y-2 mb-5">
              {(generated ?? placeholderFiles.map((appName) => ({ appName, fileName: "—" } as GeneratedFile))).map((f, i) => {
                const ready = !!generated;
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {ready ? (
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{f.appName}</p>
                        <p className="text-xs text-muted-foreground truncate font-mono">{f.fileName}</p>
                      </div>
                    </div>
                    <FileCode2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  </li>
                );
              })}
              <li className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {generated ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Tracker CSV</p>
                    <p className="text-xs text-muted-foreground font-mono">Content_Tracker_Update.csv</p>
                  </div>
                </div>
                <FileCode2 className="h-4 w-4 text-muted-foreground shrink-0" />
              </li>
            </ul>

            <Button
              onClick={handleDownload}
              disabled={!generated}
              size="lg"
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All as .ZIP
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
