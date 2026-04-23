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
            <img align="left" src="link_chain_grey.png" width="5px">
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

const serializeBodyInner = (doc:
