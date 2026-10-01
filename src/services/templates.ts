import {
  FileNode,
  Project,
  ProjectBuildSystem,
  ProjectLanguage,
  ProjectTemplateId,
  SupportedLanguage,
} from '../types/ide';

export function detectLanguage(fileName: string): SupportedLanguage {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.kt') || lower.endsWith('.kts')) return 'kotlin';
  if (lower.endsWith('.java')) return 'java';
  if (lower.endsWith('.dart')) return 'dart';
  if (lower.endsWith('.xml')) return 'xml';
  if (lower.endsWith('.gradle')) return 'gradle';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript';
  if (lower.endsWith('.html')) return 'html';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.cpp') || lower.endsWith('.c') || lower.endsWith('.h')) return 'cpp';
  if (lower.endsWith('.md')) return 'markdown';
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'yaml';
  if (lower.endsWith('.sh')) return 'bash';
  return 'properties';
}

export const ANDROID_PERMISSIONS_LIST = [
  { id: 'android.permission.INTERNET', label: 'Internet & Network Access', dangerous: false },
  { id: 'android.permission.CAMERA', label: 'Camera Capture', dangerous: true },
  { id: 'android.permission.READ_EXTERNAL_STORAGE', label: 'Read Storage / Media', dangerous: true },
  { id: 'android.permission.WRITE_EXTERNAL_STORAGE', label: 'Write Storage / Files', dangerous: true },
  { id: 'android.permission.ACCESS_FINE_LOCATION', label: 'Precise GPS Location', dangerous: true },
  { id: 'android.permission.POST_NOTIFICATIONS', label: 'Push & Local Notifications', dangerous: true },
  { id: 'android.permission.VIBRATE', label: 'Haptic Vibration', dangerous: false },
];

export const PROJECT_TEMPLATES: {
  id: ProjectTemplateId;
  name: string;
  description: string;
  defaultLang: ProjectLanguage;
  defaultBuildSystem: ProjectBuildSystem;
  category: string;
  previewImage: string;
  accentColor: string;
}[] = [
  {
    id: 'empty_activity',
    name: 'Empty Views Activity',
    description: 'AppCompatActivity with Constraint/LinearLayout XML and interactive action button.',
    defaultLang: 'Kotlin',
    defaultBuildSystem: 'Kotlin Gradle DSL',
    category: 'Android Kotlin',
    previewImage: '/src/assets/images/template_kotlin_android_1790861883908.jpg',
    accentColor: '#10B981',
  },
  {
    id: 'flutter_app',
    name: 'Flutter Material 3 App',
    description: 'Cross-platform Flutter & Dart project with StatefulWidget counter, cards, and Gradle shell.',
    defaultLang: 'Flutter',
    defaultBuildSystem: 'Flutter + Gradle',
    category: 'Flutter SDK',
    previewImage: '/src/assets/images/template_flutter_app_1790861898421.jpg',
    accentColor: '#38BDF8',
  },
  {
    id: 'react_webview',
    name: 'React + Capacitor Hybrid',
    description: 'React 19 + TypeScript mobile interface wrapped in an Android WebView & Gradle bridge.',
    defaultLang: 'React',
    defaultBuildSystem: 'React Vite + Capacitor',
    category: 'React Hybrid',
    previewImage: '/src/assets/images/template_react_hybrid_1790861912919.jpg',
    accentColor: '#818CF8',
  },
  {
    id: 'login_screen',
    name: 'Login & Auth Activity',
    description: 'Java/Kotlin authentication screen with Email, Password, validation, and Toast feedback.',
    defaultLang: 'Java',
    defaultBuildSystem: 'Java Groovy Gradle',
    category: 'Android Java',
    previewImage: '/src/assets/images/template_login_java_1790861928440.jpg',
    accentColor: '#F59E0B',
  },
  {
    id: 'compose_activity',
    name: 'Jetpack Compose Activity',
    description: 'Declarative @Composable UI built with Material 3 theme and state management.',
    defaultLang: 'Kotlin',
    defaultBuildSystem: 'Kotlin Gradle DSL',
    category: 'Jetpack Compose',
    previewImage: '/src/assets/images/template_kotlin_android_1790861883908.jpg',
    accentColor: '#10B981',
  },
  {
    id: 'bottom_nav',
    name: 'Bottom Navigation Views',
    description: 'Multi-tab mobile navigation layout with Home, Dashboard, and Notifications.',
    defaultLang: 'Kotlin',
    defaultBuildSystem: 'Kotlin Gradle DSL',
    category: 'Android Kotlin',
    previewImage: '/src/assets/images/template_flutter_app_1790861898421.jpg',
    accentColor: '#34D399',
  },
  {
    id: 'basic_activity',
    name: 'Basic Activity + FAB',
    description: 'Material App Bar, FloatingActionButton, and coordinator content layout.',
    defaultLang: 'Kotlin',
    defaultBuildSystem: 'Kotlin Gradle DSL',
    category: 'Android Kotlin',
    previewImage: '/src/assets/images/template_kotlin_android_1790861883908.jpg',
    accentColor: '#10B981',
  },
  {
    id: 'recyclerview',
    name: 'RecyclerView Feed List',
    description: 'High-performance scrollable list adapter and ViewHolder item pattern.',
    defaultLang: 'Java',
    defaultBuildSystem: 'Java Groovy Gradle',
    category: 'Android Java',
    previewImage: '/src/assets/images/template_react_hybrid_1790861912919.jpg',
    accentColor: '#38BDF8',
  },
];

function createFolderStructure(paths: string[], now: number): FileNode[] {
  const folderSet = new Set<string>();
  for (const p of paths) {
    const parts = p.split('/');
    for (let i = 1; i < parts.length; i++) {
      folderSet.add(parts.slice(0, i).join('/'));
    }
  }
  return Array.from(folderSet)
    .sort()
    .map((folderPath) => {
      const segments = folderPath.split('/');
      return {
        id: `folder-${folderPath}`,
        name: segments[segments.length - 1],
        path: folderPath,
        type: 'folder' as const,
        lastModified: now,
      };
    });
}

export function generateProjectFiles(params: {
  name: string;
  packageName: string;
  language: ProjectLanguage;
  template: ProjectTemplateId;
  minSdk: string;
  permissions?: string[];
}): FileNode[] {
  const now = Date.now();
  const pkgPath = params.packageName.replace(/\./g, '/');
  const minSdkNum = params.minSdk.includes('26')
    ? '26'
    : params.minSdk.includes('29')
    ? '29'
    : params.minSdk.includes('31')
    ? '31'
    : '26';

  const perms = params.permissions || [
    'android.permission.INTERNET',
    'android.permission.VIBRATE',
  ];
  const manifestPermsXml = perms
    .map((p) => `    <uses-permission android:name="${p}" />`)
    .join('\n');

  // 1. FLUTTER PROJECT GENERATOR
  if (params.language === 'Flutter' || params.template === 'flutter_app') {
    const rawFiles: { path: string; content: string }[] = [
      {
        path: 'lib/main.dart',
        content: `import 'package:flutter/material.dart';

void main() {
  runApp(const ${params.name.replace(/[^a-zA-Z0-9]/g, '') || 'MyFlutter'}App());
}

class ${params.name.replace(/[^a-zA-Z0-9]/g, '') || 'MyFlutter'}App extends StatelessWidget {
  const ${params.name.replace(/[^a-zA-Z0-9]/g, '') || 'MyFlutter'}App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${params.name}',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF10B981),
          brightness: Brightness.dark,
        ),
      ),
      home: const HomePage(title: '${params.name}'),
    );
  }
}

class HomePage extends StatefulWidget {
  final String title;
  const HomePage({super.key, required this.title});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _counter = 0;
  final List<String> _items = ['Hot Reload Ready', 'Material 3 Theme', 'ARM64 Skia / Impeller'];

  void _incrementCounter() {
    setState(() {
      _counter++;
    });
    debugPrint('Flutter Action triggered: counter=\$_counter');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Flutter Counter: \$_counter',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _incrementCounter,
              child: const Text('Increment Flutter State'),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}
`,
      },
      {
        path: 'pubspec.yaml',
        content: `name: ${params.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}
description: A new Flutter Android project created in CodeStudio Mobile.
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.4.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
`,
      },
      {
        path: 'android/app/build.gradle',
        content: `plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
}

android {
    namespace "${params.packageName}"
    compileSdk 34

    defaultConfig {
        applicationId "${params.packageName}"
        minSdk ${minSdkNum}
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
}
`,
      },
      {
        path: 'android/app/src/main/AndroidManifest.xml',
        content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${params.packageName}">

${manifestPermsXml}

    <application
        android:label="${params.name}"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
      },
      {
        path: 'app/src/main/res/layout/activity_main.xml',
        content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="20dp"
    android:background="#0F172A">

    <TextView
        android:id="@+id/tvFlutterTitle"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="${params.name} (Flutter Engine)"
        android:textSize="22sp"
        android:textColor="#38BDF8" />

    <TextView
        android:id="@+id/tvFlutterSub"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Dart 3.4 · Impeller Renderer · Material 3"
        android:textSize="13sp"
        android:textColor="#94A3B8" />

    <EditText
        android:id="@+id/etFlutterInput"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Add item to Flutter state..."
        android:textColor="#F8FAFC" />

    <Button
        android:id="@+id/btnFlutterAction"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Increment Flutter State (+1)"
        android:background="#38BDF8" />

</LinearLayout>
`,
      },
    ];

    const folders = createFolderStructure(rawFiles.map((f) => f.path), now);
    const fileNodes: FileNode[] = rawFiles.map((f) => {
      const segs = f.path.split('/');
      const fileName = segs[segs.length - 1];
      return {
        id: `file-${f.path}`,
        name: fileName,
        path: f.path,
        type: 'file',
        content: f.content,
        language: detectLanguage(fileName),
        lastModified: now,
      };
    });
    return [...folders, ...fileNodes];
  }

  // 2. REACT + CAPACITOR HYBRID PROJECT GENERATOR
  if (params.language === 'React' || params.template === 'react_webview') {
    const rawFiles: { path: string; content: string }[] = [
      {
        path: 'src/App.tsx',
        content: `import React, { useState } from 'react';

export interface NoteItem {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
}

export default function App() {
  const [notes, setNotes] = useState<NoteItem[]>([
    { id: '1', title: 'Configure Gradle offline cache', category: 'Android', updatedAt: '10m ago' },
    { id: '2', title: 'Test APK signing with debug keystore', category: 'Build', updatedAt: '1h ago' },
    { id: '3', title: 'Optimize Capacitor bridge plugins', category: 'React', updatedAt: 'Yesterday' }
  ]);
  const [draft, setDraft] = useState('');

  const addNote = () => {
    if (!draft.trim()) return;
    setNotes([
      { id: String(Date.now()), title: draft.trim(), category: 'General', updatedAt: 'Just now' },
      ...notes
    ]);
    setDraft('');
  };

  return (
    <div className="p-4 bg-slate-950 text-slate-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4">${params.name} (React Hybrid)</h1>
      <div className="flex gap-2 mb-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a quick dev note..."
          className="flex-1 px-3 py-2 rounded bg-slate-900 border border-slate-800"
        />
        <button onClick={addNote} className="px-4 py-2 rounded bg-emerald-600 text-white font-medium">
          Add Note
        </button>
      </div>
      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id} className="p-3 rounded bg-slate-900 border border-slate-800 flex justify-between">
            <span>{n.title}</span>
            <span className="text-xs text-slate-400">{n.category} · {n.updatedAt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
`,
      },
      {
        path: 'src/styles.css',
        content: `body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #090d16;
  color: #f8fafc;
}
`,
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${params.name}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/App.tsx"></script>
</body>
</html>
`,
      },
      {
        path: 'capacitor.config.json',
        content: `{
  "appId": "${params.packageName}",
  "appName": "${params.name}",
  "webDir": "dist",
  "bundledWebRuntime": false
}
`,
      },
      {
        path: 'android/app/src/main/AndroidManifest.xml',
        content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${params.packageName}">

${manifestPermsXml}

    <application
        android:allowBackup="true"
        android:label="${params.name}"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
      },
      {
        path: 'app/src/main/res/layout/activity_main.xml',
        content: `<?xml version="1.0" encoding="utf-8"?>
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
        android:text="${params.name} (React + Capacitor)"
        android:textSize="22sp"
        android:textColor="#F8FAFC" />

    <EditText
        android:id="@+id/etNoteInput"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Enter quick note title..."
        android:textColor="#E2E8F0" />

    <Button
        android:id="@+id/btnSaveNote"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Save Note to React State"
        android:background="#10B981" />

</LinearLayout>
`,
      },
      {
        path: 'package.json',
        content: `{
  "name": "${params.name.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@capacitor/android": "^6.0.0",
    "@capacitor/core": "^6.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
`,
      },
    ];

    const folders = createFolderStructure(rawFiles.map((f) => f.path), now);
    const fileNodes: FileNode[] = rawFiles.map((f) => {
      const segments = f.path.split('/');
      const fileName = segments[segments.length - 1];
      return {
        id: `file-${f.path}`,
        name: fileName,
        path: f.path,
        type: 'file',
        content: f.content,
        language: detectLanguage(fileName),
        lastModified: now,
      };
    });
    return [...folders, ...fileNodes];
  }

  // 3. KOTLIN & JAVA NATIVE ANDROID GENERATOR
  const isJava = params.language === 'Java';
  const mainSourcePath = isJava
    ? `app/src/main/java/${pkgPath}/MainActivity.java`
    : `app/src/main/java/${pkgPath}/MainActivity.kt`;

  let mainCode = '';
  let layoutXml = '';

  if (params.template === 'login_screen') {
    layoutXml = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp"
    android:background="#0F172A">

    <TextView
        android:id="@+id/tvTitle"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Welcome Back"
        android:textSize="24sp"
        android:textColor="#F8FAFC" />

    <TextView
        android:id="@+id/tvSubtitle"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Sign in to continue to ${params.name}"
        android:textSize="14sp"
        android:textColor="#94A3B8" />

    <EditText
        android:id="@+id/etEmail"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="developer@android.com"
        android:textColor="#F8FAFC" />

    <EditText
        android:id="@+id/etPassword"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Password"
        android:textColor="#F8FAFC" />

    <Button
        android:id="@+id/btnLogin"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Sign In"
        android:background="#10B981" />

</LinearLayout>
`;
  } else if (params.template === 'bottom_nav') {
    layoutXml = `<?xml version="1.0" encoding="utf-8"?>
<ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="20dp"
    android:background="#0F172A">

    <TextView
        android:id="@+id/tvNavHeader"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="${params.name} Dashboard"
        android:textSize="22sp"
        android:textColor="#F8FAFC" />

    <TextView
        android:id="@+id/tvStatusCard"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Active Tab: Home Overview · All services nominal"
        android:textSize="14sp"
        android:textColor="#94A3B8" />

    <Button
        android:id="@+id/btnRefreshFeed"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Sync Local Database"
        android:background="#10B981" />

</ConstraintLayout>
`;
  } else {
    layoutXml = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="20dp"
    android:background="#0F172A">

    <TextView
        android:id="@+id/tvGreeting"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Hello from ${params.name}!"
        android:textSize="22sp"
        android:textColor="#F8FAFC" />

    <TextView
        android:id="@+id/tvPackageInfo"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Package: ${params.packageName}"
        android:textSize="13sp"
        android:textColor="#94A3B8" />

    <EditText
        android:id="@+id/etUserMessage"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Type message to logcat..."
        android:textColor="#F8FAFC" />

    <Button
        android:id="@+id/btnPrimaryAction"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Trigger Action & Logcat"
        android:background="#10B981" />

</LinearLayout>
`;
  }

  if (isJava) {
    mainCode = `package ${params.packageName};

import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";
    private int clickCount = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Log.i(TAG, "App started: ${params.name} (${params.packageName})");

        Button actionBtn = findViewById(R.id.btnPrimaryAction);
        TextView greetingText = findViewById(R.id.tvGreeting);

        if (actionBtn != null) {
            actionBtn.setOnClickListener(view -> {
                clickCount++;
                Log.d(TAG, "Primary button clicked: count=" + clickCount);
                greetingText.setText("Clicked " + clickCount + " times!");
                Toast.makeText(this, "Event dispatched #" + clickCount, Toast.LENGTH_SHORT).show();
            });
        }
    }
}
`;
  } else if (params.template === 'compose_activity') {
    mainCode = `package ${params.packageName}

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.i("MainActivity", "Jetpack Compose activity initialized")
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    GreetingScreen(appName = "${params.name}")
                }
            }
        }
    }
}

@Composable
fun GreetingScreen(appName: String) {
    var counter by remember { mutableIntStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(text = "Welcome to $appName", style = MaterialTheme.typography.headlineMedium)
        Text(text = "Recomposition count: $counter", style = MaterialTheme.typography.bodyMedium)
        Button(onClick = {
            counter++
            Log.d("MainActivity", "Compose button tapped: counter=$counter")
        }) {
            Text("Increment State")
        }
    }
}
`;
  } else {
    mainCode = `package ${params.packageName}

import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private var tapCount = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        Log.i(TAG, "App started: ${params.name} on SDK ${minSdkNum}+")

        val tvGreeting = findViewById<TextView>(R.id.tvGreeting)
        val btnAction = findViewById<Button>(R.id.btnPrimaryAction)

        btnAction?.setOnClickListener {
            tapCount++
            val message = "Action executed #$tapCount in ${params.name}"
            tvGreeting?.text = message
            Log.d(TAG, "Button clicked -> $message")
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
        }
    }

    companion object {
        private const val TAG = "MainActivity"
    }
}
`;
  }

  const rawFiles: { path: string; content: string }[] = [
    {
      path: mainSourcePath,
      content: mainCode,
    },
    {
      path: 'app/src/main/res/layout/activity_main.xml',
      content: layoutXml,
    },
    {
      path: 'app/src/main/res/values/strings.xml',
      content: `<resources>
    <string name="app_name">${params.name}</string>
    <string name="action_settings">Settings</string>
    <string name="welcome_title">Hello from ${params.name}</string>
</resources>
`,
    },
    {
      path: 'app/src/main/res/values/colors.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="emerald_500">#10B981</color>
    <color name="emerald_700">#047857</color>
    <color name="slate_900">#0F172A</color>
    <color name="slate_100">#F1F5F9</color>
</resources>
`,
    },
    {
      path: 'app/src/main/AndroidManifest.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${params.packageName}">

${manifestPermsXml}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.DayNight.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`,
    },
    {
      path: 'app/build.gradle',
      content: `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace '${params.packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${params.packageName}"
        minSdk ${minSdkNum}
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.13.1'
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'com.google.android.material:material:1.12.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
}
`,
    },
    {
      path: 'settings.gradle',
      content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${params.name}"
include ':app'
`,
    },
    {
      path: 'gradle.properties',
      content: `# Project-wide Gradle settings for CodeStudio Mobile
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`,
    },
  ];

  const folders = createFolderStructure(rawFiles.map((f) => f.path), now);
  const fileNodes: FileNode[] = rawFiles.map((f) => {
    const segments = f.path.split('/');
    const fileName = segments[segments.length - 1];
    return {
      id: `file-${f.path}`,
      name: fileName,
      path: f.path,
      type: 'file',
      content: f.content,
      language: detectLanguage(fileName),
      lastModified: now,
    };
  });

  return [...folders, ...fileNodes];
}

export function createInitialProjects(): Project[] {
  const now = Date.now();

  const myAppFiles = generateProjectFiles({
    name: 'MyApp',
    packageName: 'com.example.myapp',
    language: 'Kotlin',
    template: 'empty_activity',
    minSdk: 'Android 8.0 (API 26)',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.VIBRATE',
      'android.permission.POST_NOTIFICATIONS',
    ],
  });

  const myAppSnapshot: Record<string, string> = {};
  myAppFiles.forEach((f) => {
    if (f.type === 'file' && f.content !== undefined) {
      myAppSnapshot[f.path] = f.content;
    }
  });
  myAppSnapshot['app/src/main/java/com/example/myapp/MainActivity.kt'] =
    (myAppSnapshot['app/src/main/java/com/example/myapp/MainActivity.kt'] || '').replace(
      'private var tapCount = 0',
      'private var tapCount = 0 // Initial commit baseline'
    );

  const flutterFiles = generateProjectFiles({
    name: 'FlutterShop',
    packageName: 'com.codestudio.fluttershop',
    language: 'Flutter',
    template: 'flutter_app',
    minSdk: 'Android 8.0 (API 26)',
    permissions: ['android.permission.INTERNET', 'android.permission.VIBRATE'],
  });
  const flutterSnapshot: Record<string, string> = {};
  flutterFiles.forEach((f) => {
    if (f.type === 'file' && f.content !== undefined) {
      flutterSnapshot[f.path] = f.content;
    }
  });

  const notesFiles = generateProjectFiles({
    name: 'NotesApp',
    packageName: 'com.codestudio.notesapp',
    language: 'React',
    template: 'react_webview',
    minSdk: 'Android 10.0 (API 29)',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  });
  const notesSnapshot: Record<string, string> = {};
  notesFiles.forEach((f) => {
    if (f.type === 'file' && f.content !== undefined) {
      notesSnapshot[f.path] = f.content;
    }
  });

  const calcFiles = generateProjectFiles({
    name: 'Calculator',
    packageName: 'com.example.calculator',
    language: 'Java',
    template: 'login_screen',
    minSdk: 'Android 8.0 (API 26)',
    permissions: ['android.permission.INTERNET', 'android.permission.VIBRATE'],
  });
  const calcSnapshot: Record<string, string> = {};
  calcFiles.forEach((f) => {
    if (f.type === 'file' && f.content !== undefined) {
      calcSnapshot[f.path] = f.content;
    }
  });

  return [
    {
      id: 'proj-myapp',
      name: 'MyApp',
      packageName: 'com.example.myapp',
      language: 'Kotlin',
      template: 'empty_activity',
      minSdk: 'Android 8.0 (API 26)',
      buildSystem: 'Kotlin Gradle DSL',
      permissions: [
        'android.permission.INTERNET',
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
      ],
      storagePath: '/storage/emulated/0/CodeStudio/Projects/MyApp',
      createdAt: now - 1000 * 60 * 120,
      updatedAt: now - 1000 * 60 * 2,
      files: myAppFiles,
      git: {
        branch: 'main',
        branches: ['main', 'feature/xml-redesign', 'hotfix/gradle-8'],
        remoteUrl: 'https://github.com/developer/MyApp-Android.git',
        commits: [
          {
            id: 'c-2',
            hash: 'a84f29c',
            message: 'Configure Material DayNight theme and Logcat hooks',
            author: 'Mobile Dev',
            timestamp: now - 1000 * 60 * 45,
            branch: 'main',
            changedFiles: ['app/src/main/AndroidManifest.xml', 'app/src/main/res/values/colors.xml'],
          },
          {
            id: 'c-1',
            hash: '7b10e4a',
            message: 'Initial Android project scaffold from Empty Activity template',
            author: 'Mobile Dev',
            timestamp: now - 1000 * 60 * 120,
            branch: 'main',
            changedFiles: ['app/build.gradle', 'settings.gradle'],
          },
        ],
        initialSnapshot: myAppSnapshot,
      },
    },
    {
      id: 'proj-fluttershop',
      name: 'FlutterShop',
      packageName: 'com.codestudio.fluttershop',
      language: 'Flutter',
      template: 'flutter_app',
      minSdk: 'Android 8.0 (API 26)',
      buildSystem: 'Flutter + Gradle',
      permissions: ['android.permission.INTERNET', 'android.permission.VIBRATE'],
      storagePath: '/storage/emulated/0/CodeStudio/Projects/FlutterShop',
      createdAt: now - 1000 * 60 * 60 * 5,
      updatedAt: now - 1000 * 60 * 18,
      files: flutterFiles,
      git: {
        branch: 'main',
        branches: ['main', 'flutter-impeller'],
        remoteUrl: 'https://github.com/developer/FlutterShop-Mobile.git',
        commits: [
          {
            id: 'c-flut-1',
            hash: '5c92e1a',
            message: 'Create Flutter Material 3 StatefulWidget counter and pubspec.yaml',
            author: 'Mobile Dev',
            timestamp: now - 1000 * 60 * 60 * 5,
            branch: 'main',
            changedFiles: ['lib/main.dart', 'pubspec.yaml'],
          },
        ],
        initialSnapshot: flutterSnapshot,
      },
    },
    {
      id: 'proj-notesapp',
      name: 'NotesApp',
      packageName: 'com.codestudio.notesapp',
      language: 'React',
      template: 'react_webview',
      minSdk: 'Android 10.0 (API 29)',
      buildSystem: 'React Vite + Capacitor',
      permissions: [
        'android.permission.INTERNET',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      storagePath: '/storage/emulated/0/CodeStudio/Projects/NotesApp',
      createdAt: now - 1000 * 60 * 60 * 28,
      updatedAt: now - 1000 * 60 * 60 * 22,
      files: notesFiles,
      git: {
        branch: 'main',
        branches: ['main', 'dev'],
        remoteUrl: 'https://github.com/developer/NotesApp-Hybrid.git',
        commits: [
          {
            id: 'c-notes-1',
            hash: '91d3b0e',
            message: 'Initialize React + Capacitor hybrid workspace',
            author: 'Mobile Dev',
            timestamp: now - 1000 * 60 * 60 * 24,
            branch: 'main',
            changedFiles: ['src/App.tsx', 'capacitor.config.json'],
          },
        ],
        initialSnapshot: notesSnapshot,
      },
    },
    {
      id: 'proj-calculator',
      name: 'Calculator',
      packageName: 'com.example.calculator',
      language: 'Java',
      template: 'login_screen',
      minSdk: 'Android 8.0 (API 26)',
      buildSystem: 'Java Groovy Gradle',
      permissions: ['android.permission.INTERNET', 'android.permission.VIBRATE'],
      storagePath: '/storage/emulated/0/CodeStudio/Projects/Calculator',
      createdAt: now - 1000 * 60 * 60 * 72,
      updatedAt: now - 1000 * 60 * 60 * 48,
      files: calcFiles,
      git: {
        branch: 'main',
        branches: ['main'],
        remoteUrl: 'https://github.com/developer/Android-Calculator.git',
        commits: [
          {
            id: 'c-calc-1',
            hash: '3f88c12',
            message: 'Add Java MainActivity and authentication gate',
            author: 'Mobile Dev',
            timestamp: now - 1000 * 60 * 60 * 48,
            branch: 'main',
            changedFiles: ['app/src/main/java/com/example/calculator/MainActivity.java'],
          },
        ],
        initialSnapshot: calcSnapshot,
      },
    },
  ];
}
