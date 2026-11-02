/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowUpCircle,
  BookOpen,
  Box,
  CheckCircle2,
  Code2,
  Cpu,
  DollarSign,
  Download,
  Flame,
  FolderKanban,
  Globe,
  Hammer,
  KeyRound,
  LayoutDashboard,
  Menu,
  Palette,
  PanelLeft,
  PlusCircle,
  SearchCode,
  Settings,
} from 'lucide-react';
import {
  AcceptanceTestResult,
  ApiUpgradeReport,
  BuildArtifactRecord,
  InspectedArtifactReport,
  KeystoreProfile,
  ProjectConfig,
} from './types/androforge';
import { UI_TRANSLATIONS } from './core/materialSchemes';
import {
  CreateNewAppWizardView,
  DashboardView,
  MyProjectsView,
} from './components/DashboardCreateProjectsViews';
import { HtmlToApkStudioView } from './components/HtmlToApkStudioView';
import {
  AndroidApiUpgradeView,
  ApkAabInspectorView,
} from './components/InspectorAndUpgradeViews';
import {
  AppBrandingView,
  FirebaseIntegrationView,
  MonetizationView,
  NavDrawerDesignerView,
  WebViewDesignerView,
} from './components/DesignersAndIntegrationsViews';
import {
  BuildCenterView,
  DocumentationAndSettingsView,
  KeystoreManagerView,
  SdkAndBuildToolsView,
} from './components/KeystoreSdkBuildDocsViews';

export type ModuleId =
  | 'dashboard'
  | 'create'
  | 'projects'
  | 'html_builder'
  | 'inspector'
  | 'upgrade'
  | 'branding'
  | 'webview'
  | 'drawer'
  | 'monetization'
  | 'firebase'
  | 'keystore'
  | 'sdk'
  | 'build_center'
  | 'docs'
  | 'settings';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('html_builder');
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [keystores, setKeystores] = useState<KeystoreProfile[]>([]);
  const [builds, setBuilds] = useState<BuildArtifactRecord[]>([]);
  const [upgradeReports, setUpgradeReports] = useState<ApiUpgradeReport[]>([]);
  const [environment, setEnvironment] = useState<any>(null);
  const [acceptanceTests, setAcceptanceTests] = useState<AcceptanceTestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [language, setLanguage] = useState<'en' | 'id'>('en');
  const [statusBanner, setStatusBanner] = useState<{
    message: string;
    build?: BuildArtifactRecord;
  } | null>(null);

  const t = UI_TRANSLATIONS[language];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modParam = params.get('module') as ModuleId | null;
    if (modParam) {
      setActiveModule(modParam);
    }

    fetch('/api/bootstrap')
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        if (data.projects?.length > 0) {
          setActiveProjectId(data.projects[0].id);
        }
        setKeystores(data.keystores || []);
        setBuilds(data.builds || []);
        setUpgradeReports(data.upgradeReports || []);
        setEnvironment(data.environment || null);
        setAcceptanceTests(data.acceptanceTests || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  const handleSaveProject = async (updated: ProjectConfig) => {
    setProjects((prev) =>
      prev.some((p) => p.id === updated.id)
        ? prev.map((p) => (p.id === updated.id ? updated : p))
        : [updated, ...prev]
    );
    setActiveProjectId(updated.id);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (res.ok && data.projects) {
        setProjects(data.projects);
      }
    } catch {
      // Local state already updated
    }
  };

  const handleTriggerBuild = async (
    buildType: 'apk_debug' | 'apk_release' | 'aab_release' | 'both_release',
    overrideProjectId?: string
  ) => {
    const targetId = overrideProjectId || activeProject?.id;
    if (!targetId) return;
    setIsBuilding(true);
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: targetId, buildType }),
      });
      const data = await res.json();
      if (res.ok && data.build) {
        setBuilds(data.builds);
        setProjects(data.projects);
        setStatusBanner({
          message: `Built & cryptographically signed ${data.build.projectTitle} v${data.build.versionName} (API ${data.build.targetSdk}) in ${data.build.durationMs}ms.`,
          build: data.build,
        });
      }
    } finally {
      setIsBuilding(false);
    }
  };

  const handleIncrementVersion = async () => {
    if (!activeProject) return;
    const res = await fetch(`/api/projects/${activeProject.id}/increment-version`, {
      method: 'POST',
    });
    const data = await res.json();
    if (res.ok && data.projects) {
      setProjects(data.projects);
      setStatusBanner({
        message: `Incremented ${data.project.appTitle} to versionCode ${data.project.versionCode} (v${data.project.versionName}).`,
      });
    }
  };

  const handleDuplicateProject = async (id: string) => {
    const res = await fetch(`/api/projects/${id}/duplicate`, { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.projects) {
      setProjects(data.projects);
      setActiveProjectId(data.project.id);
    }
  };

  const handleDeleteProject = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok && data.projects) {
      setProjects(data.projects);
      if (activeProjectId === id && data.projects[0]) {
        setActiveProjectId(data.projects[0].id);
      }
    }
  };

  const NAV_ITEMS: { id: ModuleId; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'create', label: t.navCreate, icon: PlusCircle },
    { id: 'projects', label: t.navProjects, icon: FolderKanban },
    { id: 'html_builder', label: t.navHtmlBuilder, icon: Globe },
    { id: 'inspector', label: t.navInspector, icon: SearchCode },
    { id: 'upgrade', label: t.navUpgrade, icon: ArrowUpCircle },
    { id: 'branding', label: t.navBranding, icon: Palette },
    { id: 'webview', label: t.navWebView, icon: Code2 },
    { id: 'drawer', label: t.navDrawer, icon: PanelLeft },
    { id: 'monetization', label: t.navMonetization, icon: DollarSign },
    { id: 'firebase', label: t.navFirebase, icon: Flame },
    { id: 'keystore', label: t.navKeystore, icon: KeyRound },
    { id: 'sdk', label: t.navSdk, icon: Cpu },
    { id: 'build_center', label: t.navBuildCenter, icon: Hammer },
    { id: 'docs', label: t.navDocs, icon: BookOpen },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  if (loading || !activeProject) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-sm font-mono text-slate-400">
          Initializing AndroForge Studio Workspace & Local Build Engine...
        </div>
      </div>
    );
  }

  const latestProjectBuild =
    builds.find((b) => b.projectId === activeProject.id) || builds[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Zone 1: Single text element Brand wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            setActiveModule('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          AndroForge Studio
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <button
            type="button"
            onClick={() => setActiveModule('html_builder')}
            className={`hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModule === 'html_builder' ? 'text-teal-600 dark:text-teal-400 font-semibold' : ''
            }`}
          >
            HTML Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('upgrade')}
            className={`hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModule === 'upgrade' ? 'text-teal-600 dark:text-teal-400 font-semibold' : ''
            }`}
          >
            API 36 Upgrade
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('inspector')}
            className={`hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModule === 'inspector' ? 'text-teal-600 dark:text-teal-400 font-semibold' : ''
            }`}
          >
            APK Inspector
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('build_center')}
            className={`hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModule === 'build_center' ? 'text-teal-600 dark:text-teal-400 font-semibold' : ''
            }`}
          >
            Build Center
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={isBuilding}
            onClick={() => handleTriggerBuild('both_release')}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isBuilding ? 'Building Release...' : t.buildBothBtn}
          </button>
        </div>
      </header>

      {/* Main Desktop IDE Workspace Canvas: Left Sidebar (248px) + Main Content Viewport */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar Navigation (16 Modules) */}
        <aside
          aria-label="Studio Modules Sidebar"
          className="w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex flex-col justify-between p-3"
        >
          <div className="space-y-2">
            {/* Active Project Selector inside Sidebar */}
            <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
              <label
                htmlFor="sidebar-active-project"
                className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
              >
                Active Workspace Project
              </label>
              <select
                id="sidebar-active-project"
                value={activeProject.id}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.appTitle} (API {p.targetSdk})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              100% Free & Local Builder
            </div>
            <div>Zero watermarks · Unlimited apps</div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-6 overflow-y-auto space-y-5">
          {/* Build Status Notification Banner */}
          {statusBanner && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusBanner.message}</span>
              </div>
              <div className="flex items-center gap-2">
                {statusBanner.build?.apkFilename && (
                  <a
                    href={`/api/artifacts/${statusBanner.build.id}/apk`}
                    download
                    className="px-2.5 py-1 rounded bg-emerald-600 text-white font-mono text-[11px] hover:bg-emerald-500 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download APK
                  </a>
                )}
                {statusBanner.build?.aabFilename && (
                  <a
                    href={`/api/artifacts/${statusBanner.build.id}/aab`}
                    download
                    className="px-2.5 py-1 rounded bg-teal-600 text-white font-mono text-[11px] hover:bg-teal-500 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download AAB
                  </a>
                )}
                {statusBanner.build && (
                  <a
                    href={`/api/artifacts/${statusBanner.build.id}/source`}
                    download
                    className="px-2.5 py-1 rounded bg-slate-800 text-white font-mono text-[11px] hover:bg-slate-700 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Android Studio ZIP
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setStatusBanner(null)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 px-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {activeModule === 'dashboard' && (
            <DashboardView
              projects={projects}
              builds={builds}
              keystores={keystores}
              acceptanceTests={acceptanceTests}
              activeProject={activeProject}
              onSelectProject={(proj) => setActiveProjectId(proj.id)}
              onNavigateModule={(mod) => setActiveModule(mod as ModuleId)}
              onTriggerBuild={(bt) => handleTriggerBuild(bt)}
            />
          )}

          {activeModule === 'create' && (
            <CreateNewAppWizardView
              templateProject={activeProject}
              keystores={keystores}
              onCreateProject={(newProj) => {
                handleSaveProject(newProj);
                setActiveModule('html_builder');
              }}
            />
          )}

          {activeModule === 'projects' && (
            <MyProjectsView
              projects={projects}
              activeProjectId={activeProject.id}
              onSelectProject={(proj) => {
                setActiveProjectId(proj.id);
                setActiveModule('html_builder');
              }}
              onDuplicateProject={handleDuplicateProject}
              onDeleteProject={handleDeleteProject}
              onCreateNewClick={() => setActiveModule('create')}
            />
          )}

          {activeModule === 'html_builder' && (
            <HtmlToApkStudioView
              project={activeProject}
              keystores={keystores}
              latestBuild={latestProjectBuild}
              isBuilding={isBuilding}
              onUpdateProject={handleSaveProject}
              onTriggerBuild={(bt) => handleTriggerBuild(bt)}
              onNavigateModule={(mod) => setActiveModule(mod as ModuleId)}
              onIncrementVersion={handleIncrementVersion}
            />
          )}

          {activeModule === 'inspector' && (
            <ApkAabInspectorView
              builds={builds}
              onRebuildFromRecoveredAssets={() => setActiveModule('upgrade')}
            />
          )}

          {activeModule === 'upgrade' && (
            <AndroidApiUpgradeView
              projects={projects}
              keystores={keystores}
              upgradeReports={upgradeReports}
              onUpgradeComplete={(upgradedProj, report, allProjects) => {
                setProjects(allProjects);
                setActiveProjectId(upgradedProj.id);
                setUpgradeReports((prev) => [report, ...prev]);
                setStatusBanner({
                  message: `Migrated ${upgradedProj.appTitle} to Android 16 (API ${upgradedProj.targetSdk}) and incremented versionCode to ${upgradedProj.versionCode}.`,
                });
              }}
              onBuildUpgradedProject={(projId) => handleTriggerBuild('both_release', projId)}
            />
          )}

          {activeModule === 'branding' && (
            <AppBrandingView
              project={activeProject}
              onUpdateProject={handleSaveProject}
            />
          )}

          {activeModule === 'webview' && (
            <WebViewDesignerView
              project={activeProject}
              onUpdateProject={handleSaveProject}
            />
          )}

          {activeModule === 'drawer' && (
            <NavDrawerDesignerView
              project={activeProject}
              onUpdateProject={handleSaveProject}
            />
          )}

          {activeModule === 'monetization' && (
            <MonetizationView
              project={activeProject}
              onUpdateProject={handleSaveProject}
            />
          )}

          {activeModule === 'firebase' && (
            <FirebaseIntegrationView
              project={activeProject}
              onUpdateProject={handleSaveProject}
            />
          )}

          {activeModule === 'keystore' && (
            <KeystoreManagerView
              project={activeProject}
              keystores={keystores}
              onSelectKeystoreForProject={(ksId) =>
                handleSaveProject({ ...activeProject, signingProfileId: ksId })
              }
              onKeystoresUpdated={(allKs, created) => {
                setKeystores(allKs);
                handleSaveProject({ ...activeProject, signingProfileId: created.id });
              }}
            />
          )}

          {activeModule === 'sdk' && (
            <SdkAndBuildToolsView
              project={activeProject}
              environment={environment}
            />
          )}

          {activeModule === 'build_center' && (
            <BuildCenterView
              project={activeProject}
              builds={builds}
              isBuilding={isBuilding}
              onTriggerBuild={(bt) => handleTriggerBuild(bt)}
            />
          )}

          {(activeModule === 'docs' || activeModule === 'settings') && (
            <DocumentationAndSettingsView
              mode={activeModule}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode((d) => !d)}
              language={language}
              onChangeLanguage={setLanguage}
              acceptanceTests={acceptanceTests}
            />
          )}
        </main>
      </div>
    </div>
  );
}
