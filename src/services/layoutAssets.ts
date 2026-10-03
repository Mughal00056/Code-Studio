import { FileNode, Project } from '../types/ide';

export interface LayoutAssetItem {
  id: string;
  name: string;
  resRef: string; // e.g. '@drawable/ic_star'
  type: 'vector' | 'image' | 'gradient' | 'color';
  category: 'Vector Icons' | 'Media Images' | 'Backgrounds & Gradients';
  description: string;
  color?: string;
  previewSvg?: string;
  xmlSnippet?: string;
}

export const BUILTIN_LAYOUT_ASSETS: LayoutAssetItem[] = [
  {
    id: 'asset-launcher',
    name: 'ic_launcher',
    resRef: '@mipmap/ic_launcher',
    type: 'vector',
    category: 'Vector Icons',
    description: 'Android Studio standard app launch icon',
    color: '#10B981',
    xmlSnippet: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="48dp"
    android:height="48dp"
    android:viewportWidth="48"
    android:viewportHeight="48">
    <path
        android:fillColor="#10B981"
        android:pathData="M24,4C12.95,4 4,12.95 4,24s8.95,20 20,20 20,-8.95 20,-20S35.05,4 24,4zM20,34l-8,-8 2.83,-2.83 5.17,5.17 13.17,-13.17L36,18 20,34z"/>
</vector>`,
  },
  {
    id: 'asset-star',
    name: 'ic_star',
    resRef: '@drawable/ic_star',
    type: 'vector',
    category: 'Vector Icons',
    description: 'Favorite / Rating gold star vector',
    color: '#F59E0B',
    xmlSnippet: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#F59E0B"
        android:pathData="M12,17.27L18.18,21l-1.64,-7.03L22,9.24l-7.19,-0.61L12,2 9.19,8.63 2,9.24l5.46,4.73L5.82,21z"/>
</vector>`,
  },
  {
    id: 'asset-heart',
    name: 'ic_heart',
    resRef: '@drawable/ic_heart',
    type: 'vector',
    category: 'Vector Icons',
    description: 'Favorite / Like heart icon',
    color: '#F43F5E',
    xmlSnippet: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#F43F5E"
        android:pathData="M12,21.35l-1.45,-1.32C5.4,15.36 2,12.28 2,8.5 2,5.42 4.42,3 7.5,3c1.74,0 3.41,0.81 4.5,2.09C13.09,3.81 14.76,3 16.5,3 19.58,3 22,5.42 22,8.5c0,3.78 -3.4,6.86 -8.55,11.54L12,21.35z"/>
</vector>`,
  },
  {
    id: 'asset-camera',
    name: 'ic_camera',
    resRef: '@drawable/ic_camera',
    type: 'vector',
    category: 'Vector Icons',
    description: 'Device camera action vector',
    color: '#38BDF8',
    xmlSnippet: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#38BDF8"
        android:pathData="M9.4,4l-1.8,2H4c-1.1,0 -2,0.9 -2,2v12c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2V8c0,-1.1 -0.9,-2 -2,-2h-3.6l-1.8,-2H9.4zM12,18.5c-2.76,0 -5,-2.24 -5,-5s2.24,-5 5,-5 5,2.24 5,5 -2.24,5 -5,5z"/>
</vector>`,
  },
  {
    id: 'asset-search',
    name: 'ic_search',
    resRef: '@drawable/ic_search',
    type: 'vector',
    category: 'Vector Icons',
    description: 'Search & discovery lens vector',
    color: '#E2E8F0',
    xmlSnippet: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#E2E8F0"
        android:pathData="M15.5,14h-0.79l-0.28,-0.27C15.41,12.59 16,11.11 16,9.5 16,5.91 13.09,3 9.5,3S3,5.91 3,9.5 5.91,16 9.5,16c1.61,0 3.09,-0.59 4.23,-1.57l0.27,0.28v0.79l5,4.99L20.49,19l-4.99,-5zM9.5,14C7.01,14 5,11.99 5,9.5S7.01,5 9.5,5 14,7.01 14,9.5 11.99,14 9.5,14z"/>
</vector>`,
  },
  {
    id: 'asset-settings',
    name: 'ic_settings',
    resRef: '@drawable/ic_settings',
    type: 'vector',
    category: 'Vector Icons',
    description: 'Preferences and system settings gear',
    color: '#94A3B8',
    xmlSnippet: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#94A3B8"
        android:pathData="M19.14,12.94c0.04,-0.3 0.06,-0.61 0.06,-0.94 0,-0.32 -0.02,-0.64 -0.07,-0.94l2.03,-1.58c0.18,-0.14 0.23,-0.41 0.12,-0.61l-1.92,-3.32c-0.12,-0.22 -0.37,-0.29 -0.59,-0.22l-2.39,0.96c-0.5,-0.38 -1.03,-0.7 -1.62,-0.94L14.4,2.81c-0.04,-0.24 -0.24,-0.41 -0.48,-0.41h-3.84c-0.24,0 -0.43,0.17 -0.47,0.41L9.25,5.35C8.66,5.59 8.12,5.92 7.63,6.29L5.24,5.33c-0.22,-0.08 -0.47,0 -0.59,0.22L2.74,8.87c-0.12,0.21 -0.08,0.47 0.12,0.61l2.03,1.58c-0.05,0.3 -0.09,0.63 -0.09,0.94s0.02,0.64 0.07,0.94l-2.03,1.58c-0.18,0.14 -0.23,0.41 -0.12,0.61l1.92,3.32c0.12,0.22 0.37,0.29 0.59,0.22l2.39,-0.96c0.5,0.38 1.03,0.7 1.62,0.94l0.36,2.54c0.05,0.24 0.24,0.41 0.48,0.41h3.84c0.24,0 0.44,-0.17 0.47,-0.41l0.36,-2.54c0.59,-0.24 1.13,-0.56 1.62,-0.94l2.39,0.96c0.22,0.08 0.47,0 0.59,-0.22l1.92,-3.32c0.12,-0.22 0.07,-0.47 -0.12,-0.61l-2.01,-1.58zM12,15.6c-1.98,0 -3.6,-1.62 -3.6,-3.6s1.62,-3.6 3.6,-3.6 3.6,1.62 3.6,3.6 -1.62,3.6 -3.6,3.6z"/>
</vector>`,
  },
  {
    id: 'asset-user',
    name: 'ic_user_avatar',
    resRef: '@drawable/ic_user_avatar',
    type: 'vector',
    category: 'Vector Icons',
    description: 'User profile avatar circle icon',
    color: '#818CF8',
    xmlSnippet: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#818CF8"
        android:pathData="M12,12c2.21,0 4,-1.79 4,-4s-1.79,-4 -4,-4 -4,1.79 -4,4 1.79,4 4,4zM12,14c-2.67,0 -8,1.34 -8,4v2h16v-2c0,-2.66 -5.33,-4 -8,-4z"/>
</vector>`,
  },
  {
    id: 'asset-home',
    name: 'ic_home',
    resRef: '@drawable/ic_home',
    type: 'vector',
    category: 'Vector Icons',
    description: 'Navigation home house icon',
    color: '#10B981',
    xmlSnippet: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#10B981"
        android:pathData="M10,20v-6h4v6h5v-8h3L12,3 2,12h3v8z"/>
</vector>`,
  },
  {
    id: 'asset-bell',
    name: 'ic_bell',
    resRef: '@drawable/ic_bell',
    type: 'vector',
    category: 'Vector Icons',
    description: 'Notifications alert bell icon',
    color: '#FBBF24',
    xmlSnippet: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FBBF24"
        android:pathData="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.89,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"/>
</vector>`,
  },
  {
    id: 'asset-banner',
    name: 'banner_sample',
    resRef: '@drawable/banner_sample',
    type: 'image',
    category: 'Media Images',
    description: 'Responsive hero banner image for cards & headers',
    color: '#1E293B',
    previewSvg: `<svg viewBox="0 0 400 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="50%" stop-color="#1E293B" />
          <stop offset="100%" stop-color="#0284C7" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgrad)" rx="12" />
      <circle cx="80" cy="80" r="45" fill="#38BDF8" opacity="0.2" />
      <circle cx="320" cy="70" r="60" fill="#10B981" opacity="0.15" />
      <text x="30" y="75" fill="#F8FAFC" font-size="20" font-weight="bold" font-family="sans-serif">Android Studio Mobile</text>
      <text x="30" y="105" fill="#94A3B8" font-size="12" font-family="sans-serif">High-performance native layout preview</text>
    </svg>`,
  },
  {
    id: 'asset-grad-emerald',
    name: 'gradient_emerald',
    resRef: '@drawable/gradient_emerald',
    type: 'gradient',
    category: 'Backgrounds & Gradients',
    description: 'Emerald to Dark Slate gradient shape',
    color: '#059669',
    xmlSnippet: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <gradient
        android:startColor="#10B981"
        android:centerColor="#047857"
        android:endColor="#0F172A"
        android:angle="135"/>
    <corners android:radius="16dp"/>
</shape>`,
  },
  {
    id: 'asset-grad-sky',
    name: 'gradient_sky',
    resRef: '@drawable/gradient_sky',
    type: 'gradient',
    category: 'Backgrounds & Gradients',
    description: 'Sky Blue to Indigo gradient card shape',
    color: '#0284C7',
    xmlSnippet: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <gradient
        android:startColor="#38BDF8"
        android:centerColor="#0284C7"
        android:endColor="#1E1B4B"
        android:angle="90"/>
    <corners android:radius="14dp"/>
</shape>`,
  },
  {
    id: 'asset-card-dark',
    name: 'card_dark_bg',
    resRef: '@drawable/card_dark_bg',
    type: 'gradient',
    category: 'Backgrounds & Gradients',
    description: 'Sleek dark card surface with subtle border',
    color: '#1E293B',
    xmlSnippet: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#1E293B"/>
    <stroke android:width="1dp" android:color="#334155"/>
    <corners android:radius="12dp"/>
</shape>`,
  },
];

export function getProjectLayoutAssets(project: Project): LayoutAssetItem[] {
  const dynamicAssets: LayoutAssetItem[] = [];

  // Scan project files in res/drawable or res/mipmap
  project.files.forEach((file) => {
    if (file.type === 'file' && (file.path.includes('res/drawable') || file.path.includes('res/mipmap'))) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const isAlreadyBuiltin = BUILTIN_LAYOUT_ASSETS.some((b) => b.name === baseName);
      if (!isAlreadyBuiltin) {
        dynamicAssets.push({
          id: `custom-${file.path}`,
          name: baseName,
          resRef: file.path.includes('mipmap') ? `@mipmap/${baseName}` : `@drawable/${baseName}`,
          type: file.name.endsWith('.xml') ? 'vector' : 'image',
          category: 'Vector Icons',
          description: `Custom project asset: ${file.path}`,
          color: '#10B981',
          xmlSnippet: file.content,
        });
      }
    }
  });

  return [...BUILTIN_LAYOUT_ASSETS, ...dynamicAssets];
}

export interface IconTemplateOption {
  key: string;
  label: string;
  pathData: string;
  defaultColor: string;
}

export const AVAILABLE_ICON_TEMPLATES: IconTemplateOption[] = [
  {
    key: 'star',
    label: 'Star (Rating / Fav)',
    pathData: 'M12,17.27L18.18,21l-1.64,-7.03L22,9.24l-7.19,-0.61L12,2 9.19,8.63 2,9.24l5.46,4.73L5.82,21z',
    defaultColor: '#F59E0B',
  },
  {
    key: 'heart',
    label: 'Heart (Like / Favorite)',
    pathData: 'M12,21.35l-1.45,-1.32C5.4,15.36 2,12.28 2,8.5 2,5.42 4.42,3 7.5,3c1.74,0 3.41,0.81 4.5,2.09C13.09,3.81 14.76,3 16.5,3 19.58,3 22,5.42 22,8.5c0,3.78 -3.4,6.86 -8.55,11.54L12,21.35z',
    defaultColor: '#F43F5E',
  },
  {
    key: 'home',
    label: 'Home (Dashboard)',
    pathData: 'M10,20v-6h4v6h5v-8h3L12,3 2,12h3v8z',
    defaultColor: '#10B981',
  },
  {
    key: 'search',
    label: 'Search (Lens)',
    pathData: 'M15.5,14h-0.79l-0.28,-0.27C15.41,12.59 16,11.11 16,9.5 16,5.91 13.09,3 9.5,3S3,5.91 3,9.5 5.91,16 9.5,16c1.61,0 3.09,-0.59 4.23,-1.57l0.27,0.28v0.79l5,4.99L20.49,19l-4.99,-5zM9.5,14C7.01,14 5,11.99 5,9.5S7.01,5 9.5,5 14,7.01 14,9.5 11.99,14 9.5,14z',
    defaultColor: '#38BDF8',
  },
  {
    key: 'user',
    label: 'User (Profile)',
    pathData: 'M12,12c2.21,0 4,-1.79 4,-4s-1.79,-4 -4,-4 -4,1.79 -4,4 1.79,4 4,4zM12,14c-2.67,0 -8,1.34 -8,4v2h16v-2c0,-2.66 -5.33,-4 -8,-4z',
    defaultColor: '#818CF8',
  },
  {
    key: 'settings',
    label: 'Settings (Gear)',
    pathData: 'M19.14,12.94c0.04,-0.3 0.06,-0.61 0.06,-0.94 0,-0.32 -0.02,-0.64 -0.07,-0.94l2.03,-1.58c0.18,-0.14 0.23,-0.41 0.12,-0.61l-1.92,-3.32c-0.12,-0.22 -0.37,-0.29 -0.59,-0.22l-2.39,0.96c-0.5,-0.38 -1.03,-0.7 -1.62,-0.94L14.4,2.81c-0.04,-0.24 -0.24,-0.41 -0.48,-0.41h-3.84c-0.24,0 -0.43,0.17 -0.47,0.41L9.25,5.35C8.66,5.59 8.12,5.92 7.63,6.29L5.24,5.33c-0.22,-0.08 -0.47,0 -0.59,0.22L2.74,8.87c-0.12,0.21 -0.08,0.47 0.12,0.61l2.03,1.58c-0.05,0.3 -0.09,0.63 -0.09,0.94s0.02,0.64 0.07,0.94l-2.03,1.58c-0.18,0.14 -0.23,0.41 -0.12,0.61l1.92,3.32c0.12,0.22 0.37,0.29 0.59,0.22l2.39,-0.96c0.5,0.38 1.03,0.7 1.62,0.94l0.36,2.54c0.05,0.24 0.24,0.41 0.48,0.41h3.84c0.24,0 0.44,-0.17 0.47,-0.41l0.36,-2.54c0.59,-0.24 1.13,-0.56 1.62,-0.94l2.39,0.96c0.22,0.08 0.47,0 0.59,-0.22l1.92,-3.32c0.12,-0.22 0.07,-0.47 -0.12,-0.61l-2.01,-1.58zM12,15.6c-1.98,0 -3.6,-1.62 -3.6,-3.6s1.62,-3.6 3.6,-3.6 3.6,1.62 3.6,3.6 -1.62,3.6 -3.6,3.6z',
    defaultColor: '#94A3B8',
  },
  {
    key: 'bell',
    label: 'Bell (Notification)',
    pathData: 'M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zm6,-6v-5c0,-3.07 -1.63,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.64,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z',
    defaultColor: '#FBBF24',
  },
  {
    key: 'cart',
    label: 'Cart (Shopping)',
    pathData: 'M7,18c-1.1,0 -1.99,0.9 -1.99,2S5.9,22 7,22s2,-0.9 2,-2 -0.9,-2 -2,-2zM1,2v2h2l3.6,7.59 -1.35,2.45c-0.16,0.28 -0.25,0.61 -0.25,0.96 0,1.1 0.9,2 2,2h12v-2H7.42c-0.14,0 -0.25,-0.11 -0.25,-0.25l0.03,-0.12 0.9,-1.63h7.45c0.75,0 1.41,-0.41 1.75,-1.03l3.58,-6.49c0.08,-0.14 0.12,-0.31 0.12,-0.48 0,-0.55 -0.45,-1 -1,-1H5.21l-0.94,-2H1zm16,16c-1.1,0 -1.99,0.9 -1.99,2s0.89,2 1.99,2 2,-0.9 2,-2 -0.9,-2 -2,-2z',
    defaultColor: '#10B981',
  },
  {
    key: 'check',
    label: 'Check (Success / Done)',
    pathData: 'M9,16.2L4.8,12l-1.4,1.4L9,19 21,7l-1.4,-1.4L9,16.2z',
    defaultColor: '#10B981',
  },
  {
    key: 'camera',
    label: 'Camera (Photo)',
    pathData: 'M9.4,4l-1.8,2H4c-1.1,0 -2,0.9 -2,2v12c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2V8c0,-1.1 -0.9,-2 -2,-2h-3.6l-1.8,-2H9.4zM12,18.5c-2.76,0 -5,-2.24 -5,-5s2.24,-5 5,-5 5,2.24 5,5 -2.24,5 -5,5z',
    defaultColor: '#38BDF8',
  },
  {
    key: 'edit',
    label: 'Edit (Pencil)',
    pathData: 'M3,17.25V21h3.75L17.81,9.94l-3.75,-3.75L3,17.25zM20.71,7.04c0.39,-0.39 0.39,-1.02 0,-1.41l-2.34,-2.34c-0.39,-0.39 -1.02,-0.39 -1.41,0l-1.83,1.83 3.75,3.75 1.83,-1.83z',
    defaultColor: '#A78BFA',
  },
  {
    key: 'share',
    label: 'Share (Network)',
    pathData: 'M18,16.08c-0.76,0 -1.44,0.3 -1.96,0.77L8.91,12.7c0.05,-0.23 0.09,-0.46 0.09,-0.7s-0.04,-0.47 -0.09,-0.7l7.05,-4.11c0.54,0.5 1.25,0.81 2.04,0.81 1.66,0 3,-1.34 3,-3s-1.34,-3 -3,-3 -3,1.34 -3,3c0,0.24 0.04,0.47 0.09,0.7L8.04,9.81C7.5,9.31 6.79,9 6,9c-1.66,0 -3,1.34 -3,3s1.34,3 3,3c0.79,0 1.5,-0.31 2.04,-0.81l7.12,4.16c-0.05,0.21 -0.08,0.43 -0.08,0.65 0,1.61 1.31,2.92 2.92,2.92 1.61,0 2.92,-1.31 2.92,-2.92s-1.31,-2.92 -2.92,-2.92z',
    defaultColor: '#38BDF8',
  },
  {
    key: 'lock',
    label: 'Lock (Security)',
    pathData: 'M18,8h-1V6c0,-2.76 -2.24,-5 -5,-5S7,3.24 7,6v2H6c-1.1,0 -2,0.9 -2,2v10c0,1.1 0.9,2 2,2h12c1.1,0 2,-0.9 2,-2V10c0,-1.1 -0.9,-2 -2,-2zm-6,9c-1.1,0 -2,-0.9 -2,-2s0.9,-2 2,-2 2,0.9 2,2 -0.9,2 -2,2zm3.1,-9H8.9V6c0,-1.71 1.39,-3.1 3.1,-3.1 1.71,0 3.1,1.39 3.1,3.1v2z',
    defaultColor: '#F59E0B',
  },
];

export function generateCustomVectorDrawableXml(
  name: string,
  iconKey: string,
  fillColor = '#10B981'
): string {
  const tpl = AVAILABLE_ICON_TEMPLATES.find((t) => t.key === iconKey) || AVAILABLE_ICON_TEMPLATES[0];
  const color = fillColor || tpl.defaultColor;

  return `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <!-- Generated vector drawable: ${name} (${tpl.label}) -->
    <path
        android:fillColor="${color}"
        android:pathData="${tpl.pathData}"/>
</vector>
`;
}

export function generateCustomShapeDrawableXml(
  name: string,
  solidColor = '#1E293B',
  radius = '12dp',
  strokeColor = '#334155'
): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <!-- Generated shape drawable: ${name} -->
    <solid android:color="${solidColor}"/>
    <stroke android:width="1dp" android:color="${strokeColor}"/>
    <corners android:radius="${radius}"/>
</shape>
`;
}

export function generateCustomGradientDrawableXml(
  name: string,
  startColor = '#10B981',
  centerColor = '#047857',
  endColor = '#0F172A',
  angle = 135,
  radius = '16dp'
): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <!-- Generated gradient drawable: ${name} -->
    <gradient
        android:startColor="${startColor}"
        android:centerColor="${centerColor}"
        android:endColor="${endColor}"
        android:angle="${angle}"/>
    <corners android:radius="${radius}"/>
</shape>
`;
}
