import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  FileArchive,
  FolderPlus,
  Globe,
  Layers,
  Package,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AcceptanceTestResult,
  BuildArtifactRecord,
  InputSourceType,
  KeystoreProfile,
  ProjectConfig,
} from '../types/androforge';
import { MATERIAL_COLOR_SCHEMES } from '../core/materialSchemes';

interface DashboardViewProps {
  projects: ProjectConfig[];
  builds: BuildArtifactRecord[];
  keystores: KeystoreProfile[];
  acceptanceTests: AcceptanceTestResult[];
  activeProject: ProjectConfig;
  onSelectProject: (proj: ProjectConfig) => void;
  onNavigateModule: (moduleId: string) => void;
  onTriggerBuild: (buildType: 'apk_debug' | 'apk_release' | 'aab_release' | 'both_release') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  builds,
  keystores,
  acceptanceTests,
  activeProject,
  onSelectProject,
  onNavigateModule,
  onTriggerBuild,
}) => {
  const api36Count = projects.filter((p) => p.targetSdk >= 36).length;
  const legacyCount = projects.filter((p) => p.targetSdk < 36).length;
  const passedTests = acceptanceTests.filter((t) => t.status === 'PASS').length;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Local Windows & Desktop Build Engine</span>
            <span aria-hidden="true">·</span>
            <span>Unlimited Projects</span>
            <span aria-hidden="true">·</span>
            <span>No Watermarks or Cloud Locks</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
            AndroForge Studio — HTML-to-APK/AAB & Android 16 (API 36) Builder
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Package local HTML5/CSS/JS applications using AndroidX WebViewAssetLoader, convert live HTTPS websites, inspect compiled APK/AAB binaries, and migrate existing Android projects to compileSdk 36 & targetSdk 36 with full Upload Key signing continuity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateModule('create')}
            className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create New App</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateModule('html_builder')}
            className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Open HTML-to-APK Studio
          </button>
          <button
            type="button"
            onClick={() => onNavigateModule('upgrade')}
            className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            API 36 Upgrade Center
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Local Projects (Unlimited)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {projects.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            {api36Count} on API 36 · {legacyCount} pending API 36 upgrade
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Verified APK & AAB Builds</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400 mt-1">
            {builds.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Signed with RSA-2048 & 4-byte zipaligned
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Toolchain & API Target</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            API 36
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            Android 16 · AGP 8.8.0 · Gradle 8.11.1
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Acceptance Verification</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {passedTests}/{acceptanceTests.length} Verified
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {keystores.length} encrypted keystores in vault
          </div>
        </div>
      </div>

      {/* Recently Opened Projects & Recent APK/AAB Builds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Workspace Projects
            </h2>
            <button
              type="button"
              onClick={() => onNavigateModule('projects')}
              className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
            >
              Manage All Projects
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {projects.map((p) => {
              const isSelected = p.id === activeProject.id;
              return (
                <div
                  key={p.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: p.iconBackgroundHex }}
                    >
                      {p.iconForegroundText || p.appTitle.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {p.appTitle}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500 tabular-nums">
                        <span>{p.applicationId}</span>
                        <span>·</span>
                        <span>v{p.versionName} ({p.versionCode})</span>
                        <span>·</span>
                        <span
                          className={
                            p.targetSdk < 35
                              ? 'text-amber-600 dark:text-amber-400 font-bold'
                              : 'text-teal-600 dark:text-teal-400'
                          }
                        >
                          API {p.targetSdk}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.targetSdk < 36 && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProject(p);
                          onNavigateModule('upgrade');
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                      >
                        Upgrade to API 36
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProject(p);
                        onNavigateModule('html_builder');
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white'
                          : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {isSelected ? 'Editing in Studio' : 'Open in Studio'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Builds & Instant Artifacts */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent APK & AAB Builds
            </h2>
            <button
              type="button"
              onClick={() => onTriggerBuild('both_release')}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              + Build Active Project
            </button>
          </div>

          <div className="space-y-3">
            {builds.slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {b.projectTitle} (v{b.versionName})
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    API {b.targetSdk} · {b.status}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {b.applicationId} · Signed by {b.signingAlias}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {b.apkFilename && (
                    <a
                      href={`/api/artifacts/${b.id}/apk`}
                      download
                      className="px-2.5 py-1 text-[11px] font-mono rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-teal-500 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3 text-teal-500" />
                      APK ({((b.apkSizeBytes || 0) / 1024).toFixed(1)} KB)
                    </a>
                  )}
                  {b.aabFilename && (
                    <a
                      href={`/api/artifacts/${b.id}/aab`}
                      download
                      className="px-2.5 py-1 text-[11px] font-mono rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-teal-500 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3 text-teal-500" />
                      AAB ({((b.aabSizeBytes || 0) / 1024).toFixed(1)} KB)
                    </a>
                  )}
                  <a
                    href={`/api/artifacts/${b.id}/source`}
                    download
                    className="px-2.5 py-1 text-[11px] font-mono rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-teal-500 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3 text-teal-500" />
                    Source ZIP
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CreateNewAppWizardProps {
  templateProject: ProjectConfig;
  keystores: KeystoreProfile[];
  onCreateProject: (newProj: ProjectConfig) => void;
}

export const CreateNewAppWizardView: React.FC<CreateNewAppWizardProps> = ({
  templateProject,
  keystores,
  onCreateProject,
}) => {
  const [sourceType, setSourceType] = useState<InputSourceType>('local_html');
  const [appTitle, setAppTitle] = useState('');
  const [seg1, setSeg1] = useState('com');
  const [seg2, setSeg2] = useState('androforge');
  const [seg3, setSeg3] = useState('mywebapp');
  const [versionName, setVersionName] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState(1);
  const [targetSdk, setTargetSdk] = useState<35 | 36>(36);
  const [webUrl, setWebUrl] = useState('example.com');
  const [schemeId, setSchemeId] = useState('classic-teal');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle.trim()) {
      setErrorMsg('Please enter an Application Title.');
      return;
    }
    const cleanS1 = seg1.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'com';
    const cleanS2 = seg2.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'company';
    const cleanS3 = seg3.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'app';
    const fullPkg = `${cleanS1}.${cleanS2}.${cleanS3}`;
    const scheme =
      MATERIAL_COLOR_SCHEMES.find((s) => s.id === schemeId) ||
      MATERIAL_COLOR_SCHEMES[0];

    const now = new Date().toISOString();
    const newProj: ProjectConfig = {
      ...JSON.parse(JSON.stringify(templateProject)),
      id: `proj_${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
      sourceType,
      appTitle: appTitle.trim(),
      packageSegments: [cleanS1, cleanS2, cleanS3],
      applicationId: fullPkg,
      namespace: fullPkg,
      versionName,
      versionCode,
      targetSdk,
      compileSdk: targetSdk,
      webUrl,
      materialSchemeId: scheme.id,
      primaryColor: scheme.primary,
      secondaryColor: scheme.secondary,
      tertiaryColor: scheme.tertiary,
      statusBarColor: scheme.statusBar,
      navigationBarColor: scheme.navBar,
      iconBackgroundHex: scheme.primary,
      iconForegroundText: appTitle.trim().slice(0, 2).toUpperCase(),
      signingProfileId: keystores[0]?.id || '',
      isExistingPlayApp: false,
    };

    onCreateProject(newProj);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Unlimited Local Projects · Local HTML5, Online WebView, or Android Gradle Project
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
          Create New Android Application Project
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500">
            {errorMsg}
          </div>
        )}

        <div>
          <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
            1. Select Input Source Type
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                {
                  id: 'local_html',
                  title: 'Local HTML Website',
                  desc: 'Offline HTML5, CSS, JS, Vite/React/Vue static builds via WebViewAssetLoader',
                },
                {
                  id: 'web_url',
                  title: 'Online Website URL',
                  desc: 'Convert live HTTPS web app with domain whitelist & offline fallback',
                },
                {
                  id: 'android_project',
                  title: 'Existing Android Project',
                  desc: 'Import Gradle project for API 36 migration & release signing',
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSourceType(opt.id)}
                className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  sourceType === opt.id
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {opt.title}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="wizard-app-title"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Application Name
            </label>
            <input
              id="wizard-app-title"
              type="text"
              required
              value={appTitle}
              onChange={(e) => {
                setAppTitle(e.target.value);
                setErrorMsg(null);
                const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (slug) setSeg3(slug.slice(0, 16));
              }}
              placeholder="e.g. Solar Inventory Pro"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Package Name (Application ID)
            </label>
            <div className="flex items-center gap-1">
              <input
                aria-label="Wizard Package Segment 1"
                type="text"
                value={seg1}
                onChange={(e) => setSeg1(e.target.value)}
                className="w-16 px-2 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
              <span>.</span>
              <input
                aria-label="Wizard Package Segment 2"
                type="text"
                value={seg2}
                onChange={(e) => setSeg2(e.target.value)}
                className="flex-1 px-2 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
              <span>.</span>
              <input
                aria-label="Wizard Package Segment 3"
                type="text"
                value={seg3}
                onChange={(e) => setSeg3(e.target.value)}
                className="flex-1 px-2 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>
        </div>

        {sourceType === 'web_url' && (
          <div>
            <label
              htmlFor="wizard-web-url"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Target HTTPS Website Domain / Path
            </label>
            <input
              id="wizard-web-url"
              type="text"
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="wizard-target-sdk"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Target & Compile SDK
            </label>
            <select
              id="wizard-target-sdk"
              value={targetSdk}
              onChange={(e) => setTargetSdk(Number(e.target.value) as 35 | 36)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            >
              <option value={36}>API 36 — Android 16 (Default)</option>
              <option value={35}>API 35 — Android 15</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="wizard-version-name"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Version Name
            </label>
            <input
              id="wizard-version-name"
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <div>
            <label
              htmlFor="wizard-version-code"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Version Code
            </label>
            <input
              id="wizard-version-code"
              type="number"
              min={1}
              value={versionCode}
              onChange={(e) => setVersionCode(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          Create Project & Open in Packaging Studio
        </button>
      </form>
    </div>
  );
};

interface MyProjectsViewProps {
  projects: ProjectConfig[];
  activeProjectId: string;
  onSelectProject: (proj: ProjectConfig) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onCreateNewClick: () => void;
}

export const MyProjectsView: React.FC<MyProjectsViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onDuplicateProject,
  onDeleteProject,
  onCreateNewClick,
}) => {
  const [search, setSearch] = useState('');
  const filtered = projects.filter(
    (p) =>
      p.appTitle.toLowerCase().includes(search.toLowerCase()) ||
      p.applicationId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Local Workspace Database · Unlimited Projects · Independent Signing & Build History
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            My Application Projects ({projects.length})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <input
            aria-label="Search Projects"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title or package ID..."
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <button
            type="button"
            onClick={onCreateNewClick}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white cursor-pointer"
          >
            + New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((proj) => {
          const isActive = proj.id === activeProjectId;
          return (
            <div
              key={proj.id}
              className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 ${
                isActive
                  ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: proj.iconBackgroundHex }}
                  >
                    {proj.iconForegroundText || proj.appTitle.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {proj.appTitle}
                    </h2>
                    <div className="text-xs font-mono text-slate-500 truncate">
                      {proj.applicationId}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums space-y-1">
                  <div>
                    Version: v{proj.versionName} (code {proj.versionCode}) · API {proj.targetSdk}
                  </div>
                  <div>
                    Source: {proj.sourceType} ({proj.htmlAssets.length} web assets)
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectProject(proj)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white cursor-pointer"
                >
                  Open in Studio
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Duplicate ${proj.appTitle}`}
                    onClick={() => onDuplicateProject(proj.id)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Duplicate
                  </button>
                  {projects.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Delete ${proj.appTitle}`}
                      onClick={() => onDeleteProject(proj.id)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
