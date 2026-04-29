import { useState, useMemo, useEffect } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CheckCircle2, Circle, Download, FileCode2, Sparkles, HelpCircle, Trash2, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ModeToggle } from "@/components/mode-toggle";
import {
  generateFiles,
  generateCSV,
  DEFAULT_SHELLS,
  APP_OPTIONS,
  DEFAULT_SELECTION,
  ROLE_OPTIONS,
  DEFAULT_ROLES,
  COURSE_LIBRARY,
  type GeneratedFile,
  type Metadata,
  type RegionalSnippets,
  type AppSelection,
  type AppKey,
  type RoleKey,
} from "@/lib/contentGenerator";

const Index = () => {
  const [baseHTML, setBaseHTML] = useState(() => localStorage.getItem("baseHTML") || "");
  const [meta, setMeta] = useState<Metadata>(() => {
    const saved = localStorage.getItem("meta");
    return saved ? JSON.parse(saved) : { courseName: "", courseCode: "", pageTitle: "", topicClassName: "" };
  });
  const [snippets, setSnippets] = useState<RegionalSnippets>(() => {
    const saved = localStorage.getItem("snippets");
    return saved ? JSON.parse(saved) : { england: "", northernIreland: "", wales: "", scotland: "", isleOfMan: "" };
  });
  const [selection, setSelection] = useState<AppSelection>(() => {
    const saved = localStorage.getItem("selection");
    return saved ? JSON.parse(saved) : DEFAULT_SELECTION;
  });
  const [roles, setRoles] = useState<Record<RoleKey, boolean>>(() => {
    const saved = localStorage.getItem("roles");
    return saved ? JSON.parse(saved) : DEFAULT_ROLES;
  });

  const [generated, setGenerated] = useState<GeneratedFile[] | null>(null);
  const [csv, setCsv] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    localStorage.setItem("baseHTML", baseHTML);
    localStorage.setItem("meta", JSON.stringify(meta));
    localStorage.setItem("snippets", JSON.stringify(snippets));
    localStorage.setItem("selection", JSON.stringify(selection));
    localStorage.setItem("roles", JSON.stringify(roles));
  }, [baseHTML, meta, snippets, selection, roles]);

  const courseOptions = useMemo(() => {
    const uniqueCoursesMap = new Map<string, string>();
    Object.entries(COURSE_LIBRARY).forEach(([code, data]) => {
      if (!data.courseName) return;
      if (code.startsWith("ENG") || !uniqueCoursesMap.has(data.courseName)) {
        uniqueCoursesMap.set(data.courseName, code.startsWith("ENG") ? code : (uniqueCoursesMap.get(data.courseName) || code));
      }
    });
    return Array.from(uniqueCoursesMap.entries())
      .map(([name, code]) => ({ name, code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // UPGRADE 2: Live Filename Preview Math
  const livePreviewName = useMemo(() => {
    const safeTitle = (meta.pageTitle || "page_title").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    const courseCodeStr = (meta.courseCode || "CODE").replace(/^(ENG|SCOT|WAL|IOM|GST|NBA|DG|DE|BP|CHSCT|CHSC)/, '').toLowerCase();
    
    // Find first active role to show in preview
    const activeRole = (Object.keys(roles) as RoleKey[]).find(k => roles[k]);
    let rolePrefix = "ad";
    if (activeRole === "pupilPrimary") rolePrefix = "pupil_ks2";
    else if (activeRole === "pupilLower") rolePrefix = "pupil_lower_secondary";
    else if (activeRole === "pupilMiddle") rolePrefix = "pupil_middle";
    else if (activeRole === "pupilUpper") rolePrefix = "upper_secondary";

    return `educ_${rolePrefix}_${courseCodeStr}_${safeTitle}_eng.html`;
  }, [meta.pageTitle, meta.courseCode, roles]);

  // UPGRADE 3: Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "text/html" || file.name.endsWith(".html"))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBaseHTML(event.target?.result as string);
        toast.success("HTML file successfully loaded!");
      };
      reader.readAsText(file);
    } else {
      toast.error("Invalid file", { description: "Please drop a valid .html file." });
    }
  };

  // UPGRADE 1: Start Fresh Button
  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear everything and start fresh?")) {
      setBaseHTML("");
      setMeta({ courseName: "", courseCode: "", pageTitle: "", topicClassName: "" });
      setSnippets({ england: "", northernIreland: "", wales: "", scotland: "", isleOfMan: "" });
      setSelection(DEFAULT_SELECTION);
      setRoles(DEFAULT_ROLES);
      setGenerated(null);
      setCsv("");
      localStorage.clear();
      toast.success("Workspace reset to defaults.");
    }
  };

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
      const files = generateFiles(baseHTML, meta, snippets, roles, DEFAULT_SHELLS, selection);
      if (!files.length) {
        toast.error("No apps selected", { description: "Tick at least one app to generate." });
        return;
      }
      const csvData = generateCSV(files, meta, roles);
      setGenerated(files);
      setCsv(csvData);
      toast.success(`${files.length} files generated`, { description: `Tracker CSV is ready.` });
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
    const safeTitle = (meta.pageTitle || "content").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    a.download = `${safeTitle}_bundle.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Bundle downloaded");
  };

  const toggleApp = (key: AppKey) => setSelection((s) => ({ ...s, [key]: !s[key] }));
  const toggleRole = (key: RoleKey) => setRoles((r) => ({ ...r, [key]: !r[key] }));
  const setAllApps = (val: boolean) => setSelection(APP_OPTIONS.reduce((acc, o) => ({ ...acc, [o.key]: val }), {} as AppSelection));
  const setAllRoles = (val: boolean) => setRoles(ROLE_OPTIONS.reduce((acc, r) => ({ ...acc, [r.key]: val }), {} as Record<RoleKey, boolean>));

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
        <div className="container py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Content Auto-Formatter Hub</h1>
              <p className="text-xs text-muted-foreground">Local, client-side HTML transformation & CSV tracker</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shadow-sm">
                  <HelpCircle className="h-4 w-4" />
                  How to Use
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">How to Use the Content Hub</DialogTitle>
                  <DialogDescription>
                    Follow these steps to auto-generate your app HTML and CSV tracker.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 text-sm mt-4">
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs">1</span> 
                      Paste the HTML Template
                    </h4>
                    <p className="text-muted-foreground pl-7">Paste your base HTML or simply drag and drop the `.html` file into the box. If using regional signposting, ensure you have the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">[INSERT_REGIONAL_SIGNPOSTING_HERE]</code> placeholder.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs">2</span> 
                      Select the Course
                    </h4>
                    <p className="text-muted-foreground pl-7">Pick a course from the dropdown. The Hub's internal brain will automatically fetch the exact Course Code, Hex Colours, and proper Asset Folders for every single app.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs">3</span> 
                      Fill in Page Details
                    </h4>
                    <p className="text-muted-foreground pl-7">Provide the Page Title and CSS Topic Class Name. The Hub mathematically calculates your filename prefixes based on the roles you select below.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs">4</span> 
                      Select Apps and Roles
                    </h4>
                    <p className="text-muted-foreground pl-7">Tick the apps and user roles you want to generate. The Hub intelligently skips apps that don't support your selected course to keep the tracker clean.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs">5</span> 
                      Generate and Download
                    </h4>
                    <p className="text-muted-foreground pl-7">Click Generate to build your HTML files and the master tracker CSV. Click download, and your cleanly formatted .ZIP bundle is ready!</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Input Content</h2>
              <Button onClick={handleReset} variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Start Fresh
              </Button>
            </div>

            <div className="space-y-4">
              {/* UPGRADED: Drag and Drop Text Box */}
              <div 
                onDragOver={handleDragOver} 
                onDragLeave={handleDragLeave} 
                onDrop={handleDrop}
                className="relative"
              >
                <Label htmlFor="html" className="mb-1.5 flex items-center gap-2">
                  Base HTML
                  <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider">Paste or Drag & Drop</span>
                </Label>
                <Textarea
                  id="html"
                  value={baseHTML}
                  onChange={(e) => setBaseHTML(e.target.value)}
                  placeholder="<!DOCTYPE html>&#10;<html>...&#10;  [INSERT_REGIONAL_SIGNPOSTING_HERE]&#10;...</html>"
                  className={`min-h-[200px] font-mono text-xs resize-y transition-colors ${isDragging ? "border-primary bg-primary/5 ring-2 ring-primary/20 border-dashed" : ""}`}
                />
                {isDragging && (
                  <div className="absolute inset-0 top-[26px] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-primary rounded-md z-10 pointer-events-none">
                    <UploadCloud className="h-10 w-10 text-primary mb-2 animate-bounce" />
                    <p className="text-sm font-semibold text-primary">Drop HTML file here</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseName" className="mb-1.5 block">Course Name</Label>
                  <select
                    id="courseName"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={meta.courseName}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const selectedOption = courseOptions.find(o => o.name === selectedName);
                      setMeta({ 
                        ...meta, 
                        courseName: selectedName, 
                        courseCode: selectedOption ? selectedOption.code : meta.courseCode
                      });
                    }}
                  >
                    <option value="" disabled>Select a course...</option>
                    {courseOptions.map((opt) => (
                      <option key={opt.code} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="courseCode" className="mb-1.5 block">Course Code</Label>
                  <Input id="courseCode" value={meta.courseCode} onChange={(e) => setMeta({ ...meta, courseCode: e.target.value })} placeholder="ENGHT" />
                </div>
                
                {/* UPGRADED: Live Filename Preview */}
                <div>
                  <Label htmlFor="pageTitle" className="mb-1.5 block">Page Title</Label>
                  <Input id="pageTitle" value={meta.pageTitle} onChange={(e) => setMeta({ ...meta, pageTitle: e.target.value })} placeholder="Catching a Catfish" />
                  <p className="text-[10px] text-muted-foreground mt-1.5 font-mono flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Preview: {livePreviewName}
                  </p>
                </div>

                <div>
                  <Label htmlFor="topicClassName" className="mb-1.5 block">Topic Class Name (CSS)</Label>
                  <Input id="topicClassName" value={meta.topicClassName} onChange={(e) => setMeta({ ...meta, topicClassName: e.target.value })} placeholder="hottopics" />
                </div>
              </div>

              <div className="pt-2">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="regional" className="border border-border rounded-lg bg-card px-4 shadow-sm">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                      Regional Signposting Snippets
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-1 pb-3">
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <Button
                onClick={handleGenerate}
                size="lg"
                className="w-full mt-4 text-primary-foreground border-0 shadow-[var(--shadow-elegant)] hover:opacity-95 transition-opacity"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Assets
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">App Selection</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Object.values(selection).filter(Boolean).length} of {APP_OPTIONS.length} apps selected
                  </p>
                </div>
                <div className="flex gap-3 text-xs mt-1 shrink-0 bg-muted/40 p-1.5 rounded-md border border-border/50">
                  <button onClick={() => setAllApps(true)} className="text-primary hover:underline font-medium px-1">Select All</button>
                  <span className="text-muted-foreground/30">|</span>
                  <button onClick={() => setAllApps(false)} className="text-muted-foreground hover:underline px-1">Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {APP_OPTIONS.map((opt) => (
                  <label
                    key={opt.key}
                    htmlFor={`chk-${opt.key}`}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <Checkbox
                      id={`chk-${opt.key}`}
                      checked={selection[opt.key]}
                      onCheckedChange={() => toggleApp(opt.key)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">CSV Tracker Roles</h2>
                  <p className="text-xs text-muted-foreground mt-1">Select roles to tag this file with in your CSV.</p>
                </div>
                <div className="flex gap-3 text-xs mt-1 shrink-0 bg-muted/40 p-1.5 rounded-md border border-border/50">
                  <button onClick={() => setAllRoles(true)} className="text-primary hover:underline font-medium px-1">Select All</button>
                  <span className="text-muted-foreground/30">|</span>
                  <button onClick={() => setAllRoles(false)} className="text-muted-foreground hover:underline px-1">Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.key}
                    htmlFor={`role-${opt.key}`}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <Checkbox
                      id={`role-${opt.key}`}
                      checked={roles[opt.key]}
                      onCheckedChange={() => toggleRole(opt.key)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Ready to Export</h2>
                <span className="text-xs text-muted-foreground">{generated ? `${generated.length} files + CSV` : "Awaiting generation"}</span>
              </div>

              <ul className="space-y-2 mb-5">
                {previewList.map((f, i) => {
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
        </div>
      </main>
    </div>
  );
};

export default Index;
