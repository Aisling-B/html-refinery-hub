export interface Metadata {
  baseFilename: string;
  courseName: string;
  courseCode: string;
  pageTitle: string;
  topicClassName: string;
}

export interface RegionalSnippets {
  england: string;
  northernIreland: string;
  wales: string;
  scotland: string;
  isleOfMan: string;
}

export interface AppShells {
  davidGame: string;
  bromley: string;
  fostering: string;
}

export interface GeneratedFile {
  appName: string;
  fileName: string;
  content: string;
  mime: string;
}

export type AppKey =
  | "ssZm"
  | "ssEng"
  | "ssScot"
  | "ssWales"
  | "ssIom"
  | "gst"
  | "nba"
  | "ssni"
  | "davidGame"
  | "bromley"
  | "fostering";

export interface AppOption {
  key: AppKey;
  label: string;
}

export const APP_OPTIONS: AppOption[] = [
  { key: "ssZm", label: "Safer Schools ZM" },
  { key: "ssEng", label: "Safer Schools England" },
  { key: "ssScot", label: "Safer Schools Scotland" },
  { key: "ssWales", label: "Safer Schools Wales" },
  { key: "ssIom", label: "Safer Schools Isle of Man" },
  { key: "gst", label: "Great Schools Trust" },
  { key: "nba", label: "North Birmingham Academy" },
  { key: "ssni", label: "Safer Schools NI" },
  { key: "davidGame", label: "David Game College" },
  { key: "bromley", label: "Bromley Permanency" },
  { key: "fostering", label: "Fostering in a Digital World" },
];

export type AppSelection = Record<AppKey, boolean>;

export const DEFAULT_SELECTION: AppSelection = APP_OPTIONS.reduce((acc, o) => {
  acc[o.key] = true;
  return acc;
}, {} as AppSelection);

const HSCT_CLASS_MAP: Record<string, string> = {
  ENGG: "hsc-gaming",
  ENGNTK: "hsc-ntk",
  ENGSM: "hsc-sm",
  ENGS: "hsc-sc",
  ENGIS: "hsc-is",
  ENGHW: "hsc-hw",
};

const PLACEHOLDER = "[INSERT_REGIONAL_SIGNPOSTING_HERE]";
const BODY_INJECT = "[INJECT_BODY_HERE]";

export const DEFAULT_SHELLS: AppShells = {
  davidGame: `<!DOCTYPE html>
<html>
<head>
<title></title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="master.css" media="all" rel="stylesheet" type="text/css">
<link href="app.css" media="all" rel="stylesheet" type="text/css">
</head>
<body>[INJECT_BODY_HERE]
</body>
</html>`,
  bromley: `<html>
<head>
<title>Bromley Permanency App</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=320, initial-scale=1"/>
<link rel="stylesheet" media="all" href="brom_perm_master.css" type="text/css"/>
<link rel="stylesheet" media="all" href="brom_perm_app.css" type="text/css" />
</head>
<body>
[INJECT_BODY_HERE]
</body>
</html>`,
  fostering: `<!DOCTYPE html>
<html>
<head>
<title>HSCT - Fostering in a Digital World</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" media="all" href="style.css" type="text/css" />
</head>
[INJECT_BODY_HERE]
</body>
</html>`,
};

const parseSignpostingText = (text: string, topicClass: string): string => {
  if (!text || !text.trim()) return "";
  
  // Failsafe: If the user pasted raw HTML, just return it exactly as is
  if (text.toLowerCase().includes("<div") || text.toLowerCase().includes("<h4")) {
    return text;
  }

  const blocks = text.split('---');
  let finalHtml = "";

  blocks.forEach((block) => {
    const lines = block.split('\n');
    let title = "";
    let body = "";
    let buttonText = "";
    let buttonUrl = "#";

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("Title:")) {
        title = trimmed.substring(6).trim();
      } else if (trimmed.startsWith("Body:")) {
        body = trimmed.substring(5).trim();
      } else if (trimmed.startsWith("Button:")) {
        const btnData = trimmed.substring(7).split('|');
        buttonText = btnData[0] ? btnData[0].trim() : "";
        buttonUrl = btnData[1] ? btnData[1].trim() : "#";
      }
    });

if (title || body || buttonText) {
      finalHtml += `<div class="grey">
    <h4 class="${topicClass}">${title}</h4>
    <p>${body}</p>
    <a class="roundcorners btn" href="${buttonUrl}" target="_blank">
        <div>
            <img align="left" src="../images/link_chain_grey.png" width="5px">
            <p>${buttonText}</p>
        </div>
    </a>
</div><br>\n`;
    }
  });

  return finalHtml;
};

const injectRegional = (html: string, snippet: string, topicClass: string): string => {
  // If there's no snippet provided, or the placeholder isn't in the HTML, do nothing
  if (!snippet || !snippet.trim() || !html.includes(PLACEHOLDER)) {
    return html;
  }
  
  // Convert plain text to HTML (or pass through if already HTML)
  const processedSnippet = parseSignpostingText(snippet, topicClass);
  
  // Safely inject the parsed HTML block wherever the placeholder sits
  return html.split(PLACEHOLDER).join(processedSnippet);
};

const injectBody = (shell: string, body: string): string => {
  if (!shell || !shell.includes(BODY_INJECT)) return body;
  return shell.split(BODY_INJECT).join(body);
};

const parseHTML = (html: string): Document => {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
};

const swapClass = (root: Document | HTMLElement, oldClass: string, newClass: string) => {
  const safe = oldClass.replace(/"/g, '\\"');
  const els = root.querySelectorAll(`[class="${safe}"]`);
  els.forEach((el) => {
    el.setAttribute("class", newClass);
  });
};

const fixImagePathsDavidGame = (root: Document | HTMLElement) => {
  const imgs = root.querySelectorAll("img");
  imgs.forEach((img) => {
    const src = img.getAttribute("src");
    if (src && src.includes("../images/")) {
      img.setAttribute("src", src.replace(/\.\.\/images\//g, "images/"));
    }
  });
};

const fixImagePathsStripped = (root: Document | HTMLElement) => {
  const imgs = root.querySelectorAll("img");
  imgs.forEach((img) => {
    const src = img.getAttribute("src");
    if (src && src.includes("../images/")) {
      img.setAttribute("src", src.replace(/\.\.\/images\//g, ""));
    }
  });
};

const serializeBodyInner = (doc: Document): string => {
  return doc.body ? doc.body.innerHTML : "";
};

const serializeFullDoc = (doc: Document): string => {
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
};

const replaceFosteringButtons = (root: Document) => {
  const candidates = Array.from(root.querySelectorAll("a"));
  candidates.forEach((a) => {
    const cls = (a.getAttribute("class") || "").toLowerCase();
    const looksLikeButtonClass = /\bbtn\b|\bbutton\b/.test(cls);
    if (!looksLikeButtonClass) return;

    // Extract the original text 
    const text = a.textContent?.trim() || "";
    
    // Try to find the original image to keep the correct icon (e.g., PDF icon vs Chain icon)
    const imgNode = a.querySelector("img");
    let imgSrc = "link_chain_grey.png"; // Fallback
    if (imgNode) {
      const originalSrc = imgNode.getAttribute("src") || "";
      // Strip the folder paths as Fostering requires images in the root
      imgSrc = originalSrc.replace(/\.\.\/images\//g, "").replace(/images\//g, "");
    }

    // Rebuild the button with the extracted dynamic content and Fostering's structure
    const href = a.getAttribute("href") || "#";
    const wrapper = root.createElement("div");
    wrapper.innerHTML = `<a class="roundcorners" href="${href}" target="_blank"><div><img align="left" src="${imgSrc}"><p class="btn-text">${text}</p></div></a>`;
    
    const newNode = wrapper.firstElementChild;
    if (newNode && a.parentNode) {
      a.parentNode.replaceChild(newNode, a);
    }
  });
};

export const generateFiles = (
  baseHTML: string,
  meta: Metadata,
  snippets: RegionalSnippets,
  shells: AppShells = DEFAULT_SHELLS,
  selection: AppSelection = DEFAULT_SELECTION
): GeneratedFile[] => {
  const { baseFilename, courseCode, topicClassName } = meta;

  const englandHTML = injectRegional(baseHTML, snippets.england, topicClassName);
  const niHTML = injectRegional(baseHTML, snippets.northernIreland, topicClassName);
  const walesHTML = injectRegional(baseHTML, snippets.wales, topicClassName);
  const scotlandHTML = injectRegional(baseHTML, snippets.scotland, topicClassName);
  const iomHTML = injectRegional(baseHTML, snippets.isleOfMan, topicClassName);

  const allRegionalEmpty =
    !snippets.england.trim() &&
    !snippets.northernIreland.trim() &&
    !snippets.wales.trim() &&
    !snippets.scotland.trim() &&
    !snippets.isleOfMan.trim();

  const out: GeneratedFile[] = [];

  if (selection.ssZm) {
    out.push({
      appName: "Safer Schools ZM",
      fileName: `${baseFilename}_all.html`,
      content: englandHTML,
      mime: "text/html",
    });
  }

  if (!allRegionalEmpty) {
    if (selection.ssEng) {
      out.push({
        appName: "Safer Schools England",
        fileName: `${baseFilename}_eng.html`,
        content: englandHTML,
        mime: "text/html",
      });
    }
    if (selection.ssScot) {
      out.push({
        appName: "Safer Schools Scotland",
        fileName: `${baseFilename}_scot.html`,
        content: scotlandHTML,
        mime: "text/html",
      });
    }
    if (selection.ssWales) {
      out.push({
        appName: "Safer Schools Wales",
        fileName: `${baseFilename}_wales.html`,
        content: walesHTML,
        mime: "text/html",
      });
    }
    if (selection.ssIom) {
      out.push({
        appName: "Safer Schools Isle of Man",
        fileName: `${baseFilename}_iom.html`,
        content: iomHTML,
        mime: "text/html",
      });
    }
  }

  if (selection.gst) {
    out.push({
      appName: "Great Schools Trust",
      fileName: `${baseFilename}_GST.html`,
      content: englandHTML,
      mime: "text/html",
    });
  }
  if (selection.nba) {
    out.push({
      appName: "North Birmingham Academy",
      fileName: `${baseFilename}_NBA.html`,
      content: englandHTML,
      mime: "text/html",
    });
  }

  if (selection.ssni) {
    const ssniDoc = parseHTML(niHTML);
    swapClass(ssniDoc, topicClassName, "deniblue");
    out.push({
      appName: "Safer Schools NI",
      fileName: `${baseFilename}_deni.html`,
      content: serializeFullDoc(ssniDoc),
      mime: "text/html",
    });
  }

  if (selection.davidGame) {
    const dgDoc = parseHTML(englandHTML);
    swapClass(dgDoc, topicClassName, "davidgamegreen");
    fixImagePathsDavidGame(dgDoc);
    out.push({
      appName: "David Game College",
      fileName: `${baseFilename}_davidgame.html`,
      content: injectBody(shells.davidGame, serializeBodyInner(dgDoc)),
      mime: "text/html",
    });
  }

  if (selection.bromley) {
    const bromDoc = parseHTML(englandHTML);
    swapClass(bromDoc, topicClassName, "bromgreen");
    fixImagePathsStripped(bromDoc);
    out.push({
      appName: "Bromley Permanency",
      fileName: `${baseFilename}_bromley.html`,
      content: injectBody(shells.bromley, serializeBodyInner(bromDoc)),
      mime: "text/html",
    });
  }

  if (selection.fostering) {
    const fosDoc = parseHTML(niHTML);
    const fosteringClass = HSCT_CLASS_MAP[courseCode] || "hsc-general";
    swapClass(fosDoc, topicClassName, fosteringClass);
    fixImagePathsStripped(fosDoc);
    replaceFosteringButtons(fosDoc);
    const fosteringShell = (shells.fostering || "").split("[INSERT_SECTION_CODE]").join(fosteringClass);
    out.push({
      appName: "Fostering in a Digital World",
      fileName: `${baseFilename}_fostering.html`,
      content: injectBody(fosteringShell, serializeBodyInner(fosDoc)),
      mime: "text/html",
    });
  }

  return out;
};

// =====================================================
// CSV / App-aware metadata mapping
// =====================================================

export type RoleKey = "staff" | "parent" | "pupil" | "safeguarding";

export const ROLE_OPTIONS: { key: RoleKey; label: string }[] = [
  { key: "staff", label: "Staff" },
  { key: "parent", label: "Parent" },
  { key: "pupil", label: "Pupil" },
  { key: "safeguarding", label: "Safeguarding Lead" },
];

export const DEFAULT_ROLES: Record<RoleKey, boolean> = {
  staff: true,
  parent: true,
  pupil: true,
  safeguarding: true,
};

const ROLE_LABEL_MAP: Record<RoleKey, string> = {
  staff: "Staff",
  parent: "Parent",
  pupil: "Pupil",
  safeguarding: "Safeguarding Lead",
};

export type CsvSchema = "saferSchools" | "davidGame" | "fostering" | "bromley";

export interface AppConfig {
  schema: CsvSchema;
  azureBase: string;
  themeColor?: string;
  fixedRole?: string; // overrides role selection (Fostering / Bromley)
}

export const APP_CONFIGS: Record<AppKey, AppConfig> = {
  ssZm: { schema: "saferSchools", azureBase: "https://mock-azure-url.com/html/zm/" },
  ssEng: { schema: "saferSchools", azureBase: "https://mock-azure-url.com/html/england/" },
  ssni: { schema: "saferSchools", azureBase: "https://mock-azure-url.com/html/ni/" },
  ssScot: { schema: "saferSchools", azureBase: "https://mock-azure-url.com/html/scotland/" },
  ssWales: { schema: "saferSchools", azureBase: "https://mock-azure-url.com/html/wales/" },
  ssIom: { schema: "saferSchools", azureBase: "https://mock-azure-url.com/html/iom/" },
  gst: { schema: "saferSchools", azureBase: "https://mock-azure-url.com/html/gst/" },
  nba: { schema: "saferSchools", azureBase: "https://mock-azure-url.com/html/nba/" },
  davidGame: {
    schema: "davidGame",
    azureBase: "https://mock-azure-url.com/davidgame_html/",
    themeColor: "#5BA84F",
  },
  bromley: {
    schema: "bromley",
    azureBase: "https://mock-azure-url.com/brom_perm_html_master_content/",
    fixedRole: "Special Guardianship",
  },
  fostering: {
    schema: "fostering",
    azureBase: "https://mock-azure-url.com/HTML%20Files/",
    fixedRole: "Non Kinship Foster Carer",
  },
};

const APP_NAME_TO_KEY: Record<string, AppKey> = APP_OPTIONS.reduce((acc, o) => {
  acc[o.label] = o.key;
  return acc;
}, {} as Record<string, AppKey>);

// Course-code → metadata lookup. Extend as needed.
export interface CourseAssetEntry {
  courseGroup: string;
  courseIcon: string;
  hexColour: string;
  backgroundImage: string;
}

export const COURSE_ASSET_MAP: Record<string, CourseAssetEntry> = {
  ENGHT: {
    courseGroup: "Hot Topics",
    courseIcon: "https://mock-azure-url.com/icons/hottopics.png",
    hexColour: "#E5322D",
    backgroundImage: "https://mock-azure-url.com/bg/hottopics.jpg",
  },
  ENGG: {
    courseGroup: "Gaming",
    courseIcon: "https://mock-azure-url.com/icons/gaming.png",
    hexColour: "#4CAF50",
    backgroundImage: "https://mock-azure-url.com/bg/gaming.jpg",
  },
  ENGNTK: {
    courseGroup: "Need to Know",
    courseIcon: "https://mock-azure-url.com/icons/ntk.png",
    hexColour: "#2196F3",
    backgroundImage: "https://mock-azure-url.com/bg/ntk.jpg",
  },
  ENGSM: {
    courseGroup: "Social Media",
    courseIcon: "https://mock-azure-url.com/icons/sm.png",
    hexColour: "#9C27B0",
    backgroundImage: "https://mock-azure-url.com/bg/sm.jpg",
  },
  ENGS: {
    courseGroup: "Scams",
    courseIcon: "https://mock-azure-url.com/icons/sc.png",
    hexColour: "#FF9800",
    backgroundImage: "https://mock-azure-url.com/bg/sc.jpg",
  },
  ENGIS: {
    courseGroup: "Internet Safety",
    courseIcon: "https://mock-azure-url.com/icons/is.png",
    hexColour: "#00BCD4",
    backgroundImage: "https://mock-azure-url.com/bg/is.jpg",
  },
  ENGHW: {
    courseGroup: "Health & Wellbeing",
    courseIcon: "https://mock-azure-url.com/icons/hw.png",
    hexColour: "#8BC34A",
    backgroundImage: "https://mock-azure-url.com/bg/hw.jpg",
  },
};

const SCHEMA_HEADERS: Record<CsvSchema, string[]> = {
  saferSchools: [
    "App Name", "Role", "Course Group", "Course Name", "Course Code", "Page Title",
    "Course Icon", "Hex Colour", "Background Image", "Generated File Name", "HTML URL",
  ],
  davidGame: [
    "App Name", "Role", "Course Group", "Course Name", "Course Code", "Page Title",
    "Page Icon", "Hex Colour", "Background Image", "Generated File Name", "HTML URL",
  ],
  fostering: [
    "App Name", "Role", "Module", "Course Name", "Course Code", "Page Title",
    "Section Icon", "Hex Colour", "Background Image", "Generated File Name", "HTML URL",
  ],
  bromley: [
    "App Name", "Role", "Pathway", "Course Name", "Course Code", "Page Title",
    "Section Icon", "Hex Colour", "Background Image", "Generated File Name", "HTML URL",
  ],
};

export interface CsvRow {
  appName: string;
  role: string;
  courseGroup: string;
  courseName: string;
  courseCode: string;
  pageTitle: string;
  courseIcon: string;
  hexColour: string;
  backgroundImage: string;
  fileName: string;
  htmlUrl: string;
  schema: CsvSchema;
}

const csvEscape = (v: string) => {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
};

export const buildCsvRows = (
  files: GeneratedFile[],
  meta: Metadata,
  selectedRoles: Record<RoleKey, boolean> = DEFAULT_ROLES
): CsvRow[] => {
  const asset = COURSE_ASSET_MAP[meta.courseCode] || {
    courseGroup: "",
    courseIcon: "",
    hexColour: "",
    backgroundImage: "",
  };
  const activeRoles = ROLE_OPTIONS.filter((r) => selectedRoles[r.key]);
  const rows: CsvRow[] = [];

  files.forEach((f) => {
    const appKey = APP_NAME_TO_KEY[f.appName];
    const cfg = appKey ? APP_CONFIGS[appKey] : APP_CONFIGS.ssZm;
    const htmlUrl = `${cfg.azureBase}${f.fileName}`;

    const rolesForApp: string[] = cfg.fixedRole
      ? [cfg.fixedRole]
      : activeRoles.length
        ? activeRoles.map((r) => ROLE_LABEL_MAP[r.key])
        : [""];

    rolesForApp.forEach((role) => {
      rows.push({
        appName: f.appName,
        role,
        courseGroup: asset.courseGroup,
        courseName: meta.courseName,
        courseCode: meta.courseCode,
        pageTitle: meta.pageTitle,
        courseIcon: asset.courseIcon,
        hexColour: cfg.themeColor || asset.hexColour,
        backgroundImage: asset.backgroundImage,
        fileName: f.fileName,
        htmlUrl,
        schema: cfg.schema,
      });
    });
  });

  return rows;
};

export const generateCSV = (
  files: GeneratedFile[],
  meta: Metadata,
  selectedRoles: Record<RoleKey, boolean> = DEFAULT_ROLES
): string => {
  const rows = buildCsvRows(files, meta, selectedRoles);

  // Group rows by schema so each app family has the right header set
  const bySchema = new Map<CsvSchema, CsvRow[]>();
  rows.forEach((r) => {
    const list = bySchema.get(r.schema) || [];
    list.push(r);
    bySchema.set(r.schema, list);
  });

  const sections: string[] = [];
  bySchema.forEach((list, schema) => {
    const headers = SCHEMA_HEADERS[schema];
    const headerLine = headers.join(",");
    const lines = list.map((r) =>
      [
        r.appName, r.role, r.courseGroup, r.courseName, r.courseCode, r.pageTitle,
        r.courseIcon, r.hexColour, r.backgroundImage, r.fileName, r.htmlUrl,
      ].map(csvEscape).join(",")
    );
    sections.push([headerLine, ...lines].join("\n"));
  });

  return sections.join("\n\n");
};
