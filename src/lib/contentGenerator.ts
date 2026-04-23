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
<body class="[INSERT_SECTION_CODE]">
[INJECT_BODY_HERE]
</body>
</html>`,
};

const injectRegional = (html: string, snippet: string): string => {
  // If there's no snippet provided, or the placeholder isn't in the HTML, do nothing
  if (!snippet || !snippet.trim() || !html.includes(PLACEHOLDER)) {
    return html;
  }
  
  // Safely inject the entire HTML block wherever the placeholder sits
  return html.split(PLACEHOLDER).join(snippet);
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

  const englandHTML = injectRegional(baseHTML, snippets.england);
  const niHTML = injectRegional(baseHTML, snippets.northernIreland);
  const walesHTML = injectRegional(baseHTML, snippets.wales);
  const scotlandHTML = injectRegional(baseHTML, snippets.scotland);
  const iomHTML = injectRegional(baseHTML, snippets.isleOfMan);

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

export const generateCSV = (files: GeneratedFile[], meta: Metadata): string => {
  const header = ["App Name", "Course Name", "Course Code", "Page Title", "Generated File Name", "Mock HTML URL"];
  const escape = (v: string) => {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const rows = files.map((f) =>
    [
      f.appName,
      meta.courseName,
      meta.courseCode,
      meta.pageTitle,
      f.fileName,
      `https://mock-azure-url.com/${f.fileName}`,
    ]
      .map(escape)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
};
