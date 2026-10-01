import React, { useMemo, useState } from 'react';
import {
  Command,
  FileCode,
  FolderGit2,
  Hammer,
  Info,
  Play,
  Plus,
  Replace,
  Search,
  Settings,
  Terminal,
  X,
} from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';
import { PROJECT_TEMPLATES } from '../../services/templates';
import { ProjectTemplateId } from '../../types/ide';

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
    createProject,
    cloneRepository,
    projects,
    activeProjectId,
    openFile,
    updateFileContent,
    triggerBuild,
    setActiveScreen,
    setBottomPanelTab,
    createFileOrFolder,
  } = useIdeStore();

  // New Project Form State (Section 5 of PRD)
  const [projName, setProjName] = useState('MyApplication');
  const [pkgName, setPkgName] = useState('com.example.myapplication');
  const [projLang, setProjLang] = useState<'Kotlin' | 'Java' | 'React / TypeScript'>('Kotlin');
  const [templateId, setTemplateId] = useState<ProjectTemplateId>('empty_activity');
  const [minSdk, setMinSdk] = useState('Android 8.0 (API 26)');
  const [buildSys, setBuildSys] = useState<
    'Gradle (Kotlin DSL)' | 'Gradle (Groovy)' | 'Vite + Capacitor'
  >('Gradle (Kotlin DSL)');

  // Git Clone State
  const [repoUrl, setRepoUrl] = useState('https://github.com/android/nowinandroid.git');
  const [cloneBranch, setCloneBranch] = useState('main');

  // Global Search Everywhere State (Section 17 of PRD)
  const [globalQuery, setGlobalQuery] = useState('MainActivity');
  const [globalReplace, setGlobalReplace] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'files' | 'symbols'>('all');

  // Command Palette Filter (Section 18 of PRD)
  const [cmdFilter, setCmdFilter] = useState('');

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  // Compute Global Search Results
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

  // Command Palette Items (Section 18 of PRD)
  const paletteCommands = useMemo(
    () => [
      {
        id: 'build-apk',
        label: 'Build APK (:app:assembleDebug)',
        category: 'Build',
        icon: Hammer,
        action: () => {
          triggerBuild('apk');
          setActiveScreen('build');
        },
      },
      {
        id: 'new-file',
        label: 'New Kotlin Class in Project',
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
        label: 'Create New Android Project',
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
    });
  };

  const handleGitCloneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    cloneRepository(repoUrl.trim(), cloneBranch.trim() || 'main');
  };

  return (
    <>
      {/* 1. NEW PROJECT MODAL (Section 5 of PRD) */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-100">
                Create New Android Project
              </h2>
              <button
                type="button"
                onClick={() => setNewProjectModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="p-5 space-y-4 text-xs">
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

              {/* Language Radio Selection */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Kotlin', 'Java', 'React / TypeScript'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setProjLang(lang)}
                      className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                        projLang === lang
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Project Template</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value as ProjectTemplateId)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                >
                  {PROJECT_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} — {tpl.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Minimum SDK</label>
                  <select
                    value={minSdk}
                    onChange={(e) => setMinSdk(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="Android 8.0 (API 26)">Android 8.0 (API 26)</option>
                    <option value="Android 10.0 (API 29)">Android 10.0 (API 29)</option>
                    <option value="Android 12.0 (API 31)">Android 12.0 (API 31)</option>
                    <option value="Android 14.0 (API 34)">Android 14.0 (API 34)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Build System</label>
                  <select
                    value={buildSys}
                    onChange={(e) =>
                      setBuildSys(
                        e.target.value as
                          | 'Gradle (Kotlin DSL)'
                          | 'Gradle (Groovy)'
                          | 'Vite + Capacitor'
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="Gradle (Kotlin DSL)">Gradle (Kotlin DSL)</option>
                    <option value="Gradle (Groovy)">Gradle (Groovy)</option>
                    <option value="Vite + Capacitor">Vite + Capacitor</option>
                  </select>
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
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. GLOBAL SEARCH EVERYWHERE MODAL (Section 17 of PRD) */}
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

      {/* 3. COMMAND PALETTE MODAL (Section 18 of PRD) */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 flex items-center gap-2.5">
              <Command className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={cmdFilter}
                onChange={(e) => setCmdFilter(e.target.value)}
                placeholder="Search IDE commands (> Build APK, New File, Open Terminal)..."
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

      {/* 4. GIT CLONE MODAL */}
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

      {/* 5. ABOUT MODAL (Section 30 of PRD) */}
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
              <strong>CodeStudio Mobile</strong> is an offline-first Android Studio IDE designed for mobile phones and touchscreens. Create Kotlin, Java, and React hybrid apps, edit XML layouts visually, run Gradle builds, inspect Logcat, and manage APK artifacts directly on your device.
            </p>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
              <div>Layer 1: React 19 + TypeScript + Zustand IDE Engine</div>
              <div>Layer 2: Android Native Bridge (FS / Gradle / JDK 17 / ADB)</div>
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
