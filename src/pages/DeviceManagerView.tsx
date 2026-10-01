import React, { useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Cpu,
  Play,
  Plug,
  Smartphone,
  Wifi,
  XCircle,
} from 'lucide-react';
import { useIdeStore } from '../stores/ideStore';
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
    appendLogcat('I', 'AdbScreencap', 'Captured device framebuffer to /sdcard/Pictures/Screenshot_CodeStudio.png');
    setDeviceNotice('Saved device screenshot to /storage/emulated/0/CodeStudio/Backups/');
    setTimeout(() => setDeviceNotice(null), 2600);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F17] p-4 sm:p-6 lg:p-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-100">
              Device Manager & ADB Runtime
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage local phone execution, USB OTG debugging, and Wireless ADB pairing.
            </p>
          </div>

          {deviceNotice && (
            <div className="px-3.5 py-2 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-xs text-emerald-300">
              {deviceNotice}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Device Targets & Wireless ADB Pairing (Section 14) */}
          <div className="lg:col-span-7 space-y-6">
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
                          {/* Unboxed metadata per Zero-Pill Discipline */}
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
              <p className="text-xs text-slate-400">
                Pair directly with local wireless debugging on this device or another phone on the same Wi-Fi network.
              </p>

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

          {/* Right Column: Interactive Device App Runner */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-[#111827] border border-slate-800/80 flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-100">Live Device App Runner</h2>
                <p className="text-xs text-slate-400">
                  Running: <span className="font-mono text-emerald-400">{activeProject.packageName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleCaptureScreenshot}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5"
                title="Capture Device Screenshot"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Screenshot</span>
              </button>
            </div>

            {/* Interactive Phone Runner Frame */}
            <div className="w-full max-w-[290px] rounded-[26px] border-4 border-slate-800 bg-slate-950 shadow-xl overflow-hidden flex flex-col">
              <div className="h-6 px-4 bg-slate-950 flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800">
                <span>09:41</span>
                <span>API 34 · ARM64</span>
              </div>

              <div
                className="p-4 flex-1 min-h-[340px] flex flex-col gap-3"
                style={{ backgroundColor: parsedXml.rootBg || '#0F172A' }}
              >
                {parsedXml.nodes.map((node, i) => (
                  <div key={i}>
                    {node.tag === 'TextView' && (
                      <div
                        style={{
                          fontSize: `${ parseInt(node.textSize, 10) || 16 }px`,
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
                            `User tapped ${node.id} on This Device (count=${next})`
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

              <div className="px-3 py-2 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  PID 14280
                </span>
                <span>Clicks: {tapCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
