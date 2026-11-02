import React, { useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Download,
  FileCode,
  FolderOpen,
  Globe,
  Layers,
  Package,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  BuildArtifactRecord,
  HtmlAssetFile,
  KeystoreProfile,
  ProjectConfig,
  WebViewExtrasConfig,
} from '../types/androforge';
import { MATERIAL_COLOR_SCHEMES } from '../core/materialSchemes';

interface HtmlToApkStudioViewProps {
  project: ProjectConfig;
  keystores: KeystoreProfile[];
  latestBuild?: BuildArtifactRecord;
  isBuilding: boolean;
  onUpdateProject: (updated: ProjectConfig) => void;
  onTriggerBuild: (buildType: 'apk_debug' | 'apk_release' | 'aab_release' | 'both_release') => void;
  onNavigateModule: (moduleId: string) => void;
  onIncrementVersion: () => void;
}

const EXTRAS_CHECKLIST: {
  key: keyof WebViewExtrasConfig;
  label: string;
  securityNote?: string;
}[] = [
  { key: 'supportZoom', label: 'Support Zoom' },
  { key: 'zoomButtons', label: 'Zoom Buttons' },
  { key: 'sideScrollBars', label: 'Side ScrollBars' },
  { key: 'textSelection', label: 'Text Selection' },
  { key: 'saveFormData', label: 'Save Form Data' },
  { key: 'fullScreen', label: 'Full Screen' },
  { key: 'javascriptApis', label: 'JavaScript APIs' },
  { key: 'httpsOnlyContent', label: 'HTTPs Only Content' },
  { key: 'allowExternalUrls', label: 'Allow External URLs' },
  { key: 'confirmOnExit', label: 'Confirm on Exit' },
  { key: 'enableGpsPrompt', label: 'Enable GPS Prompt' },
  { key: 'disallowScreenshot', label: 'Disallow Screenshot' },
  {
    key: 'allowFileAccess',
    label: 'Allow Legacy file:// Access',
    securityNote: 'Disabled by default: WebViewAssetLoader serves local files safely over https://',
  },
  {
    key: 'allowCrossOriginLocal',
    label: 'Allow Cross-Origin (Local Files)',
  },
  { key: 'showToolbarTitle', label: 'Show Toolbar (Title)' },
  { key: 'liveToolbarTitle', label: 'Live Toolbar Title' },
  { key: 'homeButton', label: 'Home Button' },
  { key: 'pullToRefresh', label: 'Pull to Refresh' },
  { key: 'deepLinking', label: 'Deep-linking' },
  { key: 'popupBlocker', label: 'Pop-up Blocker' },
];

export const HtmlToApkStudioView: React.FC<HtmlToApkStudioViewProps> = ({
  project,
  keystores,
  latestBuild,
  isBuilding,
  onUpdateProject,
  onTriggerBuild,
  onNavigateModule,
  onIncrementVersion,
}) => {
  const [previewTab, setPreviewTab] = useState<'splash' | 'webview' | 'assets'>('splash');
  const [activeAssetPath, setActiveAssetPath] = useState<string>(
    project.htmlAssets[0]?.path || 'index.html'
  );
  const [newAssetName, setNewAssetName] = useState('');

  const handleSegmentChange = (idx: 0 | 1 | 2, val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const nextSegs: [string, string, string] = [...project.packageSegments] as [
      string,
      string,
      string
    ];
    nextSegs[idx] = clean || 'app';
    const fullPkg = nextSegs.join('.');
    onUpdateProject({
      ...project,
      packageSegments: nextSegs,
      applicationId: fullPkg,
      namespace: fullPkg,
    });
  };

  const toggleExtra = (key: keyof WebViewExtrasConfig) => {
    onUpdateProject({
      ...project,
      extras: {
        ...project.extras,
        [key]: !project.extras[key],
      },
    });
  };

  const handleUploadHtmlFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const updatedAssets = [...project.htmlAssets];
    for (const file of Array.from(files)) {
      const text = await file.text();
      const relPath = (file as any).webkitRelativePath
        ? (file as any).webkitRelativePath.split('/').slice(1).join('/') || file.name
        : file.name;
      const existingIdx = updatedAssets.findIndex((a) => a.path === relPath);
      const entry: HtmlAssetFile = {
        path: relPath,
        content: text,
        encoding: 'utf8',
        sizeBytes: file.size,
        mimeType: file.type || 'text/plain',
      };
      if (existingIdx >= 0) {
        updatedAssets[existingIdx] = entry;
      } else {
        updatedAssets.push(entry);
      }
    }

    onUpdateProject({
      ...project,
      htmlAssets: updatedAssets,
    });
  };

  const handleAddBlankAsset = () => {
    const cleanName = newAssetName.trim().replace(/^\/+/, '');
    if (!cleanName) return;
    if (project.htmlAssets.some((a) => a.path === cleanName)) return;
    const updatedAssets: HtmlAssetFile[] = [
      ...project.htmlAssets,
      {
        path: cleanName,
        content: cleanName.endsWith('.css')
          ? '/* Custom stylesheet */\nbody { margin: 0; }'
          : cleanName.endsWith('.js')
          ? '// Custom script\nconsole.log("Loaded in AndroForge WebView");'
          : '<!doctype html>\n<html><body><h1>New Page</h1></body></html>',
        encoding: 'utf8',
        sizeBytes: 64,
        mimeType: 'text/plain',
      },
    ];
    onUpdateProject({ ...project, htmlAssets: updatedAssets });
    setActiveAssetPath(cleanName);
    setNewAssetName('');
  };

  const activeAsset =
    project.htmlAssets.find((a) => a.path === activeAssetPath) || project.htmlAssets[0];

  // Combine HTML + CSS + JS for live interactive iframe preview
  const buildCombinedPreviewSrcDoc = () => {
    if (project.sourceType === 'web_url') {
      return `<!doctype html><html><body style="font-family:system-ui,sans-serif;margin:0;background:#0f172a;color:#f8fafc;display:flex;flex-direction:column;height:100vh;align-items:center;justify-content:center;padding:20px;text-align:center;">
        <div style="background:#1e293b;border:1px solid #334155;padding:20px;border-radius:12px;max-width:300px;">
          <h3 style="margin:0 0 8px;color:#38bdf8;font-size:15px;">Online WebView Target</h3>
          <p style="font-size:12px;color:#cbd5e1;word-break:break-all;margin:0 0 12px;">${project.urlProtocol}${project.webUrl}</p>
          <p style="font-size:11px;color:#94a3b8;margin:0;">HTTPS Only: ${project.extras.httpsOnlyContent ? 'Enforced' : 'Disabled'} · Pull-to-Refresh: ${project.extras.pullToRefresh ? 'Active' : 'Off'}</p>
        </div>
      </body></html>`;
    }
    const indexHtml =
      project.htmlAssets.find((a) => a.path === project.localHtmlEntry)?.content ||
      project.htmlAssets[0]?.content ||
      '<h1>No index.html found</h1>';
    const cssAssets = project.htmlAssets
      .filter((a) => a.path.endsWith('.css'))
      .map((a) => `<style>${a.content}</style>`)
      .join('\n');
    const jsAssets = project.htmlAssets
      .filter((a) => a.path.endsWith('.js'))
      .map((a) => `<script>${a.content}</script>`)
      .join('\n');

    return indexHtml
      .replace('</head>', `${cssAssets}</head>`)
      .replace('</body>', `${jsAssets}</body>`);
  };

  const activeKeystore =
    keystores.find((k) => k.id === project.signingProfileId) || keystores[0];

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>HTML-to-Android Packaging Studio</span>
            <span aria-hidden="true">·</span>
            <span>Website 2 APK Pro v6.2 Compatible Layout</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-teal-600 dark:text-teal-400">
              compileSdk {project.compileSdk} / targetSdk {project.targetSdk}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            {project.appTitle} — <span className="font-mono text-base font-normal text-slate-500 dark:text-slate-400">{project.applicationId}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onIncrementVersion}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            Auto-Increment Version (v{project.versionCode} → v{project.versionCode + 1})
          </button>
          <button
            type="button"
            onClick={() => onNavigateModule('sdk')}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Code2 className="w-3.5 h-3.5" />
            Inspect Generated Kotlin Source
          </button>
        </div>
      </div>

      {/* Main 3-Column Classic + Modern Desktop Builder Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (Cols 1-6): Project Metadata, Browser Config, AdMob/Push/Drawer/Material */}
        <div className="xl:col-span-6 space-y-5">
          {/* Project Metadata Box */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Project Metadata & Application Identity
              </h2>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                API {project.targetSdk} · AGP {project.agpVersion}
              </span>
            </div>

            {/* Website type to Convert */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <span className="sm:col-span-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                Website Type to Convert
              </span>
              <div className="sm:col-span-8 flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="sourceType"
                    checked={project.sourceType === 'local_html'}
                    onChange={() => onUpdateProject({ ...project, sourceType: 'local_html' })}
                    className="accent-teal-600"
                  />
                  <span>Local HTML Website</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="sourceType"
                    checked={project.sourceType === 'web_url'}
                    onChange={() => onUpdateProject({ ...project, sourceType: 'web_url' })}
                    className="accent-teal-600"
                  />
                  <span>Web URL</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="sourceType"
                    checked={project.sourceType === 'android_project'}
                    onChange={() => onUpdateProject({ ...project, sourceType: 'android_project' })}
                    className="accent-teal-600"
                  />
                  <span>Existing Android Project</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8 space-y-3.5">
                {/* App Title */}
                <div>
                  <label
                    htmlFor="studio-app-title"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    App Title
                  </label>
                  <input
                    id="studio-app-title"
                    type="text"
                    value={project.appTitle}
                    onChange={(e) => onUpdateProject({ ...project, appTitle: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* 3-Box Package Name (com . goyal . letusc) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Package Name (Application ID)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      aria-label="Package Segment 1"
                      type="text"
                      value={project.packageSegments[0]}
                      onChange={(e) => handleSegmentChange(0, e.target.value)}
                      className="w-20 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                    <span className="font-mono font-bold text-slate-400">.</span>
                    <input
                      aria-label="Package Segment 2"
                      type="text"
                      value={project.packageSegments[1]}
                      onChange={(e) => handleSegmentChange(1, e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                    <span className="font-mono font-bold text-slate-400">.</span>
                    <input
                      aria-label="Package Segment 3"
                      type="text"
                      value={project.packageSegments[2]}
                      onChange={(e) => handleSegmentChange(2, e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Version Name & Version Code */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="studio-version-name"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Version Name
                    </label>
                    <input
                      id="studio-version-name"
                      type="text"
                      value={project.versionName}
                      onChange={(e) => onUpdateProject({ ...project, versionName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="studio-version-code"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Version Code
                    </label>
                    <input
                      id="studio-version-code"
                      type="number"
                      min={1}
                      value={project.versionCode}
                      onChange={(e) =>
                        onUpdateProject({
                          ...project,
                          versionCode: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* App Orientation */}
                <div>
                  <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    App Orientation
                  </span>
                  <div className="flex items-center gap-4">
                    {(['auto', 'portrait', 'landscape'] as const).map((orient) => (
                      <label
                        key={orient}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="orientation"
                          checked={project.orientation === orient}
                          onChange={() => onUpdateProject({ ...project, orientation: orient })}
                          className="accent-teal-600"
                        />
                        <span className="capitalize">
                          {orient === 'auto' ? 'Auto Rotate' : orient}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Launcher Icon Preview & Permissions Box */}
              <div className="sm:col-span-4 flex flex-col items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/60 dark:bg-slate-950/50">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-sm border border-white/20 select-none"
                  style={{ backgroundColor: project.iconBackgroundHex }}
                >
                  <div className="w-16 h-16 rounded-xl border-2 border-white/90 flex items-center justify-center text-white font-bold text-3xl tracking-tight">
                    {project.iconForegroundText || project.appTitle.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="w-full space-y-1.5 mt-3">
                  <button
                    type="button"
                    onClick={() => onNavigateModule('branding')}
                    className="w-full py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Change Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateModule('webview')}
                    className="w-full py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    App Permissions
                  </button>
                </div>
              </div>
            </div>

            {/* Output Directory */}
            <div>
              <label
                htmlFor="studio-output-dir"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Output Directory (Local Workspace Path)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="studio-output-dir"
                  type="text"
                  value={project.outputDirectory}
                  onChange={(e) =>
                    onUpdateProject({ ...project, outputDirectory: e.target.value })
                  }
                  className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </section>

          {/* Dialogs, Browser Config, Cache Mode & Source URL/Folder */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8 space-y-3">
                <div>
                  <label
                    htmlFor="about-dialog-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    About Dialog Text
                  </label>
                  <input
                    id="about-dialog-input"
                    type="text"
                    value={project.aboutDialogText}
                    onChange={(e) =>
                      onUpdateProject({ ...project, aboutDialogText: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="share-text-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    App Share Text
                  </label>
                  <input
                    id="share-text-input"
                    type="text"
                    value={project.appShareText}
                    onChange={(e) =>
                      onUpdateProject({ ...project, appShareText: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="exit-text-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    App Exit Confirmation Text
                  </label>
                  <input
                    id="exit-text-input"
                    type="text"
                    value={project.appExitText}
                    onChange={(e) =>
                      onUpdateProject({ ...project, appExitText: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Cache Mode */}
              <div className="sm:col-span-4 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/60 dark:bg-slate-950/50 space-y-2">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Cache Mode
                </span>
                {(
                  [
                    { id: 'no_cache', label: 'No Cache' },
                    { id: 'default', label: 'Default Cache' },
                    { id: 'highly_cached', label: 'Highly Cached' },
                  ] as const
                ).map((cm) => (
                  <label
                    key={cm.id}
                    className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="cacheMode"
                      checked={project.cacheMode === cm.id}
                      onChange={() => onUpdateProject({ ...project, cacheMode: cm.id })}
                      className="accent-teal-600"
                    />
                    <span>{cm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Browser Config */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Browser Config:
              </span>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={project.extras.hideWebViewUa}
                  onChange={() => toggleExtra('hideWebViewUa')}
                  className="accent-teal-600 rounded"
                />
                <span>Hide WebView UA</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={project.extras.hideAndroidMobileUa}
                  onChange={() => toggleExtra('hideAndroidMobileUa')}
                  className="accent-teal-600 rounded"
                />
                <span>Hide Android/Mobile UA</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={project.extras.desktopMode}
                  onChange={() => toggleExtra('desktopMode')}
                  className="accent-teal-600 rounded"
                />
                <span>Desktop Mode</span>
              </label>
            </div>

            {/* Source Input: Local HTML vs Web URL */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {project.sourceType === 'web_url' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    URL:
                  </span>
                  <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 bg-slate-50 dark:bg-slate-950">
                    <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="radio"
                        checked={project.urlProtocol === 'http://'}
                        onChange={() => onUpdateProject({ ...project, urlProtocol: 'http://' })}
                        className="accent-teal-600"
                      />
                      <span className="font-mono">http://</span>
                    </label>
                    <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="radio"
                        checked={project.urlProtocol === 'https://'}
                        onChange={() => onUpdateProject({ ...project, urlProtocol: 'https://' })}
                        className="accent-teal-600"
                      />
                      <span className="font-mono">https://</span>
                    </label>
                  </div>
                  <input
                    aria-label="Target Website URL"
                    type="text"
                    value={project.webUrl}
                    onChange={(e) => onUpdateProject({ ...project, webUrl: e.target.value })}
                    placeholder="example.com/app"
                    className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Local HTML Bundle ({project.htmlAssets.length} files packaged in assets/www/)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Entry Point: <code className="font-mono text-teal-600 dark:text-teal-400">{project.localHtmlEntry}</code> · Served via AndroidX WebViewAssetLoader
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import HTML/CSS/JS Files</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleUploadHtmlFiles}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('assets')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition-colors"
                    >
                      Edit Embedded Files
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 4 Quick-Configure Bottom Sub-Panels: AdMob, Push Notifications, Navigation Drawer, Material Color Scheme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AdMob Monetization */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  AdMob Monetization
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      checked={project.admob.enabled}
                      onChange={() =>
                        onUpdateProject({
                          ...project,
                          admob: { ...project.admob, enabled: true },
                        })
                      }
                      className="accent-teal-600"
                    />
                    <span>Enable</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      checked={!project.admob.enabled}
                      onChange={() =>
                        onUpdateProject({
                          ...project,
                          admob: { ...project.admob, enabled: false },
                        })
                      }
                      className="accent-teal-600"
                    />
                    <span>Disable</span>
                  </label>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateModule('monetization')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Configure
              </button>
            </div>

            {/* Push Notifications (Firebase) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Push Notifications (FCM)
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      checked={project.firebase.enabled}
                      onChange={() =>
                        onUpdateProject({
                          ...project,
                          firebase: { ...project.firebase, enabled: true, fcmEnabled: true },
                        })
                      }
                      className="accent-teal-600"
                    />
                    <span>Enable</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      checked={!project.firebase.enabled}
                      onChange={() =>
                        onUpdateProject({
                          ...project,
                          firebase: { ...project.firebase, enabled: false },
                        })
                      }
                      className="accent-teal-600"
                    />
                    <span>Disable</span>
                  </label>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateModule('firebase')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Configure
              </button>
            </div>

            {/* Configure Navigation Drawer */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Configure Navigation Drawer
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      checked={project.navDrawer.enabled}
                      onChange={() =>
                        onUpdateProject({
                          ...project,
                          navDrawer: { ...project.navDrawer, enabled: true },
                        })
                      }
                      className="accent-teal-600"
                    />
                    <span>Enable</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      checked={!project.navDrawer.enabled}
                      onChange={() =>
                        onUpdateProject({
                          ...project,
                          navDrawer: { ...project.navDrawer, enabled: false },
                        })
                      }
                      className="accent-teal-600"
                    />
                    <span>Disable</span>
                  </label>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateModule('drawer')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Configure
              </button>
            </div>

            {/* Customize Material Color Scheme */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Material Color Scheme (21)
                </span>
                <div className="flex items-center h-6 w-28 rounded overflow-hidden border border-slate-300 dark:border-slate-700">
                  <div className="flex-1 h-full" style={{ backgroundColor: project.primaryColor }} />
                  <div className="flex-1 h-full" style={{ backgroundColor: project.secondaryColor }} />
                  <div className="flex-1 h-full" style={{ backgroundColor: project.tertiaryColor }} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateModule('branding')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Customize
              </button>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN (Cols 7-9): Splash Preview / Interactive WebView / Embedded Assets & Build Buttons */}
        <div className="xl:col-span-3 space-y-5">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
            {/* Segmented Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewTab('splash')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  previewTab === 'splash'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Splash Preview
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('webview')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  previewTab === 'webview'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Live WebView
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('assets')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  previewTab === 'assets'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                HTML Files ({project.htmlAssets.length})
              </button>
            </div>

            {previewTab === 'splash' && (
              <div className="space-y-3">
                {/* Phone Frame Splash Preview */}
                <div
                  className="w-full h-72 rounded-xl border-2 border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center shadow-inner transition-colors"
                  style={{
                    backgroundColor: project.splash.backgroundColor,
                    color: project.splash.textColor,
                  }}
                >
                  <h3 className="text-xl font-bold tracking-tight mb-4">
                    {project.appTitle}
                  </h3>
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-md mb-4"
                    style={{ backgroundColor: project.iconBackgroundHex }}
                  >
                    <div className="w-16 h-16 rounded-xl border-2 border-white/90 flex items-center justify-center text-white font-bold text-3xl">
                      {project.iconForegroundText || project.appTitle.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <p className="text-xs font-semibold opacity-90">
                    {project.splash.subtitleText || 'Example Programs'}
                  </p>
                </div>

                {/* Duration & Mode */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <label
                    htmlFor="splash-duration-ms"
                    className="text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Duration
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="splash-duration-ms"
                      type="number"
                      min={0}
                      max={10000}
                      step={250}
                      value={project.splash.durationMs}
                      onChange={(e) =>
                        onUpdateProject({
                          ...project,
                          splash: {
                            ...project.splash,
                            durationMs: parseInt(e.target.value, 10) || 0,
                          },
                        })
                      }
                      className="w-20 px-2.5 py-1 text-xs font-mono tabular-nums rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                    <span className="text-xs text-slate-500">ms</span>
                  </div>
                </div>

                {/* Progress Wheel */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Progress Wheel
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-8 h-8 rounded-full border-3 border-slate-300 dark:border-slate-700 border-t-teal-600 animate-spin shrink-0" />
                    <select
                      aria-label="Progress Wheel Style"
                      value={project.progressWheelStyle}
                      onChange={(e) =>
                        onUpdateProject({
                          ...project,
                          progressWheelStyle: e.target.value as any,
                        })
                      }
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Lollipop">Lollipop</option>
                      <option value="Material3">Material 3 Expressive</option>
                      <option value="Circular">Circular Indeterminate</option>
                      <option value="LinearBar">Top Horizontal Bar</option>
                      <option value="None">Hidden</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'webview' && (
              <div className="space-y-2">
                <div className="rounded-xl border-2 border-slate-700 overflow-hidden bg-white h-80 flex flex-col">
                  <div
                    className="px-3 py-1.5 text-[11px] font-medium text-white flex items-center justify-between"
                    style={{ backgroundColor: project.statusBarColor }}
                  >
                    <span className="truncate">{project.appTitle}</span>
                    <span className="font-mono text-[10px] opacity-80">API {project.targetSdk}</span>
                  </div>
                  <iframe
                    title="AndroForge Live WebView Preview"
                    srcDoc={buildCombinedPreviewSrcDoc()}
                    className="w-full flex-1 border-0"
                    sandbox="allow-scripts"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Interactive sandbox rendering your packaged HTML/CSS/JS assets as served by WebViewAssetLoader.
                </p>
              </div>
            )}

            {previewTab === 'assets' && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <input
                    aria-label="New asset file path"
                    type="text"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    placeholder="e.g. about.html or js/util.js"
                    className="flex-1 px-2.5 py-1 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlankAsset}
                    className="px-2.5 py-1 text-xs font-medium rounded bg-teal-600 text-white hover:bg-teal-500"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {project.htmlAssets.map((asset) => (
                    <button
                      key={asset.path}
                      type="button"
                      onClick={() => setActiveAssetPath(asset.path)}
                      className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                        activeAsset?.path === asset.path
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {asset.path}
                    </button>
                  ))}
                </div>
                {activeAsset && (
                  <textarea
                    aria-label={`Edit ${activeAsset.path}`}
                    value={activeAsset.content}
                    onChange={(e) => {
                      const next = project.htmlAssets.map((a) =>
                        a.path === activeAsset.path
                          ? { ...a, content: e.target.value, sizeBytes: e.target.value.length }
                          : a
                      );
                      onUpdateProject({ ...project, htmlAssets: next });
                    }}
                    rows={10}
                    className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-teal-300 focus:outline-none"
                  />
                )}
              </div>
            )}
          </section>

          {/* Primary Build Buttons (Matching Website 2 APK Pro + Google Play API 36 Ready) */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Signing Key: <strong className="text-slate-800 dark:text-slate-200">{activeKeystore?.alias}</strong></span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">Google Play API 36 Ready</span>
            </div>

            <button
              type="button"
              disabled={isBuilding}
              onClick={() => onTriggerBuild('apk_release')}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-sm transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Build Android APK</span>
              <Smartphone className="w-5 h-5" />
            </button>

            <button
              type="button"
              disabled={isBuilding}
              onClick={() => onTriggerBuild('aab_release')}
              className="w-full py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-sm transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Build App Bundle (AAB)</span>
              <Package className="w-5 h-5" />
            </button>

            <button
              type="button"
              disabled={isBuilding}
              onClick={() => onTriggerBuild('both_release')}
              className="w-full py-2 px-3 rounded-lg border border-teal-600/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              {isBuilding ? 'Packaging & Signing Release Artifacts...' : 'Build Both APK + AAB + Kotlin Source ZIP'}
            </button>

            {latestBuild && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Latest Verified Build ({latestBuild.versionName}):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {latestBuild.apkFilename && (
                    <a
                      href={`/api/artifacts/${latestBuild.id}/apk`}
                      download
                      className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-teal-600 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      APK
                    </a>
                  )}
                  {latestBuild.aabFilename && (
                    <a
                      href={`/api/artifacts/${latestBuild.id}/aab`}
                      download
                      className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-teal-600 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      AAB
                    </a>
                  )}
                  <a
                    href={`/api/artifacts/${latestBuild.id}/source`}
                    download
                    className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-teal-600 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Kotlin Source ZIP
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN (Cols 10-12): Full 20-Item Extras Checklist */}
        <div className="xl:col-span-3">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Extras & WebView Features
              </h2>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {EXTRAS_CHECKLIST.filter((i) => Boolean(project.extras[i.key])).length}/{EXTRAS_CHECKLIST.length}
              </span>
            </div>

            <div className="space-y-2">
              {EXTRAS_CHECKLIST.map((item) => {
                const checked = Boolean(project.extras[item.key]);
                return (
                  <label
                    key={item.key}
                    title={item.securityNote}
                    className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExtra(item.key)}
                      className="accent-teal-600 rounded w-3.5 h-3.5 shrink-0"
                    />
                    <span className="truncate">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
