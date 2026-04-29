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
    if (confirm("Are you sure you want to clear everything and start fresh?")) {
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
        <div className="grid grid-cols-1 lg:grid-cols-
