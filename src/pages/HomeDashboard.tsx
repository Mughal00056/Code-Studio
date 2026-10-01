import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Download,
  FolderGit2,
  FolderOpen,
  HardDrive,
  Layers,
  Package,
  Plus,
  Settings,
  Smartphone,
  Terminal,
  Trash2,
  Upload,
} from 'lucide-react';
import { useIdeStore } from '../stores/ideStore';
import { detectLanguage, PROJECT_TEMPLATES } from '../services/templates';
import { FileNode, ProjectTemplateId } from '../types/ide';
import { usePWAInstall } from '../hooks/usePWAInstall';

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
}

export const HomeDashboard: React.FC = () => {
  const {
    projects,
    activeProjectId,
    selectProject,
    createProject,
    deleteProject,
    importProjectFiles,
    setNewProjectModalOpen,
    setGitCloneModalOpen,
    setSdkManagerModalOpen,
    setActiveInstallApk,
    setActiveScreen,
    setBottomPanelTab,
    apkArtifacts,
    toolchains,
    settings,
  } = useIdeStore();

  const { isInstallable, isInstalled, install } = usePWAInstall();
  const zipInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleQuickCreateFromPhotoTemplate = (tplId: ProjectTemplateId) => {
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === tplId) || PROJECT_TEMPLATES[0];
    const suffix = Math.floor(10 + Math.random() * 89);
    const cleanBase = tpl.name.split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'App';
    const name = `${cleanBase}App${suffix}`;
    createProject({
      name,
      packageName: `com.codestudio.${name.toLowerCase()}`,
      language: tpl.defaultLang,
      template: tpl.id,
      minSdk: 'Android 8.0 (API 26)',
      buildSystem: tpl.defaultBuildSystem,
      permissions: [
        'android.permission.INTERNET',
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
      ],
    });
  };

  const handleImportZipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportStatus(`Extracting ${file.name}...`);
      const zip = await JSZip.loadAsync(file);
      const extractedNodes: FileNode[] = [];
      const folderSet = new Set<string>();
      const now = Date.now();

      const entries = Object.keys(zip.files);
      for (const rawPath of entries) {
        const entry = zip.files[rawPath];
        const cleanPath = rawPath.replace(/^\/+|\/+$/g, '');
        if (!cleanPath) continue;

        if (entry.dir) {
          folderSet.add(cleanPath);
        } else {
          const parts = cleanPath.split('/');
          for (let i = 1; i < parts.length; i++) {
            folderSet.add(parts.slice(0, i).join('/'));
          }
          const content = await entry.async('string');
          const fileName = parts[parts.length - 1];
          extractedNodes.push({
            id: `zip-file-${cleanPath}-${now}`,
            name: fileName,
            path: cleanPath,
            type: 'file',
            content,
            language: detectLanguage(fileName),
            lastModified: now,
          });
        }
      }

      const folderNodes: FileNode[] = Array.from(folderSet)
        .sort()
        .map((folderPath) => {
          const segs = folderPath.split('/');
          return {
            id: `zip-folder-${folderPath}-${now}`,
            name: segs[segs.length - 1],
            path: folderPath,
            type: 'folder',
            lastModified: now,
          };
        });

      const projName =
        file.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, '') || 'ImportedApp';
      importProjectFiles(
        projName,
        `com.imported.${projName.toLowerCase()}`,
        [...folderNodes, ...extractedNodes]
      );
      setImportStatus(null);
    } catch {
      setImportStatus('Failed to read ZIP archive. Ensure it is a valid .zip file.');
      setTimeout(() => setImportStatus(null), 3000);
    }
    e.target.value = '';
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F17] p-4 sm:p-6 lg:p-10 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Welcome & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <p className="text-xs font-mono text-emerald-400 mb-1">
              Kotlin · Java · React · Flutter · Gradle 8.7
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-100 tracking-tight">
              Build Android apps directly from your phone.
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
              Create Kotlin, Java, React, or Flutter projects from visual templates, manage SDK toolchains, configure Android permissions, and install APKs 100%.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setNewProjectModalOpen(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>

            <button
              type="button"
              onClick={() => setSdkManagerModalOpen(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-slate-800 text-slate-100 font-medium text-xs sm:text-sm border border-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>SDK & Toolchains</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (isInstallable) {
                  await install();
                } else if (apkArtifacts[0]) {
                  setActiveInstallApk(apkArtifacts[0]);
                }
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalled ? 'Install APK (100%)' : 'Install App'}</span>
            </button>
          </div>
        </div>

        {importStatus && (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-emerald-300">
            {importStatus}
          </div>
        )}

        {/* Visual Photo Project Templates Gallery (Photo Previews!) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Visual Project Templates (Kotlin · Java · React · Flutter)
              </h2>
              <p className="text-xs text-slate-400">
                Tap any visual template card to create a project immediately or customize in the wizard.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewProjectModalOpen(true)}
              className="text-xs font-medium text-emerald-400 hover:underline cursor-pointer"
            >
              View All 8 Templates →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROJECT_TEMPLATES.slice(0, 4).map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => handleQuickCreateFromPhotoTemplate(tpl.id)}
                className="group rounded-xl bg-[#111827] border border-slate-800/90 hover:border-emerald-500/70 overflow-hidden cursor-pointer transition-all flex flex-col"
              >
                <div className="relative h-36 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={tpl.previewImage}
                    alt={tpl.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-emerald-300 font-semibold">{tpl.defaultLang}</span>
                    <span className="text-slate-300">{tpl.defaultBuildSystem}</span>
                  </div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 font-mono">API 26+</span>
                    <span className="font-semibold text-emerald-400">Create Project +</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={() => setActiveScreen('workspace')}
            className="p-4 rounded-xl bg-[#111827] hover:bg-slate-800/80 border border-slate-800/80 text-left transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-slate-100">Open IDE Editor</div>
            <div className="text-xs text-slate-400 mt-0.5">Code & XML Designer</div>
          </button>

          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            className="p-4 rounded-xl bg-[#111827] hover:bg-slate-800/80 border border-slate-800/80 text-left transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center mb-3 text-sky-400">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-slate-100">Import ZIP</div>
            <div className="text-xs text-slate-400 mt-0.5">Extract source archive</div>
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleImportZipFile}
            />
          </button>

          <button
            type="button"
            onClick={() => setGitCloneModalOpen(true)}
            className="p-4 rounded-xl bg-[#111827] hover:bg-slate-800/80 border border-slate-800/80 text-left transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3 text-purple-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-slate-100">Git Clone</div>
            <div className="text-xs text-slate-400 mt-0.5">Clone GitHub repository</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setBottomPanelTab('terminal');
              setActiveScreen('workspace');
            }}
            className="p-4 rounded-xl bg-[#111827] hover:bg-slate-800/80 border border-slate-800/80 text-left transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3 text-amber-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-slate-100">Terminal & Gradle</div>
            <div className="text-xs text-slate-400 mt-0.5">Run Gradle, Flutter & ADB</div>
          </button>
        </div>

        {/* Main Two-Column Section: Recent Projects + SDK Toolchain & Storage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Projects List */}
          <div className="lg:col-span-8 p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">
                Workspaces (Kotlin · Flutter · React · Java)
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {projects.length} local projects
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {projects.map((proj) => {
                const isCurrent = proj.id === activeProjectId;
                const fileCount = proj.files.filter((f) => f.type === 'file').length;

                return (
                  <div
                    key={proj.id}
                    onClick={() => selectProject(proj.id)}
                    className={`py-3.5 px-3 -mx-3 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                      isCurrent ? 'bg-slate-800/50' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-emerald-400">
                        {proj.language === 'React' ? (
                          <Code2 className="w-5 h-5 text-sky-400" />
                        ) : proj.language === 'Flutter' ? (
                          <Layers className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <Smartphone className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100 truncate">
                            {proj.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] font-mono text-emerald-400">
                              · Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-slate-200 font-medium">{proj.language}</span>
                          <span aria-hidden="true">·</span>
                          <span>{proj.buildSystem}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{proj.packageName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{fileCount} files</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(proj.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectProject(proj.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                      >
                        Open
                      </button>
                      {projects.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(proj.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Installed SDK Toolchains & File Storage */}
          <div className="lg:col-span-4 p-5 rounded-xl bg-[#111827] border border-slate-800/80 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">Installed SDKs</h2>
                <HardDrive className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="space-y-2 text-xs">
                {toolchains.map((tc) => (
                  <div
                    key={tc.id}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/90 border border-slate-800"
                  >
                    <span className="flex items-center gap-2 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{tc.category}</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">v{tc.version}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setSdkManagerModalOpen(true)}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-xs text-emerald-300 font-medium flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Manage SDK & Compilers</span>
                </span>
                <span className="font-mono">100%</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('build')}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                  <span>APK Manager & Installer</span>
                </span>
                <span className="font-mono text-slate-400">{apkArtifacts.length} APKs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('settings')}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-sky-400" />
                  <span>IDE Settings & Themes</span>
                </span>
                <span className="font-mono capitalize text-slate-400">{settings.theme}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
