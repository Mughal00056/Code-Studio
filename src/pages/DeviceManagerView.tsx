import React, { useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Cpu,
  Download,
  Maximize2,
  Minimize2,
  Monitor,
  Play,
  Plug,
  Plus,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
  Wifi,
  XCircle,
} from 'lucide-react';
import { useIdeStore } from '../stores/ideStore';
import {
  downloadFullProjectZip,
  getProjectEstimatedSizeMb,
} from '../services/projectExporter';
import { parseAndroidXmlNodes } from '../components/Editor/XmlLayoutDesigner';

export const DeviceManagerView: React.FC = () => {
  const {
    devices,
    projects,
    activeProjectId,
    pairWirelessDevice,
    toggleDeviceConnection,
    appendLogcat,
  } = useIdeStore();

  const [ipInput, setIpInput] = useState('192.168.1.48:41255');
  const [pairCodeInput, setPairCodeInput] = useState('748291');
  const [tapCount, setTapCount] = useState(0);
  const [deviceNotice, setDeviceNotice] = useState<string | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'phone' | 'tablet' | 'full'>('full');
  const [fullscreenRunner, setFullscreenRunner] = useState(false);

  // Interactive state for React & Flutter live device runners
  const [reactDraft, setReactDraft] = useState('');
  const [reactNotes, setReactNotes] = useState<string[]>([
    'Configure Gradle offline cache',
    'Test APK signing with debug keystore',
    'Verify Capacitor WebView bridge',
  ]);
  const [flutterInput, setFlutterInput] = useState('');
  const [flutterItems, setFlutterItems] = useState<string[]>([
    'Hot Reload Ready',
    'Material 3 Theme',
    'ARM64 Impeller Engine',
  ]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const layoutFile = useMemo(
    () =>
      activeProject.files.find((f) => f.name === 'activity_main.xml') ||
      activeProject.files.find((f) => f.name.endsWith('.xml')) ||
      null,
    [activeProject]
  );

  const parsedXml = useMemo(
    () => parseAndroidXmlNodes(layoutFile?.content || ''),
    [layoutFile]
  );

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim() || !pairCodeInput.trim()) return;
    pairWirelessDevice(ipInput.trim(), pairCodeInput.trim());
    setDeviceNotice(`Paired Wireless ADB target at ${ipInput.trim()}`);
    setTimeout(() => setDeviceNotice(null), 2600);
  };

  const handleCaptureScreenshot = () => {
    appendLogcat(
      'I',
      'AdbScreencap',
      'Captured device framebuffer to /sdcard/Pictures/Screenshot_CodeStudio.png'
    );
    setDeviceNotice('Saved device screenshot to /storage/emulated/0/CodeStudio/Backups/');
    setTimeout(() => setDeviceNotice(null), 2600);
  };

  const handleHotReload = () => {
    appendLogcat(
      'I',
      activeProject.language === 'Flutter' ? 'FlutterRunner' : 'ActivityManager',
      `Hot Reloaded ${activeProject.name} (${activeProject.language}) in 140ms`
    );
    setDeviceNotice(`Hot Reloaded ${activeProject.name} (${activeProject.language}) on device`);
    setTimeout(() => setDeviceNotice(null), 2200);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F17] p-4 sm:p-6 lg:p-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-100">
              Device Manager & Live {activeProject.language} App Runner
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Test your {activeProject.language} ({activeProject.buildSystem}) application in full-size preview or on connected Android 14 targets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const estMb = getProjectEstimatedSizeMb(activeProject);
                setDeviceNotice(`Packaging & downloading ${activeProject.name}-Full-Project.zip (${estMb} MB)...`);
                await downloadFullProjectZip(activeProject);
                setTimeout(() => setDeviceNotice(null), 2600);
              }}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                Download Full Project (.zip · {getProjectEstimatedSizeMb(activeProject)} MB)
              </span>
            </button>

            {deviceNotice && (
              <div className="px-3.5 py-2 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-xs text-emerald-300">
                {deviceNotice}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Device Targets & Wireless ADB Pairing */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">Available Targets</h2>
                <span className="text-xs font-mono text-slate-400">
                  {devices.filter((d) => d.status === 'connected').length} connected
                </span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {devices.map((dev) => {
                  const isConnected = dev.status === 'connected';
                  return (
                    <div
                      key={dev.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          {dev.type === 'local' ? (
                            <Smartphone className="w-5 h-5 text-emerald-400" />
                          ) : dev.type === 'usb' ? (
                            <Plug className="w-5 h-5 text-sky-400" />
                          ) : (
                            <Wifi className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-100">
                              {dev.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span>{dev.androidVersion} (API {dev.apiLevel})</span>
                            <span>·</span>
                            <span>{dev.abi}</span>
                            <span>·</span>
                            <span>Battery {dev.batteryLevel}%</span>
                            {dev.ipAddress && (
                              <>
                                <span>·</span>
                                <span>{dev.ipAddress}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs mt-1">
                            {isConnected ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Connected ({dev.installedPackages.length} apps installed)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <XCircle className="w-3.5 h-3.5" />
                                Not connected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleDeviceConnection(dev.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isConnected
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                          }`}
                        >
                          {isConnected ? 'Disconnect' : 'Connect ADB'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Project Runtime Permissions Status */}
            <div className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Granted App Permissions on Device ({activeProject.name})</span>
                </span>
                <span className="text-xs font-mono text-emerald-400">All Allowed</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-slate-300">
                {(activeProject.permissions || ['android.permission.INTERNET']).map((p) => (
                  <span key={p} className="text-slate-300">
                    ✓ {p.replace('android.permission.', '')}
                  </span>
                ))}
              </div>
            </div>

            {/* Wireless ADB Pairing Card */}
            <form
              onSubmit={handlePairSubmit}
              className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">
                  Wireless ADB Pairing (Android 11+)
                </h2>
                <Wifi className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">IP Address & Port</label>
                  <input
                    type="text"
                    value={ipInput}
                    onChange={(e) => setIpInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">6-Digit Wi-Fi Pairing Code</label>
                  <input
                    type="text"
                    value={pairCodeInput}
                    onChange={(e) => setPairCodeInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                Pair Wireless Target
              </button>
            </form>
          </div>

          {/* Right Column: Large Interactive Device & Website App Runner (Supports Kotlin, Java, React, and Flutter!) */}
          <div
            className={`${
              fullscreenRunner
                ? 'fixed inset-0 z-50 p-6 bg-[#0B0F17] overflow-y-auto'
                : 'lg:col-span-7 p-5 rounded-xl bg-[#111827] border border-slate-800/80'
            } flex flex-col items-center space-y-4`}
          >
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  Live {activeProject.language} Website & App Preview ({getProjectEstimatedSizeMb(activeProject)} MB)
                </h2>
                <p className="text-xs text-slate-400">
                  Running:{' '}
                  <span className="font-mono text-emerald-400">{activeProject.packageName}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('phone')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer ${
                      previewViewport === 'phone'
                        ? 'bg-emerald-600 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Phone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('tablet')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer ${
                      previewViewport === 'tablet'
                        ? 'bg-emerald-600 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span>Tablet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('full')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer ${
                      previewViewport === 'full'
                        ? 'bg-emerald-600 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Full Size (100%)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleHotReload}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-emerald-300 flex items-center gap-1 cursor-pointer"
                  title="Hot Reload App"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reload</span>
                </button>
                <button
                  type="button"
                  onClick={handleCaptureScreenshot}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                  title="Capture Device Screenshot"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenRunner(!fullscreenRunner)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                  title={fullscreenRunner ? 'Exit Fullscreen' : 'Maximize Fullscreen Preview'}
                >
                  {fullscreenRunner ? (
                    <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Interactive Large Responsive App / Website Runner Frame */}
            <div
              className={`w-full ${
                previewViewport === 'phone'
                  ? 'max-w-[440px]'
                  : previewViewport === 'tablet'
                  ? 'max-w-[768px]'
                  : 'max-w-full'
              } rounded-2xl border-2 border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col flex-1 transition-all`}
            >
              <div className="h-8 px-4 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800">
                <span>09:41 · {activeProject.name}</span>
                <span>{activeProject.language} · API 34 · {getProjectEstimatedSizeMb(activeProject)} MB</span>
              </div>

              {/* FLUTTER LIVE RUNTIME */}
              {activeProject.language === 'Flutter' ? (
                <div className="p-6 flex-1 min-h-[520px] flex flex-col justify-between bg-[#0D1524] relative">
                  <div className="space-y-3">
                    <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-bold text-sky-300">
                        {activeProject.name} (Flutter)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Impeller</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-sky-500/30">
                      <div className="text-xs text-slate-400">StatefulWidget Counter</div>
                      <div className="text-2xl font-bold font-mono text-sky-300 mt-0.5">
                        {tapCount}
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={flutterInput}
                        onChange={(e) => setFlutterInput(e.target.value)}
                        placeholder="Add Flutter item..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!flutterInput.trim()) return;
                          setFlutterItems([flutterInput.trim(), ...flutterItems]);
                          appendLogcat('D', 'Flutter', `Added item "${flutterInput.trim()}" to state`);
                          setFlutterInput('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-semibold text-xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {flutterItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-center justify-between"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFlutterItems(flutterItems.filter((_, i) => i !== idx))
                            }
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flutter FloatingActionButton */}
                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        const next = tapCount + 1;
                        setTapCount(next);
                        appendLogcat('D', 'Flutter', `FloatingActionButton pressed: _counter=${next}`);
                      }}
                      className="w-12 h-12 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                      title="Flutter FloatingActionButton"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : activeProject.language === 'React' ? (
                /* REACT + CAPACITOR LIVE RUNTIME */
                <div className="p-6 flex-1 min-h-[520px] flex flex-col justify-between bg-[#0B111E]">
                  <div className="space-y-3">
                    <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-bold text-indigo-300">
                        {activeProject.name} (React 19)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Capacitor</span>
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={reactDraft}
                        onChange={(e) => setReactDraft(e.target.value)}
                        placeholder="Write a dev note..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!reactDraft.trim()) return;
                          setReactNotes([reactDraft.trim(), ...reactNotes]);
                          setTapCount((c) => c + 1);
                          appendLogcat('I', 'CapacitorConsole', `React state updated: added "${reactDraft.trim()}"`);
                          setReactDraft('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs cursor-pointer"
                      >
                        Save
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {reactNotes.map((note, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{note}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setReactNotes(reactNotes.filter((_, i) => i !== idx))
                            }
                            className="text-slate-500 hover:text-rose-400 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 pt-2">
                    WebView Bridge Active · {reactNotes.length} items
                  </div>
                </div>
              ) : (
                /* KOTLIN & JAVA NATIVE XML RUNTIME */
                <div
                  className="p-6 flex-1 min-h-[520px] flex flex-col gap-4"
                  style={{ backgroundColor: parsedXml.rootBg || '#0F172A' }}
                >
                  {parsedXml.nodes.map((node, i) => (
                    <div key={i}>
                      {node.tag === 'TextView' && (
                        <div
                          style={{
                            fontSize: `${parseInt(node.textSize, 10) || 16}px`,
                            color: node.textColor || '#F8FAFC',
                          }}
                        >
                          {i === 0 && tapCount > 0
                            ? `Action executed #${tapCount} in ${activeProject.name}`
                            : node.text}
                        </div>
                      )}
                      {node.tag === 'EditText' && (
                        <input
                          type="text"
                          placeholder={node.hint || 'Input text...'}
                          className="w-full px-3 py-2 rounded bg-slate-900/90 border-b border-emerald-400 text-xs text-slate-100"
                        />
                      )}
                      {node.tag === 'Button' && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = tapCount + 1;
                            setTapCount(next);
                            appendLogcat(
                              'D',
                              'MainActivity',
                              `[${activeProject.language}] User tapped ${node.id} on This Device (count=${next})`
                            );
                          }}
                          className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{node.text || 'Run Action'}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="px-3 py-2 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  PID 14280
                </span>
                <span>Events: {tapCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
