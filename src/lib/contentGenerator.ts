export interface Metadata {
  courseName: string;
  courseCode: string;
  pageTitle: string;
  topicClassName: string;
  fosteringSectionCode: string;
}

export interface GeneratedFile {
  appName: string;
  fileName: string;
  content: string;
  mime: string;
}

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

export const generateFiles = (baseHTML: string, meta: Metadata): GeneratedFile[] => {
  const { courseCode, topicClassName, fosteringSectionCode } = meta;

  // 1. Safer Schools ZM (Base) - exact duplicate
  const ssZm: GeneratedFile = {
    appName: "Safer Schools ZM (Base)",
    fileName: `${courseCode}_ZM.html`,
    content: baseHTML,
    mime: "text/html",
  };

  // 2. Great Schools Trust & North Birmingham Academy - exact duplicate
  const gstNba: GeneratedFile = {
    appName: "Great Schools Trust & NBA",
    fileName: `${courseCode}_GST_NBA.html`,
    content: baseHTML,
    mime: "text/html",
  };

  // 3. Safer Schools NI - full HTML, swap class to deniblue
  const ssniDoc = parseHTML(baseHTML);
  swapClass(ssniDoc, topicClassName, "deniblue");
  const ssni: GeneratedFile = {
    appName: "Safer Schools NI",
    fileName: `${courseCode}_SSNI.html`,
    content: serializeFullDoc(ssniDoc),
    mime: "text/html",
  };

  // 4. David Game College - body innerHTML, class davidgamegreen, fix img paths
  const dgDoc = parseHTML(baseHTML);
  swapClass(dgDoc, topicClassName, "davidgamegreen");
  fixImagePaths(dgDoc);
  const davidGame: GeneratedFile = {
    appName: "David Game College",
    fileName: `${courseCode}_DavidGame.html`,
    content: serializeBodyInner(dgDoc),
    mime: "text/html",
  };

  // 5. Bromley Permanency - body innerHTML, class bromgreen, fix img paths
  const bromDoc = parseHTML(baseHTML);
  swapClass(bromDoc, topicClassName, "bromgreen");
  fixImagePaths(bromDoc);
  const bromley: GeneratedFile = {
    appName: "Bromley Permanency",
    fileName: `${courseCode}_Bromley.html`,
    content: serializeBodyInner(bromDoc),
    mime: "text/html",
  };

  // 6. Fostering in a Digital World - body innerHTML, class hsc-[code], fix imgs, replace <a> buttons
  const fosDoc = parseHTML(baseHTML);
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
    fileName: `${courseCode}_Fostering.html`,
    content: serializeBodyInner(fosDoc),
    mime: "text/html",
  };

  return [ssZm, gstNba, ssni, davidGame, bromley, fostering];
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
