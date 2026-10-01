import { create } from 'zustand';
import {
  ActiveScreen,
  ApkArtifact,
  BottomPanelTab,
  BuildStepStatus,
  ConnectedDevice,
  FileNode,
  IdeSettings,
  LogcatEntry,
  OpenTab,
  Project,
  ProjectTemplateId,
} from '../types/ide';
import { createInitialProjects, detectLanguage, generateProjectFiles } from '../services/templates';

const STORAGE_KEY = 'codestudio_mobile_state_v1';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'success' | 'error' | 'info';
  text: string;
  timestamp: number;
}

interface IdeState {
  // Navigation & UI state
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  bottomPanelOpen: boolean;
  setBottomPanelOpen: (open: boolean) => void;
  bottomPanelTab: BottomPanelTab;
  setBottomPanelTab: (tab: BottomPanelTab) => void;
  explorerOpenMobile: boolean;
  setExplorerOpenMobile: (open: boolean) => void;
  devicePreviewOpen: boolean;
  setDevicePreviewOpen: (open: boolean) => void;

  // Modals
  newProjectModalOpen: boolean;
  setNewProjectModalOpen: (open: boolean) => void;
  gitCloneModalOpen: boolean;
  setGitCloneModalOpen: (open: boolean) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  aboutModalOpen: boolean;
  setAboutModalOpen: (open: boolean) => void;

  // Projects
  projects: Project[];
  activeProjectId: string;
  selectProject: (projectId: string) => void;
  createProject: (params: {
    name: string;
    packageName: string;
    language: 'Kotlin' | 'Java' | 'React / TypeScript';
    template: ProjectTemplateId;
    minSdk: string;
    buildSystem: 'Gradle (Kotlin DSL)' | 'Gradle (Groovy)' | 'Vite + Capacitor';
  }) => Project;
  importProjectFiles: (name: string, packageName: string, files: FileNode[]) => void;
  deleteProject: (projectId: string) => void;

  // File Operations
  openTabs: OpenTab[];
  activeFilePath: string | null;
  openFile: (filePath: string, line?: number) => void;
  closeTab: (filePath: string) => void;
  updateFileContent: (filePath: string, newContent: string) => void;
  undoEdit: (filePath: string) => void;
  redoEdit: (filePath: string) => void;
  setXmlViewMode: (filePath: string, mode: 'code' | 'design' | 'split') => void;
  createFileOrFolder: (parentPath: string, name: string, type: 'file' | 'folder', initialContent?: string) => void;
  renameFileOrFolder: (oldPath: string, newName: string) => void;
  deleteFileOrFolder: (targetPath: string) => void;
  duplicateFile: (targetPath: string) => void;

  // Terminal
  terminalCwd: string;
  terminalLines: TerminalLine[];
  executeTerminalCommand: (rawCmd: string) => void;
  clearTerminal: () => void;

  // Build & APK System
  buildVariant: 'debug' | 'release';
  setBuildVariant: (v: 'debug' | 'release') => void;
  cleanBeforeBuild: boolean;
  setCleanBeforeBuild: (clean: boolean) => void;
  isBuilding: boolean;
  buildSteps: BuildStepStatus[];
  buildLogs: string[];
  apkArtifacts: ApkArtifact[];
  triggerBuild: (format: 'apk' | 'aab' | 'clean' | 'rebuild') => void;
  installApkOnDevice: (apkId: string, deviceId?: string) => void;
  deleteApkArtifact: (apkId: string) => void;

  // Logcat
  logcatEntries: LogcatEntry[];
  logcatPaused: boolean;
  setLogcatPaused: (paused: boolean) => void;
  appendLogcat: (level: LogcatEntry['level'], tag: string, message: string) => void;
  clearLogcat: () => void;

  // Devices
  devices: ConnectedDevice[];
  pairWirelessDevice: (ipPort: string, pairCode: string) => void;
  toggleDeviceConnection: (deviceId: string) => void;

  // Git Operations
  commitChanges: (message: string, pushAfter?: boolean) => void;
  createBranch: (branchName: string) => void;
  switchBranch: (branchName: string) => void;
  cloneRepository: (repoUrl: string, branch: string) => void;

  // Settings
  settings: IdeSettings;
  updateSettings: (partial: Partial<IdeSettings>) => void;
}

function formatTimeNow(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

const DEFAULT_SETTINGS: IdeSettings = {
  fontSize: 13,
  theme: 'dark',
  tabSize: 4,
  wordWrap: false,
  lineNumbers: true,
  autoSave: true,
  syntaxHighlighting: true,
  gradleVersion: '8.7',
  jdkVersion: 'OpenJDK 17.0.11 (Embedded ARM64)',
  androidSdkVersion: 'Android 14.0 (API 34)',
  buildCache: true,
  offlineMode: false,
  shell: '/bin/sh (CodeStudio Mobile Sandbox)',
  terminalFontSize: 12,
  uiLanguage: 'English',
  notifications: true,
  storageLocation: '/storage/emulated/0/CodeStudio',
};

const INITIAL_BUILD_STEPS: BuildStepStatus[] = [
  { id: 'step-kotlin', label: 'Kotlin / Java compilation', taskName: ':app:compileDebugKotlin', status: 'completed', durationMs: 420 },
  { id: 'step-res', label: 'Resource compilation (AAPT2)', taskName: ':app:mergeDebugResources', status: 'completed', durationMs: 310 },
  { id: 'step-manifest', label: 'Manifest processing', taskName: ':app:processDebugMainManifest', status: 'completed', durationMs: 140 },
  { id: 'step-dex', label: 'DEX bytecode generation (D8)', taskName: ':app:dexBuilderDebug', status: 'completed', durationMs: 510 },
  { id: 'step-pkg', label: 'APK packaging & v2 signing', taskName: ':app:packageDebug', status: 'completed', durationMs: 280 },
];

function loadPersistedState(): {
  projects: Project[];
  settings: IdeSettings;
  apkArtifacts: ApkArtifact[];
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.projects && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        return {
          projects: parsed.projects,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          apkArtifacts: parsed.apkArtifacts || [],
        };
      }
    }
  } catch {
    // ignore storage errors
  }

  const initialProjects = createInitialProjects();
  const initialApks: ApkArtifact[] = [
    {
      id: 'apk-initial-1',
      fileName: 'MyApp-debug.apk',
      projectId: 'proj-myapp',
      projectName: 'MyApp',
      packageName: 'com.example.myapp',
      variant: 'debug',
      format: 'apk',
      versionName: '1.0.0',
      versionCode: 1,
      minSdk: 'API 26 (Android 8.0)',
      targetSdk: 'API 34 (Android 14.0)',
      sizeBytes: 2485120, // ~2.4 MB
      createdAt: Date.now() - 1000 * 60 * 12,
      outputPath: 'app/build/outputs/apk/debug/app-debug.apk',
      permissions: [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.VIBRATE',
      ],
      activities: ['com.example.myapp.MainActivity'],
      services: ['androidx.appcompat.app.AppLocalesMetadataHolderService'],
      installedOnDeviceIds: ['dev-local-phone'],
    },
  ];

  return {
    projects: initialProjects,
    settings: DEFAULT_SETTINGS,
    apkArtifacts: initialApks,
  };
}

function persistState(projects: Project[], settings: IdeSettings, apkArtifacts: ApkArtifact[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        projects,
        settings,
        apkArtifacts,
      })
    );
  } catch {
    // ignore quota errors
  }
}

const initialData = loadPersistedState();
const firstProject = initialData.projects[0];
const defaultOpenFile =
  firstProject.files.find((f) => f.name.startsWith('MainActivity'))?.path ||
  firstProject.files.find((f) => f.type === 'file')?.path ||
  null;
const secondOpenFile =
  firstProject.files.find((f) => f.name === 'activity_main.xml')?.path || null;

const initialTabs: OpenTab[] = [];
if (defaultOpenFile) {
  initialTabs.push({
    filePath: defaultOpenFile,
    projectId: firstProject.id,
    cursorLine: 1,
    cursorCol: 1,
    undoStack: [],
    redoStack: [],
  });
}
if (secondOpenFile && secondOpenFile !== defaultOpenFile) {
  initialTabs.push({
    filePath: secondOpenFile,
    projectId: firstProject.id,
    cursorLine: 1,
    cursorCol: 1,
    xmlViewMode: 'split',
    undoStack: [],
    redoStack: [],
  });
}

export const useIdeStore = create<IdeState>((set, get) => ({
  activeScreen: 'workspace',
  setActiveScreen: (screen) => set({ activeScreen: screen }),

  bottomPanelOpen: true,
  setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),

  bottomPanelTab: 'terminal',
  setBottomPanelTab: (tab) => set({ bottomPanelTab: tab, bottomPanelOpen: true }),

  explorerOpenMobile: false,
  setExplorerOpenMobile: (open) => set({ explorerOpenMobile: open }),

  devicePreviewOpen: true,
  setDevicePreviewOpen: (open) => set({ devicePreviewOpen: open }),

  newProjectModalOpen: false,
  setNewProjectModalOpen: (open) => set({ newProjectModalOpen: open }),

  gitCloneModalOpen: false,
  setGitCloneModalOpen: (open) => set({ gitCloneModalOpen: open }),

  searchModalOpen: false,
  setSearchModalOpen: (open) => set({ searchModalOpen: open }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  aboutModalOpen: false,
  setAboutModalOpen: (open) => set({ aboutModalOpen: open }),

  projects: initialData.projects,
  activeProjectId: firstProject.id,

  selectProject: (projectId) => {
    const state = get();
    const target = state.projects.find((p) => p.id === projectId);
    if (!target) return;

    const mainFile =
      target.files.find((f) => f.name.startsWith('MainActivity') || f.name === 'App.tsx')?.path ||
      target.files.find((f) => f.type === 'file')?.path ||
      null;
    const xmlFile = target.files.find((f) => f.name === 'activity_main.xml')?.path;

    const newTabs: OpenTab[] = [];
    if (mainFile) {
      newTabs.push({
        filePath: mainFile,
        projectId: target.id,
        cursorLine: 1,
        cursorCol: 1,
        undoStack: [],
        redoStack: [],
      });
    }
    if (xmlFile && xmlFile !== mainFile) {
      newTabs.push({
        filePath: xmlFile,
        projectId: target.id,
        cursorLine: 1,
        cursorCol: 1,
        xmlViewMode: 'split',
        undoStack: [],
        redoStack: [],
      });
    }

    set({
      activeProjectId: target.id,
      openTabs: newTabs,
      activeFilePath: mainFile,
      activeScreen: 'workspace',
      terminalCwd: target.storagePath,
    });
  },

  createProject: (params) => {
    const state = get();
    const now = Date.now();
    const files = generateProjectFiles({
      name: params.name,
      packageName: params.packageName,
      language: params.language,
      template: params.template,
      minSdk: params.minSdk,
    });

    const snapshot: Record<string, string> = {};
    files.forEach((f) => {
      if (f.type === 'file' && f.content !== undefined) {
        snapshot[f.path] = f.content;
      }
    });

    const newProj: Project = {
      id: `proj-${now}`,
      name: params.name,
      packageName: params.packageName,
      language: params.language,
      template: params.template,
      minSdk: params.minSdk,
      buildSystem: params.buildSystem,
      storagePath: `${state.settings.storageLocation}/Projects/${params.name.replace(/\s+/g, '')}`,
      createdAt: now,
      updatedAt: now,
      files,
      git: {
        branch: 'main',
        branches: ['main'],
        remoteUrl: `https://github.com/developer/${params.name.replace(/\s+/g, '-')}.git`,
        commits: [
          {
            id: `commit-${now}`,
            hash: Math.random().toString(16).substring(2, 9),
            message: `Initial project created with ${params.template} template`,
            author: 'Mobile Dev',
            timestamp: now,
            branch: 'main',
            changedFiles: files.filter((f) => f.type === 'file').map((f) => f.path),
          },
        ],
        initialSnapshot: snapshot,
      },
    };

    const updatedProjects = [newProj, ...state.projects];
    persistState(updatedProjects, state.settings, state.apkArtifacts);

    const mainFile =
      newProj.files.find((f) => f.name.startsWith('MainActivity') || f.name === 'App.tsx')?.path ||
      newProj.files.find((f) => f.type === 'file')?.path ||
      null;

    const xmlFile = newProj.files.find((f) => f.name === 'activity_main.xml')?.path;
    const tabs: OpenTab[] = [];
    if (mainFile) {
      tabs.push({
        filePath: mainFile,
        projectId: newProj.id,
        cursorLine: 1,
        cursorCol: 1,
        undoStack: [],
        redoStack: [],
      });
    }
    if (xmlFile && xmlFile !== mainFile) {
      tabs.push({
        filePath: xmlFile,
        projectId: newProj.id,
        cursorLine: 1,
        cursorCol: 1,
        xmlViewMode: 'split',
        undoStack: [],
        redoStack: [],
      });
    }

    set({
      projects: updatedProjects,
      activeProjectId: newProj.id,
      openTabs: tabs,
      activeFilePath: mainFile,
      activeScreen: 'workspace',
      newProjectModalOpen: false,
      terminalCwd: newProj.storagePath,
    });

    get().appendLogcat('I', 'ProjectManager', `Created project ${newProj.name} (${newProj.packageName})`);
    return newProj;
  },

  importProjectFiles: (name, packageName, files) => {
    const state = get();
    const now = Date.now();
    const snapshot: Record<string, string> = {};
    files.forEach((f) => {
      if (f.type === 'file' && f.content !== undefined) {
        snapshot[f.path] = f.content;
      }
    });

    const newProj: Project = {
      id: `proj-zip-${now}`,
      name,
      packageName,
      language: files.some((f) => f.name.endsWith('.kt')) ? 'Kotlin' : 'Java',
      template: 'empty_activity',
      minSdk: 'Android 8.0 (API 26)',
      buildSystem: 'Gradle (Kotlin DSL)',
      storagePath: `${state.settings.storageLocation}/Projects/${name}`,
      createdAt: now,
      updatedAt: now,
      files,
      git: {
        branch: 'main',
        branches: ['main'],
        remoteUrl: '',
        commits: [
          {
            id: `commit-${now}`,
            hash: Math.random().toString(16).substring(2, 9),
            message: `Imported from ZIP archive (${files.filter((f) => f.type === 'file').length} files)`,
            author: 'Mobile Dev',
            timestamp: now,
            branch: 'main',
            changedFiles: files.filter((f) => f.type === 'file').map((f) => f.path),
          },
        ],
        initialSnapshot: snapshot,
      },
    };

    const updatedProjects = [newProj, ...state.projects];
    persistState(updatedProjects, state.settings, state.apkArtifacts);
    get().selectProject(newProj.id);
    get().appendLogcat('I', 'ZipImporter', `Imported ZIP archive into ${newProj.storagePath}`);
  },

  deleteProject: (projectId) => {
    const state = get();
    if (state.projects.length <= 1) return;
    const remaining = state.projects.filter((p) => p.id !== projectId);
    persistState(remaining, state.settings, state.apkArtifacts);
    if (state.activeProjectId === projectId) {
      get().selectProject(remaining[0].id);
    } else {
      set({ projects: remaining });
    }
  },

  openTabs: initialTabs,
  activeFilePath: defaultOpenFile,

  openFile: (filePath, line = 1) => {
    const state = get();
    const exists = state.openTabs.find(
      (t) => t.filePath === filePath && t.projectId === state.activeProjectId
    );
    if (exists) {
      set({
        activeFilePath: filePath,
        activeScreen: 'workspace',
        openTabs: state.openTabs.map((t) =>
          t.filePath === filePath ? { ...t, cursorLine: line } : t
        ),
      });
    } else {
      const isXmlLayout = filePath.includes('res/layout/') && filePath.endsWith('.xml');
      const newTab: OpenTab = {
        filePath,
        projectId: state.activeProjectId,
        cursorLine: line,
        cursorCol: 1,
        xmlViewMode: isXmlLayout ? 'split' : 'code',
        undoStack: [],
        redoStack: [],
      };
      set({
        openTabs: [...state.openTabs, newTab],
        activeFilePath: filePath,
        activeScreen: 'workspace',
      });
    }
  },

  closeTab: (filePath) => {
    const state = get();
    const filtered = state.openTabs.filter((t) => t.filePath !== filePath);
    let nextActive = state.activeFilePath;
    if (state.activeFilePath === filePath) {
      nextActive = filtered.length > 0 ? filtered[filtered.length - 1].filePath : null;
    }
    set({ openTabs: filtered, activeFilePath: nextActive });
  },

  updateFileContent: (filePath, newContent) => {
    const state = get();
    const activeProject = state.projects.find((p) => p.id === state.activeProjectId);
    if (!activeProject) return;

    const currentFile = activeProject.files.find((f) => f.path === filePath);
    const prevContent = currentFile?.content ?? '';
    if (prevContent === newContent) return;

    const updatedProjects = state.projects.map((p) => {
      if (p.id !== state.activeProjectId) return p;
      return {
        ...p,
        updatedAt: Date.now(),
        files: p.files.map((f) =>
          f.path === filePath
            ? { ...f, content: newContent, lastModified: Date.now() }
            : f
        ),
      };
    });

    const updatedTabs = state.openTabs.map((t) => {
      if (t.filePath !== filePath) return t;
      const nextUndo = [...t.undoStack.slice(-29), prevContent];
      return { ...t, undoStack: nextUndo, redoStack: [] };
    });

    persistState(updatedProjects, state.settings, state.apkArtifacts);
    set({ projects: updatedProjects, openTabs: updatedTabs });
  },

  undoEdit: (filePath) => {
    const state = get();
    const tab = state.openTabs.find((t) => t.filePath === filePath);
    const activeProject = state.projects.find((p) => p.id === state.activeProjectId);
    if (!tab || tab.undoStack.length === 0 || !activeProject) return;

    const currentFile = activeProject.files.find((f) => f.path === filePath);
    if (!currentFile) return;

    const previousContent = tab.undoStack[tab.undoStack.length - 1];
    const nextUndo = tab.undoStack.slice(0, -1);
    const nextRedo = [...tab.redoStack, currentFile.content || ''];

    const updatedProjects = state.projects.map((p) => {
      if (p.id !== state.activeProjectId) return p;
      return {
        ...p,
        files: p.files.map((f) =>
          f.path === filePath ? { ...f, content: previousContent, lastModified: Date.now() } : f
        ),
      };
    });

    set({
      projects: updatedProjects,
      openTabs: state.openTabs.map((t) =>
        t.filePath === filePath ? { ...t, undoStack: nextUndo, redoStack: nextRedo } : t
      ),
    });
    persistState(updatedProjects, state.settings, state.apkArtifacts);
  },

  redoEdit: (filePath) => {
    const state = get();
    const tab = state.openTabs.find((t) => t.filePath === filePath);
    const activeProject = state.projects.find((p) => p.id === state.activeProjectId);
    if (!tab || tab.redoStack.length === 0 || !activeProject) return;

    const currentFile = activeProject.files.find((f) => f.path === filePath);
    if (!currentFile) return;

    const nextContent = tab.redoStack[tab.redoStack.length - 1];
    const nextRedo = tab.redoStack.slice(0, -1);
    const nextUndo = [...tab.undoStack, currentFile.content || ''];

    const updatedProjects = state.projects.map((p) => {
      if (p.id !== state.activeProjectId) return p;
      return {
        ...p,
        files: p.files.map((f) =>
          f.path === filePath ? { ...f, content: nextContent, lastModified: Date.now() } : f
        ),
      };
    });

    set({
      projects: updatedProjects,
      openTabs: state.openTabs.map((t) =>
        t.filePath === filePath ? { ...t, undoStack: nextUndo, redoStack: nextRedo } : t
      ),
    });
    persistState(updatedProjects, state.settings, state.apkArtifacts);
  },

  setXmlViewMode: (filePath, mode) => {
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.filePath === filePath ? { ...t, xmlViewMode: mode } : t
      ),
    }));
  },

  createFileOrFolder: (parentPath, name, type, initialContent) => {
    const state = get();
    const cleanName = name.trim();
    if (!cleanName) return;

    const fullPath = parentPath ? `${parentPath}/${cleanName}` : cleanName;
    const now = Date.now();

    const defaultSnippet =
      initialContent !== undefined
        ? initialContent
        : cleanName.endsWith('.kt')
        ? `package com.example.app\n\nclass ${cleanName.replace('.kt', '')} {\n    \n}\n`
        : cleanName.endsWith('.java')
        ? `package com.example.app;\n\npublic class ${cleanName.replace('.java', '')} {\n    \n}\n`
        : cleanName.endsWith('.xml')
        ? `<?xml version="1.0" encoding="utf-8"?>\n<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"\n    android:layout_width="match_parent"\n    android:layout_height="match_parent"\n    android:orientation="vertical"\n    android:padding="16dp">\n\n    <TextView\n        android:id="@+id/tvNew"\n        android:layout_width="match_parent"\n        android:layout_height="wrap_content"\n        android:text="${cleanName}"\n        android:textSize="18sp" />\n\n</LinearLayout>\n`
        : '';

    const newNode: FileNode = {
      id: `${type}-${fullPath}-${now}`,
      name: cleanName,
      path: fullPath,
      type,
      content: type === 'file' ? defaultSnippet : undefined,
      language: type === 'file' ? detectLanguage(cleanName) : undefined,
      lastModified: now,
    };

    const updatedProjects = state.projects.map((p) => {
      if (p.id !== state.activeProjectId) return p;
      if (p.files.some((f) => f.path === fullPath)) return p;
      return {
        ...p,
        updatedAt: now,
        files: [...p.files, newNode],
      };
    });

    persistState(updatedProjects, state.settings, state.apkArtifacts);
    set({ projects: updatedProjects });

    if (type === 'file') {
      get().openFile(fullPath);
    }
  },

  renameFileOrFolder: (oldPath, newName) => {
    const state = get();
    const cleanName = newName.trim();
    if (!cleanName) return;

    const segments = oldPath.split('/');
    segments[segments.length - 1] = cleanName;
    const newPath = segments.join('/');

    const updatedProjects = state.projects.map((p) => {
      if (p.id !== state.activeProjectId) return p;
      return {
        ...p,
        updatedAt: Date.now(),
        files: p.files.map((f) => {
          if (f.path === oldPath) {
            return {
              ...f,
              name: cleanName,
              path: newPath,
              language: f.type === 'file' ? detectLanguage(cleanName) : undefined,
              lastModified: Date.now(),
            };
          }
          if (f.path.startsWith(`${oldPath}/`)) {
            return {
              ...f,
              path: f.path.replace(`${oldPath}/`, `${newPath}/`),
            };
          }
          return f;
        }),
      };
    });

    const updatedTabs = state.openTabs.map((t) =>
      t.filePath === oldPath ? { ...t, filePath: newPath } : t
    );

    persistState(updatedProjects, state.settings, state.apkArtifacts);
    set({
      projects: updatedProjects,
      openTabs: updatedTabs,
      activeFilePath: state.activeFilePath === oldPath ? newPath : state.activeFilePath,
    });
  },

  deleteFileOrFolder: (targetPath) => {
    const state = get();
    const updatedProjects = state.projects.map((p) => {
      if (p.id !== state.activeProjectId) return p;
      return {
        ...p,
        updatedAt: Date.now(),
        files: p.files.filter(
          (f) => f.path !== targetPath && !f.path.startsWith(`${targetPath}/`)
        ),
      };
    });

    const updatedTabs = state.openTabs.filter(
      (t) => t.filePath !== targetPath && !t.filePath.startsWith(`${targetPath}/`)
    );

    let nextActive = state.activeFilePath;
    if (
      state.activeFilePath &&
      (state.activeFilePath === targetPath || state.activeFilePath.startsWith(`${targetPath}/`))
    ) {
      nextActive = updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1].filePath : null;
    }

    persistState(updatedProjects, state.settings, state.apkArtifacts);
    set({
      projects: updatedProjects,
      openTabs: updatedTabs,
      activeFilePath: nextActive,
    });
  },

  duplicateFile: (targetPath) => {
    const state = get();
    const proj = state.projects.find((p) => p.id === state.activeProjectId);
    if (!proj) return;
    const target = proj.files.find((f) => f.path === targetPath && f.type === 'file');
    if (!target) return;

    const dotIdx = target.name.lastIndexOf('.');
    const copyName =
      dotIdx > 0
        ? `${target.name.slice(0, dotIdx)}_copy${target.name.slice(dotIdx)}`
        : `${target.name}_copy`;
    const parentPath = targetPath.includes('/')
      ? targetPath.slice(0, targetPath.lastIndexOf('/'))
      : '';

    get().createFileOrFolder(parentPath, copyName, 'file', target.content || '');
  },

  // Terminal
  terminalCwd: firstProject.storagePath,
  terminalLines: [
    {
      id: 't-init-1',
      type: 'info',
      text: 'CodeStudio Mobile Shell (ARM64 Android Sandbox · OpenJDK 17 · Gradle 8.7)',
      timestamp: Date.now() - 5000,
    },
    {
      id: 't-init-2',
      type: 'output',
      text: `Working directory: ${firstProject.storagePath}\nType "help" to list supported commands or run "./gradlew assembleDebug"`,
      timestamp: Date.now() - 4000,
    },
  ],

  clearTerminal: () => set({ terminalLines: [] }),

  executeTerminalCommand: (rawCmd) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    const state = get();
    const activeProject = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];
    const now = Date.now();

    const appendLines = (newItems: Omit<TerminalLine, 'id' | 'timestamp'>[]) => {
      set((s) => ({
        terminalLines: [
          ...s.terminalLines,
          ...newItems.map((item, idx) => ({
            ...item,
            id: `term-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
          })),
        ],
      }));
    };

    appendLines([{ type: 'input', text: `$ ${cmd}` }]);

    const parts = cmd.split(/\s+/);
    const base = parts[0];
    const arg1 = parts[1] || '';
    const arg2 = parts[2] || '';

    if (base === 'clear') {
      set({ terminalLines: [] });
      return;
    }

    if (base === 'help') {
      appendLines([
        {
          type: 'output',
          text: [
            'Available commands in CodeStudio Mobile Terminal:',
            '  ls [dir]                   List files in current project workspace',
            '  pwd                        Print current working storage path',
            '  cd <dir>                   Change directory inside project',
            '  cat <file>                 Display file contents',
            '  mkdir <folder>             Create a new directory in project',
            '  touch <file>               Create a new empty file in project',
            '  cp <src> <dest>            Copy file within project',
            '  mv <src> <dest>            Move or rename file',
            '  rm <file>                  Remove file from project',
            '  ./gradlew assembleDebug    Compile & package Debug APK',
            '  ./gradlew assembleRelease  Compile & package Release APK',
            '  ./gradlew bundleRelease    Build Android App Bundle (.aab)',
            '  ./gradlew clean            Clean build outputs',
            '  git status | branch | log  Inspect Git repository state',
            '  adb devices                List attached Android devices',
            '  npm -v | node -v           Check hybrid web toolchain versions',
            '  clear                      Clear terminal history',
          ].join('\n'),
        },
      ]);
      return;
    }

    if (base === 'pwd') {
      appendLines([{ type: 'output', text: state.terminalCwd }]);
      return;
    }

    if (base === 'ls') {
      const targetPrefix = arg1 && arg1 !== '.' ? arg1.replace(/\/$/, '') : '';
      const entries = new Set<string>();
      activeProject.files.forEach((f) => {
        if (!targetPrefix) {
          const top = f.path.split('/')[0];
          const isDir = f.path.includes('/') || f.type === 'folder';
          entries.add(isDir ? `${top}/` : top);
        } else if (f.path.startsWith(`${targetPrefix}/`)) {
          const rest = f.path.slice(targetPrefix.length + 1);
          const seg = rest.split('/')[0];
          const isDir = rest.includes('/') || f.type === 'folder';
          if (seg) entries.add(isDir ? `${seg}/` : seg);
        }
      });
      const list = Array.from(entries).sort();
      appendLines([
        {
          type: list.length > 0 ? 'output' : 'info',
          text: list.length > 0 ? list.join('   ') : '(empty directory)',
        },
      ]);
      return;
    }

    if (base === 'cd') {
      if (!arg1 || arg1 === '~' || arg1 === '/') {
        set({ terminalCwd: activeProject.storagePath });
      } else if (arg1 === '..') {
        const idx = state.terminalCwd.lastIndexOf('/');
        if (idx > 0) set({ terminalCwd: state.terminalCwd.slice(0, idx) });
      } else {
        set({ terminalCwd: `${state.terminalCwd}/${arg1.replace(/^\//, '')}` });
      }
      return;
    }

    if (base === 'cat') {
      if (!arg1) {
        appendLines([{ type: 'error', text: 'cat: missing file operand' }]);
        return;
      }
      const match = activeProject.files.find(
        (f) => f.type === 'file' && (f.path === arg1 || f.name === arg1)
      );
      if (!match) {
        appendLines([{ type: 'error', text: `cat: ${arg1}: No such file in project` }]);
      } else {
        appendLines([{ type: 'output', text: match.content || '' }]);
      }
      return;
    }

    if (base === 'mkdir') {
      if (!arg1) {
        appendLines([{ type: 'error', text: 'mkdir: missing operand' }]);
        return;
      }
      get().createFileOrFolder('', arg1, 'folder');
      appendLines([{ type: 'success', text: `Created directory: ${arg1}` }]);
      return;
    }

    if (base === 'touch') {
      if (!arg1) {
        appendLines([{ type: 'error', text: 'touch: missing file operand' }]);
        return;
      }
      const slash = arg1.lastIndexOf('/');
      const parent = slash > 0 ? arg1.slice(0, slash) : '';
      const name = slash > 0 ? arg1.slice(slash + 1) : arg1;
      get().createFileOrFolder(parent, name, 'file');
      appendLines([{ type: 'success', text: `Created file: ${arg1}` }]);
      return;
    }

    if (base === 'rm') {
      const target = parts[parts.length - 1];
      if (!target || target.startsWith('-')) {
        appendLines([{ type: 'error', text: 'rm: missing file operand' }]);
        return;
      }
      const found = activeProject.files.find((f) => f.path === target || f.name === target);
      if (!found) {
        appendLines([{ type: 'error', text: `rm: cannot remove '${target}': No such file or directory` }]);
      } else {
        get().deleteFileOrFolder(found.path);
        appendLines([{ type: 'info', text: `Removed ${found.path}` }]);
      }
      return;
    }

    if (base === 'cp' && arg1 && arg2) {
      const src = activeProject.files.find((f) => f.path === arg1 || f.name === arg1);
      if (!src || src.type !== 'file') {
        appendLines([{ type: 'error', text: `cp: cannot stat '${arg1}': No such file` }]);
      } else {
        const slash = arg2.lastIndexOf('/');
        const parent = slash > 0 ? arg2.slice(0, slash) : '';
        const name = slash > 0 ? arg2.slice(slash + 1) : arg2;
        get().createFileOrFolder(parent, name, 'file', src.content || '');
        appendLines([{ type: 'success', text: `Copied ${src.path} -> ${arg2}` }]);
      }
      return;
    }

    if (base === 'mv' && arg1 && arg2) {
      const src = activeProject.files.find((f) => f.path === arg1 || f.name === arg1);
      if (!src) {
        appendLines([{ type: 'error', text: `mv: cannot stat '${arg1}': No such file` }]);
      } else {
        get().renameFileOrFolder(src.path, arg2.split('/').pop() || arg2);
        appendLines([{ type: 'success', text: `Renamed ${src.path} -> ${arg2}` }]);
      }
      return;
    }

    if (base === './gradlew' || base === 'gradle') {
      const task = arg1 || 'assembleDebug';
      if (task === 'clean') {
        get().triggerBuild('clean');
        appendLines([
          { type: 'output', text: '> Task :app:clean UP-TO-DATE\n\nBUILD SUCCESSFUL in 620ms' },
        ]);
      } else if (task.toLowerCase().includes('bundle') || task.toLowerCase().includes('aab')) {
        appendLines([
          {
            type: 'info',
            text: `Starting a Gradle Daemon (subsequent builds will be faster)\n> Task :app:compileReleaseKotlin\n> Task :app:mergeReleaseResources\n> Task :app:bundleRelease`,
          },
        ]);
        get().triggerBuild('aab');
        setTimeout(() => {
          appendLines([
            {
              type: 'success',
              text: `\nBUILD SUCCESSFUL in 1.8s\n5 actionable tasks: 5 executed\nOutput: app/build/outputs/bundle/release/${activeProject.name}-release.aab`,
            },
          ]);
        }, 1400);
      } else {
        const isRel = task.toLowerCase().includes('release');
        if (isRel) get().setBuildVariant('release');
        else get().setBuildVariant('debug');

        appendLines([
          {
            type: 'output',
            text: `> Task :app:compile${isRel ? 'Release' : 'Debug'}Kotlin\n> Task :app:merge${isRel ? 'Release' : 'Debug'}Resources\n> Task :app:process${isRel ? 'Release' : 'Debug'}MainManifest\n> Task :app:dexBuilder${isRel ? 'Release' : 'Debug'}\n> Task :app:package${isRel ? 'Release' : 'Debug'}`,
          },
        ]);
        get().triggerBuild('apk');
        setTimeout(() => {
          appendLines([
            {
              type: 'success',
              text: `\nBUILD SUCCESSFUL in 1.6s\n5 actionable tasks: 5 executed\nAPK Output: app/build/outputs/apk/${isRel ? 'release' : 'debug'}/${activeProject.name}-${isRel ? 'release' : 'debug'}.apk`,
            },
          ]);
        }, 1500);
      }
      return;
    }

    if (base === 'git') {
      if (arg1 === 'status') {
        const modified = activeProject.files.filter(
          (f) =>
            f.type === 'file' &&
            activeProject.git.initialSnapshot[f.path] !== f.content
        );
        if (modified.length === 0) {
          appendLines([
            {
              type: 'output',
              text: `On branch ${activeProject.git.branch}\nnothing to commit, working tree clean`,
            },
          ]);
        } else {
          appendLines([
            {
              type: 'output',
              text: `On branch ${activeProject.git.branch}\nChanges not staged for commit:\n${modified
                .map((m) => `  modified:   ${m.path}`)
                .join('\n')}`,
            },
          ]);
        }
      } else if (arg1 === 'branch') {
        appendLines([
          {
            type: 'output',
            text: activeProject.git.branches
              .map((b) => (b === activeProject.git.branch ? `* ${b}` : `  ${b}`))
              .join('\n'),
          },
        ]);
      } else if (arg1 === 'log') {
        appendLines([
          {
            type: 'output',
            text: activeProject.git.commits
              .slice(0, 5)
              .map(
                (c) =>
                  `commit ${c.hash} (${c.branch})\nAuthor: ${c.author}\n    ${c.message}`
              )
              .join('\n\n'),
          },
        ]);
      } else {
        appendLines([
          {
            type: 'info',
            text: `git ${arg1}: executed on branch '${activeProject.git.branch}'`,
          },
        ]);
      }
      return;
    }

    if (base === 'adb') {
      if (arg1 === 'devices') {
        const connected = state.devices.filter((d) => d.status === 'connected');
        appendLines([
          {
            type: 'output',
            text: `List of devices attached\n${connected
              .map((d) => `${d.ipAddress || 'emulator-5554'}\tdevice product:${d.name.replace(/\s+/g, '_')} model:${d.abi}`)
              .join('\n')}`,
          },
        ]);
      } else {
        appendLines([
          {
            type: 'output',
            text: 'Android Debug Bridge version 1.0.41 (CodeStudio Embedded)',
          },
        ]);
      }
      return;
    }

    if (base === 'npm' || base === 'node') {
      appendLines([
        {
          type: 'output',
          text: base === 'node' ? 'v22.4.0 (ARM64 Android)' : '10.8.1',
        },
      ]);
      return;
    }

    appendLines([
      {
        type: 'error',
        text: `sh: ${base}: command not found. Type "help" for available commands.`,
      },
    ]);
  },

  // Build & APK State
  buildVariant: 'debug',
  setBuildVariant: (v) => set({ buildVariant: v }),
  cleanBeforeBuild: true,
  setCleanBeforeBuild: (clean) => set({ cleanBeforeBuild: clean }),
  isBuilding: false,
  buildSteps: INITIAL_BUILD_STEPS,
  buildLogs: [
    '> Task :app:preBuild UP-TO-DATE',
    '> Task :app:compileDebugKotlin (420ms)',
    '> Task :app:mergeDebugResources (310ms)',
    '> Task :app:processDebugMainManifest (140ms)',
    '> Task :app:dexBuilderDebug (510ms)',
    '> Task :app:packageDebug (280ms)',
    'BUILD SUCCESSFUL in 1s 660ms',
  ],
  apkArtifacts: initialData.apkArtifacts,

  triggerBuild: (format) => {
    const state = get();
    if (state.isBuilding) return;

    const activeProject = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];
    const variantCap = state.buildVariant === 'debug' ? 'Debug' : 'Release';

    if (format === 'clean') {
      set({
        buildLogs: [
          `Executing tasks: [:app:clean] in project ${activeProject.storagePath}`,
          '> Task :app:clean',
          'Deleted build directory: app/build/outputs',
          'BUILD SUCCESSFUL in 410ms',
        ],
      });
      get().appendLogcat('I', 'GradleDaemon', `Cleaned build directory for ${activeProject.name}`);
      return;
    }

    const steps: BuildStepStatus[] = [
      {
        id: 'step-kotlin',
        label: `${activeProject.language} compilation`,
        taskName: `:app:compile${variantCap}${activeProject.language === 'Java' ? 'JavaWithJavac' : 'Kotlin'}`,
        status: 'running',
      },
      {
        id: 'step-res',
        label: 'Resource compilation',
        taskName: `:app:merge${variantCap}Resources`,
        status: 'pending',
      },
      {
        id: 'step-manifest',
        label: 'Manifest processing',
        taskName: `:app:process${variantCap}MainManifest`,
        status: 'pending',
      },
      {
        id: 'step-dex',
        label: 'DEX generation',
        taskName: `:app:dexBuilder${variantCap}`,
        status: 'pending',
      },
      {
        id: 'step-pkg',
        label: format === 'aab' ? 'AAB bundle packaging' : 'APK packaging',
        taskName: format === 'aab' ? `:app:bundle${variantCap}` : `:app:package${variantCap}`,
        status: 'pending',
      },
    ];

    set({
      isBuilding: true,
      buildSteps: steps,
      buildLogs: [
        `Starting Gradle ${state.settings.gradleVersion} daemon (${state.settings.jdkVersion})...`,
        ...(state.cleanBeforeBuild || format === 'rebuild' ? ['> Task :app:clean (190ms)'] : []),
      ],
    });

    get().appendLogcat(
      'I',
      'GradleBuild',
      `Started ${format.toUpperCase()} (${state.buildVariant}) build for ${activeProject.packageName}`
    );

    steps.forEach((step, idx) => {
      setTimeout(() => {
        const dur = 220 + Math.floor(Math.random() * 280);
        set((s) => {
          const nextSteps = s.buildSteps.map((st, i) => {
            if (i < idx) return st;
            if (i === idx) return { ...st, status: 'completed' as const, durationMs: dur };
            if (i === idx + 1) return { ...st, status: 'running' as const };
            return st;
          });
          const isLast = idx === steps.length - 1;
          const ext = format === 'aab' ? 'aab' : 'apk';
          const outDir = format === 'aab' ? 'bundle' : 'apk';
          const fileName = `${activeProject.name.replace(/\s+/g, '')}-${state.buildVariant}.${ext}`;
          const outPath = `app/build/outputs/${outDir}/${state.buildVariant}/${fileName}`;

          let nextApks = s.apkArtifacts;
          if (isLast) {
            const newArtifact: ApkArtifact = {
              id: `apk-${Date.now()}`,
              fileName,
              projectId: activeProject.id,
              projectName: activeProject.name,
              packageName: activeProject.packageName,
              variant: state.buildVariant,
              format: format === 'aab' ? 'aab' : 'apk',
              versionName: '1.0.' + (s.apkArtifacts.length + 1),
              versionCode: s.apkArtifacts.length + 1,
              minSdk: activeProject.minSdk,
              targetSdk: state.settings.androidSdkVersion,
              sizeBytes: 2150000 + Math.floor(Math.random() * 950000),
              createdAt: Date.now(),
              outputPath: outPath,
              permissions: [
                'android.permission.INTERNET',
                'android.permission.ACCESS_NETWORK_STATE',
                'android.permission.VIBRATE',
              ],
              activities: [`${activeProject.packageName}.MainActivity`],
              services: ['androidx.appcompat.app.AppLocalesMetadataHolderService'],
              installedOnDeviceIds: ['dev-local-phone'],
            };
            nextApks = [newArtifact, ...s.apkArtifacts];
            persistState(s.projects, s.settings, nextApks);
            get().appendLogcat(
              'I',
              'PackageManager',
              `Generated artifact ${fileName} (${(newArtifact.sizeBytes / (1024 * 1024)).toFixed(2)} MB) at ${outPath}`
            );
          }

          return {
            buildSteps: nextSteps,
            isBuilding: !isLast,
            apkArtifacts: nextApks,
            buildLogs: [
              ...s.buildLogs,
              `> Task ${step.taskName} (${dur}ms)`,
              ...(isLast
                ? [
                    '',
                    'BUILD SUCCESSFUL in 1s 580ms',
                    `Artifact output: ${outPath}`,
                  ]
                : []),
            ],
          };
        });
      }, (idx + 1) * 280);
    });
  },

  installApkOnDevice: (apkId, deviceId = 'dev-local-phone') => {
    const state = get();
    const apk = state.apkArtifacts.find((a) => a.id === apkId);
    if (!apk) return;

    const updatedApks = state.apkArtifacts.map((a) =>
      a.id === apkId
        ? {
            ...a,
            installedOnDeviceIds: Array.from(new Set([...a.installedOnDeviceIds, deviceId])),
          }
        : a
    );

    const updatedDevices = state.devices.map((d) =>
      d.id === deviceId
        ? {
            ...d,
            installedPackages: Array.from(new Set([...d.installedPackages, apk.packageName])),
          }
        : d
    );

    persistState(state.projects, state.settings, updatedApks);
    set({ apkArtifacts: updatedApks, devices: updatedDevices });
    get().appendLogcat(
      'I',
      'ActivityManager',
      `Installed ${apk.fileName} (${apk.packageName}) onto ${deviceId} — Launching .MainActivity`
    );
  },

  deleteApkArtifact: (apkId) => {
    const state = get();
    const updated = state.apkArtifacts.filter((a) => a.id !== apkId);
    persistState(state.projects, state.settings, updated);
    set({ apkArtifacts: updated });
  },

  // Logcat
  logcatPaused: false,
  setLogcatPaused: (paused) => set({ logcatPaused: paused }),
  logcatEntries: [
    {
      id: 'log-1',
      timestamp: formatTimeNow(),
      pid: 14280,
      level: 'I',
      tag: 'MainActivity',
      message: 'App started: MyApp on SDK 26+',
      packageName: 'com.example.myapp',
    },
    {
      id: 'log-2',
      timestamp: formatTimeNow(),
      pid: 14280,
      level: 'D',
      tag: 'MyApp',
      message: 'View hierarchy inflated from R.layout.activity_main (4 child views)',
      packageName: 'com.example.myapp',
    },
    {
      id: 'log-3',
      timestamp: formatTimeNow(),
      pid: 14280,
      level: 'W',
      tag: 'System',
      message: 'ClassLoader referenced unknown path: /data/app/com.example.myapp/lib/arm64',
      packageName: 'com.example.myapp',
    },
    {
      id: 'log-4',
      timestamp: formatTimeNow(),
      pid: 14280,
      level: 'E',
      tag: 'NetworkSync',
      message: 'Offline mode active: cached Gradle dependencies resolved from local m2 repository',
      packageName: 'com.example.myapp',
    },
  ],

  appendLogcat: (level, tag, message) => {
    const state = get();
    if (state.logcatPaused) return;
    const activeProj = state.projects.find((p) => p.id === state.activeProjectId);
    const entry: LogcatEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: formatTimeNow(),
      pid: 14280,
      level,
      tag,
      message,
      packageName: activeProj?.packageName || 'com.example.myapp',
    };
    set((s) => ({
      logcatEntries: [...s.logcatEntries.slice(-199), entry],
    }));
  },

  clearLogcat: () => set({ logcatEntries: [] }),

  // Devices
  devices: [
    {
      id: 'dev-local-phone',
      name: 'This Device (Pixel 8 Pro ARM64)',
      type: 'local',
      androidVersion: 'Android 14',
      apiLevel: 34,
      status: 'connected',
      ipAddress: '127.0.0.1:5555',
      batteryLevel: 88,
      abi: 'arm64-v8a',
      installedPackages: ['com.example.myapp', 'com.codestudio.notesapp'],
    },
    {
      id: 'dev-usb-otg',
      name: 'Samsung Galaxy S23 (USB OTG)',
      type: 'usb',
      androidVersion: 'Android 13',
      apiLevel: 33,
      status: 'disconnected',
      batteryLevel: 64,
      abi: 'arm64-v8a',
      installedPackages: [],
    },
    {
      id: 'dev-wireless-adb',
      name: 'Wireless ADB Debugging Target',
      type: 'wireless',
      androidVersion: 'Android 14',
      apiLevel: 34,
      status: 'disconnected',
      ipAddress: '192.168.1.42:38491',
      batteryLevel: 92,
      abi: 'arm64-v8a',
      installedPackages: [],
    },
  ],

  pairWirelessDevice: (ipPort, pairCode) => {
    const state = get();
    const newDev: ConnectedDevice = {
      id: `dev-wifi-${Date.now()}`,
      name: `Wireless Device (${ipPort})`,
      type: 'wireless',
      androidVersion: 'Android 14',
      apiLevel: 34,
      status: 'connected',
      ipAddress: ipPort,
      batteryLevel: 95,
      abi: 'arm64-v8a',
      installedPackages: [],
    };
    set({ devices: [newDev, ...state.devices] });
    get().appendLogcat('I', 'AdbWireless', `Paired with ${ipPort} using code ${pairCode}`);
  },

  toggleDeviceConnection: (deviceId) => {
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? { ...d, status: d.status === 'connected' ? 'disconnected' : 'connected' }
          : d
      ),
    }));
  },

  // Git Operations
  commitChanges: (message, pushAfter = false) => {
    const state = get();
    const proj = state.projects.find((p) => p.id === state.activeProjectId);
    if (!proj || !message.trim()) return;

    const changedFiles = proj.files
      .filter((f) => f.type === 'file' && proj.git.initialSnapshot[f.path] !== f.content)
      .map((f) => f.path);

    const newSnapshot: Record<string, string> = {};
    proj.files.forEach((f) => {
      if (f.type === 'file' && f.content !== undefined) {
        newSnapshot[f.path] = f.content;
      }
    });

    const newCommit = {
      id: `commit-${Date.now()}`,
      hash: Math.random().toString(16).substring(2, 9),
      message: message.trim() + (pushAfter ? ' (pushed to origin)' : ''),
      author: 'Mobile Dev',
      timestamp: Date.now(),
      branch: proj.git.branch,
      changedFiles: changedFiles.length > 0 ? changedFiles : ['(workspace sync)'],
    };

    const updatedProjects = state.projects.map((p) => {
      if (p.id !== state.activeProjectId) return p;
      return {
        ...p,
        updatedAt: Date.now(),
        git: {
          ...p.git,
          commits: [newCommit, ...p.git.commits],
          initialSnapshot: newSnapshot,
        },
      };
    });

    persistState(updatedProjects, state.settings, state.apkArtifacts);
    set({ projects: updatedProjects });
    get().appendLogcat(
      'I',
      'GitEngine',
      `Committed ${newCommit.hash} on ${proj.git.branch}: "${newCommit.message}"`
    );
  },

  createBranch: (branchName) => {
    const clean = branchName.trim().replace(/\s+/g, '-');
    if (!clean) return;
    const state = get();
    const updatedProjects = state.projects.map((p) => {
      if (p.id !== state.activeProjectId) return p;
      const branches = Array.from(new Set([...p.git.branches, clean]));
      return {
        ...p,
        git: {
          ...p.git,
          branch: clean,
          branches,
        },
      };
    });
    persistState(updatedProjects, state.settings, state.apkArtifacts);
    set({ projects: updatedProjects });
  },

  switchBranch: (branchName) => {
    const state = get();
    const updatedProjects = state.projects.map((p) => {
      if (p.id !== state.activeProjectId) return p;
      return {
        ...p,
        git: {
          ...p.git,
          branch: branchName,
        },
      };
    });
    persistState(updatedProjects, state.settings, state.apkArtifacts);
    set({ projects: updatedProjects });
  },

  cloneRepository: (repoUrl, branch) => {
    const rawName =
      repoUrl
        .split('/')
        .pop()
        ?.replace(/\.git$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '') || 'ClonedAndroidApp';

    const pkg = `com.github.${rawName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'app'}`;
    const created = get().createProject({
      name: rawName,
      packageName: pkg,
      language: 'Kotlin',
      template: 'basic_activity',
      minSdk: 'Android 8.0 (API 26)',
      buildSystem: 'Gradle (Kotlin DSL)',
    });

    const state = get();
    const updatedProjects = state.projects.map((p) =>
      p.id === created.id
        ? {
            ...p,
            git: {
              ...p.git,
              remoteUrl: repoUrl,
              branch: branch || 'main',
              branches: Array.from(new Set(['main', branch || 'main'])),
            },
          }
        : p
    );
    persistState(updatedProjects, state.settings, state.apkArtifacts);
    set({ projects: updatedProjects, gitCloneModalOpen: false });
  },

  // Settings
  settings: initialData.settings,
  updateSettings: (partial) => {
    const state = get();
    const next = { ...state.settings, ...partial };
    persistState(state.projects, next, state.apkArtifacts);
    set({ settings: next });
  },
}));
