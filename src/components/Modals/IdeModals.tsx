import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Command,
  Cpu,
  Download,
  FileCode,
  FolderGit2,
  Hammer,
  Info,
  Loader2,
  Package,
  Play,
  Plus,
  Replace,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Terminal,
  X,
} from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';
import { ANDROID_PERMISSIONS_LIST, PROJECT_TEMPLATES } from '../../services/templates';
import { ProjectBuildSystem, ProjectLanguage, ProjectTemplateId } from '../../types/ide';

export const IdeModals: React.FC = () => {
  const {
    newProjectModalOpen,
    setNewProjectModalOpen,
    gitCloneModalOpen,
    setGitCloneModalOpen,
    searchModalOpen,
    setSearchModalOpen,
    commandPaletteOpen,
    setCommandPaletteOpen,
    aboutModalOpen,
    setAboutModalOpen,
    sdkManagerModalOpen,
    setSdkManagerModalOpen,
    activeInstallApk,
    setActiveInstallApk,
    toolchains,
    installToolchain,
    installAllToolchains,
    createProject,
    cloneRepository,
    projects,
    activeProjectId,
    openFile,
    updateFileContent,
    triggerBuild,
    installApkOnDevice,
    setActiveScreen,
    setBottomPanelTab,
    createFileOrFolder,
  } = useIdeStore();

  // New Project Form State with Visual Photo Template Picker
  const [projName, setProjName] = useState('MyApplication');
  const [pkgName, setPkgName] = useState('com.example.myapplication');
  const [projLang, setProjLang] = useState<ProjectLanguage>('Kotlin');
  const [templateId, setTemplateId] = useState<ProjectTemplateId>('empty_activity');
  const [minSdk, setMinSdk] = useState('Android 8.0 (API 26)');
  const [buildSys, setBuildSys] = useState<ProjectBuildSystem>('Kotlin Gradle DSL');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([
    'android.permission.INTERNET',
    'android.permission.VIBRATE',
    'android.permission.POST_NOTIFICATIONS',
  ]);

  // APK Package Installer State (0 -> 100% progress + Permissions)
  const [installProgress, setInstallProgress] = useState(0);
  const [installStage, setInstallStage] = useState<'ready' | 'installing' | 'done'>('ready');
  const [grantedInstallPerms, setGrantedInstallPerms] = useState<string[]>([]);

  useEffect(() => {
    if (activeInstallApk) {
      setInstallStage('ready');
      setInstallProgress(0);
      setGrantedInstallPerms(
        activeInstallApk.permissions.length > 0
          ? activeInstallApk.permissions
          : ['android.permission.INTERNET', 'android.permission.VIBRATE']
      );
    }
  }, [activeInstallApk]);

  const startApkInstallation = () => {
    if (!activeInstallApk) return;
    setInstallStage('installing');
    setInstallProgress(20);

    const steps = [45, 75, 95, 100];
    steps.forEach((pct, idx) => {
      setTimeout(() => {
        setInstallProgress(pct);
        if (pct === 100) {
          setInstallStage('done');
          installApkOnDevice(activeInstallApk.id, grantedInstallPerms);
        }
      }, (idx + 1) * 250);
    });
  };

  // Git Clone State
  const [repoUrl, setRepoUrl] = useState('https://github.com/android/nowinandroid.git');
  const [cloneBranch, setCloneBranch] = useState('main');

  // Global Search Everywhere State
  const [globalQuery, setGlobalQuery] = useState('MainActivity');
  const [globalReplace, setGlobalReplace] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'files' | 'symbols'>('all');

  // Command Palette Filter
  const [cmdFilter, setCmdFilter] = useState('');

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const searchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q || !activeProject) return [];

    const results: {
      filePath: string;
      fileName: string;
      line: number;
      snippet: string;
    }[] = [];

    for (const file of activeProject.files) {
      if (file.type !== 'file') continue;

      if (searchScope === 'files') {
        if (file.name.toLowerCase().includes(q) || file.path.toLowerCase().includes(q)) {
          results.push({
            filePath: file.path,
            fileName: file.name,
            line: 1,
            snippet: file.path,
          });
        }
        continue;
      }

      const fileLines = (file.content || '').split('\n');
      fileLines.forEach((ln, idx) => {
        if (searchScope === 'symbols') {
          if (
            (ln.includes('class ') ||
              ln.includes('fun ') ||
              ln.includes('void ') ||
              ln.includes('Widget ') ||
              ln.includes('android:id=')) &&
            ln.toLowerCase().includes(q)
          ) {
            results.push({
              filePath: file.path,
              fileName: file.name,
              line: idx + 1,
              snippet: ln.trim(),
            });
          }
        } else if (ln.toLowerCase().includes(q)) {
          results.push({
            filePath: file.path,
            fileName: file.name,
            line: idx + 1,
            snippet: ln.trim(),
          });
        }
      });
    }

    return results.slice(0, 50);
  }, [globalQuery, searchScope, activeProject]);

  const handleGlobalReplaceAll = () => {
    if (!globalQuery.trim() || !activeProject) return;
    activeProject.files.forEach((f) => {
      if (f.type === 'file' && f.content && f.content.includes(globalQuery)) {
        const updated = f.content.split(globalQuery).join(globalReplace);
        updateFileContent(f.path, updated);
      }
    });
    setSearchModalOpen(false);
  };

  const paletteCommands = useMemo(
    () => [
      {
        id: 'build-apk',
        label: 'Build & Install APK (100%)',
        category: 'Build',
        icon: Hammer,
        action: () => {
          triggerBuild('apk', true);
        },
      },
      {
        id: 'sdk-manager',
        label: 'Open SDK & Toolchain Installer (Kotlin, Java, Gradle, React, Flutter)',
        category: 'SDK',
        icon: Cpu,
        action: () => {
          setSdkManagerModalOpen(true);
        },
      },
      {
        id: 'new-file',
        label: 'New Source File in Project',
        category: 'File',
        icon: FileCode,
        action: () => {
          createFileOrFolder(
            `app/src/main/java/${activeProject.packageName.replace(/\./g, '/')}`,
            `FeatureHelper_${Date.now().toString().slice(-3)}.kt`,
            'file'
          );
          setActiveScreen('workspace');
        },
      },
      {
        id: 'open-terminal',
        label: 'Open Terminal Console',
        category: 'Tools',
        icon: Terminal,
        action: () => {
          setBottomPanelTab('terminal');
          setActiveScreen('workspace');
        },
      },
      {
        id: 'search-project',
        label: 'Search Project Everywhere',
        category: 'Search',
        icon: Search,
        action: () => {
          setSearchModalOpen(true);
        },
      },
      {
        id: 'git-commit',
        label: 'Git Source Control & Commit',
        category: 'Git',
        icon: FolderGit2,
        action: () => {
          setActiveScreen('git');
        },
      },
      {
        id: 'settings',
        label: 'Open IDE Settings & Themes',
        category: 'Preferences',
        icon: Settings,
        action: () => {
          setActiveScreen('settings');
        },
      },
      {
        id: 'run-app',
        label: 'Run App on Connected Device',
        category: 'Run',
        icon: Play,
        action: () => {
          setActiveScreen('devices');
        },
      },
      {
        id: 'new-project',
        label: 'Create New Project (Visual Photo Templates)',
        category: 'Project',
        icon: Plus,
        action: () => {
          setNewProjectModalOpen(true);
        },
      },
    ],
    [
      activeProject,
      createFileOrFolder,
      setActiveScreen,
      setBottomPanelTab,
      setNewProjectModalOpen,
      setSdkManagerModalOpen,
      setSearchModalOpen,
      triggerBuild,
    ]
  );

  const filteredCommands = useMemo(() => {
    const q = cmdFilter.trim().toLowerCase();
    if (!q) return paletteCommands;
    return paletteCommands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [cmdFilter, paletteCommands]);

  const handleSelectVisualTemplate = (tplId: ProjectTemplateId) => {
    setTemplateId(tplId);
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === tplId);
    if (tpl) {
      setProjLang(tpl.defaultLang);
      setBuildSys(tpl.defaultBuildSystem);
    }
  };

  const handleSelectLanguage = (lang: ProjectLanguage) => {
    setProjLang(lang);
    if (lang === 'Kotlin') setBuildSys('Kotlin Gradle DSL');
    else if (lang === 'Java') setBuildSys('Java Groovy Gradle');
    else if (lang === 'React') {
      setBuildSys('React Vite + Capacitor');
      setTemplateId('react_webview');
    } else if (lang === 'Flutter') {
      setBuildSys('Flutter + Gradle');
      setTemplateId('flutter_app');
    }
  };

  const toggleNewProjPermission = (permId: string) => {
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !pkgName.trim()) return;
    createProject({
      name: projName.trim(),
      packageName: pkgName.trim(),
      language: projLang,
      template: templateId,
      minSdk,
      buildSystem: buildSys,
      permissions: selectedPerms,
    });
  };

  const handleGitCloneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    cloneRepository(repoUrl.trim(), cloneBranch.trim() || 'main');
  };

  return (
    <>
      {/* 1. NEW PROJECT MODAL WITH VISUAL PHOTO TEMPLATES */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-display font-bold text-slate-100">
                  New Project Gallery — Select Visual Template
                </h2>
                <p className="text-xs text-slate-400">
                  Choose a visual template for Kotlin, Java, React, or Flutter and configure project permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewProjectModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateProjectSubmit}
              className="p-5 space-y-5 text-xs overflow-y-auto flex-1"
            >
              {/* Visual Photo Template Gallery Grid */}
              <div>
                <label className="block text-slate-200 font-semibold mb-2.5">
                  1. Choose Visual Project Template (Photo Preview)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PROJECT_TEMPLATES.map((tpl) => {
                    const isSelected = templateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectVisualTemplate(tpl.id)}
                        className={`group rounded-xl border overflow-hidden cursor-pointer transition-all flex flex-col ${
                          isSelected
                            ? 'border-emerald-400 ring-2 ring-emerald-400/50 bg-slate-800/90'
                            : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                        }`}
                      >
                        {/* Photo Thumbnail with Fallback */}
                        <div className="relative h-28 w-full bg-slate-950 overflow-hidden">
                          <img
                            src={tpl.previewImage}
                            alt={tpl.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                          <span className="absolute bottom-2 left-2.5 text-[10px] font-mono text-emerald-300">
                            {tpl.category}
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="font-semibold text-slate-100 text-xs truncate">
                              {tpl.name}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                              {tpl.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project Name & Package Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Project Name</label>
                  <input
                    type="text"
                    value={projName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProjName(val);
                      const cleanSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '') || 'app';
                      setPkgName(`com.example.${cleanSlug}`);
                    }}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Package Name</label>
                  <input
                    type="text"
                    value={pkgName}
                    onChange={(e) => setPkgName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-slate-100"
                  />
                </div>
              </div>

              {/* Language & Framework Selection (Kotlin, Java, React, Flutter) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    2. Language / Framework (Kotlin · Java · React · Flutter)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Kotlin', 'Java', 'React', 'Flutter'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleSelectLanguage(lang)}
                        className={`py-2 px-2 rounded-lg border text-center font-semibold transition-colors cursor-pointer ${
                          projLang === lang
                            ? 'bg-emerald-600 text-slate-950 border-emerald-500'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">Build System</label>
                    <select
                      value={buildSys}
                      onChange={(e) => setBuildSys(e.target.value as ProjectBuildSystem)}
                      className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                    >
                      <option value="Kotlin Gradle DSL">Kotlin Gradle DSL</option>
                      <option value="Java Groovy Gradle">Java Groovy Gradle</option>
                      <option value="React Vite + Capacitor">React Vite + Capacitor</option>
                      <option value="Flutter + Gradle">Flutter + Gradle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">Minimum SDK</label>
                    <select
                      value={minSdk}
                      onChange={(e) => setMinSdk(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                    >
                      <option value="Android 8.0 (API 26)">Android 8.0 (API 26)</option>
                      <option value="Android 10.0 (API 29)">Android 10.0 (API 29)</option>
                      <option value="Android 12.0 (API 31)">Android 12.0 (API 31)</option>
                      <option value="Android 14.0 (API 34)">Android 14.0 (API 34)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Project Permissions Checklist */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  3. Android Manifest Permissions
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ANDROID_PERMISSIONS_LIST.map((p) => {
                    const checked = selectedPerms.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        onClick={() => toggleNewProjPermission(p.id)}
                        className={`px-2.5 py-2 rounded-lg border flex items-center gap-2 cursor-pointer select-none ${
                          checked
                            ? 'bg-emerald-950/30 border-emerald-600/60 text-slate-100'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded text-emerald-500"
                        />
                        <span className="truncate text-[11px]">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold cursor-pointer"
                >
                  Create {projLang} Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ANDROID STUDIO SDK & TOOLCHAIN INSTALLER MODAL (Kotlin, Java, Gradle, React, Flutter) */}
      {sdkManagerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-display font-bold text-slate-100">
                    Android Studio SDK & Toolchain Installer
                  </h2>
                  <p className="text-xs text-slate-400">
                    Install & verify Kotlin, OpenJDK Java, Gradle, React Node.js, Flutter SDK, and Android SDK Platform 34.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSdkManagerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-300">
                  SDK Location:{' '}
                  <span className="font-mono text-emerald-400">
                    /data/data/com.codestudio/files/sdk
                  </span>
                </div>
                <button
                  type="button"
                  onClick={installAllToolchains}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Verify & Update All SDKs (100%)</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {toolchains.map((tc) => (
                  <div
                    key={tc.id}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-slate-100">
                          {tc.name}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          · v{tc.version} · {tc.sizeMb} MB
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{tc.description}</p>
                      <div className="text-[11px] font-mono text-slate-500 truncate">
                        Binary: {tc.binaryPath}
                      </div>

                      {tc.installing && (
                        <div className="pt-1">
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-200"
                              style={{ width: `${tc.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400">
                            Installing & linking ARM64 binaries... {tc.progress}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        disabled={tc.installing}
                        onClick={() => installToolchain(tc.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-emerald-300 cursor-pointer"
                      >
                        {tc.installing ? 'Installing...' : 'Installed ✓ (Re-verify)'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ANDROID APK PACKAGE INSTALLER & PERMISSIONS MODAL (100% Install & Launch) */}
      {activeInstallApk && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-display font-bold text-slate-100">
                    Android Package Installer
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">
                    {activeInstallApk.fileName} · v{activeInstallApk.versionName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveInstallApk(null)}
                className="p-1 text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-100 truncate">
                    {activeInstallApk.projectName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {activeInstallApk.packageName}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">
                    {activeInstallApk.language || 'Kotlin'} ·{' '}
                    {(activeInstallApk.sizeBytes / (1024 * 1024)).toFixed(2)} MB · Target: This Device
                  </div>
                </div>
              </div>

              {/* Runtime Permissions Confirmation */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Grant App Permissions:</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  {ANDROID_PERMISSIONS_LIST.map((perm) => {
                    const isGranted = grantedInstallPerms.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        onClick={() =>
                          setGrantedInstallPerms((prev) =>
                            prev.includes(perm.id)
                              ? prev.filter((p) => p !== perm.id)
                              : [...prev, perm.id]
                          )
                        }
                        className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/60 cursor-pointer select-none"
                      >
                        <span className="text-slate-200">{perm.label}</span>
                        <input
                          type="checkbox"
                          checked={isGranted}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-emerald-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar / Install Status */}
              {installStage !== 'ready' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-emerald-300">
                      {installStage === 'done'
                        ? '✓ Application Installed 100%!'
                        : 'Installing APK & granting permissions...'}
                    </span>
                    <span className="text-slate-300">{installProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${installProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveInstallApk(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Close
                </button>

                {installStage === 'ready' && (
                  <button
                    type="button"
                    onClick={startApkInstallation}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install APK (100%)</span>
                  </button>
                )}

                {installStage === 'installing' && (
                  <button
                    type="button"
                    disabled
                    className="px-5 py-2 rounded-lg bg-emerald-600/60 text-slate-950 font-semibold flex items-center gap-1.5"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Installing...</span>
                  </button>
                )}

                {installStage === 'done' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInstallApk(null);
                      setActiveScreen('devices');
                    }}
                    className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Open Installed App</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. GLOBAL SEARCH EVERYWHERE MODAL */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-14 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-slate-100">
                    Search Everywhere ({activeProject.name})
                  </h2>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                  {(['all', 'files', 'symbols'] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setSearchScope(sc)}
                      className={`px-2.5 py-1 rounded capitalize font-medium ${
                        searchScope === sc
                          ? 'bg-emerald-600 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className="sm:col-span-6 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={globalQuery}
                    onChange={(e) => setGlobalQuery(e.target.value)}
                    placeholder="Search project code, files, symbols..."
                    autoFocus
                    className="bg-transparent text-slate-100 focus:outline-none w-full"
                  />
                </div>
                <div className="sm:col-span-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700">
                  <Replace className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={globalReplace}
                    onChange={(e) => setGlobalReplace(e.target.value)}
                    placeholder="Replace all with..."
                    className="bg-transparent text-slate-100 focus:outline-none w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGlobalReplaceAll}
                  className="sm:col-span-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold whitespace-nowrap"
                >
                  Replace All
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2">
              {searchResults.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  No matches found in {activeProject.name}.
                </div>
              ) : (
                searchResults.map((res, i) => (
                  <button
                    key={`${res.filePath}-${res.line}-${i}`}
                    type="button"
                    onClick={() => {
                      openFile(res.filePath, res.line);
                      setSearchModalOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-800/70 rounded-lg transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-emerald-300">
                        {res.fileName}{' '}
                        <span className="font-mono font-normal text-slate-400">
                          · Line {res.line}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-300 truncate mt-0.5">
                        {res.snippet}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {res.filePath}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. COMMAND PALETTE MODAL */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 flex items-center gap-2.5">
              <Command className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={cmdFilter}
                onChange={(e) => setCmdFilter(e.target.value)}
                placeholder="Search IDE commands (> Build APK, SDK Installer, Open Terminal)..."
                autoFocus
                className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              {filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => {
                      setCommandPaletteOpen(false);
                      cmd.action();
                    }}
                    className="w-full px-3 py-2.5 rounded-lg hover:bg-slate-800 text-left flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="flex items-center gap-2.5 text-slate-100 font-medium">
                      <Icon className="w-4 h-4 text-emerald-400" />
                      <span>&gt; {cmd.label}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{cmd.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. GIT CLONE MODAL */}
      {gitCloneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-100">
                Clone Git Repository
              </h2>
              <button
                type="button"
                onClick={() => setGitCloneModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGitCloneSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Repository URL (HTTPS or SSH)
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Branch</label>
                <input
                  type="text"
                  value={cloneBranch}
                  onChange={(e) => setCloneBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGitCloneModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-slate-950 font-semibold"
                >
                  Clone into Projects
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. ABOUT MODAL */}
      {aboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-display font-bold text-slate-100">
                  About CodeStudio Mobile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAboutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              <strong>CodeStudio Mobile</strong> is an offline-first Android Studio IDE for Kotlin, Java, React, and Flutter development directly on your phone.
            </p>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
              <div>Languages: Kotlin 2.0 · Java 17 · React 19 · Flutter 3.24</div>
              <div>Build Engines: Gradle 8.7 · Vite Capacitor · Dart AOT</div>
              <div>Storage: /storage/emulated/0/CodeStudio</div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAboutModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-slate-950 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
