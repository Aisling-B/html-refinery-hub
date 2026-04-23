import { useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Circle, Download, FileCode2, Sparkles } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle"; // Added import for Step 4
import {
  generateFiles,
  generateCSV,
  DEFAULT_SHELLS,
  APP_OPTIONS,
  DEFAULT_SELECTION,
  type GeneratedFile,
  type Metadata,
  type RegionalSnippets,
  type AppSelection,
  type AppKey,
} from "@/lib/contentGenerator";

const Index = () => {
  const [baseHTML, setBaseHTML] = useState("");
  const [meta, setMeta] = useState<Metadata>({
    baseFilename: "",
    courseName: "",
    courseCode: "",
    pageTitle: "",
    topicClassName: "",
  });
  const [snippets, setSnippets] = useState<RegionalSnippets>({
    england: "",
    northernIreland: "",
    wales: "",
    scotland: "",
    isleOfMan: "",
  });
  const [selection, setSelection] = useState<AppSelection>(DEFAULT_SELECTION);
  const [generated, setGenerated] = useState<GeneratedFile[] | null>(null);
  const [csv, setCsv] = useState<string>("");

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
      const files = generateFiles(baseHTML, meta, snippets, DEFAULT_SHELLS, selection);
      if (!files.length) {
        toast.error("No apps selected", { description: "Tick at least one app to generate." });
        return;
      }
      const csvData = generateCSV(files, meta);
      setGenerated(files);
      setCsv(csvData);
      toast.success(`${files.length} files generated`, { description: "Ready to download as a ZIP bundle." });
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

  const toggleApp = (key: AppKey) => {
    setSelection((s) => ({ ...s, [key]: !s[key] }));
  };

  const signpostingFields: { key: keyof RegionalSnippets; label: string }[] = [
    { key: "england", label: "England Signposting" },
    { key: "northernIreland", label: "Northern Ireland Signposting" },
    { key: "wales", label: "Wales Signposting" },
    { key: "scotland", label: "Scotland Signposting" },
    { key: "isleOfMan", label: "Isle of Man Signposting" },
  ];

  const previewList: { appName: string; fileName: string }[] = generated
    ? generated.map((f) => ({ appName: f.appName, fileName: f.fileName }))
    : APP_OPTIONS.filter((o) => selection[o.key]).map((o) => ({ appName: o.label, fileName: "—" }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-5 flex items-center justify-between"> {/* Changed to justify-between for Step 4 */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Content Auto-Formatter Prototype</h1>
              <p className="text-xs text-muted-foreground">Local, client-side HTML transformation & CSV tracker</p>
            </div>
          </div>
          <ModeToggle /> {/* Inserted ModeToggle for Step 4 */}
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
                <Label htmlFor="html" className="mb-1.5 block">Paste Safer Schools ZM 3.0 HTML Here as the template</Label>
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
                  <Input id="courseName" value={meta.courseName} onChange={(e) => setMeta({ ...meta, courseName: e.target.value })} placeholder="Hot Topics" />
                </div>
                <div>
