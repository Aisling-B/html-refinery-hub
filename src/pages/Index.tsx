import { useState, useMemo, useEffect } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
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

  const livePreviewName = useMemo(() => {
    const safeTitle = (meta.pageTitle || "page_title").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    const courseCodeStr = (meta.courseCode || "CODE").replace(/^(ENG|SCOT|WAL|IOM|GST|NBA|DG|DE|BP|CHSCT|CHSC)/, '').toLowerCase();
    
    const activeRole = (Object.keys(roles) as RoleKey[]).find(k => roles[k]);
    let rolePrefix = "ad";
    if (activeRole === "pupilPrimary") rolePrefix = "pupil_ks2";
    else if (activeRole === "pupilLower") rolePrefix = "pupil_lower_secondary";
    else if (activeRole === "pupilMiddle") rolePrefix = "pupil_middle";
    else if (activeRole === "pupilUpper") rolePrefix = "upper_secondary";

    return `educ_${rolePrefix}_${courseCodeStr}_${safeTitle}_eng.html`;
  }, [meta.pageTitle, meta.courseCode, roles]);

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
    <div className="min-h-screen relative bg-background overflow-hidden font-sans text-foreground">
      
      {/* --- UPGRADE 1: BEAUTIFUL BACKGROUND GLOW --- */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-blue-500/10 blur-[140px] pointer-events-none z-0"></div>

      <header className="border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-20">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Content Auto-Formatter</h1>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Client-Side HTML & CSV Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shadow-sm bg-background/50 backdrop-blur-sm hover:bg-muted/50 border-border/50">
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

      <main className="container py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card className="p-6 shadow-xl shadow-black/5 border-border/40 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold tracking-tight">Input Content</h2>
              <Button onClick={handleReset} variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Start Fresh
              </Button>
            </div>

            <div className="space-y-5">
              <div 
                onDragOver={handleDragOver} 
                onDragLeave={handleDragLeave} 
                onDrop={handleDrop}
                className="relative"
              >
                <Label htmlFor="html" className="mb-1.5 flex items-center gap-2">
                  Base HTML
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 border border-border/50 px-1.5 py-0.5 rounded uppercase tracking-wider">Paste or Drag & Drop</span>
                </Label>
                <Textarea
                  id="html"
                  value={baseHTML}
                  onChange={(e) => setBaseHTML(e.target.value)}
                  placeholder="<!DOCTYPE html>&#10;<html>...&#10;  [INSERT_REGIONAL_SIGNPOSTING_HERE]&#10;...</html>"
                  className={`min-h-[220px] font-mono text-xs resize-y transition-all bg-background/50 ${isDragging ? "border-primary bg-primary/5 ring-4 ring-primary/10 border-dashed" : "border-border/60"}`}
                />
                {isDragging && (
                  <div className="absolute inset-0 top-[26px] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-primary rounded-md z-10 pointer-events-none">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <UploadCloud className="h-8 w-8 text-primary animate-bounce" />
                    </div>
                    <p className="text-base font-bold text-primary">Drop HTML file here</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="courseName" className="mb-1.5 block">Course Name</Label>
                  <select
                    id="courseName"
                    className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                  <Input id="courseCode" value={meta.courseCode} onChange={(e) => setMeta({ ...meta, courseCode: e.target.value })} placeholder="ENGHT" className="bg-background/50" />
                </div>
                
                <div>
                  <Label htmlFor="pageTitle" className="mb-1.5 block">Page Title</Label>
                  <Input id="pageTitle" value={meta.pageTitle} onChange={(e) => setMeta({ ...meta, pageTitle: e.target.value })} placeholder="Catching a Catfish" className="bg-background/50" />
                  <p className="text-[10px] text-muted-foreground mt-1.5 font-mono flex items-center gap-1.5 bg-muted/40 p-1 rounded border border-border/30">
                    <Sparkles className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">{livePreviewName}</span>
                  </p>
                </div>

                <div>
                  <Label htmlFor="topicClassName" className="mb-1.5 block">Topic Class Name (CSS)</Label>
                  <Input id="topicClassName" value={meta.topicClassName} onChange={(e) => setMeta({ ...meta, topicClassName: e.target.value })} placeholder="hottopics" className="bg-background/50" />
                </div>
              </div>

              <div className="pt-2">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="regional" className="border border-border/60 rounded-xl bg-card/50 px-5 shadow-sm">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3.5">
                      Regional Signposting Snippets
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2 pb-4">
                        {signpostingFields.map((f) => (
                          <div key={f.key}>
                            <Label htmlFor={`sn-${f.key}`} className="mb-1.5 block">{f.label}</Label>
                            <Textarea
                              id={`sn-${f.key}`}
                              value={snippets[f.key]}
                              onChange={(e) => setSnippets({ ...snippets, [f.key]: e.target.value })}
                              placeholder={`HTML to inject for ${f.label.replace(" Signposting", "")}`}
                              className="min-h-[80px] font-mono text-xs resize-y bg-background/50"
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
                className="w-full mt-6 h-12 text-primary-foreground border-0 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all font-bold text-base"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Assets
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            
            {/* --- UPGRADE 2: INTERACTIVE PILL BUTTONS FOR APPS --- */}
            <Card className="p-6 shadow-xl shadow-black/5 border-border/40 bg-card/80 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">App Targets</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Object.values(selection).filter(Boolean).length} of {APP_OPTIONS.length} selected
                  </p>
                </div>
                <div className="flex gap-3 text-xs mt-1 shrink-0 bg-muted/50 p-1.5 rounded-lg border border-border/40">
                  <button onClick={() => setAllApps(true)} className="text-primary hover:text-primary/80 font-semibold px-2 transition-colors">Select All</button>
                  <span className="text-muted-foreground/30">|</span>
                  <button onClick={() => setAllApps(false)} className="text-muted-foreground hover:text-foreground font-medium px-2 transition-colors">Clear</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {APP_OPTIONS.map((opt) => {
                  const isSelected = selection[opt.key];
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleApp(opt.key)}
                      className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 border ${
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]" 
                          : "bg-background/50 text-muted-foreground border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* --- UPGRADE 2: INTERACTIVE PILL BUTTONS FOR ROLES --- */}
            <Card className="p-6 shadow-xl shadow-black/5 border-border/40 bg-card/80 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">CSV Roles</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Tag generated files to these audiences.</p>
                </div>
                <div className="flex gap-3 text-xs mt-1 shrink-0 bg-muted/50 p-1.5 rounded-lg border border-border/40">
                  <button onClick={() => setAllRoles(true)} className="text-primary hover:text-primary/80 font-semibold px-2 transition-colors">Select All</button>
                  <span className="text-muted-foreground/30">|</span>
                  <button onClick={() => setAllRoles(false)} className="text-muted-foreground hover:text-foreground font-medium px-2 transition-colors">Clear</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {ROLE_OPTIONS.map((opt) => {
                  const isSelected = roles[opt.key];
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleRole(opt.key)}
                      className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 border ${
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]" 
                          : "bg-background/50 text-muted-foreground border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 shadow-xl shadow-black/5 border-border/40 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold tracking-tight">Ready to Export</h2>
                <span className="text-[11px] font-semibold tracking-wider uppercase bg-primary/10 text-primary px-2 py-1 rounded-md">
                  {generated ? `${generated.length} Files` : "Awaiting Info"}
                </span>
              </div>

              <ul className="space-y-2 mb-6">
                {previewList.map((f, i) => {
                  const ready = !!generated;
                  return (
                    <li
                      key={i}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${ready ? "bg-card border-border/60" : "bg-muted/20 border-transparent"}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {ready ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 drop-shadow-sm" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${ready ? "text-foreground" : "text-muted-foreground"}`}>{f.appName}</p>
                          <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">{f.fileName}</p>
                        </div>
                      </div>
                      <FileCode2 className={`h-4 w-4 shrink-0 ${ready ? "text-muted-foreground" : "text-muted-foreground/30"}`} />
                    </li>
                  );
                })}
                <li className={`flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors ${generated ? "bg-card border-border/60" : "bg-muted/30 border-border/40"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    {generated ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 drop-shadow-sm" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${generated ? "text-foreground" : "text-muted-foreground"}`}>Master Tracker CSV</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">Content_Tracker.csv</p>
                    </div>
                  </div>
                  <FileCode2 className={`h-4 w-4 shrink-0 ${generated ? "text-muted-foreground" : "text-muted-foreground/30"}`} />
                </li>
              </ul>

              <Button
                onClick={handleDownload}
                disabled={!generated}
                size="lg"
                variant="outline"
                className={`w-full h-12 font-bold transition-all ${generated ? "hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-sm" : ""}`}
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
