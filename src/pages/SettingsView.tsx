import React from 'react';
import {
  Code2,
  Cpu,
  HardDrive,
  Layers,
  Palette,
  Terminal as TerminalIcon,
} from 'lucide-react';
import { useIdeStore } from '../stores/ideStore';
import { IdeTheme } from '../types/ide';

const THEMES: { id: IdeTheme; label: string; previewBg: string; accent: string }[] = [
  { id: 'dark', label: 'Dark IDE (Default)', previewBg: '#0B0F17', accent: '#10B981' },
  { id: 'amoled', label: 'AMOLED Black', previewBg: '#000000', accent: '#10B981' },
  { id: 'dracula', label: 'Dracula', previewBg: '#282A36', accent: '#BD93F9' },
  { id: 'monokai', label: 'Monokai Pro', previewBg: '#272822', accent: '#A6E22E' },
  { id: 'solarized', label: 'Solarized Dark', previewBg: '#002B36', accent: '#2AA198' },
  { id: 'light', label: 'Light Studio', previewBg: '#F8FAFC', accent: '#059669' },
];

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useIdeStore();

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F17] p-4 sm:p-6 lg:p-8 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-5">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-100">
            IDE Settings, Themes & Native Bridge
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Customize the code editor, Gradle & JDK toolchain, terminal shell, and storage sandbox.
          </p>
        </div>

        {/* Section 20: Themes */}
        <div className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">Color Themes</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {THEMES.map((t) => {
              const isSelected = settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateSettings({ theme: t.id })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-400 bg-slate-800/90 ring-1 ring-emerald-400'
                      : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className="w-full h-10 rounded-lg border border-slate-700/60 mb-2.5 flex items-end p-1.5"
                    style={{ backgroundColor: t.previewBg }}
                  >
                    <div
                      className="w-6 h-1.5 rounded-full"
                      style={{ backgroundColor: t.accent }}
                    />
                  </div>
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {t.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid of Settings Categories (Section 19) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Editor Settings */}
          <div className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">Code Editor</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Editor Font Size (px)</span>
                <input
                  type="number"
                  min={10}
                  max={22}
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: Number(e.target.value) || 13 })}
                  className="w-20 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-100 text-right"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Tab Size (Spaces)</span>
                <select
                  value={settings.tabSize}
                  onChange={(e) => updateSettings({ tabSize: Number(e.target.value) })}
                  className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-100"
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                </select>
              </div>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-300">Show Line Numbers</span>
                <input
                  type="checkbox"
                  checked={settings.lineNumbers}
                  onChange={(e) => updateSettings({ lineNumbers: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-300">Word Wrap</span>
                <input
                  type="checkbox"
                  checked={settings.wordWrap}
                  onChange={(e) => updateSettings({ wordWrap: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-300">Syntax Highlighting</span>
                <input
                  type="checkbox"
                  checked={settings.syntaxHighlighting}
                  onChange={(e) => updateSettings({ syntaxHighlighting: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-300">Auto Save to Local Storage</span>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Build & Toolchain Settings */}
          <div className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <h2 className="text-base font-semibold text-slate-100">Build & Toolchain</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Gradle Distribution</label>
                <select
                  value={settings.gradleVersion}
                  onChange={(e) => updateSettings({ gradleVersion: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-100"
                >
                  <option value="8.7">Gradle 8.7 (Recommended)</option>
                  <option value="8.4">Gradle 8.4 LTS</option>
                  <option value="7.6.3">Gradle 7.6.3</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Embedded JDK Runtime</label>
                <select
                  value={settings.jdkVersion}
                  onChange={(e) => updateSettings({ jdkVersion: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-100"
                >
                  <option value="OpenJDK 17.0.11 (Embedded ARM64)">
                    OpenJDK 17.0.11 (Embedded ARM64)
                  </option>
                  <option value="OpenJDK 21.0.3 (Termux Bridge)">
                    OpenJDK 21.0.3 (Termux Bridge)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Android SDK Platform</label>
                <select
                  value={settings.androidSdkVersion}
                  onChange={(e) => updateSettings({ androidSdkVersion: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-100"
                >
                  <option value="Android 14.0 (API 34)">Android 14.0 (API 34)</option>
                  <option value="Android 13.0 (API 33)">Android 13.0 (API 33)</option>
                  <option value="Android 12.0 (API 31)">Android 12.0 (API 31)</option>
                </select>
              </div>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-300">Enable Gradle Build Cache</span>
                <input
                  type="checkbox"
                  checked={settings.buildCache}
                  onChange={(e) => updateSettings({ buildCache: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-300">Offline Gradle Dependency Mode</span>
                <input
                  type="checkbox"
                  checked={settings.offlineMode}
                  onChange={(e) => updateSettings({ offlineMode: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Terminal Settings */}
          <div className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-semibold text-slate-100">Terminal Environment</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Shell Binary</label>
                <input
                  type="text"
                  value={settings.shell}
                  onChange={(e) => updateSettings({ shell: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Terminal Font Size (px)</span>
                <input
                  type="number"
                  min={10}
                  max={20}
                  value={settings.terminalFontSize}
                  onChange={(e) =>
                    updateSettings({ terminalFontSize: Number(e.target.value) || 12 })
                  }
                  className="w-20 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-100 text-right"
                />
              </div>
            </div>
          </div>

          {/* General & Storage Location */}
          <div className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-semibold text-slate-100">General & File Storage</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Root Storage Directory</label>
                <input
                  type="text"
                  value={settings.storageLocation}
                  onChange={(e) => updateSettings({ storageLocation: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-100"
                />
              </div>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-300">Build Completion Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => updateSettings({ notifications: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 23 & 30: Two-Layer Architecture Reference (React UI Layer 1 + Native Android Engine Layer 2) */}
        <div className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">
              Two-Layer Mobile IDE Architecture (Layer 1 React + Layer 2 Native Android Bridge)
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            CodeStudio Mobile is architected in two cleanly separated layers: Layer 1 provides the complete Android Studio-grade React + TypeScript interface, Zustand stores, XML visual layout parser, and offline sandbox; Layer 2 connects to Android native execution via Capacitor or Termux IPC for native OpenJDK, Gradle, Android SDK, ADB, and PackageInstaller execution.
          </p>
        </div>
      </div>
    </div>
  );
};
