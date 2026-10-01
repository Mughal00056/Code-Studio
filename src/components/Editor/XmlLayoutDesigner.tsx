import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Layers,
  Layout,
  Maximize2,
  Minimize2,
  Monitor,
  Plus,
  Smartphone,
  Square,
  Tablet,
  Trash2,
  Type,
} from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';

export interface ParsedXmlNode {
  index: number;
  tag: string;
  id: string;
  text: string;
  hint: string;
  width: string;
  height: string;
  textSize: string;
  textColor: string;
  background: string;
  rawBlock: string;
}

const PALETTE_WIDGETS = [
  {
    tag: 'TextView',
    label: 'TextView',
    icon: Type,
    snippet: (idx: number) => `    <TextView
        android:id="@+id/tvItem${idx}"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="New TextView ${idx}"
        android:textSize="16sp"
        android:textColor="#F8FAFC" />`,
  },
  {
    tag: 'Button',
    label: 'Button',
    icon: Square,
    snippet: (idx: number) => `    <Button
        android:id="@+id/btnAction${idx}"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Action Button ${idx}"
        android:background="#10B981" />`,
  },
  {
    tag: 'EditText',
    label: 'EditText',
    icon: Type,
    snippet: (idx: number) => `    <EditText
        android:id="@+id/etInput${idx}"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Enter text ${idx}..."
        android:textColor="#F8FAFC" />`,
  },
  {
    tag: 'ImageView',
    label: 'ImageView',
    icon: ImageIcon,
    snippet: (idx: number) => `    <ImageView
        android:id="@+id/ivBanner${idx}"
        android:layout_width="match_parent"
        android:layout_height="120dp"
        android:background="#1E293B" />`,
  },
  {
    tag: 'LinearLayout',
    label: 'LinearLayout',
    icon: Layout,
    snippet: (idx: number) => `    <TextView
        android:id="@+id/tvSection${idx}"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="LinearLayout Container Group ${idx}"
        android:textSize="13sp"
        android:textColor="#94A3B8" />`,
  },
  {
    tag: 'ConstraintLayout',
    label: 'ConstraintLayout',
    icon: Layers,
    snippet: (idx: number) => `    <TextView
        android:id="@+id/tvConstraint${idx}"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Constraint Anchor Row ${idx}"
        android:textSize="13sp"
        android:textColor="#38BDF8" />`,
  },
  {
    tag: 'ScrollView',
    label: 'ScrollView',
    icon: Smartphone,
    snippet: (idx: number) => `    <TextView
        android:id="@+id/tvScrollHeader${idx}"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Scrollable Viewport Region ${idx}"
        android:textSize="13sp"
        android:textColor="#A78BFA" />`,
  },
];

function extractAttr(block: string, attrName: string, fallback = ''): string {
  const regex = new RegExp(`${attrName}\\s*=\\s*"([^"]*)"`, 'i');
  const m = block.match(regex);
  return m ? m[1] : fallback;
}

export function parseAndroidXmlNodes(xmlContent: string): {
  rootTag: string;
  rootBg: string;
  nodes: ParsedXmlNode[];
} {
  const rootMatch = xmlContent.match(
    /<(LinearLayout|ConstraintLayout|ScrollView|RelativeLayout|FrameLayout)([^>]*)>/i
  );
  const rootTag = rootMatch ? rootMatch[1] : 'LinearLayout';
  const rootBg = rootMatch
    ? extractAttr(rootMatch[2], 'android:background', '#0F172A')
    : '#0F172A';

  const childRegex = /<(TextView|Button|EditText|ImageView|Switch|ProgressBar)\b([\s\S]*?)\/>/gi;
  const nodes: ParsedXmlNode[] = [];
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = childRegex.exec(xmlContent)) !== null) {
    const tag = match[1];
    const rawBlock = match[0];
    const idRaw = extractAttr(rawBlock, 'android:id', `@+id/view_${i + 1}`);
    nodes.push({
      index: i,
      tag,
      id: idRaw.replace('@+id/', '').replace('@id/', ''),
      text: extractAttr(rawBlock, 'android:text', ''),
      hint: extractAttr(rawBlock, 'android:hint', ''),
      width: extractAttr(rawBlock, 'android:layout_width', 'match_parent'),
      height: extractAttr(rawBlock, 'android:layout_height', 'wrap_content'),
      textSize: extractAttr(rawBlock, 'android:textSize', '16sp'),
      textColor: extractAttr(rawBlock, 'android:textColor', '#F8FAFC'),
      background: extractAttr(
        rawBlock,
        'android:background',
        tag === 'Button' ? '#10B981' : 'transparent'
      ),
      rawBlock,
    });
    i++;
  }

  return { rootTag, rootBg, nodes };
}

interface XmlLayoutDesignerProps {
  filePath: string;
  xmlContent: string;
  onChangeXml: (updated: string) => void;
}

export const XmlLayoutDesigner: React.FC<XmlLayoutDesignerProps> = ({
  xmlContent,
  onChangeXml,
}) => {
  const { appendLogcat, projects, activeProjectId } = useIdeStore();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [draggedWidgetTag, setDraggedWidgetTag] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  // Default to 'full' so the project preview is large and spacious!
  const [viewportSize, setViewportSize] = useState<'phone' | 'tablet' | 'full'>('full');
  const [isFullscreenModal, setIsFullscreenModal] = useState(false);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  // If the current file isn't an XML file, fallback to parsing the project's activity_main.xml so preview works on any file!
  const effectiveXml = useMemo(() => {
    if (xmlContent.includes('<') && xmlContent.includes('android:')) {
      return xmlContent;
    }
    const projectXml = activeProject?.files.find((f) => f.name === 'activity_main.xml')?.content;
    return projectXml || xmlContent;
  }, [xmlContent, activeProject]);

  const parsed = useMemo(() => parseAndroidXmlNodes(effectiveXml), [effectiveXml]);
  const selectedNode =
    selectedIndex !== null && parsed.nodes[selectedIndex]
      ? parsed.nodes[selectedIndex]
      : parsed.nodes[0] || null;

  const insertWidgetByTag = (tag: string) => {
    const widget = PALETTE_WIDGETS.find((w) => w.tag === tag) || PALETTE_WIDGETS[0];
    const snippet = widget.snippet(parsed.nodes.length + 1);
    const closingTagRegex =
      /<\/\s*(LinearLayout|ConstraintLayout|ScrollView|RelativeLayout|FrameLayout)\s*>/i;
    if (closingTagRegex.test(effectiveXml)) {
      const updated = effectiveXml.replace(closingTagRegex, `\n${snippet}\n\n</$1>`);
      onChangeXml(updated);
      setSelectedIndex(parsed.nodes.length);
      appendLogcat('D', 'LayoutDesigner', `Added <${widget.tag}> to XML layout hierarchy`);
    } else {
      onChangeXml(`${effectiveXml}\n${snippet}`);
    }
  };

  const updateSelectedNodeAttribute = (attr: string, value: string) => {
    if (!selectedNode) return;
    let updatedBlock = selectedNode.rawBlock;
    const attrRegex = new RegExp(`(${attr}\\s*=\\s*")"([^"]*)"`, 'i');
    if (attrRegex.test(updatedBlock)) {
      updatedBlock = updatedBlock.replace(attrRegex, `${attr}="${value}"`);
    } else {
      updatedBlock = updatedBlock.replace(/\s*\/>$/, `\n        ${attr}="${value}" />`);
    }
    const nextXml = effectiveXml.replace(selectedNode.rawBlock, updatedBlock);
    onChangeXml(nextXml);
  };

  const deleteNode = (node: ParsedXmlNode) => {
    const nextXml = effectiveXml.replace(node.rawBlock, '').replace(/\n{3,}/g, '\n\n');
    onChangeXml(nextXml);
    setSelectedIndex(null);
    appendLogcat('D', 'LayoutDesigner', `Removed view @+id/${node.id} from XML`);
  };

  const moveNode = (fromIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (targetIndex < 0 || targetIndex >= parsed.nodes.length) return;

    const first = parsed.nodes[Math.min(fromIndex, targetIndex)];
    const second = parsed.nodes[Math.max(fromIndex, targetIndex)];

    const placeholder = '__XML_SWAP_PLACEHOLDER__';
    const step1 = effectiveXml.replace(first.rawBlock, placeholder);
    const step2 = step1.replace(second.rawBlock, first.rawBlock);
    const step3 = step2.replace(placeholder, second.rawBlock);

    onChangeXml(step3);
    setSelectedIndex(targetIndex);
  };

  const triggerPreviewButton = (node: ParsedXmlNode) => {
    const msg = `Clicked @+id/${node.id} ("${node.text || 'Button'}")`;
    setToastMsg(msg);
    appendLogcat('D', 'MainActivity', `OnClickListener triggered for R.id.${node.id}`);
    setTimeout(() => setToastMsg(null), 2200);
  };

  const containerMaxWidth =
    viewportSize === 'phone'
      ? 'max-w-[440px]'
      : viewportSize === 'tablet'
      ? 'max-w-[768px]'
      : 'max-w-full';

  return (
    <div
      className={`${
        isFullscreenModal
          ? 'fixed inset-0 z-50 bg-[#0B0F17]'
          : 'flex flex-col lg:flex-row h-full bg-[#0B0F17]'
      } text-slate-200 overflow-y-auto lg:overflow-hidden flex`}
    >
      {/* Left Widget Palette */}
      <div className="w-full lg:w-52 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-3 flex flex-col gap-2 shrink-0 bg-[#0E1420]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Widget Palette</span>
          <span className="text-[11px] text-slate-500">Tap or Drag</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1.5">
          {PALETTE_WIDGETS.map((w) => {
            const Icon = w.icon;
            return (
              <button
                key={w.tag}
                draggable
                onDragStart={() => setDraggedWidgetTag(w.tag)}
                onDragEnd={() => setDraggedWidgetTag(null)}
                onClick={() => insertWidgetByTag(w.tag)}
                className="flex items-center justify-between px-2.5 py-2 min-h-[40px] rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800/90 text-left text-xs text-slate-200 transition-colors group cursor-pointer"
                title={`Add ${w.label} to XML`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{w.label}</span>
                </span>
                <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Center Large Interactive Project / Website / App Preview Surface */}
      <div
        className="flex-1 flex flex-col items-center p-3 sm:p-5 bg-[#0B0F17] relative overflow-y-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (draggedWidgetTag) {
            insertWidgetByTag(draggedWidgetTag);
            setDraggedWidgetTag(null);
          }
        }}
      >
        {/* Top Preview Size & Fullscreen Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-slate-100">{activeProject.name} Preview</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-mono">{activeProject.language}</span>
            <span aria-hidden="true">·</span>
            <span>{parsed.nodes.length} Views</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setViewportSize('phone')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewportSize === 'phone'
                    ? 'bg-emerald-600 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone (440px)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewportSize('tablet')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewportSize === 'tablet'
                    ? 'bg-emerald-600 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tablet (768px)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewportSize('full')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewportSize === 'full'
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
              onClick={() => setIsFullscreenModal(!isFullscreenModal)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
              title={isFullscreenModal ? 'Exit Fullscreen Preview' : 'Maximize Fullscreen Preview'}
            >
              {isFullscreenModal ? (
                <Minimize2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Large Responsive Android / Website Preview Canvas */}
        <div
          className={`w-full ${containerMaxWidth} flex-1 rounded-2xl border-2 border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col transition-all`}
          style={{ minHeight: '540px' }}
        >
          {/* Status Bar */}
          <div className="h-8 px-5 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/70">
            <span>09:41 · {activeProject.name}</span>
            <span>{activeProject.packageName}</span>
            <span>5G · 100%</span>
          </div>

          {/* Inflated View Hierarchy */}
          <div
            className="flex-1 p-6 sm:p-8 flex flex-col gap-4 relative transition-colors overflow-y-auto"
            style={{ backgroundColor: parsed.rootBg || '#0F172A' }}
          >
            {parsed.nodes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-700 rounded-xl text-sm text-slate-400">
                <p>Empty {parsed.rootTag}</p>
                <p className="mt-1 text-slate-500">
                  Tap any widget in the palette on the left to insert it into the layout.
                </p>
              </div>
            ) : (
              parsed.nodes.map((node, idx) => {
                const isSelected = selectedNode?.index === idx;
                const fontSizePx = parseInt(node.textSize, 10) || 18;

                return (
                  <div
                    key={`${node.id}-${idx}`}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950'
                        : 'hover:ring-1 hover:ring-slate-600'
                    }`}
                  >
                    {node.tag === 'TextView' && (
                      <div
                        className="py-1.5 px-2 break-words font-medium"
                        style={{
                          fontSize: `${Math.min(Math.max(fontSizePx, 14), 32)}px`,
                          color: node.textColor || '#F8FAFC',
                        }}
                      >
                        {node.text || `@+id/${node.id}`}
                      </div>
                    )}

                    {node.tag === 'EditText' && (
                      <input
                        type={node.id.toLowerCase().includes('password') ? 'password' : 'text'}
                        value={inputValues[node.id] ?? ''}
                        onChange={(e) =>
                          setInputValues((prev) => ({ ...prev, [node.id]: e.target.value }))
                        }
                        placeholder={node.hint || node.text || `EditText (${node.id})`}
                        className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border-b-2 border-emerald-500/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                      />
                    )}

                    {node.tag === 'Button' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndex(idx);
                          triggerPreviewButton(node);
                        }}
                        className="w-full py-3.5 px-5 rounded-xl font-semibold text-sm text-slate-950 shadow-md active:scale-[0.99] transition-transform cursor-pointer"
                        style={{
                          backgroundColor:
                            node.background && node.background !== 'transparent'
                              ? node.background
                              : '#10B981',
                          color: '#052e16',
                        }}
                      >
                        {node.text || node.id}
                      </button>
                    )}

                    {node.tag === 'ImageView' && (
                      <div
                        className="w-full h-36 rounded-xl border border-slate-700/80 flex flex-col items-center justify-center gap-1.5 text-slate-400"
                        style={{ backgroundColor: node.background || '#1E293B' }}
                      >
                        <ImageIcon className="w-8 h-8 text-emerald-400" />
                        <span className="text-xs font-mono">@+id/{node.id}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Simulated Android Toast Notification */}
            {toastMsg && (
              <div className="absolute bottom-4 left-6 right-6 px-4 py-2.5 rounded-full bg-slate-900/95 border border-slate-700 text-xs text-center text-emerald-300 shadow-lg">
                {toastMsg}
              </div>
            )}
          </div>

          {/* Gesture Navigation Bar */}
          <div className="h-7 bg-slate-950 flex items-center justify-center border-t border-slate-900">
            <div className="w-32 h-1.5 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>

      {/* Right Attribute Inspector */}
      <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-800/80 p-3.5 bg-[#0E1420] shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">Attributes Inspector</span>
          {selectedNode && (
            <span className="text-[11px] font-mono text-emerald-400">{selectedNode.tag}</span>
          )}
        </div>

        {selectedNode ? (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">android:id</label>
              <input
                type="text"
                value={selectedNode.id}
                onChange={(e) =>
                  updateSelectedNodeAttribute(
                    'android:id',
                    `@+id/${e.target.value.replace(/^@\+?id\//, '')}`
                  )
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100"
              />
            </div>

            {selectedNode.tag !== 'ImageView' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {selectedNode.tag === 'EditText' ? 'android:hint' : 'android:text'}
                </label>
                <input
                  type="text"
                  value={selectedNode.tag === 'EditText' ? selectedNode.hint : selectedNode.text}
                  onChange={(e) =>
                    updateSelectedNodeAttribute(
                      selectedNode.tag === 'EditText' ? 'android:hint' : 'android:text',
                      e.target.value
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-100"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">layout_width</label>
                <select
                  value={selectedNode.width}
                  onChange={(e) =>
                    updateSelectedNodeAttribute('android:layout_width', e.target.value)
                  }
                  className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-100"
                >
                  <option value="match_parent">match_parent</option>
                  <option value="wrap_content">wrap_content</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">layout_height</label>
                <select
                  value={selectedNode.height}
                  onChange={(e) =>
                    updateSelectedNodeAttribute('android:layout_height', e.target.value)
                  }
                  className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-100"
                >
                  <option value="wrap_content">wrap_content</option>
                  <option value="match_parent">match_parent</option>
                </select>
              </div>
            </div>

            {selectedNode.tag === 'TextView' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">textSize</label>
                  <input
                    type="text"
                    value={selectedNode.textSize}
                    onChange={(e) =>
                      updateSelectedNodeAttribute('android:textSize', e.target.value)
                    }
                    className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">textColor</label>
                  <input
                    type="text"
                    value={selectedNode.textColor}
                    onChange={(e) =>
                      updateSelectedNodeAttribute('android:textColor', e.target.value)
                    }
                    className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveNode(selectedNode.index, 'up')}
                  disabled={selectedNode.index === 0}
                  className="p-2 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300"
                  title="Move View Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveNode(selectedNode.index, 'down')}
                  disabled={selectedNode.index >= parsed.nodes.length - 1}
                  className="p-2 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300"
                  title="Move View Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => deleteNode(selectedNode)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-800/50 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete View</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Select any element on the preview canvas to inspect or modify its attributes.
          </p>
        )}
      </div>
    </div>
  );
};
