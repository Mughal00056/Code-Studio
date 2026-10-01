export type SupportedLanguage =
  | 'kotlin'
  | 'java'
  | 'xml'
  | 'json'
  | 'gradle'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'python'
  | 'cpp'
  | 'markdown'
  | 'yaml'
  | 'bash'
  | 'properties';

export type ProjectTemplateId =
  | 'empty_activity'
  | 'basic_activity'
  | 'bottom_nav'
  | 'login_screen'
  | 'recyclerview'
  | 'compose_activity'
  | 'react_webview';

export interface FileNode {
  id: string;
  name: string;
  path: string; // relative to project root, e.g. "app/src/main/java/com/example/myapp/MainActivity.kt"
  type: 'file' | 'folder';
  content?: string;
  language?: SupportedLanguage;
  lastModified: number;
}

export interface GitCommit {
  id: string;
  hash: string;
  message: string;
  author: string;
  timestamp: number;
  branch: string;
  changedFiles: string[];
}

export interface ApkArtifact {
  id: string;
  fileName: string;
  projectId: string;
  projectName: string;
  packageName: string;
  variant: 'debug' | 'release';
  format: 'apk' | 'aab';
  versionName: string;
  versionCode: number;
  minSdk: string;
  targetSdk: string;
  sizeBytes: number;
  createdAt: number;
  outputPath: string;
  permissions: string[];
  activities: string[];
  services: string[];
  installedOnDeviceIds: string[];
}

export interface Project {
  id: string;
  name: string;
  packageName: string;
  language: 'Kotlin' | 'Java' | 'React / TypeScript';
  template: ProjectTemplateId;
  minSdk: string;
  buildSystem: 'Gradle (Kotlin DSL)' | 'Gradle (Groovy)' | 'Vite + Capacitor';
  storagePath: string; // e.g. /storage/emulated/0/CodeStudio/Projects/MyApp
  createdAt: number;
  updatedAt: number;
  files: FileNode[];
  git: {
    branch: string;
    branches: string[];
    remoteUrl: string;
    commits: GitCommit[];
    initialSnapshot: Record<string, string>; // path -> content at last commit
  };
}

export interface OpenTab {
  filePath: string;
  projectId: string;
  cursorLine: number;
  cursorCol: number;
  xmlViewMode?: 'code' | 'design' | 'split';
  undoStack: string[];
  redoStack: string[];
}

export interface LogcatEntry {
  id: string;
  timestamp: string;
  pid: number;
  level: 'V' | 'D' | 'I' | 'W' | 'E';
  tag: string;
  message: string;
  packageName: string;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'local' | 'usb' | 'wireless';
  androidVersion: string;
  apiLevel: number;
  status: 'connected' | 'disconnected' | 'pairing';
  ipAddress?: string;
  batteryLevel: number;
  abi: string;
  installedPackages: string[];
}

export type IdeTheme = 'dark' | 'light' | 'amoled' | 'dracula' | 'monokai' | 'solarized';

export interface IdeSettings {
  // Editor
  fontSize: number;
  theme: IdeTheme;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  syntaxHighlighting: boolean;
  // Build
  gradleVersion: string;
  jdkVersion: string;
  androidSdkVersion: string;
  buildCache: boolean;
  offlineMode: boolean;
  // Terminal
  shell: string;
  terminalFontSize: number;
  // General
  uiLanguage: 'English' | 'Hinglish (PRD)';
  notifications: boolean;
  storageLocation: string;
}

export interface BuildStepStatus {
  id: string;
  label: string;
  taskName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  durationMs?: number;
}

export type ActiveScreen =
  | 'home'
  | 'workspace'
  | 'build'
  | 'git'
  | 'devices'
  | 'settings';

export type BottomPanelTab = 'terminal' | 'build_output' | 'logcat';
