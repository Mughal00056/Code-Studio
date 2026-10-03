import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDot,
  Copy,
  Eye,
  EyeOff,
  FilePlus2,
  FolderArchive,
  FolderPlus,
  Heart,
  Home,
  Image as ImageIcon,
  Layers,
  Layout,
  Maximize2,
  Minimize2,
  Monitor,
  Move,
  Palette,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Settings,
  ShoppingCart,
  Sliders,
  Smartphone,
  Sparkles,
  Square,
  Star,
  Tablet,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Type,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';
import {
  AVAILABLE_ICON_TEMPLATES,
  BUILTIN_LAYOUT_ASSETS,
  generateCustomGradientDrawableXml,
  generateCustomShapeDrawableXml,
  generateCustomVectorDrawableXml,
  getProjectLayoutAssets,
  LayoutAssetItem,
} from '../../services/layoutAssets';

export interface ParsedXmlNode {
  index: number;
  tag: string;
  fullTag: string;
  id: string;
  text: string;
  hint: string;
  width: string;
  height: string;
  textSize: string;
  textColor: string;
  background: string;
  padding: string;
  visibility: string;
  enabled: boolean;
  onClick: string;
  rawBlock: string;
  startIndex: number;
  endIndex: number;
}

const PALETTE_WIDGETS = [
  {
    tag: 'TextView',
    label: 'TextView',
    icon: Type,
    category: 'Text',
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
    category: 'Widgets',
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
    category: 'Text',
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
    category: 'Media',
    snippet: (idx: number) => `    <ImageView
        android:id="@+id/ivBanner${idx}"
        android:layout_width="match_parent"
        android:layout_height="140dp"
        android:background="#1E293B" />`,
  },
  {
    tag: 'Switch',
    label: 'Switch',
    icon: ToggleRight,
    category: 'Widgets',
    snippet: (idx: number) => `    <Switch
        android:id="@+id/switchToggle${idx}"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Enable Feature ${idx}"
        android:textColor="#F8FAFC" />`,
  },
  {
    tag: 'ProgressBar',
    label: 'ProgressBar',
    icon: CircleDot,
    category: 'Widgets',
    snippet: (idx: number) => `    <ProgressBar
        android:id="@+id/progressBar${idx}"
        android:layout_width="match_parent"
        android:layout_height="wrap_content" />`,
  },
  {
    tag: 'CheckBox',
    label: 'CheckBox',
    icon: CheckSquare,
    category: 'Widgets',
    snippet: (idx: number) => `    <CheckBox
        android:id="@+id/cbOption${idx}"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Confirm Option ${idx}"
        android:textColor="#F8FAFC" />`,
  },
  {
    tag: 'FloatingActionButton',
    label: 'FloatingActionButton',
    icon: Plus,
    category: 'Widgets',
    snippet: (idx: number) => `    <com.google.android.material.floatingactionbutton.FloatingActionButton
        android:id="@+id/fabAction${idx}"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:background="#10B981" />`,
  },
  {
    tag: 'CardView',
    label: 'CardView',
    icon: Layers,
    category: 'Containers',
    snippet: (idx: number) => `    <androidx.cardview.widget.CardView
        android:id="@+id/cardContainer${idx}"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="#1E293B">
        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:padding="16dp"
            android:text="Card View Content ${idx}"
            android:textColor="#F8FAFC" />
    </androidx.cardview.widget.CardView>`,
  },
  {
    tag: 'LinearLayout',
    label: 'LinearLayout',
    icon: Layout,
    category: 'Layouts',
    snippet: (idx: number) => `    <LinearLayout
        android:id="@+id/linearContainer${idx}"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="12dp">
        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Nested LinearLayout ${idx}"
            android:textColor="#94A3B8" />
    </LinearLayout>`,
  },
];

const COLOR_PRESETS = [
  { name: 'Emerald', value: '#10B981', text: '#052E16' },
  { name: 'Sky', value: '#38BDF8', text: '#082F49' },
  { name: 'Slate', value: '#1E293B', text: '#F8FAFC' },
  { name: 'Dark Slate', value: '#0F172A', text: '#F8FAFC' },
  { name: 'Indigo', value: '#6366F1', text: '#EEF2FF' },
  { name: 'Amber', value: '#F59E0B', text: '#451A03' },
  { name: 'Rose', value: '#F43F5E', text: '#4C0519' },
  { name: 'Transparent', value: 'transparent', text: '#F8FAFC' },
];

function extractAttr(block: string, attrName: string, fallback = ''): string {
  const regex = new RegExp(`${attrName}\\s*=\\s*"([^"]*)"`, 'i');
  const m = block.match(regex);
  return m ? m[1] : fallback;
}

export function parseAndroidXmlNodes(xmlContent: string): {
  rootTag: string;
  rootBg: string;
  rootOrientation: string;
  nodes: ParsedXmlNode[];
} {
  if (!xmlContent || !xmlContent.trim()) {
    return { rootTag: 'LinearLayout', rootBg: '#0F172A', rootOrientation: 'vertical', nodes: [] };
  }

  // 1. Identify root container
  const rootTagMatch = xmlContent.match(
    /<([a-zA-Z0-9_.:]+)\b([^>]*)>/i
  );
  const fullRootTag = rootTagMatch ? rootTagMatch[1] : 'LinearLayout';
  const rootTag = fullRootTag.split('.').pop() || 'LinearLayout';
  const rootAttrs = rootTagMatch ? rootTagMatch[2] : '';
  const rootBg = extractAttr(rootAttrs, 'android:background', '#0F172A');
  const rootOrientation = extractAttr(rootAttrs, 'android:orientation', 'vertical');

  const rootOpenIndex = rootTagMatch ? rootTagMatch.index || 0 : 0;
  const rootOpenLength = rootTagMatch ? rootTagMatch[0].length : 0;
  const rootBodyStart = rootOpenIndex + rootOpenLength;

  const nodes: ParsedXmlNode[] = [];

  // 2. Scan all child elements inside the layout body
  const tagRegex = /<([a-zA-Z0-9_.:]+)\b([^>]*?)(\/?>)/g;
  tagRegex.lastIndex = rootBodyStart;

  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = tagRegex.exec(xmlContent)) !== null) {
    const rawTag = match[1];
    const attrs = match[2];
    const closingPunc = match[3];
    const startIndex = match.index;

    // Skip XML declaration, comments, or opening root container repeat
    if (
      rawTag.startsWith('?') ||
      rawTag.startsWith('!') ||
      rawTag.toLowerCase() === 'xml'
    ) {
      continue;
    }

    let endIndex = startIndex + match[0].length;
    let rawBlock = match[0];
    let innerText = '';

    // If non-self-closing tag like <TextView ...>content</TextView>
    if (closingPunc === '>') {
      const closeTagStr = `</${rawTag}>`;
      const closeIdx = xmlContent.indexOf(closeTagStr, endIndex);
      if (closeIdx !== -1 && closeIdx < endIndex + 2000) {
        innerText = xmlContent.slice(endIndex, closeIdx).trim();
        endIndex = closeIdx + closeTagStr.length;
        rawBlock = xmlContent.slice(startIndex, endIndex);
        tagRegex.lastIndex = endIndex;
      }
    }

    const shortTag = rawTag.split('.').pop() || rawTag;
    const idRaw = extractAttr(attrs, 'android:id', `@+id/${shortTag.toLowerCase()}_${i + 1}`);
    const textAttr = extractAttr(attrs, 'android:text', '');
    const textContent =
      textAttr || (innerText && !innerText.includes('<') ? innerText : '');

    nodes.push({
      index: i,
      tag: shortTag,
      fullTag: rawTag,
      id: idRaw.replace('@+id/', '').replace('@id/', ''),
      text: textContent,
      hint: extractAttr(attrs, 'android:hint', ''),
      width: extractAttr(attrs, 'android:layout_width', 'match_parent'),
      height: extractAttr(attrs, 'android:layout_height', 'wrap_content'),
      textSize: extractAttr(
        attrs,
        'android:textSize',
        shortTag.includes('Title') || shortTag.includes('Header') ? '22sp' : '16sp'
      ),
      textColor: extractAttr(attrs, 'android:textColor', '#F8FAFC'),
      background: extractAttr(
        attrs,
        'android:background',
        shortTag.includes('Button') ? '#10B981' : 'transparent'
      ),
      padding: extractAttr(attrs, 'android:padding', ''),
      visibility: extractAttr(attrs, 'android:visibility', 'visible'),
      enabled: extractAttr(attrs, 'android:enabled', 'true') !== 'false',
      onClick: extractAttr(attrs, 'android:onClick', ''),
      rawBlock,
      startIndex,
      endIndex,
    });
    i++;
  }

  return { rootTag, rootBg, rootOrientation, nodes };
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
  const { appendLogcat, projects, activeProjectId, createFileOrFolder } = useIdeStore();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [inspectorTab, setInspectorTab] = useState<'attributes' | 'tree' | 'root'>('attributes');
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [previewMode, setPreviewMode] = useState<'canvas' | 'live_app'>('canvas');
  const [paletteTab, setPaletteTab] = useState<'widgets' | 'assets'>('widgets');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<'All' | 'Vector Icons' | 'Media Images' | 'Backgrounds & Gradients'>('All');
  const [newAssetModalOpen, setNewAssetModalOpen] = useState(false);
  const [assetTypeTab, setAssetTypeTab] = useState<'vector' | 'shape' | 'gradient' | 'image'>('vector');
  const [selectedIconKey, setSelectedIconKey] = useState<string>('star');
  const [shapeRadius, setShapeRadius] = useState('16dp');
  const [gradientStart, setGradientStart] = useState('#10B981');
  const [gradientEnd, setGradientEnd] = useState('#0F172A');
  const [uploadedImageData, setUploadedImageData] = useState<string | null>(null);
  const [newAssetName, setNewAssetName] = useState('ic_favorite_badge');
  const [newAssetColor, setNewAssetColor] = useState('#10B981');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [draggedWidgetTag, setDraggedWidgetTag] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>({});
  const [checkboxStates, setCheckboxStates] = useState<Record<string, boolean>>({});
  const [viewportSize, setViewportSize] = useState<'phone' | 'tablet' | 'full'>('full');
  const [isFullscreenModal, setIsFullscreenModal] = useState(false);
  const [assetPickerForAttr, setAssetPickerForAttr] = useState<'background' | 'src' | null>(null);

  // Live Interactive App Runner States (works for Kotlin, Java, React, Flutter)
  const [liveAppCounter, setLiveAppCounter] = useState(0);
  const [liveAppInput, setLiveAppInput] = useState('');
  const [liveAppList, setLiveAppList] = useState<string[]>([
    'Welcome to CodeStudio',
    'Interactive live runtime active',
  ]);

  // Collapsible Accordion sections for Attributes Inspector
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    identity: false,
    text: false,
    dimensions: false,
    appearance: false,
    visibility: false,
  });

  const toggleSection = (sec: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const toggleAllSections = () => {
    const areAnyOpen = Object.values(collapsedSections).some((v) => !v);
    setCollapsedSections({
      identity: areAnyOpen,
      text: areAnyOpen,
      dimensions: areAnyOpen,
      appearance: areAnyOpen,
      visibility: areAnyOpen,
    });
  };

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const projectAssets = useMemo(
    () => getProjectLayoutAssets(activeProject),
    [activeProject]
  );

  const filteredAssets = useMemo(() => {
    if (assetCategoryFilter === 'All') return projectAssets;
    return projectAssets.filter((a) => a.category === assetCategoryFilter);
  }, [projectAssets, assetCategoryFilter]);

  // If the open file is not an XML file, fallback to the project's layout XML or a rich customized layout
  const effectiveXml = useMemo(() => {
    if (
      xmlContent &&
      (xmlContent.includes('<LinearLayout') ||
        xmlContent.includes('<ConstraintLayout') ||
        xmlContent.includes('<ScrollView') ||
        xmlContent.includes('<RelativeLayout') ||
        xmlContent.includes('<FrameLayout') ||
        xmlContent.includes('xmlns:android'))
    ) {
      return xmlContent;
    }
    const foundLayout = activeProject?.files.find(
      (f) =>
        f.type === 'file' &&
        (f.name === 'activity_main.xml' ||
          f.path.includes('res/layout') ||
          (f.name.endsWith('.xml') && (f.content || '').includes('<LinearLayout')))
    );
    if (foundLayout?.content) {
      return foundLayout.content;
    }

    return `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="20dp"
    android:background="#0F172A">

    <TextView
        android:id="@+id/tvHeader"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="${activeProject?.name || 'CodeStudio App'}"
        android:textSize="24sp"
        android:textColor="#38BDF8" />

    <TextView
        android:id="@+id/tvSubHeader"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="${activeProject?.language || 'Android'} · ${activeProject?.packageName || 'com.example.app'}"
        android:textSize="13sp"
        android:textColor="#94A3B8" />

    <EditText
        android:id="@+id/etUserInput"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Type input in layout preview..."
        android:textColor="#F8FAFC" />

    <Button
        android:id="@+id/btnPrimaryAction"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Tap to Run Action (+1)"
        android:background="#10B981" />

</LinearLayout>`;
  }, [xmlContent, activeProject]);

  const parsed = useMemo(() => parseAndroidXmlNodes(effectiveXml), [effectiveXml]);
  const selectedNode =
    selectedIndex !== null && parsed.nodes[selectedIndex]
      ? parsed.nodes[selectedIndex]
      : parsed.nodes[0] || null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const insertWidgetByTag = (tag: string) => {
    const widget = PALETTE_WIDGETS.find((w) => w.tag === tag) || PALETTE_WIDGETS[0];
    const snippet = widget.snippet(parsed.nodes.length + 1);
    const closingTagRegex =
      /<\/\s*(LinearLayout|ConstraintLayout|ScrollView|RelativeLayout|FrameLayout|androidx[a-zA-Z0-9_.]*)\s*>/i;
    if (closingTagRegex.test(effectiveXml)) {
      const updated = effectiveXml.replace(closingTagRegex, `\n${snippet}\n\n</$1>`);
      onChangeXml(updated);
      setSelectedIndex(parsed.nodes.length);
      appendLogcat('D', 'LayoutDesigner', `Added <${widget.tag}> to XML layout hierarchy`);
      showToast(`Added ${widget.label} to layout`);
    } else {
      onChangeXml(`${effectiveXml}\n${snippet}`);
      showToast(`Added ${widget.label} to layout`);
    }
  };

  const handleAddNewAsset = () => {
    if (!newAssetName.trim()) return;
    const cleanName = newAssetName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    let content = '';

    if (assetTypeTab === 'vector') {
      content = generateCustomVectorDrawableXml(cleanName, selectedIconKey, newAssetColor);
    } else if (assetTypeTab === 'shape') {
      content = generateCustomShapeDrawableXml(cleanName, newAssetColor, shapeRadius);
    } else if (assetTypeTab === 'gradient') {
      content = generateCustomGradientDrawableXml(
        cleanName,
        gradientStart,
        newAssetColor,
        gradientEnd,
        135,
        shapeRadius
      );
    } else if (assetTypeTab === 'image' && uploadedImageData) {
      content = uploadedImageData;
    } else {
      content = generateCustomVectorDrawableXml(cleanName, selectedIconKey, newAssetColor);
    }

    createFileOrFolder('app/src/main/res/drawable', `${cleanName}.xml`, 'file', content);
    setNewAssetModalOpen(false);
    showToast(`Added @drawable/${cleanName} to layout assets`);
    appendLogcat('I', 'AssetManager', `Created drawable @drawable/${cleanName}.xml in project`);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setUploadedImageData(result);
      if (!newAssetName || newAssetName === 'ic_favorite_badge') {
        const baseName = file.name
          .replace(/\.[^/.]+$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
        setNewAssetName(`img_${baseName}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const insertAssetAsImageView = (asset: LayoutAssetItem) => {
    const idx = parsed.nodes.length + 1;
    const cleanId = `iv_${asset.name.replace(/[^a-zA-Z0-9]/g, '')}_${idx}`;
    const snippet = `    <ImageView
        android:id="@+id/${cleanId}"
        android:layout_width="match_parent"
        android:layout_height="120dp"
        android:src="${asset.resRef}" />`;
    const closingTagRegex =
      /<\/\s*(LinearLayout|ConstraintLayout|ScrollView|RelativeLayout|FrameLayout|androidx[a-zA-Z0-9_.]*)\s*>/i;
    if (closingTagRegex.test(effectiveXml)) {
      const updated = effectiveXml.replace(closingTagRegex, `\n${snippet}\n\n</$1>`);
      onChangeXml(updated);
    } else {
      onChangeXml(`${effectiveXml}\n${snippet}`);
    }
    setSelectedIndex(parsed.nodes.length);
    showToast(`Added ${asset.resRef} to layout`);
  };

  const applyAssetToSelected = (asset: LayoutAssetItem) => {
    if (!selectedNode) return;
    if (selectedNode.tag.includes('ImageView')) {
      updateSelectedNodeAttribute('android:src', asset.resRef);
    } else {
      updateSelectedNodeAttribute('android:background', asset.resRef);
    }
    showToast(`Applied ${asset.resRef} to @+id/${selectedNode.id}`);
  };

  // 100% Deterministic and Safe Attribute Update using String Index Slicing (NEVER creates duplicates)
  const updateSelectedNodeAttribute = (attr: string, value: string) => {
    if (!selectedNode) return;
    let updatedBlock = selectedNode.rawBlock;
    const attrRegex = new RegExp(`(${attr}\\s*=\\s*")[^"]*(")`, 'i');

    if (attrRegex.test(updatedBlock)) {
      updatedBlock = updatedBlock.replace(attrRegex, `$1${value}$2`);
    } else {
      // Attribute does not exist yet: insert right before closing tag /> or >
      if (updatedBlock.includes('/>')) {
        updatedBlock = updatedBlock.replace(/\s*\/>$/, `\n        ${attr}="${value}" />`);
      } else {
        updatedBlock = updatedBlock.replace(/>/, `\n        ${attr}="${value}">`);
      }
    }

    const nextXml =
      effectiveXml.slice(0, selectedNode.startIndex) +
      updatedBlock +
      effectiveXml.slice(selectedNode.endIndex);

    onChangeXml(nextXml);
    appendLogcat('D', 'AttributesInspector', `Updated ${selectedNode.id} [${attr}="${value}"]`);
  };

  const updateRootAttribute = (attr: string, value: string) => {
    const rootTagRegex = /<([a-zA-Z0-9_.:]+)\b([^>]*)>/i;
    const m = effectiveXml.match(rootTagRegex);
    if (!m) return;
    const fullOpenTag = m[0];
    const attrRegex = new RegExp(`(${attr}\\s*=\\s*")[^"]*(")`, 'i');
    let nextOpenTag = fullOpenTag;
    if (attrRegex.test(fullOpenTag)) {
      nextOpenTag = fullOpenTag.replace(attrRegex, `$1${value}$2`);
    } else {
      nextOpenTag = fullOpenTag.replace(/>$/, `\n    ${attr}="${value}">`);
    }
    const nextXml = effectiveXml.replace(fullOpenTag, nextOpenTag);
    onChangeXml(nextXml);
    showToast(`Updated root ${attr}`);
  };

  const switchRootTag = (newTag: string) => {
    const rootTagRegex = /<([a-zA-Z0-9_.:]+)\b([^>]*)>/i;
    const m = effectiveXml.match(rootTagRegex);
    if (!m) return;
    const oldTag = m[1];
    const closeRegex = new RegExp(`</${oldTag}>`, 'i');
    let nextXml = effectiveXml.replace(new RegExp(`<${oldTag}\\b`, 'i'), `<${newTag}`);
    nextXml = nextXml.replace(closeRegex, `</${newTag}>`);
    onChangeXml(nextXml);
    showToast(`Changed Root Layout to ${newTag}`);
  };

  const duplicateNode = (node: ParsedXmlNode) => {
    const suffix = parsed.nodes.length + 1;
    const duplicatedBlock = node.rawBlock.replace(
      /android:id="\s*@\+id\/([^"]*)"/i,
      `android:id="@+id/$1_${suffix}"`
    );
    const nextXml =
      effectiveXml.slice(0, node.endIndex) +
      `\n\n${duplicatedBlock}` +
      effectiveXml.slice(node.endIndex);
    onChangeXml(nextXml);
    setSelectedIndex(parsed.nodes.length);
    showToast(`Duplicated ${node.id}`);
  };

  const deleteNode = (node: ParsedXmlNode) => {
    const nextXml =
      effectiveXml.slice(0, node.startIndex) +
      effectiveXml.slice(node.endIndex).replace(/^\s*\n/, '');
    onChangeXml(nextXml);
    setSelectedIndex(null);
    appendLogcat('D', 'LayoutDesigner', `Removed view @+id/${node.id}`);
    showToast(`Deleted ${node.id}`);
  };

  const moveNode = (fromIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (targetIndex < 0 || targetIndex >= parsed.nodes.length) return;

    const first = parsed.nodes[Math.min(fromIndex, targetIndex)];
    const second = parsed.nodes[Math.max(fromIndex, targetIndex)];

    const step1 =
      effectiveXml.slice(0, first.startIndex) +
      second.rawBlock +
      effectiveXml.slice(first.endIndex, second.startIndex) +
      first.rawBlock +
      effectiveXml.slice(second.endIndex);

    onChangeXml(step1);
    setSelectedIndex(targetIndex);
    showToast(`Moved ${direction === 'up' ? 'Up' : 'Down'}`);
  };

  const triggerPreviewButton = (node: ParsedXmlNode) => {
    const msg = `Clicked @+id/${node.id} ("${node.text || 'Button'}")`;
    showToast(msg);
    appendLogcat('D', 'MainActivity', `OnClickListener triggered for R.id.${node.id}`);
  };

  const loadStarterTemplate = (type: 'standard' | 'login' | 'counter' | 'cards') => {
    let tpl = '';
    if (type === 'login') {
      tpl = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp"
    android:background="#0F172A">

    <TextView
        android:id="@+id/tvLoginTitle"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Welcome Back"
        android:textSize="26sp"
        android:textColor="#F8FAFC" />

    <TextView
        android:id="@+id/tvLoginSubtitle"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Sign in to your ${activeProject.name} account"
        android:textSize="14sp"
        android:textColor="#94A3B8" />

    <EditText
        android:id="@+id/etEmail"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Email address"
        android:textColor="#F8FAFC" />

    <EditText
        android:id="@+id/etPassword"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Password"
        android:textColor="#F8FAFC" />

    <Button
        android:id="@+id/btnSignIn"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Sign In to App"
        android:background="#10B981" />

</LinearLayout>`;
    } else if (type === 'counter') {
      tpl = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp"
    android:background="#0B0F17">

    <TextView
        android:id="@+id/tvCounterHeader"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="${activeProject.name} Interactive Counter"
        android:textSize="22sp"
        android:textColor="#38BDF8" />

    <TextView
        android:id="@+id/tvCounterDisplay"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Current Count: 0"
        android:textSize="28sp"
        android:textColor="#10B981" />

    <Button
        android:id="@+id/btnIncrement"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Increment Counter (+1)"
        android:background="#38BDF8" />

</LinearLayout>`;
    } else {
      tpl = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="20dp"
    android:background="#0F172A">

    <TextView
        android:id="@+id/tvHeader"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Welcome to ${activeProject.name}"
        android:textSize="24sp"
        android:textColor="#F8FAFC" />

    <TextView
        android:id="@+id/tvSubHeader"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Package: ${activeProject.packageName}"
        android:textSize="13sp"
        android:textColor="#94A3B8" />

    <EditText
        android:id="@+id/etUserPrompt"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Type message here..."
        android:textColor="#F8FAFC" />

    <Button
        android:id="@+id/btnSubmit"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Execute Action & Logcat"
        android:background="#10B981" />

</LinearLayout>`;
    }
    onChangeXml(tpl);
    setSelectedIndex(0);
    showToast(`Loaded ${type} layout template`);
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
      {/* Left Sidebar: Widgets vs Layout Assets */}
      <div className="w-full lg:w-60 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-3 flex flex-col gap-2.5 shrink-0 bg-[#0E1420]">
        {/* Tab Switcher: Widgets | Layout Assets */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setPaletteTab('widgets')}
            className={`flex-1 py-1 px-2 rounded-md font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              paletteTab === 'widgets'
                ? 'bg-emerald-600 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layout className="w-3 h-3" />
            <span>Widgets</span>
          </button>
          <button
            type="button"
            onClick={() => setPaletteTab('assets')}
            className={`flex-1 py-1 px-2 rounded-md font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              paletteTab === 'assets'
                ? 'bg-emerald-600 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-3 h-3" />
            <span>Layout Assets</span>
          </button>
        </div>

        {/* SUBTAB 1: WIDGET PALETTE */}
        {paletteTab === 'widgets' && (
          <>
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/70">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-emerald-400" />
                <span>Components</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">Tap to Add</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1.5 overflow-y-auto max-h-[50vh] lg:max-h-none">
              {PALETTE_WIDGETS.map((w) => {
                const Icon = w.icon;
                return (
                  <button
                    key={w.tag}
                    draggable
                    onDragStart={() => setDraggedWidgetTag(w.tag)}
                    onDragEnd={() => setDraggedWidgetTag(null)}
                    onClick={() => insertWidgetByTag(w.tag)}
                    className="flex items-center justify-between px-2.5 py-2 min-h-[38px] rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800/90 text-left text-xs text-slate-200 transition-colors group cursor-pointer"
                    title={`Insert <${w.tag}> into layout`}
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

            {/* Quick Starter Templates */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Quick Starters:</span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => loadStarterTemplate('standard')}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => loadStarterTemplate('login')}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  Login Form
                </button>
                <button
                  type="button"
                  onClick={() => loadStarterTemplate('counter')}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  Counter
                </button>
                <button
                  type="button"
                  onClick={() => loadStarterTemplate('cards')}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  Overview
                </button>
              </div>
            </div>
          </>
        )}

        {/* SUBTAB 2: LAYOUT ASSETS BROWSER & CREATOR */}
        {paletteTab === 'assets' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/70">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Drawables & Media</span>
              </span>
              <button
                type="button"
                onClick={() => setNewAssetModalOpen(true)}
                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                title="Add New Custom Layout Asset to Project"
              >
                <Plus className="w-3 h-3" />
                <span>Add Asset</span>
              </button>
            </div>

            {/* Filter Categories */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {(['All', 'Vector Icons', 'Media Images', 'Backgrounds & Gradients'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAssetCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors cursor-pointer ${
                      assetCategoryFilter === cat
                        ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 font-semibold'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            {/* Assets List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[60vh] lg:max-h-none">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 space-y-2 transition-all group"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm"
                      style={{
                        backgroundColor: `${asset.color || '#10B981'}20`,
                        borderColor: `${asset.color || '#10B981'}50`,
                      }}
                    >
                      <Sparkles
                        className="w-4 h-4"
                        style={{ color: asset.color || '#10B981' }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-100 truncate">
                        {asset.name}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 truncate">
                        {asset.resRef}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => insertAssetAsImageView(asset)}
                      className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      title="Insert as new ImageView in layout"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>+ Add to Layout</span>
                    </button>
                    {selectedNode && (
                      <button
                        type="button"
                        onClick={() => applyAssetToSelected(asset)}
                        className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/50 text-emerald-300 text-[10px] font-semibold cursor-pointer"
                        title={`Apply ${asset.resRef} to @+id/${selectedNode.id}`}
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Center Large Interactive Preview Surface */}
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
        {/* Floating Unclose / Open Attributes Inspector Button (visible when closed) */}
        {inspectorCollapsed && (
          <button
            type="button"
            onClick={() => setInspectorCollapsed(false)}
            className="absolute right-4 top-3 z-30 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-1.5 cursor-pointer border border-emerald-400/40 animate-fade-in"
            title="Open / Unclose Attributes Inspector"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Attributes Inspector (Unclose)</span>
          </button>
        )}

        {/* Preview Control Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            {/* Mode Switcher: Layout Canvas vs Live App Preview */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode('canvas')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  previewMode === 'canvas'
                    ? 'bg-emerald-600 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Visual Layout Canvas & Attributes Editor"
              >
                <Layout className="w-3.5 h-3.5" />
                <span>Layout Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('live_app')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  previewMode === 'live_app'
                    ? 'bg-emerald-600 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Live Interactive App Runner for all apps (Kotlin, Java, React, Flutter)"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Live App Preview</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">{activeProject.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-400">{parsed.nodes.length} views</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Attributes Inspector Closed / Unclosed Toggle Button with Arrow */}
            <button
              type="button"
              onClick={() => setInspectorCollapsed(!inspectorCollapsed)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                !inspectorCollapsed
                  ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title={
                inspectorCollapsed
                  ? 'Unclose / Open Attributes Inspector'
                  : 'Close Attributes Inspector'
              }
            >
              {inspectorCollapsed ? (
                <>
                  <ChevronLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unclose Inspector</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Close Inspector</span>
                </>
              )}
            </button>

            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setViewportSize('phone')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  viewportSize === 'phone'
                    ? 'bg-emerald-600 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Phone</span>
              </button>
              <button
                type="button"
                onClick={() => setViewportSize('tablet')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  viewportSize === 'tablet'
                    ? 'bg-emerald-600 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tablet</span>
              </button>
              <button
                type="button"
                onClick={() => setViewportSize('full')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  viewportSize === 'full'
                    ? 'bg-emerald-600 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Full</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreenModal(!isFullscreenModal)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
              title={isFullscreenModal ? 'Exit Fullscreen' : 'Maximize Fullscreen'}
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
          style={{ minHeight: '520px' }}
        >
          {/* Status Bar */}
          <div className="h-8 px-5 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/70 select-none">
            <span>09:41 · {activeProject.name}</span>
            <span className="text-emerald-400 font-semibold">
              {previewMode === 'live_app'
                ? `Live Runtime · ${activeProject.language}`
                : parsed.rootTag}
            </span>
            <span>5G · 100%</span>
          </div>

          {/* MODE 1: LIVE INTERACTIVE APP RUNNER (Kotlin, Java, React, Flutter) */}
          {previewMode === 'live_app' ? (
            <div className="flex-1 p-5 flex flex-col justify-between bg-[#0B111E] overflow-y-auto">
              <div className="space-y-3.5">
                {/* Simulated App Header */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                      {activeProject.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{activeProject.name}</div>
                      <div className="text-[10px] font-mono text-emerald-400">
                        {activeProject.language} · {activeProject.packageName}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Live App Hot Reloaded');
                      appendLogcat('I', 'LiveRunner', 'Hot reload completed in 18ms');
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 cursor-pointer"
                    title="Hot Reload"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Interactive Counter Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-md">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                    <span>Interactive State Counter</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 font-mono text-[10px]">
                      Live Hot State
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-2">
                    {liveAppCounter}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = liveAppCounter + 1;
                        setLiveAppCounter(next);
                        showToast(`Action triggered: count=${next}`);
                        appendLogcat('D', 'LiveRunner', `Button clicked: counter=${next}`);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow cursor-pointer active:scale-95 transition-transform flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tap to Increase (+1)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveAppCounter(0)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Interactive Dynamic Input & List */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Live UI Components Input:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={liveAppInput}
                      onChange={(e) => setLiveAppInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && liveAppInput.trim()) {
                          setLiveAppList([liveAppInput.trim(), ...liveAppList]);
                          setLiveAppInput('');
                        }
                      }}
                      placeholder={`Test ${activeProject.language} live state...`}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!liveAppInput.trim()) return;
                        setLiveAppList([liveAppInput.trim(), ...liveAppList]);
                        showToast(`Added "${liveAppInput.trim()}"`);
                        appendLogcat(
                          'D',
                          'LiveRunner',
                          `Added item to list: ${liveAppInput.trim()}`
                        );
                        setLiveAppInput('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {liveAppList.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 flex items-center justify-between group"
                      >
                        <span className="truncate">{item}</span>
                        <button
                          type="button"
                          onClick={() => setLiveAppList(liveAppList.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Controls */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Interactive Runtime Ready</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewMode('canvas')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Layout className="w-3 h-3 text-emerald-400" />
                  <span>Switch to Layout Canvas</span>
                </button>
              </div>
            </div>
          ) : (
            /* MODE 2: INFLATED XML VIEW HIERARCHY CANVAS */
            <div
            className="flex-1 p-6 sm:p-8 flex flex-col gap-4 relative transition-colors overflow-y-auto"
            style={{ backgroundColor: parsed.rootBg || '#0F172A' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedIndex(null);
                setInspectorTab('root');
              }
            }}
          >
            {parsed.nodes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-700/80 rounded-2xl text-slate-400 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-emerald-400">
                  <Layout className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Empty {parsed.rootTag} Layout</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Tap any widget from the left palette or choose a starter template below to inflate views.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => insertWidgetByTag('TextView')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-slate-950 font-semibold text-xs cursor-pointer"
                  >
                    + Add TextView
                  </button>
                  <button
                    type="button"
                    onClick={() => insertWidgetByTag('Button')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
                  >
                    + Add Button
                  </button>
                  <button
                    type="button"
                    onClick={() => loadStarterTemplate('standard')}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 text-slate-950 font-semibold text-xs cursor-pointer"
                  >
                    Load Starter Layout
                  </button>
                </div>
              </div>
            ) : (
              parsed.nodes.map((node, idx) => {
                const isSelected = selectedNode?.index === idx;
                const fontSizePx = parseInt(node.textSize, 10) || 16;
                const isGone = node.visibility === 'gone';
                if (isGone) return null;

                return (
                  <div
                    key={`${node.id}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(idx);
                      setInspectorTab('attributes');
                    }}
                    className={`relative rounded-xl transition-all cursor-pointer group ${
                      isSelected
                        ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 shadow-lg'
                        : 'hover:ring-1 hover:ring-slate-600'
                    }`}
                  >
                    {/* Floating Selection Badge */}
                    {isSelected && (
                      <div className="absolute -top-3 left-3 z-10 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold shadow flex items-center gap-1">
                        <span>{node.tag}</span>
                        <span>·</span>
                        <span>@{node.id}</span>
                      </div>
                    )}

                    {/* TEXTVIEW */}
                    {node.tag.includes('TextView') && (
                      <div
                        className="py-1.5 px-2 break-words font-medium"
                        style={{
                          fontSize: `${Math.min(Math.max(fontSizePx, 12), 36)}px`,
                          color: node.textColor || '#F8FAFC',
                          opacity: node.enabled ? 1 : 0.5,
                        }}
                      >
                        {node.text || `@+id/${node.id}`}
                      </div>
                    )}

                    {/* EDITTEXT */}
                    {node.tag.includes('EditText') && (
                      <input
                        type={node.id.toLowerCase().includes('password') ? 'password' : 'text'}
                        value={inputValues[node.id] ?? ''}
                        disabled={!node.enabled}
                        onChange={(e) =>
                          setInputValues((prev) => ({ ...prev, [node.id]: e.target.value }))
                        }
                        placeholder={node.hint || node.text || `EditText (${node.id})`}
                        className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border-b-2 border-emerald-500/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                      />
                    )}

                    {/* BUTTON / MATERIALBUTTON */}
                    {node.tag.includes('Button') && !node.tag.includes('Floating') && !node.tag.includes('Radio') && (
                      <button
                        type="button"
                        disabled={!node.enabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndex(idx);
                          triggerPreviewButton(node);
                        }}
                        className="w-full py-3.5 px-5 rounded-xl font-semibold text-sm shadow-md active:scale-[0.99] transition-transform cursor-pointer flex items-center justify-center gap-2"
                        style={{
                          backgroundColor:
                            node.background && node.background !== 'transparent'
                              ? node.background
                              : '#10B981',
                          color: node.textColor && node.textColor !== '#F8FAFC' ? node.textColor : '#052E16',
                          opacity: node.enabled ? 1 : 0.5,
                        }}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{node.text || node.id}</span>
                      </button>
                    )}

                    {/* IMAGEVIEW */}
                    {node.tag.includes('ImageView') && (
                      <div
                        className="w-full h-32 rounded-xl border border-slate-700/80 flex flex-col items-center justify-center gap-1.5 text-slate-400"
                        style={{ backgroundColor: node.background || '#1E293B' }}
                      >
                        <ImageIcon className="w-8 h-8 text-emerald-400" />
                        <span className="text-xs font-mono">@+id/{node.id}</span>
                      </div>
                    )}

                    {/* SWITCH */}
                    {node.tag.includes('Switch') && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSwitchStates((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800"
                      >
                        <span className="text-sm font-medium text-slate-200">
                          {node.text || `@+id/${node.id}`}
                        </span>
                        <div
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            switchStates[node.id] ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
                              switchStates[node.id] ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* PROGRESSBAR */}
                    {node.tag.includes('ProgressBar') && (
                      <div className="p-3 space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-400 font-mono">
                          <span>{node.id}</span>
                          <span>Loading...</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-emerald-500 animate-pulse w-3/4" />
                        </div>
                      </div>
                    )}

                    {/* CHECKBOX */}
                    {node.tag.includes('CheckBox') && (
                      <label
                        onClick={(e) => {
                          e.stopPropagation();
                          setCheckboxStates((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer"
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            checkboxStates[node.id]
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                              : 'bg-slate-900 border-slate-700'
                          }`}
                        >
                          {checkboxStates[node.id] && <Check className="w-3.5 h-3.5 font-bold" />}
                        </div>
                        <span className="text-sm text-slate-200 font-medium">
                          {node.text || node.id}
                        </span>
                      </label>
                    )}

                    {/* RADIOBUTTON */}
                    {node.tag.includes('RadioButton') && (
                      <div className="flex items-center gap-2.5 p-2">
                        <Radio className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-slate-200">{node.text || node.id}</span>
                      </div>
                    )}

                    {/* FLOATING ACTION BUTTON */}
                    {node.tag.includes('Floating') && (
                      <div className="flex justify-end p-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerPreviewButton(node);
                          }}
                          className="w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl flex items-center justify-center active:scale-95 transition-transform"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>
                    )}

                    {/* CARDVIEW / CONTAINER / GENERIC FALLBACK */}
                    {(!node.tag.includes('TextView') &&
                      !node.tag.includes('EditText') &&
                      !node.tag.includes('Button') &&
                      !node.tag.includes('ImageView') &&
                      !node.tag.includes('Switch') &&
                      !node.tag.includes('ProgressBar') &&
                      !node.tag.includes('CheckBox') &&
                      !node.tag.includes('RadioButton')) && (
                      <div
                        className="p-4 rounded-xl border border-slate-700/80 space-y-1"
                        style={{ backgroundColor: node.background || '#1E293B' }}
                      >
                        <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          <span>&lt;{node.tag}&gt; @+id/{node.id}</span>
                        </div>
                        <div className="text-sm text-slate-200 font-medium">
                          {node.text || 'Container Region'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Simulated Android Toast Notification */}
            {toastMsg && (
              <div className="absolute bottom-4 left-6 right-6 px-4 py-2.5 rounded-full bg-slate-900/95 border border-slate-700 text-xs text-center text-emerald-300 shadow-xl animate-fade-in">
                {toastMsg}
              </div>
            )}
          </div>
        )}

          {/* Gesture Navigation Bar */}
          <div className="h-7 bg-slate-950 flex items-center justify-center border-t border-slate-900 select-none">
            <div className="w-32 h-1.5 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>

      {/* Slim Rail when Attributes Inspector is Collapsed (Desktop) */}
      {inspectorCollapsed && (
        <div className="hidden lg:flex w-10 border-l border-slate-800/80 bg-[#0E1420] shrink-0 flex-col items-center py-3 gap-3">
          <button
            type="button"
            onClick={() => setInspectorCollapsed(false)}
            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 flex items-center justify-center shadow cursor-pointer transition-transform hover:scale-105"
            title="Unclose Attributes Inspector (Click Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            onClick={() => setInspectorCollapsed(false)}
            className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-semibold text-slate-400 hover:text-emerald-300 tracking-wider uppercase select-none cursor-pointer flex items-center gap-1.5 py-2"
            title="Click to Unclose Attributes Inspector"
          >
            <Sliders className="w-3 h-3 text-emerald-400 rotate-90" />
            <span>Attributes Inspector</span>
          </div>
        </div>
      )}

      {/* Right Attributes Inspector & Component Tree Panel */}
      <div
        className={`${
          inspectorCollapsed
            ? 'hidden'
            : 'w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-[#0E1420] shrink-0 flex flex-col'
        }`}
      >
        {/* Inspector Header Tabs: Attributes | Component Tree | Root Layout & Arrow Close Button */}
        <div className="p-2 border-b border-slate-800/80 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 flex-1">
            <button
              type="button"
              onClick={() => setInspectorTab('attributes')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                inspectorTab === 'attributes'
                  ? 'bg-emerald-600 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Attributes
            </button>
            <button
              type="button"
              onClick={() => setInspectorTab('tree')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                inspectorTab === 'tree'
                  ? 'bg-emerald-600 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Views ({parsed.nodes.length})
            </button>
            <button
              type="button"
              onClick={() => setInspectorTab('root')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                inspectorTab === 'root'
                  ? 'bg-emerald-600 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Root
            </button>
          </div>

          {/* ARROW BUTTON TO CLOSE / COLLAPSE INSPECTOR */}
          <button
            type="button"
            onClick={() => setInspectorCollapsed(true)}
            className="px-2 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-rose-300 cursor-pointer flex items-center gap-1 text-xs shrink-0"
            title="Close Attributes Inspector"
          >
            <span className="text-[11px] font-medium hidden sm:inline">Close</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>

        {/* TAB 1: ATTRIBUTES INSPECTOR */}
        {inspectorTab === 'attributes' && (
          <div className="flex-1 p-3.5 space-y-3 text-xs overflow-y-auto">
            {selectedNode ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{selectedNode.tag} Attributes</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleAllSections}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      title="Expand or Collapse All Attribute Groups"
                    >
                      <ChevronDown className="w-3 h-3" />
                      <span>Toggle All</span>
                    </button>
                    <span className="font-mono text-[10px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                      @{selectedNode.id}
                    </span>
                  </div>
                </div>

                {/* ACCORDION 1: IDENTITY & ID */}
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('identity')}
                    className="w-full px-3 py-2 bg-slate-900/90 hover:bg-slate-800/80 flex items-center justify-between text-left font-semibold text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      <span>1. Identity & ID</span>
                    </span>
                    {collapsedSections.identity ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                  {!collapsedSections.identity && (
                    <div className="p-3 space-y-2.5">
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
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span>Tag Type:</span>
                        <span className="text-emerald-400 font-bold">&lt;{selectedNode.tag}&gt;</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCORDION 2: TEXT & LABELS */}
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('text')}
                    className="w-full px-3 py-2 bg-slate-900/90 hover:bg-slate-800/80 flex items-center justify-between text-left font-semibold text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-sky-400" />
                      <span>2. Text & Content</span>
                    </span>
                    {collapsedSections.text ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                  {!collapsedSections.text && (
                    <div className="p-3 space-y-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          {selectedNode.tag.includes('EditText') ? 'android:hint' : 'android:text'}
                        </label>
                        <input
                          type="text"
                          value={
                            selectedNode.tag.includes('EditText')
                              ? selectedNode.hint
                              : selectedNode.text
                          }
                          onChange={(e) =>
                            updateSelectedNodeAttribute(
                              selectedNode.tag.includes('EditText')
                                ? 'android:hint'
                                : 'android:text',
                              e.target.value
                            )
                          }
                          placeholder="View text content..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCORDION 3: DIMENSIONS & SIZING */}
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('dimensions')}
                    className="w-full px-3 py-2 bg-slate-900/90 hover:bg-slate-800/80 flex items-center justify-between text-left font-semibold text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>3. Dimensions & Layout</span>
                    </span>
                    {collapsedSections.dimensions ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                  {!collapsedSections.dimensions && (
                    <div className="p-3 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            layout_width
                          </label>
                          <select
                            value={selectedNode.width}
                            onChange={(e) =>
                              updateSelectedNodeAttribute('android:layout_width', e.target.value)
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="match_parent">match_parent</option>
                            <option value="wrap_content">wrap_content</option>
                            <option value="0dp">0dp (weight)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            layout_height
                          </label>
                          <select
                            value={selectedNode.height}
                            onChange={(e) =>
                              updateSelectedNodeAttribute('android:layout_height', e.target.value)
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="wrap_content">wrap_content</option>
                            <option value="match_parent">match_parent</option>
                            <option value="48dp">48dp</option>
                            <option value="120dp">120dp</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCORDION 4: APPEARANCE, COLORS & LAYOUT ASSETS */}
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('appearance')}
                    className="w-full px-3 py-2 bg-slate-900/90 hover:bg-slate-800/80 flex items-center justify-between text-left font-semibold text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>4. Colors & Layout Assets</span>
                    </span>
                    {collapsedSections.appearance ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                  {!collapsedSections.appearance && (
                    <div className="p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            textSize (sp)
                          </label>
                          <input
                            type="text"
                            value={selectedNode.textSize}
                            onChange={(e) =>
                              updateSelectedNodeAttribute('android:textSize', e.target.value)
                            }
                            placeholder="16sp"
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-100"
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
                            placeholder="#F8FAFC"
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-100"
                          />
                        </div>
                      </div>

                      {/* Background / Src Attribute & Layout Assets Picker */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-slate-400">
                            {selectedNode.tag.includes('ImageView')
                              ? 'android:src / background'
                              : 'android:background'}
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setAssetPickerForAttr(
                                selectedNode.tag.includes('ImageView') ? 'src' : 'background'
                              )
                            }
                            className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                            title="Choose from Project Layout Assets"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Pick Asset</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={selectedNode.background}
                          onChange={(e) =>
                            updateSelectedNodeAttribute('android:background', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-100"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {COLOR_PRESETS.map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() =>
                                updateSelectedNodeAttribute('android:background', c.value)
                              }
                              className="w-5 h-5 rounded-md border border-slate-700/80 cursor-pointer shadow-sm hover:scale-110 transition-transform"
                              style={{
                                backgroundColor:
                                  c.value === 'transparent' ? '#0E1420' : c.value,
                              }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCORDION 5: VISIBILITY, STATE & ACTIONS */}
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('visibility')}
                    className="w-full px-3 py-2 bg-slate-900/90 hover:bg-slate-800/80 flex items-center justify-between text-left font-semibold text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>5. State & Hierarchy</span>
                    </span>
                    {collapsedSections.visibility ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                  {!collapsedSections.visibility && (
                    <div className="p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            visibility
                          </label>
                          <select
                            value={selectedNode.visibility}
                            onChange={(e) =>
                              updateSelectedNodeAttribute('android:visibility', e.target.value)
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                          >
                            <option value="visible">visible</option>
                            <option value="invisible">invisible</option>
                            <option value="gone">gone</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">enabled</label>
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedNodeAttribute(
                                'android:enabled',
                                selectedNode.enabled ? 'false' : 'true'
                              )
                            }
                            className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              selectedNode.enabled
                                ? 'bg-emerald-950/60 border border-emerald-600/50 text-emerald-300'
                                : 'bg-slate-950 border border-slate-800 text-slate-500'
                            }`}
                          >
                            {selectedNode.enabled ? 'true' : 'false'}
                          </button>
                        </div>
                      </div>

                      {/* Hierarchy Controls */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => moveNode(selectedNode.index, 'up')}
                            disabled={selectedNode.index === 0}
                            className="flex-1 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-300 flex items-center justify-center gap-1 cursor-pointer border border-slate-800 text-xs"
                            title="Move View Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                            <span>Up</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveNode(selectedNode.index, 'down')}
                            disabled={selectedNode.index >= parsed.nodes.length - 1}
                            className="flex-1 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-300 flex items-center justify-center gap-1 cursor-pointer border border-slate-800 text-xs"
                            title="Move View Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                            <span>Down</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateNode(selectedNode)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                            title="Duplicate View"
                          >
                            <Copy className="w-3.5 h-3.5 text-sky-400" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteNode(selectedNode)}
                          className="w-full py-1.5 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete View @+{selectedNode.id}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Sliders className="w-8 h-8 text-slate-700 mx-auto" />
                <p>Select any element on the preview canvas to inspect or modify its attributes.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPONENT TREE (View Hierarchy) */}
        {inspectorTab === 'tree' && (
          <div className="flex-1 p-3 space-y-1.5 overflow-y-auto text-xs">
            <div className="text-[11px] font-semibold text-slate-400 pb-1 border-b border-slate-800">
              Component Hierarchy ({parsed.rootTag})
            </div>
            {parsed.nodes.length === 0 ? (
              <div className="p-4 text-center text-slate-500">No child views in layout.</div>
            ) : (
              parsed.nodes.map((n, idx) => (
                <div
                  key={`${n.id}-${idx}`}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setInspectorTab('attributes');
                  }}
                  className={`p-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    selectedNode?.index === idx
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-medium'
                      : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-mono text-slate-500">{idx + 1}</span>
                    <span className="font-semibold">{n.tag}</span>
                    <span className="font-mono text-[11px] text-slate-400 truncate">@{n.id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(n);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400"
                    title="Delete View"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: ROOT LAYOUT CONFIGURATION */}
        {inspectorTab === 'root' && (
          <div className="flex-1 p-3.5 space-y-4 text-xs overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-100">Root Layout Config</span>
              <span className="font-mono text-emerald-400">{parsed.rootTag}</span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Root Layout Container</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['LinearLayout', 'ConstraintLayout', 'ScrollView'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => switchRootTag(r)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-colors cursor-pointer ${
                      parsed.rootTag === r
                        ? 'bg-emerald-600 text-slate-950 font-semibold border-emerald-500'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {parsed.rootTag === 'LinearLayout' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">android:orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['vertical', 'horizontal'] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => updateRootAttribute('android:orientation', o)}
                      className={`py-1.5 rounded-lg border capitalize ${
                        parsed.rootOrientation === o
                          ? 'bg-emerald-600 text-slate-950 font-semibold border-emerald-500'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-400">Root Background Color</label>
              <input
                type="text"
                value={parsed.rootBg}
                onChange={(e) => updateRootAttribute('android:background', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => updateRootAttribute('android:background', c.value)}
                    className="w-6 h-6 rounded-md border border-slate-700/80 cursor-pointer shadow-sm hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value === 'transparent' ? '#0E1420' : c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD NEW LAYOUT ASSET TO PROJECT (Vectors, Shapes, Gradients, Images) */}
      {newAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl overflow-hidden font-sans my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0E1420]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-100 text-sm">
                    Add Layout Asset to Project
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Generate vector drawables, shape cards, gradients, or upload images into res/drawable
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewAssetModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Asset Type Selector Tabs */}
            <div className="px-5 pt-4 pb-2 shrink-0">
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                {(
                  [
                    { id: 'vector', label: 'Vector Icon', icon: Sparkles },
                    { id: 'shape', label: 'Shape Card', icon: Square },
                    { id: 'gradient', label: 'Gradient', icon: Palette },
                    { id: 'image', label: 'Upload Media', icon: Upload },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAssetTypeTab(t.id)}
                      className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[11px] ${
                        assetTypeTab === t.id
                          ? 'bg-emerald-600 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Asset Name Field */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Asset Resource Name (in @drawable/)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newAssetName}
                    onChange={(e) =>
                      setNewAssetName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
                    }
                    placeholder="e.g. ic_cart_badge or bg_card_emerald"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[10px] font-mono text-emerald-400">
                    @drawable/{newAssetName || '...'}
                  </span>
                </div>
              </div>

              {/* TAB 1: VECTOR ICON GENERATOR */}
              {assetTypeTab === 'vector' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Choose Vector Icon Template
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                      {AVAILABLE_ICON_TEMPLATES.map((tpl) => {
                        const isSelected = selectedIconKey === tpl.key;
                        return (
                          <div
                            key={tpl.key}
                            onClick={() => {
                              setSelectedIconKey(tpl.key);
                              setNewAssetColor(tpl.defaultColor);
                              if (newAssetName === 'ic_favorite_badge' || newAssetName.startsWith('ic_')) {
                                setNewAssetName(`ic_${tpl.key}`);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500 text-slate-100'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <svg
                              className="w-5 h-5"
                              viewBox="0 0 24 24"
                              fill={isSelected ? newAssetColor : tpl.defaultColor}
                            >
                              <path d={tpl.pathData} />
                            </svg>
                            <span className="text-[10px] font-medium truncate w-full">
                              {tpl.label.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Icon Fill Tint Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newAssetColor}
                        onChange={(e) => setNewAssetColor(e.target.value)}
                        className="w-32 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_PRESETS.filter((c) => c.value !== 'transparent').map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setNewAssetColor(c.value)}
                            className="w-6 h-6 rounded-md border border-slate-700 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SHAPE & CARD DRAWABLE */}
              {assetTypeTab === 'shape' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Solid Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newAssetColor}
                        onChange={(e) => setNewAssetColor(e.target.value)}
                        className="w-32 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_PRESETS.filter((c) => c.value !== 'transparent').map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setNewAssetColor(c.value)}
                            className="w-6 h-6 rounded-md border border-slate-700 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Corner Radius (dp)
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {['4dp', '8dp', '14dp', '20dp', '999dp'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setShapeRadius(r)}
                          className={`py-1.5 rounded-lg border text-xs text-center transition-colors cursor-pointer ${
                            shapeRadius === r
                              ? 'bg-emerald-600 text-slate-950 font-bold border-emerald-500'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GRADIENT BACKGROUND */}
              {assetTypeTab === 'gradient' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Start Color</label>
                      <input
                        type="text"
                        value={gradientStart}
                        onChange={(e) => setGradientStart(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">End Color</label>
                      <input
                        type="text"
                        value={gradientEnd}
                        onChange={(e) => setGradientEnd(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Corner Radius</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['8dp', '16dp', '24dp', '999dp'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setShapeRadius(r)}
                          className={`py-1.5 rounded-lg border text-xs text-center transition-colors cursor-pointer ${
                            shapeRadius === r
                              ? 'bg-emerald-600 text-slate-950 font-bold border-emerald-500'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: UPLOAD IMAGE MEDIA */}
              {assetTypeTab === 'image' && (
                <div className="space-y-3">
                  <label className="block text-slate-300 font-medium mb-1">
                    Select Media File (PNG, JPG, SVG, WebP)
                  </label>
                  <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-900/60 transition-colors">
                    <Upload className="w-8 h-8 text-emerald-400" />
                    <span className="text-xs text-slate-200 font-semibold">
                      Click to Browse Media File
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Supports PNG, JPG, WebP, and SVG images
                    </span>
                    <input
                      type="file"
                      accept="image/*,.svg"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadedImageData && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                      <img
                        src={uploadedImageData}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-100 truncate">
                          {newAssetName}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          Image ready to embed in res/drawable
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live Visual Asset Preview Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow border"
                    style={{
                      backgroundColor:
                        assetTypeTab === 'gradient'
                          ? gradientStart
                          : assetTypeTab === 'shape'
                          ? newAssetColor
                          : `${newAssetColor}25`,
                      borderColor: `${newAssetColor}60`,
                    }}
                  >
                    {assetTypeTab === 'vector' ? (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={newAssetColor}>
                        <path
                          d={
                            AVAILABLE_ICON_TEMPLATES.find((t) => t.key === selectedIconKey)
                              ?.pathData || AVAILABLE_ICON_TEMPLATES[0].pathData
                          }
                        />
                      </svg>
                    ) : assetTypeTab === 'image' && uploadedImageData ? (
                      <img
                        src={uploadedImageData}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Sparkles className="w-5 h-5 text-emerald-300" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">
                      @drawable/{newAssetName || 'asset_preview'}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400">
                      Type: {assetTypeTab.toUpperCase()} · Android Drawable XML
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Live Preview</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-end gap-2 bg-[#0E1420] shrink-0">
              <button
                type="button"
                onClick={() => setNewAssetModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewAsset}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create & Add to res/drawable</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PICK ASSET FOR SELECTED WIDGET ATTRIBUTE */}
      {assetPickerForAttr && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl overflow-hidden font-sans my-auto max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0E1420]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display font-bold text-slate-100 text-sm">
                  Apply Layout Asset to @+id/{selectedNode?.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssetPickerForAttr(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 max-h-96">
              {projectAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    if (selectedNode) {
                      const attrName =
                        assetPickerForAttr === 'src' ? 'android:src' : 'android:background';
                      updateSelectedNodeAttribute(attrName, asset.resRef);
                      showToast(`Set ${attrName}="${asset.resRef}"`);
                    }
                    setAssetPickerForAttr(null);
                  }}
                  className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${asset.color || '#10B981'}25`,
                        borderColor: `${asset.color || '#10B981'}50`,
                      }}
                    >
                      <Sparkles className="w-4 h-4" style={{ color: asset.color || '#10B981' }} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-100 group-hover:text-emerald-300">
                        {asset.name}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400">{asset.resRef}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px]"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-[#0E1420] shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAssetPickerForAttr(null);
                  setNewAssetModalOpen(true);
                }}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Custom Asset</span>
              </button>
              <button
                type="button"
                onClick={() => setAssetPickerForAttr(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
