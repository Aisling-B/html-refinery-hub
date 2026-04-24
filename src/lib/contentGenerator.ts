export interface Metadata {
  baseFilename: string;
  courseName: string;
  courseCode: string;
  pageTitle: string;
  topicClassName: string;
  headerImageUrl: string;
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
// CSV / App-aware metadata mapping (Master Database)
// =====================================================

// Granular role keys used across the platform
export type RoleKey =
  | "staffPrimary"
  | "staffSecondary"
  | "parentPrimary"
  | "parentSecondary"
  | "pupilPrimary"
  | "pupilLower"
  | "pupilMiddle"
  | "pupilUpper"
  | "sgPrimary"
  | "sgSecondary";

export const ROLE_OPTIONS: { key: RoleKey; label: string }[] = [
  { key: "staffPrimary", label: "Staff Primary" },
  { key: "staffSecondary", label: "Staff Secondary" },
  { key: "parentPrimary", label: "Parent Primary" },
  { key: "parentSecondary", label: "Parent Secondary" },
  { key: "pupilPrimary", label: "Pupil Primary" },
  { key: "pupilLower", label: "Pupil Lower Secondary" },
  { key: "pupilMiddle", label: "Pupil Middle Secondary" },
  { key: "pupilUpper", label: "Pupil Upper Secondary" },
  { key: "sgPrimary", label: "Safeguarding Lead Primary" },
  { key: "sgSecondary", label: "Safeguarding Lead Secondary" },
];

export const DEFAULT_ROLES: Record<RoleKey, boolean> = ROLE_OPTIONS.reduce(
  (acc, r) => {
    acc[r.key] = true;
    return acc;
  },
  {} as Record<RoleKey, boolean>
);

// Master per-app config: base URL + the app-specific role labels
export interface AppConfig {
  baseUrl: string;
  roles: Partial<Record<RoleKey, string>>;
}

export const APP_CONFIGS: Record<string, AppConfig> = {
  zm: {
    baseUrl: "https://saferschoolscontent.blob.core.windows.net/html/all/",
    roles: {
      staffPrimary: "Staff - Primary",
      staffSecondary: "Staff - Secondary",
      parentPrimary: "Parents and Carers Primary",
      parentSecondary: "Parents and Carers Secondary",
      pupilPrimary: "Pupil Primary KS2",
      pupilLower: "Pupil Lower Secondary",
      pupilMiddle: "Pupil Middle Secondary",
      pupilUpper: "Pupil Upper Secondary",
      sgPrimary: "Safeguarding Lead - Primary",
      sgSecondary: "Safeguarding Lead - Secondary",
    },
  },
  england: {
    baseUrl: "https://saferschoolscontent.blob.core.windows.net/html/england/",
    roles: {
      staffPrimary: "Staff - Primary",
      staffSecondary: "Staff - Secondary",
      parentPrimary: "Parents and Carers Primary",
      parentSecondary: "Parents and Carers Secondary",
      pupilPrimary: "Pupil Primary KS2",
      pupilLower: "Pupil Lower Secondary",
      pupilMiddle: "Pupil Middle Secondary",
      pupilUpper: "Pupil Upper Secondary",
      sgPrimary: "Safeguarding Lead - Primary",
      sgSecondary: "Safeguarding Lead - Secondary",
    },
  },
  isleOfMan: {
    baseUrl: "https://saferschoolscontent.blob.core.windows.net/html/iom/",
    roles: {
      staffPrimary: "Staff - Primary",
      staffSecondary: "Staff - Secondary",
      parentPrimary: "Parents and Carers Primary",
      parentSecondary: "Parents and Carers Secondary",
      pupilPrimary: "Pupil Primary KS2",
      pupilLower: "Pupil Lower Secondary",
      pupilMiddle: "Pupil Middle Secondary",
      pupilUpper: "Pupil Upper Secondary",
      sgPrimary: "Safeguarding Lead - Primary",
      sgSecondary: "Safeguarding Lead - Secondary",
    },
  },
  scotland: {
    baseUrl: "https://saferschoolscontent.blob.core.windows.net/html/scotland/",
    roles: {
      staffPrimary: "Staff - Primary",
      staffSecondary: "Staff - Secondary",
      parentPrimary: "Parents and Carers Primary",
      parentSecondary: "Parents and Carers Secondary",
      pupilPrimary: "Pupil Primary KS2",
      pupilLower: "Pupil Lower Secondary",
      pupilMiddle: "Pupil Middle Secondary",
      pupilUpper: "Pupil Upper Secondary",
      sgPrimary: "Safeguarding Lead - Primary",
      sgSecondary: "Safeguarding Lead - Secondary",
    },
  },
  wales: {
    baseUrl: "https://saferschoolscontent.blob.core.windows.net/html/wales/",
    roles: {
      staffPrimary: "Staff - Primary",
      staffSecondary: "Staff - Secondary",
      parentPrimary: "Parents and Carers Primary",
      parentSecondary: "Parents and Carers Secondary",
      pupilPrimary: "Pupil Primary KS2",
      pupilLower: "Pupil Lower Secondary",
      pupilMiddle: "Pupil Middle Secondary",
      pupilUpper: "Pupil Upper Secondary",
      sgPrimary: "Safeguarding Lead - Primary",
      sgSecondary: "Safeguarding Lead - Secondary",
    },
  },
  davidGame: {
    baseUrl: "https://able3content.blob.core.windows.net/david-game-college/DGC_HTML/",
    roles: {
      staffSecondary: "Staff",
      parentSecondary: "Parents and Guardians",
      pupilMiddle: "GCSE Students",
      pupilUpper: "6th Form Students",
      sgSecondary: "Safeguarding Team",
    },
  },
  greatSchoolsTrust: {
    baseUrl: "https://able3content.blob.core.windows.net/great-schools-trust/master-course-content/html/",
    roles: {
      staffPrimary: "Staff - Primary",
      staffSecondary: "Staff - Secondary",
      parentPrimary: "Parents and Carers Primary",
      parentSecondary: "Parents and Carers Secondary",
      pupilPrimary: "Pupil Primary KS2",
      pupilLower: "Pupil Lower Secondary",
      pupilMiddle: "Pupil Middle Secondary",
      pupilUpper: "Pupil Upper Secondary",
      sgPrimary: "Safeguarding Lead - Primary",
      sgSecondary: "Safeguarding Lead - Secondary",
    },
  },
  northBirminghamAcademy: {
    baseUrl: "https://able3content.blob.core.windows.net/north-birmingham-academy/master-course-content/html/",
    roles: {
      staffSecondary: "Staff",
      parentSecondary: "Parents and Carers",
      pupilLower: "Pupil - Lower Secondary",
      pupilMiddle: "Pupil - Middle Secondary",
      pupilUpper: "Pupil - Upper Secondary",
      sgSecondary: "Safeguarding Lead",
    },
  },
  northernIreland: {
    baseUrl: "https://saferschoolscontent.blob.core.windows.net/northernireland/htmls/course_content/htmls/",
    roles: {
      staffPrimary: "Staff Primary",
      staffSecondary: "Staff Post-Primary",
      parentPrimary: "Parent/Carer Primary",
      parentSecondary: "Parent/Carer Post-Primary",
      pupilPrimary: "Pupil Year 6-7",
      pupilLower: "Pupil Year 8-9",
      pupilMiddle: "Pupil Year 10-11",
      pupilUpper: "Pupil Year 12-14",
      sgPrimary: "Safeguarding Lead Primary",
      sgSecondary: "Safeguarding Lead Post-Primary",
    },
  },
  bromley: {
    baseUrl: "https://ableportaldev.blob.core.windows.net/bromleypermanency/brom_perm_html_master_content/",
    roles: {
      parentSecondary: "Special Guardianship, Foster Carer - Connected Persons",
    },
  },
};

// Map our internal AppKey → master APP_CONFIGS key
const APP_KEY_TO_CONFIG: Record<AppKey, string> = {
  ssZm: "zm",
  ssEng: "england",
  ssScot: "scotland",
  ssWales: "wales",
  ssIom: "isleOfMan",
  gst: "greatSchoolsTrust",
  nba: "northBirminghamAcademy",
  ssni: "northernIreland",
  davidGame: "davidGame",
  bromley: "bromley",
  fostering: "bromley", // fostering shares no master entry; fallback (unused for HTML URL header)
};

const APP_NAME_TO_KEY: Record<string, AppKey> = APP_OPTIONS.reduce((acc, o) => {
  acc[o.label] = o.key;
  return acc;
}, {} as Record<string, AppKey>);

// Course library: visual assets per course code
export interface CourseLibraryEntry {
  courseGroup: string;
  courseName: string;
  courseIcon: string;
  hexColour: string;
  backgroundImage: string;
}

export const COURSE_LIBRARY: Record<string, CourseLibraryEntry> = {
  ENGHT: {
    courseGroup: "Hot Topics",
    courseName: "Hot Topics",
    courseIcon: "https://mock-azure-url.com/icons/hottopics.png",
    hexColour: "#E5322D",
    backgroundImage: "https://mock-azure-url.com/bg/hottopics.jpg",
  },
  ENGG: {
    courseGroup: "Gaming",
    courseName: "Gaming",
    courseIcon: "https://mock-azure-url.com/icons/gaming.png",
    hexColour: "#4CAF50",
    backgroundImage: "https://mock-azure-url.com/bg/gaming.jpg",
  },
  ENGNTK: {
    courseGroup: "Need to Know",
    courseName: "Need to Know",
    courseIcon: "https://mock-azure-url.com/icons/ntk.png",
    hexColour: "#2196F3",
    backgroundImage: "https://mock-azure-url.com/bg/ntk.jpg",
  },
  ENGSM: {
    courseGroup: "Social Media",
    courseName: "Social Media",
    courseIcon: "https://mock-azure-url.com/icons/sm.png",
    hexColour: "#9C27B0",
    backgroundImage: "https://mock-azure-url.com/bg/sm.jpg",
  },
  ENGS: {
    courseGroup: "Scams",
    courseName: "Scams",
    courseIcon: "https://mock-azure-url.com/icons/sc.png",
    hexColour: "#FF9800",
    backgroundImage: "https://mock-azure-url.com/bg/sc.jpg",
  },
  ENGIS: {
    courseGroup: "Internet Safety",
    courseName: "Internet Safety",
    courseIcon: "https://mock-azure-url.com/icons/is.png",
    hexColour: "#00BCD4",
    backgroundImage: "https://mock-azure-url.com/bg/is.jpg",
  },
  ENGHW: {
    courseGroup: "Health & Wellbeing",
    courseName: "Health & Wellbeing",
    courseIcon: "https://mock-azure-url.com/icons/hw.png",
    hexColour: "#8BC34A",
    backgroundImage: "https://mock-azure-url.com/bg/hw.jpg",
  },
};

// CSV schema (single unified table)
export const CSV_HEADERS = [
  "App Name",
  "Role",
  "Course Group",
  "Course Name",
  "Course Code",
  "Page Title",
  "Module Code",
  "Module Name",
  "Course Icon",
  "Hex Colour",
  "Background Image",
  "Header Image",
  "Is Story",
  "Is Full Screen",
  "Order",
  "Navigation Style",
  "Generated File Name",
  "HTML URL",
];

export interface CsvRow {
  appName: string;
  role: string;
  courseGroup: string;
  courseName: string;
  courseCode: string;
  pageTitle: string;
  moduleCode: string;
  moduleName: string;
  courseIcon: string;
  hexColour: string;
  backgroundImage: string;
  headerImage: string;
  isStory: string;
  isFullScreen: string;
  order: string;
  navigationStyle: string;
  fileName: string;
  htmlUrl: string;
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
  const lib = COURSE_LIBRARY[meta.courseCode];
  const courseGroup = lib?.courseGroup ?? "";
  const courseName = lib?.courseName ?? meta.courseName ?? "";
  const courseIcon = lib?.courseIcon ?? "";
  const hexColour = lib?.hexColour ?? "";
  const backgroundImage = lib?.backgroundImage ?? "";

  const activeRoleKeys = (Object.keys(selectedRoles) as RoleKey[]).filter(
    (k) => selectedRoles[k]
  );

  const rows: CsvRow[] = [];

  files.forEach((f) => {
    const appKey = APP_NAME_TO_KEY[f.appName];
    if (!appKey) return;
    const cfgKey = APP_KEY_TO_CONFIG[appKey];
    const cfg = APP_CONFIGS[cfgKey];
    if (!cfg) return;

    const htmlUrl = `${cfg.baseUrl}${f.fileName}`;

    activeRoleKeys.forEach((roleKey) => {
      const mappedRole = cfg.roles[roleKey];
      // Skip if this app doesn't define a string for the selected role
      if (!mappedRole) return;

      rows.push({
        appName: f.appName,
        role: mappedRole,
        courseGroup,
        courseName,
        courseCode: meta.courseCode,
        pageTitle: meta.pageTitle,
        moduleCode: "L1",
        moduleName: "Level 1",
        courseIcon,
        hexColour,
        backgroundImage,
        headerImage: meta.headerImageUrl || "",
        isStory: "False",
        isFullScreen: "False",
        order: "1",
        navigationStyle: "Free",
        fileName: f.fileName,
        htmlUrl,
      });
    });
  });

  return rows;
};

export const generateCSV = (files: GeneratedFile[], meta: Metadata, selectedRoles: Record<string, boolean> = {}): string => {
  const allRows: string[] = [];
  let headerGenerated = false;

  files.forEach((file) => {
    const appKey = file.appKey;
    const config = APP_CONFIGS[appKey];
    
    if (!config) return;

    // Use the exact app-specific columns from our previous schema setup
    // (Falling back to the standard Safer Schools columns if not specified)
    const columns = config.columns || [
      "Role ", "Course Group", "Course Group Icon", "Course Name", "Course Icon", 
      "Course Code", "Module Code", "Module Name", "Page Title", "PageIcon", 
      "HTMLURL", "HeaderImageURL", "Video ID", "Colour", "Background Image", 
      "Course Group Background Image", "Course Tile Background Image", 
      "Is Story", "Is Full Screen", "Order", "Progress Style", "Navigation Style"
    ];

    if (!headerGenerated) {
      allRows.push(columns.join(","));
      headerGenerated = true;
    }

    // 1. PULL FROM THE MASTER DATABASE (Not mock data!)
    const courseData = COURSE_LIBRARY[meta.courseCode] || {
      group: "",
      name: "",
      color: "",
      icon: ""
    };

    // 2. GENERATE A ROW FOR EVERY TICKED ROLE FOR THIS APP
    const availableRolesInApp = config.roles || {};
    
    Object.keys(selectedRoles).forEach((roleKey) => {
      // Only generate if the user ticked the box AND the app actually supports that role
      if (selectedRoles[roleKey] && availableRolesInApp[roleKey]) {
        const exactRoleName = availableRolesInApp[roleKey];
        
        const rowData = columns.map(col => {
          const cleanCol = col.trim().toLowerCase();
          
          // Role & URLs
          if (cleanCol === "role" || cleanCol === "role ") return exactRoleName;
          if (cleanCol === "htmlurl" || cleanCol === "html url") return `${config.baseUrl}${file.fileName}`;
          
          // Inputs from UI
          if (cleanCol === "page title") return meta.pageTitle;
          if (cleanCol === "course code") return meta.courseCode;
          if (cleanCol === "headerimageurl" || cleanCol === "header image url") return meta.headerImageUrl || "";
          
          // Master Database Matches (The part Lovable messed up)
          if (cleanCol === "course group") return courseData.group;
          if (cleanCol === "course name") return courseData.name;
          if (cleanCol === "colour") return courseData.color;
          
          // Icons
          if (cleanCol === "course icon" || cleanCol === "pageicon" || cleanCol === "page icon") {
             // If we are in NI, dynamically swap the assets folder path
             if (appKey === "northernIreland" && courseData.icon) {
                 return courseData.icon.replace("/assets/icons/", "/northernireland/assets/tile_icons/");
             }
             return courseData.icon;
          }
          
          // Static Defaults
          if (cleanCol === "module code") return "L1";
          if (cleanCol === "module name") return "Level 1";
          if (cleanCol === "is story") return "False";
          if (cleanCol === "is full screen") return "False";
          if (cleanCol === "order") return "1";
          if (cleanCol === "navigation style") return "Free";
          
          // Blank fields
          return ""; 
        });

        // Escape commas for CSV
        allRows.push(rowData.map(v => {
            const s = String(v || "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(","));
      }
    });
  });

  return allRows.join("\n");
};
