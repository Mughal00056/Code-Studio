import { FileNode, Project, ProjectTemplateId, SupportedLanguage } from '../types/ide';

export function detectLanguage(fileName: string): SupportedLanguage {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.kt') || lower.endsWith('.kts')) return 'kotlin';
  if (lower.endsWith('.java')) return 'java';
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

export const PROJECT_TEMPLATES: {
  id: ProjectTemplateId;
  name: string;
  description: string;
  defaultLang: 'Kotlin' | 'Java' | 'React / TypeScript';
  category: string;
}[] = [
  {
    id: 'empty_activity',
    name: 'Empty Activity',
    description: 'Creates a new Android project with a single AppCompatActivity and XML layout.',
    defaultLang: 'Kotlin',
    category: 'Android Native',
  },
  {
    id: 'basic_activity',
    name: 'Basic Activity',
    description: 'App bar, FloatingActionButton, and interactive counter card layout.',
    defaultLang: 'Kotlin',
    category: 'Android Native',
  },
  {
    id: 'bottom_nav',
    name: 'Bottom Navigation',
    description: 'Standard three-tab bottom navigation architecture with Home, Dashboard, and Alerts.',
    defaultLang: 'Kotlin',
    category: 'Android Native',
  },
  {
    id: 'login_screen',
    name: 'Login Screen',
    description: 'Email and password authentication form with input validation and state feedback.',
    defaultLang: 'Kotlin',
    category: 'Android Native',
  },
  {
    id: 'recyclerview',
    name: 'RecyclerView List',
    description: 'Scrollable list adapter pattern for high-performance mobile feeds.',
    defaultLang: 'Kotlin',
    category: 'Android Native',
  },
  {
    id: 'compose_activity',
    name: 'Compose Activity',
    description: 'Declarative UI built with Jetpack Compose Material 3 components.',
    defaultLang: 'Kotlin',
    category: 'Jetpack Compose',
  },
  {
    id: 'react_webview',
    name: 'React Capacitor Hybrid',
    description: 'HTML, CSS, and TypeScript mobile project bundled inside an Android WebView shell.',
    defaultLang: 'React / TypeScript',
    category: 'Hybrid Web',
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
  language: 'Kotlin' | 'Java' | 'React / TypeScript';
  template: ProjectTemplateId;
  minSdk: string;
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

  if (params.template === 'react_webview' || params.language === 'React / TypeScript') {
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
    { id: '3', title: 'Optimize RecyclerView item view bindings', category: 'UI', updatedAt: 'Yesterday' }
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
      <h1 className="text-xl font-bold mb-4">${params.name}</h1>
      <div className="flex gap-2 mb-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a quick dev note..."
          className="flex-1 px-3 py-2 rounded bg-slate-900 border border-slate-800"
        />
        <button onClick={addNote} className="px-4 py-2 rounded bg-emerald-600 text-white font-medium">
          Add
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

    <uses-permission android:name="android.permission.INTERNET" />

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
        android:text="${params.name} Hybrid Shell"
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
        android:text="Save Note to Local Storage"
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

    const folders = createFolderStructure(
      rawFiles.map((f) => f.path),
      now
    );
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

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />

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

  const folders = createFolderStructure(
    rawFiles.map((f) => f.path),
    now
  );
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
  });

  // Modify MainActivity.kt slightly in MyApp so Git Source Control immediately shows realistic working changes if desired, or keep snapshot synced
  const myAppSnapshot: Record<string, string> = {};
  myAppFiles.forEach((f) => {
    if (f.type === 'file' && f.content !== undefined) {
      myAppSnapshot[f.path] = f.content;
    }
  });
  // Introduce a subtle unstaged edit on MainActivity.kt and activity_main.xml so Git Source Control has live changes out of the box (matching Section 16 of PRD!)
  myAppSnapshot['app/src/main/java/com/example/myapp/MainActivity.kt'] =
    (myAppSnapshot['app/src/main/java/com/example/myapp/MainActivity.kt'] || '').replace(
      'private var tapCount = 0',
      'private var tapCount = 0 // Initial commit baseline'
    );
  myAppSnapshot['app/src/main/res/layout/activity_main.xml'] =
    (myAppSnapshot['app/src/main/res/layout/activity_main.xml'] || '').replace(
      'Trigger Action & Logcat',
      'Run Action'
    );

  const notesFiles = generateProjectFiles({
    name: 'NotesApp',
    packageName: 'com.codestudio.notesapp',
    language: 'React / TypeScript',
    template: 'react_webview',
    minSdk: 'Android 10.0 (API 29)',
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
      buildSystem: 'Gradle (Kotlin DSL)',
      storagePath: '/storage/emulated/0/CodeStudio/Projects/MyApp',
      createdAt: now - 1000 * 60 * 120,
      updatedAt: now - 1000 * 60 * 2, // 2 min ago
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
      id: 'proj-notesapp',
      name: 'NotesApp',
      packageName: 'com.codestudio.notesapp',
      language: 'React / TypeScript',
      template: 'react_webview',
      minSdk: 'Android 10.0 (API 29)',
      buildSystem: 'Vite + Capacitor',
      storagePath: '/storage/emulated/0/CodeStudio/Projects/NotesApp',
      createdAt: now - 1000 * 60 * 60 * 28,
      updatedAt: now - 1000 * 60 * 60 * 22, // Yesterday
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
      buildSystem: 'Gradle (Groovy)',
      storagePath: '/storage/emulated/0/CodeStudio/Projects/Calculator',
      createdAt: now - 1000 * 60 * 60 * 72,
      updatedAt: now - 1000 * 60 * 60 * 48, // 2 days ago
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
