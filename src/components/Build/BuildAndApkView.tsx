import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  CheckCircle2,
  CircleDot,
  Download,
  FolderArchive,
  FolderOpen,
  Hammer,
  Info,
  Loader2,
  Package,
  Play,
  RefreshCw,
  Share2,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';
import { ApkArtifact } from '../../types/ide';

export const BuildAndApkView: React.FC = () => {
  const {
    projects,
    activeProjectId,
    buildVariant,
    setBuildVariant,
    cleanBeforeBuild,
    setCleanBeforeBuild,
    isBuilding,
    buildSteps,
    buildLogs,
    apkArtifacts,
    triggerBuild,
    installApkOnDevice,
    deleteApkArtifact,
    createFileOrFolder,
    openFile,
    setActiveScreen,
    appendLogcat,
  } = useIdeStore();

  const [selectedApkInfo, setSelectedApkInfo] = useState<ApkArtifact | null>(
    apkArtifacts[0] || null
  );
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const latestArtifact = apkArtifacts[0] || null;

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 2800);
  };

  const handleDownloadOrShareApk = async (apk: ApkArtifact) => {
    const zip = new JSZip();
    zip.file(
      'AndroidManifest.xml',
      `<?xml version="1.0" encoding="utf-8"?>\n<manifest package="${apk.packageName}" android:versionCode="${apk.versionCode}" android:versionName="${apk.versionName}">\n  <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34" />\n</manifest>`
    );
    zip.file(
      'META-INF/MANIFEST.MF',
      `Manifest-Version: 1.0\nCreated-By: CodeStudio Mobile Gradle 8.7\nPackage: ${apk.packageName}\nVariant: ${apk.variant}\n`
    );
    zip.file(
      'classes.dex.txt',
      `DEX Bytecode Stub for ${apk.activities.join(', ')} (Compiled at ${new Date(
        apk.createdAt
      ).toISOString()})`
    );
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = apk.fileName;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${apk.fileName} to device storage`);
  };

  const handleExtractApk = (apk: ApkArtifact) => {
    const summaryContent = `// Extracted APK Inspection Report: ${apk.fileName}
// Package: ${apk.packageName}
// Version: ${apk.versionName} (Code ${apk.versionCode})
// Output Path: ${apk.outputPath}

Permissions:
${apk.permissions.map((p) => `- ${p}`).join('\n')}

Activities:
${apk.activities.map((a) => `- ${a}`).join('\n')}

Services:
${apk.services.map((s) => `- ${s}`).join('\n')}
`;
    createFileOrFolder('extracted_apk', `${apk.fileName}.info.txt`, 'file', summaryContent);
    openFile(`extracted_apk/${apk.fileName}.info.txt`);
    appendLogcat('I', 'ApkExtractor', `Extracted ${apk.fileName} manifest to extracted_apk/`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F17] p-4 sm:p-6 lg:p-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-100">
              Gradle Build System & APK Manager
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Project: <span className="text-slate-200 font-medium">{activeProject.name}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span className="font-mono text-xs">{activeProject.packageName}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span>{activeProject.buildSystem}</span>
            </p>
          </div>

          {statusBanner && (
            <div className="px-3.5 py-2 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-xs text-emerald-300 font-medium">
              {statusBanner}
            </div>
          )}
        </div>

        {/* Top Grid: Build Configuration (Section 11) + Build Output Pipeline (Section 12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Build Controls Column */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-[#111827] border border-slate-800/80 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">Build Configuration</h2>
                <span className="text-xs font-mono text-slate-400">Gradle 8.7</span>
              </div>

              {/* Variant Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Build Variant
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-900 border border-slate-800">
                  {(['debug', 'release'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBuildVariant(v)}
                      className={`py-2 px-3 rounded-md text-xs font-semibold capitalize transition-colors ${
                        buildVariant === v
                          ? 'bg-emerald-600 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean Before Build Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={cleanBeforeBuild}
                  onChange={(e) => setCleanBeforeBuild(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-300">
                  Clean build directory before compiling (`:app:clean`)
                </span>
              </label>

              {/* Primary Build Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isBuilding}
                  onClick={() => triggerBuild('apk')}
                  className="min-h-[44px] py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isBuilding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Hammer className="w-4 h-4" />
                  )}
                  <span>Build APK</span>
                </button>

                <button
                  type="button"
                  disabled={isBuilding}
                  onClick={() => triggerBuild('aab')}
                  className="min-h-[44px] py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Build AAB</span>
                </button>
              </div>

              {/* Secondary Build Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isBuilding}
                  onClick={() => triggerBuild('clean')}
                  className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clean Project</span>
                </button>
                <button
                  type="button"
                  disabled={isBuilding}
                  onClick={() => triggerBuild('rebuild')}
                  className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rebuild Project</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Target SDK</span>
                <span className="font-mono text-slate-300">API 34 (Android 14)</span>
              </div>
              <div className="flex justify-between">
                <span>Min SDK</span>
                <span className="font-mono text-slate-300">{activeProject.minSdk}</span>
              </div>
            </div>
          </div>

          {/* Build Output Column (Section 12) */}
          <div className="lg:col-span-7 p-5 rounded-xl bg-[#111827] border border-slate-800/80 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">Build Output</h2>
              <span className="text-xs font-mono text-emerald-400">
                {isBuilding ? 'Gradle Running...' : 'BUILD SUCCESSFUL'}
              </span>
            </div>

            {/* 5 Stage Pipeline Steps */}
            <div className="space-y-2">
              {buildSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : step.status === 'running' ? (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                    ) : (
                      <CircleDot className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className="font-medium text-slate-200">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                    <span className="hidden sm:inline">{step.taskName}</span>
                    {step.durationMs && <span>{step.durationMs}ms</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Streaming Build Console */}
            <div className="p-3 rounded-lg bg-[#090D14] border border-slate-800 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto space-y-1">
              {buildLogs.map((ln, i) => (
                <div
                  key={i}
                  className={
                    ln.startsWith('BUILD SUCCESSFUL')
                      ? 'text-emerald-400 font-semibold'
                      : 'text-slate-300'
                  }
                >
                  {ln || '\u00A0'}
                </div>
              ))}
            </div>

            {/* Latest Artifact Quick Action Row */}
            {latestArtifact && (
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">Generated Artifact Output</div>
                  <div className="text-xs font-mono text-emerald-300 truncate">
                    {latestArtifact.outputPath}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      installApkOnDevice(latestArtifact.id);
                      showToast(`Installed ${latestArtifact.fileName} onto This Device`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Install</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadOrShareApk(latestArtifact)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('workspace')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Open Folder</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: APK Manager & Manifest Inspector (Section 15) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* APK Artifacts List */}
          <div className="lg:col-span-7 p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">APK Manager</h2>
              <span className="text-xs text-slate-400">
                /storage/emulated/0/CodeStudio/APKs · {apkArtifacts.length} packages
              </span>
            </div>

            {apkArtifacts.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No APK or AAB packages generated yet. Click "Build APK" above to compile your first package.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {apkArtifacts.map((apk) => {
                  const sizeMb = (apk.sizeBytes / (1024 * 1024)).toFixed(2);
                  const isSelected = selectedApkInfo?.id === apk.id;
                  const isInstalled = apk.installedOnDeviceIds.length > 0;

                  return (
                    <div
                      key={apk.id}
                      onClick={() => setSelectedApkInfo(apk)}
                      className={`py-3.5 px-3 -mx-3 rounded-lg transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected ? 'bg-slate-800/60' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-100 truncate">
                            {apk.fileName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-1.5">
                          <span>{sizeMb} MB</span>
                          <span>·</span>
                          <span>v{apk.versionName} ({apk.versionCode})</span>
                          <span>·</span>
                          <span className="capitalize">{apk.variant}</span>
                          {isInstalled && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-400">Installed on Device</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            installApkOnDevice(apk.id);
                            showToast(`Installed ${apk.fileName} onto This Device`);
                          }}
                          className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs"
                        >
                          Install
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadOrShareApk(apk);
                          }}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
                          title="Download / Share APK"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExtractApk(apk);
                          }}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
                          title="Extract APK Manifest & Resources"
                        >
                          <FolderArchive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApkInfo(apk);
                          }}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
                          title="Inspect APK Information"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteApkArtifact(apk.id);
                          }}
                          className="p-1.5 rounded bg-slate-900 hover:bg-rose-950/50 border border-slate-800 text-slate-400 hover:text-rose-300"
                          title="Delete Artifact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* APK Information Inspector (Section 15: Package name, Version, Version code, SDK, Permissions, Activities, Services, APK size) */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">APK Manifest Information</h2>
              <Smartphone className="w-4 h-4 text-emerald-400" />
            </div>

            {selectedApkInfo ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-y-2.5 py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">File Name</span>
                  <span className="font-mono text-slate-100 text-right truncate">
                    {selectedApkInfo.fileName}
                  </span>

                  <span className="text-slate-400">Package Name</span>
                  <span className="font-mono text-emerald-300 text-right truncate">
                    {selectedApkInfo.packageName}
                  </span>

                  <span className="text-slate-400">Version Name</span>
                  <span className="font-mono text-slate-200 text-right">
                    {selectedApkInfo.versionName}
                  </span>

                  <span className="text-slate-400">Version Code</span>
                  <span className="font-mono text-slate-200 text-right">
                    {selectedApkInfo.versionCode}
                  </span>

                  <span className="text-slate-400">Minimum SDK</span>
                  <span className="font-mono text-slate-200 text-right">
                    {selectedApkInfo.minSdk}
                  </span>

                  <span className="text-slate-400">Target SDK</span>
                  <span className="font-mono text-slate-200 text-right">
                    {selectedApkInfo.targetSdk}
                  </span>

                  <span className="text-slate-400">APK Size</span>
                  <span className="font-mono text-slate-200 text-right">
                    {(selectedApkInfo.sizeBytes / (1024 * 1024)).toFixed(2)} MB ({selectedApkInfo.sizeBytes.toLocaleString()} bytes)
                  </span>
                </div>

                <div>
                  <div className="text-slate-400 mb-1">Declared Permissions</div>
                  <div className="font-mono text-[11px] text-slate-300 space-y-1 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    {selectedApkInfo.permissions.map((perm) => (
                      <div key={perm} className="truncate">
                        {perm}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 mb-1">Activities & Services</div>
                  <div className="font-mono text-[11px] text-slate-300 space-y-1 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    {selectedApkInfo.activities.map((act) => (
                      <div key={act} className="truncate text-emerald-300">
                        Activity: {act}
                      </div>
                    ))}
                    {selectedApkInfo.services.map((srv) => (
                      <div key={srv} className="truncate text-sky-300">
                        Service: {srv}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Select an APK artifact from the list to inspect its compiled AndroidManifest metadata.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
