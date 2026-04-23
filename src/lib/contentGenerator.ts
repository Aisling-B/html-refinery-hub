export interface Metadata {
  baseFilename: string;
  courseName: string;
  courseCode: string;
  pageTitle: string;
  topicClassName: string;
  fosteringSectionCode: string;
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

const PLACEHOLDER = "[INSERT_REGIONAL_SIGNPOSTING_HERE]";
const BODY_INJECT = "[INJECT_BODY_HERE]";

export const DEFAULT_SHELLS: AppShells = {
  davidGame: `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>David Game College</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body class="davidgamegreen">\n[INJECT_BODY_HERE]\n</body>\n</html>`,
  bromley: `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>Bromley Permanency</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body class="bromgreen">\n[INJECT_BODY_HERE]\n</body>\n</html>`,
  fostering: `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>Fostering in a Digital World</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body class="hsc-[INSERT_SECTION_CODE]">\n[INJECT_BODY_HERE]\n</body>\n</html>`,
};

const injectRegional = (html: string, snippet: string): string => {
  if (!html.includes(PLACEHOLDER)) return html;
  return html.split(PLACEHOLDER).join(snippet ?? "");
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
  // Use exact-match attribute selector so values with spaces (e.g. "hot topics") work.
  // Escape any double quotes in the old class string for the selector.
  const safe = oldClass.replace(/"/g, '\\"');
  const els = root.querySelectorAll(`[class="${safe}"]`);
  els.forEach((el) => {
    el.setAttribute("class", newClass);
  });
};

const fixImagePaths = (root: Document | HTMLElement) => {
  const imgs = root.querySelectorAll("img");
  imgs.forEach((img) => {
    const src = img.getAttribute("src");
    if (src && src.includes("../images/")) {
      img.setAttribute("src", src.replace(/\.\.\/images\//g, "images/"));
    }
  });
};

const serializeBodyInner = (doc: Document): string => {
  return doc.body ? doc.body.innerHTML : "";
};

const serializeFullDoc = (doc: Document): string => {
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
};

// Replace only <a> tags that look like buttons:
//  - have a class containing "btn" or "button", OR
//  - directly wrap a <button> element
const replaceFosteringButtons = (root: Document) => {
  const candidates = Array.from(root.querySelectorAll("a"));
  candidates.forEach((a) => {
    const cls = (a.getAttribute("class") || "").toLowerCase();
    const looksLikeButtonClass = /\bbtn\b|\bbutton\b/.test(cls);
    const wrapsButton = !!a.querySelector("button");
    if (!looksLikeButtonClass && !wrapsButton) return;

    const href = a.getAttribute("href") || "#";
    const wrapper = root.createElement("div");
    wrapper.innerHTML = `<a class="roundcorners" href="${href}" target="_blank"><div><img align="left" src="link_chain_grey.png"><p class="btn-text">Report Remove</p></div></a>`;
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
  shells: AppShells = DEFAULT_SHELLS
): GeneratedFile[] => {
  const { baseFilename, topicClassName, fosteringSectionCode } = meta;

  // Pre-build region-specific source HTML
  const englandHTML = injectRegional(baseHTML, snippets.england);
  const niHTML = injectRegional(baseHTML, snippets.northernIreland);
  const walesHTML = injectRegional(baseHTML, snippets.wales);
  const scotlandHTML = injectRegional(baseHTML, snippets.scotland);
  const iomHTML = injectRegional(baseHTML, snippets.isleOfMan);

  const ssZm: GeneratedFile = {
    appName: "Safer Schools ZM",
    fileName: `${baseFilename}_all.html`,
    content: englandHTML,
    mime: "text/html",
  };

  const ssEng: GeneratedFile = {
    appName: "Safer Schools England",
    fileName: `${baseFilename}_eng.html`,
    content: englandHTML,
    mime: "text/html",
  };

  const ssScot: GeneratedFile = {
    appName: "Safer Schools Scotland",
    fileName: `${baseFilename}_scot.html`,
    content: scotlandHTML,
    mime: "text/html",
  };

  const ssWales: GeneratedFile = {
    appName: "Safer Schools Wales",
    fileName: `${baseFilename}_wales.html`,
    content: walesHTML,
    mime: "text/html",
  };

  const ssIom: GeneratedFile = {
    appName: "Safer Schools Isle of Man",
    fileName: `${baseFilename}_iom.html`,
    content: iomHTML,
    mime: "text/html",
  };

  const gstNba: GeneratedFile = {
    appName: "Great Schools Trust & NBA",
    fileName: `${baseFilename}_GST_NBA.html`,
    content: englandHTML,
    mime: "text/html",
  };

  // Safer Schools NI - full HTML, swap class to deniblue
  const ssniDoc = parseHTML(niHTML);
  swapClass(ssniDoc, topicClassName, "deniblue");
  const ssni: GeneratedFile = {
    appName: "Safer Schools NI",
    fileName: `${baseFilename}_deni.html`,
    content: serializeFullDoc(ssniDoc),
    mime: "text/html",
  };

  // David Game College - body innerHTML wrapped in shell
  const dgDoc = parseHTML(englandHTML);
  swapClass(dgDoc, topicClassName, "davidgamegreen");
  fixImagePaths(dgDoc);
  const davidGame: GeneratedFile = {
    appName: "David Game College",
    fileName: `${baseFilename}_davidgame.html`,
    content: injectBody(shells.davidGame, serializeBodyInner(dgDoc)),
    mime: "text/html",
  };

  // Bromley Permanency - body innerHTML wrapped in shell
  const bromDoc = parseHTML(englandHTML);
  swapClass(bromDoc, topicClassName, "bromgreen");
  fixImagePaths(bromDoc);
  const bromley: GeneratedFile = {
    appName: "Bromley Permanency",
    fileName: `${baseFilename}_bromley.html`,
    content: injectBody(shells.bromley, serializeBodyInner(bromDoc)),
    mime: "text/html",
  };

  // Fostering in a Digital World - body innerHTML wrapped in shell, dynamic hsc-[code]
  const fosDoc = parseHTML(niHTML);
  const fosteringClass = `hsc-${fosteringSectionCode}`;
  swapClass(fosDoc, topicClassName, fosteringClass);
  fixImagePaths(fosDoc);
  replaceFosteringButtons(fosDoc);
  // Allow the shell to also reference [INSERT_SECTION_CODE] so the body class is dynamic
  const fosteringShell = (shells.fostering || "").split("[INSERT_SECTION_CODE]").join(fosteringSectionCode);
  const fostering: GeneratedFile = {
    appName: "Fostering in a Digital World",
    fileName: `${baseFilename}_fostering.html`,
    content: injectBody(fosteringShell, serializeBodyInner(fosDoc)),
    mime: "text/html",
  };

  return [ssZm, ssEng, ssScot, ssWales, ssIom, gstNba, ssni, davidGame, bromley, fostering];
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
