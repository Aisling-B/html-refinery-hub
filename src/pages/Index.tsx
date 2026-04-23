import { useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Download, FileCode2, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  generateFiles,
  generateCSV,
  DEFAULT_SHELLS,
  type GeneratedFile,
  type Metadata,
  type RegionalSnippets,
  type AppShells,
} from "@/lib/contentGenerator";

const Index = () => {
  const [baseHTML, setBaseHTML] = useState("");
  const [meta, setMeta] = useState<Metadata>({
    baseFilename: "",
    courseName: "",
    courseCode: "",
    pageTitle: "",
    topicClassName: "",
    fosteringSectionCode: "",
  });
  const [snippets, setSnippets] = useState<RegionalSnippets>({
    england: "",
    northernIreland: "",
    wales: "",
    scotland: "",
    isleOfMan: "",
  });
  const [shells, setShells] = useState<AppShells>(DEFAULT_SHELLS);
  const [generated, setGenerated] = useState<GeneratedFile[] | null>(null);
  const [csv, setCsv] = useState<string>("");

  const placeholderFiles = [
    "Safer Schools ZM",
    "Safer Schools England",
    "Safer Schools Scotland",
    "Safer Schools Wales",
    "Safer Schools Isle of Man",
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
      const files = generateFiles(baseHTML, meta, snippets, shells);
      const csvData = generateCSV(files, meta);
      setGenerated(files);
      setCsv(csvData);
      toast.success("10 files generated", { description: "Ready to download as a ZIP bundle." });
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
    a.download = `${meta.baseFilename || meta.courseCode || "content"}_bundle.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Bundle downloaded");
  };

  const signpostingFields: { key: keyof RegionalSnippets; label: string }[] = [
    { key: "england", label: "England Signposting" },
    { key: "northernIreland", label: "Northern Ireland Signposting" },
    { key: "wales", label: "Wales Signposting" },
    { key: "scotland", label: "Scotland Signposting" },
    { key: "isleOfMan", label: "Isle of Man Signposting" },
  ];

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
                  placeholder="<!DOCTYPE html>&#10;<html>...&#10;  [INSERT_REGIONAL_SIGNPOSTING_HERE]&#10;...</html>"
                  className="min-h-[220px] font-mono text-xs resize-y"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Tip: include <code className="font-mono">[INSERT_REGIONAL_SIGNPOSTING_HERE]</code> where regional content should be injected.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="baseFilename" className="mb-1.5 block">Base Filename</Label>
                  <Input id="baseFilename" value={meta.baseFilename} onChange={(e) => setMeta({ ...meta, baseFilename: e.target.value })} placeholder="education_pupil_middle_ie_overview" />
                </div>
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

              <div className="pt-2">
                <h3 className="text-sm font-semibold mb-2">Regional Signposting Snippets</h3>
                <div className="space-y-3">
                  {signpostingFields.map((f) => (
                    <div key={f.key}>
                      <Label htmlFor={`sn-${f.key}`} className="mb-1.5 block">{f.label}</Label>
                      <Textarea
                        id={`sn-${f.key}`}
                        value={snippets[f.key]}
                        onChange={(e) => setSnippets({ ...snippets, [f.key]: e.target.value })}
                        placeholder={`HTML to inject for ${f.label.replace(" Signposting", "")}`}
                        className="min-h-[80px] font-mono text-xs resize-y"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="shells" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold">
                    App Shells (advanced)
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Body-only outputs are wrapped in these shells. Use{" "}
                      <code className="font-mono">[INJECT_BODY_HERE]</code> as the placeholder.
                      The Fostering shell also supports{" "}
                      <code className="font-mono">[INSERT_SECTION_CODE]</code>.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="shell-dg" className="mb-1.5 block">David Game Shell HTML</Label>
                        <Textarea
                          id="shell-dg"
                          value={shells.davidGame}
                          onChange={(e) => setShells({ ...shells, davidGame: e.target.value })}
                          className="min-h-[120px] font-mono text-xs resize-y"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shell-brom" className="mb-1.5 block">Bromley Shell HTML</Label>
                        <Textarea
                          id="shell-brom"
                          value={shells.bromley}
                          onChange={(e) => setShells({ ...shells, bromley: e.target.value })}
                          className="min-h-[120px] font-mono text-xs resize-y"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shell-fos" className="mb-1.5 block">Fostering Shell HTML</Label>
                        <Textarea
                          id="shell-fos"
                          value={shells.fostering}
                          onChange={(e) => setShells({ ...shells, fostering: e.target.value })}
                          className="min-h-[120px] font-mono text-xs resize-y"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

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
