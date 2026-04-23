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
<title>HSCT - Fostering
