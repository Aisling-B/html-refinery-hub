export interface Metadata {
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

// --- DYNAMIC FILENAME HELPERS ---
export const ROLE_TO_AUDIENCE: Record<RoleKey, string> = {
  staffPrimary: "ad",
  staffSecondary: "ad",
  parentPrimary: "ad",
  parentSecondary: "ad",
  sgPrimary: "ad",
  sgSecondary: "ad",
  pupilPrimary: "pupil_ks2",
  pupilLower: "pupil_lower_secondary",
  pupilMiddle: "pupil_middle",
  pupilUpper: "upper_secondary",
};

const getCourseAbbreviation = (code: string) => {
  const prefixes = ["ENG", "SCOT", "WAL", "IOM", "GST", "NBA", "DG", "DE", "BP", "CHSCT", "CHSC"];
  let suffix = code || "";
  for (const p of prefixes) {
    if (suffix.startsWith(p)) {
      suffix = suffix.substring(p.length);
      break;
    }
  }
  return suffix.toLowerCase();
};

const getFilenamePrefix = (appKey: AppKey, audienceTarget: string) => {
  let appPrefix = "educ";
  if (appKey === "davidGame") appPrefix = "dgc";
  else if (appKey === "bromley") appPrefix = "brom_perm";
  else if (appKey === "fostering") appPrefix = "hsct";

  let roleStr = audienceTarget;
  if (appKey === "fostering" && audienceTarget === "ad") roleStr = "fc";

  if (!roleStr) return appPrefix;
  return `${appPrefix}_${roleStr}`;
};

export const generateFiles = (
  baseHTML: string,
  meta: Metadata,
  snippets: RegionalSnippets,
  roles: Record<string, boolean>,
  shells: AppShells = DEFAULT_SHELLS,
  selection: AppSelection = DEFAULT_SELECTION
): GeneratedFile[] => {
  const { courseCode, topicClassName } = meta;

  // 1. Find every unique audience prefix you checked!
  const activeAudiences = new Set<string>();
  (Object.keys(roles) as RoleKey[]).forEach((roleKey) => {
    if (roles[roleKey]) {
      activeAudiences.add(ROLE_TO_AUDIENCE[roleKey]);
    }
  });
  if (activeAudiences.size === 0) activeAudiences.add("ad"); // Failsafe fallback

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

  // 2. Generate a distinct HTML file for EACH audience selected!
  Array.from(activeAudiences).forEach((audienceTarget) => {
    const buildName = (appKey: AppKey, suffix: string) => {
      const prefix = getFilenamePrefix(appKey, audienceTarget);
      const course = getCourseAbbreviation(meta.courseCode);
      const safeTitle = (meta.pageTitle || "page").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
      const rawName = `${prefix}_${course}_${safeTitle}${suffix}.html`;
      return rawName.replace(/_+/g, '_'); 
    };

    if (selection.ssZm) out.push({ appName: "Safer Schools ZM", fileName: buildName("ssZm", "_all"), content: englandHTML, mime: "text/html", audienceTarget });
    if (selection.ssEng) out.push({ appName: "Safer Schools England", fileName: buildName("ssEng", allRegionalEmpty ? "_all" : "_eng"), content: englandHTML, mime: "text/html", audienceTarget });
    if (selection.ssScot) out.push({ appName: "Safer Schools Scotland", fileName: buildName("ssScot", allRegionalEmpty ? "_all" : "_scot"), content: scotlandHTML, mime: "text/html", audienceTarget });
    if (selection.ssWales) out.push({ appName: "Safer Schools Wales", fileName: buildName("ssWales", allRegionalEmpty ? "_all" : "_wales"), content: walesHTML, mime: "text/html", audienceTarget });
    if (selection.ssIom) out.push({ appName: "Safer Schools Isle of Man", fileName: buildName("ssIom", allRegionalEmpty ? "_all" : "_iom"), content: iomHTML, mime: "text/html", audienceTarget });

    if (selection.gst) out.push({ appName: "Great Schools Trust", fileName: buildName("gst", "_gst"), content: englandHTML, mime: "text/html", audienceTarget });
    if (selection.nba) out.push({ appName: "North Birmingham Academy", fileName: buildName("nba", "_nba"), content: englandHTML, mime: "text/html", audienceTarget });

    if (selection.ssni) {
      const ssniDoc = parseHTML(niHTML);
      swapClass(ssniDoc, topicClassName, "deniblue");
      out.push({ appName: "Safer Schools NI", fileName: buildName("ssni", "_deni"), content: serializeFullDoc(ssniDoc), mime: "text/html", audienceTarget });
    }

if (selection.davidGame) {
      const dgDoc = parseHTML(englandHTML);
      swapClass(dgDoc, topicClassName, "davidgamegreen");
      fixImagePathsDavidGame(dgDoc);
      // Removed the "_davidgame" suffix!
      out.push({ appName: "David Game College", fileName: buildName("davidGame", ""), content: injectBody(shells.davidGame, serializeBodyInner(dgDoc)), mime: "text/html", audienceTarget });
    }

if (selection.bromley) {
      const bromDoc = parseHTML(englandHTML);
      swapClass(bromDoc, topicClassName, "bromgreen");
      fixImagePathsStripped(bromDoc);
      // Removed the "_bromley" suffix!
      out.push({ appName: "Bromley Permanency", fileName: buildName("bromley", ""), content: injectBody(shells.bromley, serializeBodyInner(bromDoc)), mime: "text/html", audienceTarget });
    }

if (selection.fostering) {
      const fosDoc = parseHTML(niHTML);
      const fosteringClass = HSCT_CLASS_MAP[courseCode] || "hsc-general";
      swapClass(fosDoc, topicClassName, fosteringClass);
      fixImagePathsStripped(fosDoc);
      replaceFosteringButtons(fosDoc);
      const fosteringShell = (shells.fostering || "").split("[INSERT_SECTION_CODE]").join(fosteringClass);
      // Removed the "_fostering" suffix!
      out.push({ appName: "Fostering in a Digital World", fileName: buildName("fostering", ""), content: injectBody(fosteringShell, serializeBodyInner(fosDoc)), mime: "text/html", audienceTarget });
    }
  });

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
    fosteringInADigitalWorld: {
    baseUrl: "https://able3content.blob.core.windows.net/fostering-in-digital-world/HTML%20Files/",
    roles: {
      staffSecondary: "Social Worker",
      parentSecondary: "Non Kinship Foster Carer, Kinship Foster Carer",
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
  fostering: "fosteringInADigitalWorld", 
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

export const COURSE_LIBRARY: Record<string, any> = {
  "ENGHT": { courseGroup: "Online Safety Guidance", courseName: "Hot Topics", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hot_topics.png" },
  "ENGNTK": { courseGroup: "Online Safety Guidance", courseName: "Need to Know", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_need_to_know.png" },
  "ENGPI": { courseGroup: "Online Safety Guidance", courseName: "Personal Information", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_personal_information.png" },
  "ENGHC": { courseGroup: "Online Safety Guidance", courseName: "Harmful Content", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_harmful_content.png" },
  "ENGHW": { courseGroup: "Online Safety Guidance", courseName: "Health & Wellbeing", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_health_wellbeing.png" },
  "ENGG": { courseGroup: "Online Safety Guidance", courseName: "Gaming", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_gaming.png" },
  "ENGB": { courseGroup: "Online Safety Guidance", courseName: "Bullying", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_bullying.png" },
  "ENGS": { courseGroup: "Online Safety Guidance", courseName: "Scams", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_scams.png" },
  "ENGIE": { courseGroup: "Online Safety Guidance", courseName: "Artificial Intelligence", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_artificial_intelligence.png" },
  "ENGIS": { courseGroup: "Online Safety Guidance", courseName: "Image Sharing", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_image_sharing.png" },
  "ENGYC": { courseGroup: "Online Safety Guidance", courseName: "Younger Children", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_younger_children.png" },
  "ENGSM": { courseGroup: "Online Safety Guidance", courseName: "Social Media", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_social_media.png" },
  "ENGTTBP": { courseGroup: "Online Safety Guidance", courseName: "Teacher Targeted Bullying", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_ttb_what_is_teacher_targeted_bullying.png" },
  "ENGHR": { courseGroup: "Online Safety Guidance", courseName: "Healthy Relationships", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_healthy_relationships.png" },
  "ENGCR": { courseGroup: "Online Safety Guidance", courseName: "Cyber Resilience", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_scams.png" },
  "ENGSGL1": { courseGroup: "Professional Development", courseName: "Safeguarding Level 1", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_safeguarding_level_1.png" },
  "ENGSGL3": { courseGroup: "Professional Development", courseName: "Safeguarding Level 3", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_safeguarding_level_3.png" },
  "ENGAR": { courseGroup: "Professional Development", courseName: "Appropriate Use of Social Media", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_appropriate_use.png" },
  "ENGMHA": { courseGroup: "Professional Development", courseName: "Mental Health Awareness", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_mental_health.png" },
  "ENGDIS": { courseGroup: "Professional Development", courseName: "Digital Image Sharing", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_youth_produced_imagery.png" },
  "ENGFGM": { courseGroup: "Professional Development", courseName: "FGM", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_fgm.png" },
  "ENGPF": { courseGroup: "Professional Development", courseName: "Private Fostering Awareness", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_private_fostering.png" },
  "ENGHOR1": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 1", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_one.png" },
  "ENGHOR2": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 2", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_2.png" },
  "ENGHOR3": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 3", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_3.png" },
  "ENGTTB": { courseGroup: "Professional Development", courseName: "Teacher Targeted Bullying (CPD)", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_ttb_teacher_targeted_bullying.png" },
  "ENGCSB": { courseGroup: "Professional Development", courseName: "Cyber Security Basics", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_csb_cyber_security_basics.png" },
  "IOMHT": { courseGroup: "Online Safety Guidance", courseName: "Hot Topics", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hot_topics.png" },
  "IOMNTK": { courseGroup: "Online Safety Guidance", courseName: "Need to Know", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_need_to_know.png" },
  "IOMPI": { courseGroup: "Online Safety Guidance", courseName: "Personal Information", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_personal_information.png" },
  "IOMHC": { courseGroup: "Online Safety Guidance", courseName: "Harmful Content", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_harmful_content.png" },
  "IOMHW": { courseGroup: "Online Safety Guidance", courseName: "Health & Wellbeing", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_health_wellbeing.png" },
  "IOMG": { courseGroup: "Online Safety Guidance", courseName: "Gaming", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_gaming.png" },
  "IOMB": { courseGroup: "Online Safety Guidance", courseName: "Bullying", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_bullying.png" },
  "IOMS": { courseGroup: "Online Safety Guidance", courseName: "Scams", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_scams.png" },
  "IOMIE": { courseGroup: "Online Safety Guidance", courseName: "Artificial Intelligence", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_artificial_intelligence.png" },
  "IOMIS": { courseGroup: "Online Safety Guidance", courseName: "Image Sharing", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_image_sharing.png" },
  "IOMYC": { courseGroup: "Online Safety Guidance", courseName: "Younger Children", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_younger_children.png" },
  "IOMSM": { courseGroup: "Online Safety Guidance", courseName: "Social Media", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_social_media.png" },
  "IOMTTBP": { courseGroup: "Online Safety Guidance", courseName: "Teacher Targeted Bullying", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_ttb_what_is_teacher_targeted_bullying.png" },
  "IOMHR": { courseGroup: "Online Safety Guidance", courseName: "Healthy Relationships", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_healthy_relationships.png" },
  "IOMCR": { courseGroup: "Online Safety Guidance", courseName: "Cyber Resilience", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_scams.png" },
  "IOMSGL1": { courseGroup: "Professional Development", courseName: "Safeguarding Level 1", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_safeguarding_level_1.png" },
  "IOMSGL3": { courseGroup: "Professional Development", courseName: "Safeguarding Level 3", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_safeguarding_level_3.png" },
  "IOMAR": { courseGroup: "Professional Development", courseName: "Appropriate Use of Social Media", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_appropriate_use.png" },
  "IOMMHA": { courseGroup: "Professional Development", courseName: "Mental Health Awareness", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_mental_health.png" },
  "IOMDIS": { courseGroup: "Professional Development", courseName: "Digital Image Sharing", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_youth_produced_imagery.png" },
  "IOMFGM": { courseGroup: "Professional Development", courseName: "FGM", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_fgm.png" },
  "IOMPF": { courseGroup: "Professional Development", courseName: "Private Fostering Awareness", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_private_fostering.png" },
  "IOMHOR1": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 1", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_one.png" },
  "IOMHOR2": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 2", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_2.png" },
  "IOMHOR3": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 3", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_3.png" },
  "IOMTTB": { courseGroup: "Professional Development", courseName: "Teacher Targeted Bullying (CPD)", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_ttb_teacher_targeted_bullying.png" },
  "IOMCSB": { courseGroup: "Professional Development", courseName: "Cyber Security Basics", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_csb_cyber_security_basics.png" },
  "SCOTHT": { courseGroup: "Online Safety Guidance", courseName: "Hot Topics", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hot_topics.png" },
  "SCOTNTK": { courseGroup: "Online Safety Guidance", courseName: "Need to Know", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_need_to_know.png" },
  "SCOTPI": { courseGroup: "Online Safety Guidance", courseName: "Personal Information", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_personal_information.png" },
  "SCOTHC": { courseGroup: "Online Safety Guidance", courseName: "Harmful Content", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_harmful_content.png" },
  "SCOTHW": { courseGroup: "Online Safety Guidance", courseName: "Health & Wellbeing", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_health_wellbeing.png" },
  "SCOTG": { courseGroup: "Online Safety Guidance", courseName: "Gaming", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_gaming.png" },
  "SCOTB": { courseGroup: "Online Safety Guidance", courseName: "Bullying", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_bullying.png" },
  "SCOTS": { courseGroup: "Online Safety Guidance", courseName: "Scams", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_scams.png" },
  "SCOTIE": { courseGroup: "Online Safety Guidance", courseName: "Artificial Intelligence", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_artificial_intelligence.png" },
  "SCOTIS": { courseGroup: "Online Safety Guidance", courseName: "Image Sharing", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_image_sharing.png" },
  "SCOTYC": { courseGroup: "Online Safety Guidance", courseName: "Younger Children", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_younger_children.png" },
  "SCOTSM": { courseGroup: "Online Safety Guidance", courseName: "Social Media", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_social_media.png" },
  "SCOTTTBP": { courseGroup: "Online Safety Guidance", courseName: "Teacher Targeted Bullying", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_ttb_what_is_teacher_targeted_bullying.png" },
  "SCOTHR": { courseGroup: "Online Safety Guidance", courseName: "Healthy Relationships", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_healthy_relationships.png" },
  "SCOTCR": { courseGroup: "Online Safety Guidance", courseName: "Cyber Resilience", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_scams.png" },
  "SCOTSGL1": { courseGroup: "Professional Development", courseName: "Safeguarding Level 1", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_safeguarding_level_1.png" },
  "SCOTSGL3": { courseGroup: "Professional Development", courseName: "Safeguarding Level 3", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_safeguarding_level_3.png" },
  "SCOTAR": { courseGroup: "Professional Development", courseName: "Appropriate Use of Social Media", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_appropriate_use.png" },
  "SCOTMHA": { courseGroup: "Professional Development", courseName: "Mental Health Awareness", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_mental_health.png" },
  "SCOTDIS": { courseGroup: "Professional Development", courseName: "Digital Image Sharing", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_youth_produced_imagery.png" },
  "SCOTFGM": { courseGroup: "Professional Development", courseName: "FGM", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_fgm.png" },
  "SCOTPF": { courseGroup: "Professional Development", courseName: "Private Fostering Awareness", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_private_fostering.png" },
  "SCOTHOR1": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 1", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_one.png" },
  "SCOTHOR2": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 2", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_2.png" },
  "SCOTHOR3": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 3", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_3.png" },
  "SCOTTTB": { courseGroup: "Professional Development", courseName: "Teacher Targeted Bullying (CPD)", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_ttb_teacher_targeted_bullying.png" },
  "SCOTCSB": { courseGroup: "Professional Development", courseName: "Cyber Security Basics", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_csb_cyber_security_basics.png" },
  "WALHT": { courseGroup: "Online Safety Guidance", courseName: "Hot Topics", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hot_topics.png" },
  "WALNTK": { courseGroup: "Online Safety Guidance", courseName: "Need to Know", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_need_to_know.png" },
  "WALPI": { courseGroup: "Online Safety Guidance", courseName: "Personal Information", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_personal_information.png" },
  "WALHC": { courseGroup: "Online Safety Guidance", courseName: "Harmful Content", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_harmful_content.png" },
  "WALHW": { courseGroup: "Online Safety Guidance", courseName: "Health & Wellbeing", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_health_wellbeing.png" },
  "WALG": { courseGroup: "Online Safety Guidance", courseName: "Gaming", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_gaming.png" },
  "WALB": { courseGroup: "Online Safety Guidance", courseName: "Bullying", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_bullying.png" },
  "WALS": { courseGroup: "Online Safety Guidance", courseName: "Scams", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_scams.png" },
  "WALIE": { courseGroup: "Online Safety Guidance", courseName: "Artificial Intelligence", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_artificial_intelligence.png" },
  "WALIS": { courseGroup: "Online Safety Guidance", courseName: "Image Sharing", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_image_sharing.png" },
  "WALYC": { courseGroup: "Online Safety Guidance", courseName: "Younger Children", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_younger_children.png" },
  "WALSM": { courseGroup: "Online Safety Guidance", courseName: "Social Media", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_social_media.png" },
  "WALTTBP": { courseGroup: "Online Safety Guidance", courseName: "Teacher Targeted Bullying", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_ttb_what_is_teacher_targeted_bullying.png" },
  "WALHR": { courseGroup: "Online Safety Guidance", courseName: "Healthy Relationships", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_healthy_relationships.png" },
  "WALCR": { courseGroup: "Online Safety Guidance", courseName: "Cyber Resilience", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_scams.png" },
  "WALSGL1": { courseGroup: "Professional Development", courseName: "Safeguarding Level 1", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_safeguarding_level_1.png" },
  "WALSGL3": { courseGroup: "Professional Development", courseName: "Safeguarding Level 3", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_safeguarding_level_3.png" },
  "WALAR": { courseGroup: "Professional Development", courseName: "Appropriate Use of Social Media", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_appropriate_use.png" },
  "WALMHA": { courseGroup: "Professional Development", courseName: "Mental Health Awareness", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_mental_health.png" },
  "WALDIS": { courseGroup: "Professional Development", courseName: "Digital Image Sharing", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_youth_produced_imagery.png" },
  "WALFGM": { courseGroup: "Professional Development", courseName: "FGM", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_fgm.png" },
  "WALPF": { courseGroup: "Professional Development", courseName: "Private Fostering Awareness", hexColour: "#1A66FF", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_private_fostering.png" },
  "WALHOR1": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 1", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_one.png" },
  "WALHOR2": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 2", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_2.png" },
  "WALHOR3": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 3", hexColour: "#D7375F", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_hor_module_3.png" },
  "WALTTB": { courseGroup: "Professional Development", courseName: "Teacher Targeted Bullying (CPD)", hexColour: "#4F45BA", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_ttb_teacher_targeted_bullying.png" },
  "WALCSB": { courseGroup: "Professional Development", courseName: "Cyber Security Basics", hexColour: "#398440", courseIcon: "https://saferschoolscontent.blob.core.windows.net/assets/icons/ss_csb_cyber_security_basics.png" },
  "DGHT": { courseGroup: "Online Safety Guidance", courseName: "Hot Topics", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_hot_topics.png" },
  "DGNTK": { courseGroup: "Online Safety Guidance", courseName: "Need to Know", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_need_to_know.png" },
  "DGPI": { courseGroup: "Online Safety Guidance", courseName: "Personal Information", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_personal_information.png" },
  "DGHC": { courseGroup: "Online Safety Guidance", courseName: "Harmful Content", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_harmful_content.png" },
  "DGHW": { courseGroup: "Online Safety Guidance", courseName: "Health & Wellbeing", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_health_wellbeing.png" },
  "DGG": { courseGroup: "Online Safety Guidance", courseName: "Gaming", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_games.png" },
  "DGB": { courseGroup: "Online Safety Guidance", courseName: "Bullying", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_bullying.png" },
  "DGS": { courseGroup: "Online Safety Guidance", courseName: "Scams", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_scams.png" },
  "DGIE": { courseGroup: "Online Safety Guidance", courseName: "Artificial Intelligence", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_artificial_intelligence.png" },
  "DGIS": { courseGroup: "Online Safety Guidance", courseName: "Image Sharing", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_image_sharing.png" },
  "DGYC": { courseGroup: "Online Safety Guidance", courseName: "Younger Children", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_younger_children.png" },
  "DGSM": { courseGroup: "Online Safety Guidance", courseName: "Social Media", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_social_media.png" },
  "DGTTBP": { courseGroup: "Online Safety Guidance", courseName: "Teacher Targeted Bullying", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_teacher_targeted_bullying.png" },
  "DGHR": { courseGroup: "Online Safety Guidance", courseName: "Healthy Relationships", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_healthy_relationships.png" },
  "DGCR": { courseGroup: "Online Safety Guidance", courseName: "Cyber Resilience", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_cyber_resilience.png" },
  "DGSGL1": { courseGroup: "Professional Development", courseName: "Safeguarding Level 1", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_safeguarding_level_1.png" },
  "DGSGL3": { courseGroup: "Professional Development", courseName: "Safeguarding Level 3", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_safeguarding_level_3.png" },
  "DGAR": { courseGroup: "Professional Development", courseName: "Appropriate Use of Social Media", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_appropriate_use.png" },
  "DGMHA": { courseGroup: "Professional Development", courseName: "Mental Health Awareness", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_mental_health.png" },
  "DGDIS": { courseGroup: "Professional Development", courseName: "Digital Image Sharing", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_youth_produced_imagery.png" },
  "DGFGM": { courseGroup: "Professional Development", courseName: "FGM", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_fgm.png" },
  "DGPF": { courseGroup: "Professional Development", courseName: "Private Fostering Awareness", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_private_fostering.png" },
  "DGHOR1": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 1", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_hor_module_one.png" },
  "DGHOR2": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 2", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_hor_module_2.png" },
  "DGHOR3": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 3", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_hor_module_3.png" },
  "DGTTB": { courseGroup: "Professional Development", courseName: "Teacher Targeted Bullying (CPD)", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_teacher_targeted_bullying_cpd.png" },
  "DGCSB": { courseGroup: "Professional Development", courseName: "Cyber Security Basics", hexColour: "#16583e", courseIcon: "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/dgc_cyber_security_basics.png" },
  "DEHT": { courseGroup: "Online Safety Guidance", courseName: "Hot Topics", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_hot_topics.png" },
  "DENTK": { courseGroup: "Online Safety Guidance", courseName: "Need to Know", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_need_to_know.png" },
  "DEPI": { courseGroup: "Online Safety Guidance", courseName: "Personal Information", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_personal_information.png" },
  "DEHC": { courseGroup: "Online Safety Guidance", courseName: "Harmful Content", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_harmful_content.png" },
  "DEHW": { courseGroup: "Online Safety Guidance", courseName: "Health & Wellbeing", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_health_wellbeing.png" },
  "DEG": { courseGroup: "Online Safety Guidance", courseName: "Gaming", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_gaming.png" },
  "DEB": { courseGroup: "Online Safety Guidance", courseName: "Bullying", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_bullying.png" },
  "DES": { courseGroup: "Online Safety Guidance", courseName: "Scams", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_scams.png" },
  "DEIE": { courseGroup: "Online Safety Guidance", courseName: "Artificial Intelligence", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_artificial_intelligence.png" },
  "DEIS": { courseGroup: "Online Safety Guidance", courseName: "Image Sharing", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_image_sharing.png" },
  "DEYC": { courseGroup: "Online Safety Guidance", courseName: "Younger Children", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_younger_children.png" },
  "DESM": { courseGroup: "Online Safety Guidance", courseName: "Social Media", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_social_media.png" },
  "DETTBP": { courseGroup: "Online Safety Guidance", courseName: "Teacher Targeted Bullying", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_ttb_what_is_teacher_targeted_bullying.png" },
  "DEHR": { courseGroup: "Online Safety Guidance", courseName: "Healthy Relationships", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_healthy_relationships.png" },
  "DECR": { courseGroup: "Online Safety Guidance", courseName: "Cyber Resilience", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_scams.png" },
  "DESGL1": { courseGroup: "Professional Development", courseName: "Safeguarding Level 1", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_safeguarding_level_1.png" },
  "DESGL3": { courseGroup: "Professional Development", courseName: "Safeguarding Level 3", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_safeguarding_level_3.png" },
  "DEAR": { courseGroup: "Professional Development", courseName: "Appropriate Use of Social Media", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_appropriate_use.png" },
  "DEMHA": { courseGroup: "Professional Development", courseName: "Mental Health Awareness", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_mental_health.png" },
  "DEDIS": { courseGroup: "Professional Development", courseName: "Digital Image Sharing", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_youth_produced_imagery.png" },
  "DEFGM": { courseGroup: "Professional Development", courseName: "FGM", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_fgm.png" },
  "DEPF": { courseGroup: "Professional Development", courseName: "Private Fostering Awareness", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_private_fostering.png" },
  "DEHOR1": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 1", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_hor_module_one.png" },
  "DEHOR2": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 2", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_hor_module_2.png" },
  "DEHOR3": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 3", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_hor_module_3.png" },
  "DETTB": { courseGroup: "Professional Development", courseName: "Teacher Targeted Bullying (CPD)", hexColour: "#053476", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_ttb_teacher_targeted_bullying.png" },
  "DECSB": { courseGroup: "Professional Development", courseName: "Cyber Security Basics", hexColour: "#C04492", courseIcon: "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/ss_csb_cyber_security_basics.png" },
  "GSTHT": { courseGroup: "Online Safety Guidance", courseName: "Hot Topics", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_hot_topics.png" },
  "GSTNTK": { courseGroup: "Online Safety Guidance", courseName: "Need to Know", hexColour: "#1A66FF", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_need_to_know.png" },
  "GSTPI": { courseGroup: "Online Safety Guidance", courseName: "Personal Information", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_personal_information.png" },
  "GSTHC": { courseGroup: "Online Safety Guidance", courseName: "Harmful Content", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_harmful_content.png" },
  "GSTHW": { courseGroup: "Online Safety Guidance", courseName: "Health & Wellbeing", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_health_wellbeing.png" },
  "GSTG": { courseGroup: "Online Safety Guidance", courseName: "Gaming", hexColour: "#1A66FF", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_gaming.png" },
  "GSTB": { courseGroup: "Online Safety Guidance", courseName: "Bullying", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_bullying.png" },
  "GSTS": { courseGroup: "Online Safety Guidance", courseName: "Scams", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_scams.png" },
  "GSTIE": { courseGroup: "Online Safety Guidance", courseName: "Artificial Intelligence", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_artificial_intelligence.png" },
  "GSTIS": { courseGroup: "Online Safety Guidance", courseName: "Image Sharing", hexColour: "#1A66FF", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_image_sharing.png" },
  "GSTYC": { courseGroup: "Online Safety Guidance", courseName: "Younger Children", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_younger_children.png" },
  "GSTSM": { courseGroup: "Online Safety Guidance", courseName: "Social Media", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_social_media.png" },
  "GSTTTBP": { courseGroup: "Online Safety Guidance", courseName: "Teacher Targeted Bullying", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_ttb_what_is_teacher_targeted_bullying.png" },
  "GSTHR": { courseGroup: "Online Safety Guidance", courseName: "Healthy Relationships", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_healthy_relationships.png" },
  "GSTCR": { courseGroup: "Online Safety Guidance", courseName: "Cyber Resilience", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_scams.png" },
  "GSTSGL1": { courseGroup: "Professional Development", courseName: "Safeguarding Level 1", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_safeguarding_level_1.png" },
  "GSTSGL3": { courseGroup: "Professional Development", courseName: "Safeguarding Level 3", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_safeguarding_level_3.png" },
  "GSTAR": { courseGroup: "Professional Development", courseName: "Appropriate Use of Social Media", hexColour: "#1A66FF", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_appropriate_use.png" },
  "GSTMHA": { courseGroup: "Professional Development", courseName: "Mental Health Awareness", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_mental_health.png" },
  "GSTDIS": { courseGroup: "Professional Development", courseName: "Digital Image Sharing", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_youth_produced_imagery.png" },
  "GSTFGM": { courseGroup: "Professional Development", courseName: "FGM", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_fgm.png" },
  "GSTPF": { courseGroup: "Professional Development", courseName: "Private Fostering Awareness", hexColour: "#1A66FF", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_private_fostering.png" },
  "GSTHOR1": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 1", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_hor_module_one.png" },
  "GSTHOR2": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 2", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_hor_module_2.png" },
  "GSTHOR3": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 3", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_hor_module_3.png" },
  "GSTTTB": { courseGroup: "Professional Development", courseName: "Teacher Targeted Bullying (CPD)", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_ttb_teacher_targeted_bullying.png" },
  "GSTCSB": { courseGroup: "Professional Development", courseName: "Cyber Security Basics", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/gst_csb_cyber_security_basics.png" },
  "NBAHT": { courseGroup: "Online Safety Guidance", courseName: "Hot Topics", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_hot_topics.png" },
  "NBANTK": { courseGroup: "Online Safety Guidance", courseName: "Need to Know", hexColour: "#1A66FF", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_need_to_know.png" },
  "NBAPI": { courseGroup: "Online Safety Guidance", courseName: "Personal Information", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_personal_information.png" },
  "NBAHC": { courseGroup: "Online Safety Guidance", courseName: "Harmful Content", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_harmful_content.png" },
  "NBAHW": { courseGroup: "Online Safety Guidance", courseName: "Health & Wellbeing", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_health_wellbeing.png" },
  "NBAG": { courseGroup: "Online Safety Guidance", courseName: "Gaming", hexColour: "#1A66FF", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_gaming.png" },
  "NBAB": { courseGroup: "Online Safety Guidance", courseName: "Bullying", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_bullying.png" },
  "NBAS": { courseGroup: "Online Safety Guidance", courseName: "Scams", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_scams.png" },
  "NBAIE": { courseGroup: "Online Safety Guidance", courseName: "Artificial Intelligence", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_artificial_intelligence.png" },
  "NBAIS": { courseGroup: "Online Safety Guidance", courseName: "Image Sharing", hexColour: "#1A66FF", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_image_sharing.png" },
  "NBAYC": { courseGroup: "Online Safety Guidance", courseName: "Younger Children", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_younger_children.png" },
  "NBASM": { courseGroup: "Online Safety Guidance", courseName: "Social Media", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_social_media.png" },
  "NBATTBP": { courseGroup: "Online Safety Guidance", courseName: "Teacher Targeted Bullying", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_ttb_what_is_teacher_targeted_bullying.png" },
  "NBAHR": { courseGroup: "Online Safety Guidance", courseName: "Healthy Relationships", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_healthy_relationships.png" },
  "NBACR": { courseGroup: "Online Safety Guidance", courseName: "Cyber Resilience", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_scams.png" },
  "NBASGL1": { courseGroup: "Professional Development", courseName: "Safeguarding Level 1", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_safeguarding_level_1.png" },
  "NBASGL3": { courseGroup: "Professional Development", courseName: "Safeguarding Level 3", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_safeguarding_level_3.png" },
  "NBAAR": { courseGroup: "Professional Development", courseName: "Appropriate Use of Social Media", hexColour: "#1A66FF", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_appropriate_use.png" },
  "NBAMHA": { courseGroup: "Professional Development", courseName: "Mental Health Awareness", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_mental_health.png" },
  "NBADIS": { courseGroup: "Professional Development", courseName: "Digital Image Sharing", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_youth_produced_imagery.png" },
  "NBAFGM": { courseGroup: "Professional Development", courseName: "FGM", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_fgm.png" },
  "NBAPF": { courseGroup: "Professional Development", courseName: "Private Fostering Awareness", hexColour: "#1A66FF", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_private_fostering.png" },
  "NBAHOR1": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 1", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_hor_module_one.png" },
  "NBAHOR2": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 2", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_hor_module_2.png" },
  "NBAHOR3": { courseGroup: "Professional Development", courseName: "Healthy Online Relationships Module 3", hexColour: "#D7375F", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_hor_module_3.png" },
  "NBATTB": { courseGroup: "Professional Development", courseName: "Teacher Targeted Bullying (CPD)", hexColour: "#4F45BA", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_ttb_teacher_targeted_bullying.png" },
  "NBACSB": { courseGroup: "Professional Development", courseName: "Cyber Security Basics", hexColour: "#398440", courseIcon: "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/nba_csb_cyber_security_basics.png" },
  "BPNTK": { courseGroup: "Course Content", courseName: "Need to Know", hexColour: "#32845b", courseIcon: "https://ableportaldev.blob.core.windows.net/bromleypermanency/master_icons/course_content_icons/need_to_know_bp_course.png" },
  "BPPI": { courseGroup: "Course Content", courseName: "Personal Information", hexColour: "#32845b", courseIcon: "https://ableportaldev.blob.core.windows.net/bromleypermanency/master_icons/course_content_icons/personal_information_bp_course.png" },
  "BPIS": { courseGroup: "Course Content", courseName: "Image Sharing", hexColour: "#32845b", courseIcon: "https://ableportaldev.blob.core.windows.net/bromleypermanency/master_icons/course_content_icons/image_sharing_bp_course.png" },
  "BPHC": { courseGroup: "Course Content", courseName: "Harmful Content", hexColour: "#32845b", courseIcon: "https://ableportaldev.blob.core.windows.net/bromleypermanency/master_icons/course_content_icons/harmful_content_course.png" },
  "BPHW": { courseGroup: "Course Content", courseName: "Health & Wellbeing", hexColour: "#32845b", courseIcon: "https://ableportaldev.blob.core.windows.net/bromleypermanency/master_icons/course_content_icons/health_wellbeing_bp_course.png" },
  "BPG": { courseGroup: "Course Content", courseName: "Gaming", hexColour: "#32845b", courseIcon: "https://ableportaldev.blob.core.windows.net/bromleypermanency/master_icons/course_content_icons/gaming.png" },
  "BPSC": { courseGroup: "Course Content", courseName: "Scams", hexColour: "#32845b", courseIcon: "https://ableportaldev.blob.core.windows.net/bromleypermanency/master_icons/course_content_icons/scams_bp_course.png" },
  "CHSCTNTK": { courseGroup: "Online Safety Advice", courseName: "Need to Know", hexColour: "#0B6077", courseIcon: "https://able3content.blob.core.windows.net/fostering-in-digital-world/Images/online_safety_icons/hsct_need_to_know.png" },
  "CHSCTSM": { courseGroup: "Online Safety Advice", courseName: "Social Media", hexColour: "#5548C4", courseIcon: "https://able3content.blob.core.windows.net/fostering-in-digital-world/Images/online_safety_icons/hsct_social_media.png" },
  "CHSCSC": { courseGroup: "Online Safety Advice", courseName: "Scams", hexColour: "#337D1C", courseIcon: "https://able3content.blob.core.windows.net/fostering-in-digital-world/Images/online_safety_icons/hsct_scams.png" },
  "CHSCHW": { courseGroup: "Online Safety Advice", courseName: "Health & Wellbeing", hexColour: "#BF5016", courseIcon: "https://able3content.blob.core.windows.net/fostering-in-digital-world/Images/online_safety_icons/hsct_health_and_wellbeing.png" },
  "CHSCIS": { courseGroup: "Online Safety Advice", courseName: "Image Sharing", hexColour: "#0B6077", courseIcon: "https://able3content.blob.core.windows.net/fostering-in-digital-world/Images/online_safety_icons/hsct_image_sharing.png" },
  "CHSCTGA": { courseGroup: "Online Safety Advice", courseName: "Gaming", hexColour: "#5548C4", courseIcon: "https://able3content.blob.core.windows.net/fostering-in-digital-world/Images/online_safety_icons/hsct_gaming.png" }
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
        headerImage: "",
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

// --- THE TRANSLATOR BRAIN ---
const getAppSpecificCourseCode = (baseCode: string, internalAppKey: AppKey): string => {
  let suffix = baseCode;
  const prefixes = ["ENG", "SCOT", "WAL", "IOM", "GST", "NBA", "DG", "DE", "BP", "CHSCT", "CHSC"];
  
  for (const p of prefixes) {
    if (baseCode.startsWith(p)) {
      suffix = baseCode.substring(p.length);
      break;
    }
  }

  const prefixMap: Record<AppKey, string> = {
    ssZm: "ENG", ssEng: "ENG", ssScot: "SCOT", ssWales: "WAL", ssIom: "IOM",
    gst: "GST", nba: "NBA", ssni: "DE", davidGame: "DG", bromley: "BP", fostering: "CHSCT", 
  };

  const newPrefix = prefixMap[internalAppKey] || "ENG";
  
  if (internalAppKey === "fostering") {
    if (suffix === "HW") return "CHSCHW";
    if (suffix === "IS") return "CHSCIS";
    if (suffix === "SC") return "CHSCSC";
    if (suffix === "G") return "CHSCTGA"; 
    if (suffix === "CSE") return "CHSCTCSE";
  }
  if (internalAppKey === "bromley" && suffix === "S") return "BPSC";

  return newPrefix + suffix;
};

// --- SMART ASSET GENERATOR ---
const getGroupIcon = (courseGroup: string, internalAppKey: AppKey): string => {
    const group = (courseGroup || "").toLowerCase();
    
    if (internalAppKey === "bromley") return "https://ableportaldev.blob.core.windows.net/bromleypermanency/master_icons/coursegroupicon.png";
    if (internalAppKey === "fostering") {
        if (group.includes("child")) return "https://able3content.blob.core.windows.net/fostering-in-digital-world/Images/online_safety_icons/hsct_child_exploitation.png";
        return "https://able3content.blob.core.windows.net/fostering-in-digital-world/Images/online_safety_icons/hsct_online_safety_advice.png";
    }
    
    let folder = "https://saferschoolscontent.blob.core.windows.net/assets/icons/";
    let filePrefix = "ss_";
    
    if (internalAppKey === "ssni") folder = "https://saferschoolscontent.blob.core.windows.net/northernireland/assets/tile_icons/";
    else if (internalAppKey === "gst") { folder = "https://able3content.blob.core.windows.net/great-schools-trust/assets/icons/"; filePrefix = "gst_"; }
    else if (internalAppKey === "nba") { folder = "https://able3content.blob.core.windows.net/north-birmingham-academy/assets/icons/"; filePrefix = "nba_"; }
    else if (internalAppKey === "davidGame") { folder = "https://able3content.blob.core.windows.net/david-game-college/dgc_assets/online_safety_icons/"; filePrefix = "dgc_"; }
    
    if (group.includes("online safety")) return folder + filePrefix + "online_safety.png";
    if (group.includes("professional")) return folder + filePrefix + "professional_dev.png";
    if (group.includes("teaching")) return "https://saferschoolscontent.blob.core.windows.net/assets/icons/teaching_resources.png";
    if (group.includes("friend") || group.includes("password") || group.includes("stories") || group.includes("jack")) return folder + filePrefix + "stories.png";
    
    return "";
};

// --- THE FIXED CSV GENERATOR ---
export const generateCSV = (files: GeneratedFile[], meta: Metadata, selectedRoles: Record<string, boolean> = {}): string => {
  const allRows: string[] = [];

  const columns = [
    "Role ", "Course Group", "Course Group Icon", "Course Name", "Course Icon", 
    "Course Code", "Module Code", "Module Name", "Page Title", "PageIcon", 
    "HTMLURL", "HeaderImageURL", "Video ID", "Colour", "Background Image", 
    "Course Group Background Image", "Course Tile Background Image", 
    "Is Story", "Is Full Screen", "Order", "Progress Style", "Navigation Style"
  ];

  const validFiles = files.filter(file => {
      const internalAppKey = APP_NAME_TO_KEY[file.appName];
      if (!internalAppKey) return false;
      const appSpecificCode = getAppSpecificCourseCode(meta.courseCode, internalAppKey);
      return !!COURSE_LIBRARY[appSpecificCode];
  });

  const filesByApp: Record<string, GeneratedFile[]> = {};
  validFiles.forEach((file) => {
    if (!filesByApp[file.appName]) filesByApp[file.appName] = [];
    filesByApp[file.appName].push(file);
  });

  Object.keys(filesByApp).forEach(appName => {
    const appFiles = filesByApp[appName];
    
    allRows.push(`"--- ${appName.toUpperCase()} ---"${",".repeat(columns.length - 1)}`);
    allRows.push(columns.join(","));

    appFiles.forEach(file => {
        const internalAppKey = APP_NAME_TO_KEY[file.appName];
        if (!internalAppKey) return;
        
        const configKey = APP_KEY_TO_CONFIG[internalAppKey];
        const config = APP_CONFIGS[configKey];
        if (!config) return;

        const appSpecificCode = getAppSpecificCourseCode(meta.courseCode, internalAppKey);
        const courseData = COURSE_LIBRARY[appSpecificCode];

        let finalCourseIcon = courseData.courseIcon || "";
        if (internalAppKey === "ssni" && finalCourseIcon) {
            finalCourseIcon = finalCourseIcon.replace("/assets/icons/", "/northernireland/assets/tile_icons/");
        }

        const generatedGroupIcon = getGroupIcon(courseData.courseGroup, internalAppKey);
        const availableRolesInApp = config.roles || {};
        
        Object.keys(selectedRoles).forEach((roleKey) => {
          if (selectedRoles[roleKey] && availableRolesInApp[roleKey as RoleKey]) {
            
            // MAGIC: This ensures the CSV row strictly maps to the right HTML file!
            if (ROLE_TO_AUDIENCE[roleKey as RoleKey] !== file.audienceTarget) return;

            const exactRoleName = availableRolesInApp[roleKey as RoleKey];
            
            const rowData = columns.map(col => {
              const cleanCol = col.trim().toLowerCase();
              
              if (cleanCol === "role" || cleanCol === "role ") return exactRoleName;
              if (cleanCol === "htmlurl" || cleanCol === "html url") return `${config.baseUrl}${file.fileName}`;
              if (cleanCol === "page title") return meta.pageTitle;
              
              if (cleanCol === "headerimageurl" || cleanCol === "header image url") return "";
              if (cleanCol === "pageicon" || cleanCol === "page icon") return "";
              
              if (cleanCol === "course code") return appSpecificCode; 
              if (cleanCol === "course group") return courseData.courseGroup;
              if (cleanCol === "course group icon") return generatedGroupIcon;
              if (cleanCol === "course name") return courseData.courseName;
              if (cleanCol === "colour") return courseData.hexColour;
              if (cleanCol === "course icon") return finalCourseIcon;
              
              if (cleanCol === "module code") return "L1";
              if (cleanCol === "module name") return "Level 1";
              if (cleanCol === "is story") return "False";
              if (cleanCol === "is full screen") return "False";
              if (cleanCol === "order") return "1";
              if (cleanCol === "navigation style") return "Free";
              
              return ""; 
            });

            allRows.push(rowData.map(v => {
                const s = String(v || "");
                return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            }).join(","));
          }
        });
    });
    
    allRows.push(",".repeat(columns.length - 1));
  });

  return allRows.join("\n");
};
