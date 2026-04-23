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

export interface GeneratedFile {
  appName: string;
  fileName: string;
  content: string;
  mime: string;
}

const PLACEHOLDER = "[INSERT_REGIONAL_SIGNPOSTING_HERE]";

const injectRegional = (html: string, snippet: string): string => {
  if (!html.includes(PLACEHOLDER)) return html;
  // Replace all occurrences without regex (literal string)
  return html.split(PLACEHOLDER).join(snippet ?? "");
};

const parseHTML = (html: string): Document => {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
};

const swapClass = (doc: Document | HTMLElement, oldClass: string, newClass: string) => {
  const root = doc instanceof Document ? doc : doc;
  const escaped = CSS.escape(oldClass);
  const els = root.querySelectorAll(`.${escaped}`);
  els.forEach((el) => {
    el.classList.remove(oldClass);
    el.classList.add(newClass);
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

export const generateFiles = (
  baseHTML: string,
  meta: Metadata,
  snippets: RegionalSnippets
): GeneratedFile[] => {
  const { baseFilename, topicClassName, fosteringSectionCode } = meta;

  // Pre-build region-specific source HTML
  const englandHTML = injectRegional(baseHTML, snippets.england);
  const niHTML = injectRegional(baseHTML, snippets.northernIreland);
  const walesHTML = injectRegional(baseHTML, snippets.wales);
  const scotlandHTML = injectRegional(baseHTML, snippets.scotland);
  const iomHTML = injectRegional(baseHTML, snippets.isleOfMan);

  // 1. Safer Schools ZM (England snippet) - full HTML duplicate
  const ssZm: GeneratedFile = {
    appName: "Safer Schools ZM",
    fileName: `${baseFilename}_all.html`,
    content: englandHTML,
    mime: "text/html",
  };

  // 2. Safer Schools England - full HTML
  const ssEng: GeneratedFile = {
    appName: "Safer Schools England",
    fileName: `${baseFilename}_eng.html`,
    content: englandHTML,
    mime: "text/html",
  };

  // 3. Safer Schools Scotland - full HTML
  const ssScot: GeneratedFile = {
    appName: "Safer Schools Scotland",
    fileName: `${baseFilename}_scot.html`,
    content: scotlandHTML,
    mime: "text/html",
  };

  // 4. Safer Schools Wales - full HTML
  const ssWales: GeneratedFile = {
    appName: "Safer Schools Wales",
    fileName: `${baseFilename}_wales.html`,
    content: walesHTML,
    mime: "text/html",
  };

  // 5. Safer Schools Isle of Man - full HTML
  const ssIom: GeneratedFile = {
    appName: "Safer Schools Isle of Man",
    fileName: `${baseFilename}_iom.html`,
    content: iomHTML,
    mime: "text/html",
  };

  // 6. Great Schools Trust & NBA (England snippet) - full HTML
  const gstNba: GeneratedFile = {
    appName: "Great Schools Trust & NBA",
    fileName: `${baseFilename}_GST_NBA.html`,
    content: englandHTML,
    mime: "text/html",
  };

  // 7. Safer Schools NI - full HTML, swap class to deniblue
  const ssniDoc = parseHTML(niHTML);
  swapClass(ssniDoc, topicClassName, "deniblue");
  const ssni: GeneratedFile = {
    appName: "Safer Schools NI",
    fileName: `${baseFilename}_deni.html`,
    content: serializeFullDoc(ssniDoc),
    mime: "text/html",
  };

  // 8. David Game College (England snippet) - body innerHTML, davidgamegreen
  const dgDoc = parseHTML(englandHTML);
  swapClass(dgDoc, topicClassName, "davidgamegreen");
  fixImagePaths(dgDoc);
  const davidGame: GeneratedFile = {
    appName: "David Game College",
    fileName: `${baseFilename}_davidgame.html`,
    content: serializeBodyInner(dgDoc),
    mime: "text/html",
  };

  // 9. Bromley Permanency (England snippet) - body innerHTML, bromgreen
  const bromDoc = parseHTML(englandHTML);
  swapClass(bromDoc, topicClassName, "bromgreen");
  fixImagePaths(bromDoc);
  const bromley: GeneratedFile = {
    appName: "Bromley Permanency",
    fileName: `${baseFilename}_bromley.html`,
    content: serializeBodyInner(bromDoc),
    mime: "text/html",
  };

  // 10. Fostering in a Digital World (NI snippet) - body innerHTML, hsc-[code]
  const fosDoc = parseHTML(niHTML);
  swapClass(fosDoc, topicClassName, `hsc-${fosteringSectionCode}`);
  fixImagePaths(fosDoc);
  const anchors = Array.from(fosDoc.querySelectorAll("a"));
  anchors.forEach((a) => {
    const href = a.getAttribute("href") || "#";
    const wrapper = fosDoc.createElement("div");
    wrapper.innerHTML = `<a class="roundcorners" href="${href}" target="_blank"><div><img align="left" src="link_chain_grey.png"><p class="btn-text">Report Remove</p></div></a>`;
    const newNode = wrapper.firstElementChild;
    if (newNode && a.parentNode) {
      a.parentNode.replaceChild(newNode, a);
    }
  });
  const fostering: GeneratedFile = {
    appName: "Fostering in a Digital World",
    fileName: `${baseFilename}_fostering.html`,
    content: serializeBodyInner(fosDoc),
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
