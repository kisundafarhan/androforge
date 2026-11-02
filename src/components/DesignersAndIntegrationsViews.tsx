import React, { useState } from 'react';
import {
  Bell,
  Check,
  DollarSign,
  Globe,
  Layout,
  Lock,
  Menu,
  Palette,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react';
import { NavDrawerItem, ProjectConfig } from '../types/androforge';
import { MATERIAL_COLOR_SCHEMES } from '../core/materialSchemes';
import { computeRequiredPermissions } from '../core/androidGenerator';

interface DesignerProps {
  project: ProjectConfig;
  onUpdateProject: (updated: ProjectConfig) => void;
}

export const AppBrandingView: React.FC<DesignerProps> = ({
  project,
  onUpdateProject,
}) => {
  const applyScheme = (schemeId: string) => {
    const scheme = MATERIAL_COLOR_SCHEMES.find((s) => s.id === schemeId);
    if (!scheme) return;
    onUpdateProject({
      ...project,
      materialSchemeId: scheme.id,
      primaryColor: scheme.primary,
      secondaryColor: scheme.secondary,
      tertiaryColor: scheme.tertiary,
      statusBarColor: scheme.statusBar,
      navigationBarColor: scheme.navBar,
      iconBackgroundHex: scheme.primary,
      splash: {
        ...project.splash,
        textColor: scheme.primary,
      },
      navDrawer: {
        ...project.navDrawer,
        headerBgColor: scheme.primary,
      },
    });
  };

  const DENSITIES = [
    { name: 'mdpi', sizePx: 48 },
    { name: 'hdpi', sizePx: 72 },
    { name: 'xhdpi', sizePx: 96 },
    { name: 'xxhdpi', sizePx: 144 },
    { name: 'xxxhdpi', sizePx: 192 },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Adaptive Icon Generator · 21 Material 3 Color Schemes · Splash Screen Studio
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
          App Branding & Material 3 Theme Designer
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 21 Material Color Schemes & Custom Color Pickers */}
        <div className="lg:col-span-7 space-y-5">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Select from 21 Material 3 Color Schemes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {MATERIAL_COLOR_SCHEMES.map((scheme) => {
                const active = project.materialSchemeId === scheme.id;
                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => applyScheme(scheme.id)}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center h-4 w-full rounded overflow-hidden mb-1.5">
                      <span className="flex-1 h-full" style={{ backgroundColor: scheme.primary }} />
                      <span className="flex-1 h-full" style={{ backgroundColor: scheme.secondary }} />
                      <span className="flex-1 h-full" style={{ backgroundColor: scheme.tertiary }} />
                    </div>
                    <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">
                      {scheme.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Adaptive Launcher Icon & Densities (mdpi to xxxhdpi)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="brand-icon-monogram"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Foreground Monogram / Symbol
                </label>
                <input
                  id="brand-icon-monogram"
                  type="text"
                  maxLength={3}
                  value={project.iconForegroundText}
                  onChange={(e) =>
                    onUpdateProject({ ...project, iconForegroundText: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label
                  htmlFor="brand-icon-bg"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Adaptive Background Color Hex
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="brand-icon-bg"
                    type="color"
                    value={project.iconBackgroundHex}
                    onChange={(e) =>
                      onUpdateProject({ ...project, iconBackgroundHex: e.target.value })
                    }
                    className="h-8 w-12 rounded cursor-pointer border border-slate-300"
                  />
                  <input
                    aria-label="Adaptive Background Hex String"
                    type="text"
                    value={project.iconBackgroundHex}
                    onChange={(e) =>
                      onUpdateProject({ ...project, iconBackgroundHex: e.target.value })
                    }
                    className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4 pt-2">
              {DENSITIES.map((d) => (
                <div key={d.name} className="flex flex-col items-center gap-1">
                  <div
                    className="rounded-xl flex items-center justify-center text-white font-bold shadow-xs border border-white/20"
                    style={{
                      backgroundColor: project.iconBackgroundHex,
                      width: Math.min(72, Math.max(32, d.sizePx / 2.2)),
                      height: Math.min(72, Math.max(32, d.sizePx / 2.2)),
                      fontSize: Math.max(11, d.sizePx / 6),
                    }}
                  >
                    {project.iconForegroundText || 'A'}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {d.name} ({d.sizePx}px)
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Splash Screen & System Bar Live Preview */}
        <div className="lg:col-span-5 space-y-5">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Splash Screen & System Bar Configuration
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="splash-bg-hex"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Splash Background
                </label>
                <input
                  id="splash-bg-hex"
                  type="text"
                  value={project.splash.backgroundColor}
                  onChange={(e) =>
                    onUpdateProject({
                      ...project,
                      splash: { ...project.splash, backgroundColor: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label
                  htmlFor="splash-subtitle-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Splash Subtitle
                </label>
                <input
                  id="splash-subtitle-input"
                  type="text"
                  value={project.splash.subtitleText}
                  onChange={(e) =>
                    onUpdateProject({
                      ...project,
                      splash: { ...project.splash, subtitleText: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>

            <div
              className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden shadow-md"
              style={{ backgroundColor: project.splash.backgroundColor }}
            >
              <div
                className="px-4 py-1.5 text-[11px] font-mono text-white flex justify-between"
                style={{ backgroundColor: project.statusBarColor }}
              >
                <span>09:41</span>
                <span>5G · 100%</span>
              </div>
              <div
                className="h-64 flex flex-col items-center justify-center p-6 text-center"
                style={{ color: project.splash.textColor }}
              >
                <div className="text-lg font-bold mb-3">{project.appTitle}</div>
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md mb-3"
                  style={{ backgroundColor: project.iconBackgroundHex }}
                >
                  {project.iconForegroundText}
                </div>
                <div className="text-xs font-medium opacity-85">
                  {project.splash.subtitleText}
                </div>
              </div>
              <div
                className="h-5 flex items-center justify-center"
                style={{ backgroundColor: project.navigationBarColor }}
              >
                <div className="w-24 h-1 rounded-full bg-white/60" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export const WebViewDesignerView: React.FC<DesignerProps> = ({
  project,
  onUpdateProject,
}) => {
  const [newDomain, setNewDomain] = useState('');
  const activePermissions = computeRequiredPermissions(project);

  const addDomain = () => {
    const clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '');
    if (!clean) return;
    if (project.extras.allowedDomains.includes(clean)) return;
    onUpdateProject({
      ...project,
      extras: {
        ...project.extras,
        allowedDomains: [...project.extras.allowedDomains, clean],
      },
    });
    setNewDomain('');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          AndroidX WebViewAssetLoader · Origin Whitelist · Runtime Permissions · Deep Links
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
          Advanced WebView Security & Capabilities Designer
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-5">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Allowed Origin Whitelist & JS Bridge Security
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Native JavaScript bridge methods (<code className="font-mono">AndroForgeNative</code>) validate the active page origin against this whitelist before executing.
            </p>
            <div className="flex items-center gap-2">
              <input
                aria-label="Add Whitelisted Domain"
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="api.yourdomain.com"
                className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
              <button
                type="button"
                onClick={addDomain}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-500"
              >
                Add Origin
              </button>
            </div>
            <div className="space-y-1.5">
              {project.extras.allowedDomains.map((dom) => (
                <div
                  key={dom}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono"
                >
                  <span>{dom}</span>
                  {dom !== 'appassets.androidplatform.net' && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProject({
                          ...project,
                          extras: {
                            ...project.extras,
                            allowedDomains: project.extras.allowedDomains.filter(
                              (d) => d !== dom
                            ),
                          },
                        })
                      }
                      className="text-rose-500 hover:text-rose-400 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Hardware Permissions & Deep-Link Intent Filter
            </h2>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {(
                [
                  { key: 'cameraPermission', label: 'Camera Capture (CAMERA)' },
                  { key: 'microphonePermission', label: 'Microphone (RECORD_AUDIO)' },
                  { key: 'enableGpsPrompt', label: 'Fine Location (GPS)' },
                  { key: 'downloadsEnabled', label: 'Android DownloadManager' },
                  { key: 'fileUploadEnabled', label: 'File Upload Chooser' },
                  { key: 'keepScreenAwake', label: 'Keep Screen Awake' },
                ] as const
              ).map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(project.extras[perm.key])}
                    onChange={() =>
                      onUpdateProject({
                        ...project,
                        extras: {
                          ...project.extras,
                          [perm.key]: !project.extras[perm.key],
                        },
                      })
                    }
                    className="accent-teal-600"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Resulting AndroidManifest.xml Permissions ({activePermissions.length}):
              </div>
              <div className="space-y-1 font-mono text-[11px] text-teal-600 dark:text-teal-400">
                {activePermissions.map((p) => (
                  <div key={p}>{p}</div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-6 space-y-5">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Custom User-Agent & Deep-Link Scheme
            </h2>
            <div>
              <label
                htmlFor="wv-custom-ua"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Custom User-Agent Override (Optional)
              </label>
              <input
                id="wv-custom-ua"
                type="text"
                value={project.extras.customUserAgent}
                onChange={(e) =>
                  onUpdateProject({
                    ...project,
                    extras: { ...project.extras, customUserAgent: e.target.value },
                  })
                }
                placeholder="Mozilla/5.0 (Linux; Android 16) AndroForge/1.0"
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="wv-deeplink-scheme"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Deep-Link URI Scheme
                </label>
                <input
                  id="wv-deeplink-scheme"
                  type="text"
                  value={project.extras.deepLinkScheme}
                  onChange={(e) =>
                    onUpdateProject({
                      ...project,
                      extras: { ...project.extras, deepLinkScheme: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label
                  htmlFor="wv-deeplink-host"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Deep-Link Host
                </label>
                <input
                  id="wv-deeplink-host"
                  type="text"
                  value={project.extras.deepLinkHost}
                  onChange={(e) =>
                    onUpdateProject({
                      ...project,
                      extras: { ...project.extras, deepLinkHost: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export const NavDrawerDesignerView: React.FC<DesignerProps> = ({
  project,
  onUpdateProject,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newTarget, setNewTarget] = useState('index.html');

  const handleAddItem = () => {
    if (!newLabel.trim()) return;
    const item: NavDrawerItem = {
      id: `nav_${Date.now()}`,
      label: newLabel.trim(),
      icon: 'FileText',
      actionType: newTarget.startsWith('http') ? 'web_url' : 'local_page',
      target: newTarget.trim(),
    };
    onUpdateProject({
      ...project,
      navDrawer: {
        ...project.navDrawer,
        items: [...project.navDrawer.items, item],
      },
    });
    setNewLabel('');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Material 3 NavigationView & BottomNavigationView Designer
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
          Navigation Drawer & Menu Designer
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={project.navDrawer.enabled}
                onChange={() =>
                  onUpdateProject({
                    ...project,
                    navDrawer: {
                      ...project.navDrawer,
                      enabled: !project.navDrawer.enabled,
                    },
                  })
                }
                className="accent-teal-600"
              />
              <span>Enable Material Navigation Drawer</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={project.navDrawer.bottomNavEnabled}
                onChange={() =>
                  onUpdateProject({
                    ...project,
                    navDrawer: {
                      ...project.navDrawer,
                      bottomNavEnabled: !project.navDrawer.bottomNavEnabled,
                    },
                  })
                }
                className="accent-teal-600"
              />
              <span>Enable Bottom Navigation Bar</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="drawer-header-title"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Drawer Header Title
              </label>
              <input
                id="drawer-header-title"
                type="text"
                value={project.navDrawer.headerTitle}
                onChange={(e) =>
                  onUpdateProject({
                    ...project,
                    navDrawer: { ...project.navDrawer, headerTitle: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label
                htmlFor="drawer-header-subtitle"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Drawer Header Subtitle
              </label>
              <input
                id="drawer-header-subtitle"
                type="text"
                value={project.navDrawer.headerSubtitle}
                onChange={(e) =>
                  onUpdateProject({
                    ...project,
                    navDrawer: { ...project.navDrawer, headerSubtitle: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              aria-label="New Menu Item Label"
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Menu Item Label (e.g. Chapter 2)"
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
            <input
              aria-label="New Menu Item Target"
              type="text"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="index.html#ch2"
              className="w-40 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-500"
            >
              Add Item
            </button>
          </div>

          <div className="space-y-2">
            {project.navDrawer.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs"
              >
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {item.label}
                  </span>
                  <span className="ml-2 font-mono text-slate-500">
                    ({item.actionType} → {item.target || 'native action'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProject({
                      ...project,
                      navDrawer: {
                        ...project.navDrawer,
                        items: project.navDrawer.items.filter((i) => i.id !== item.id),
                      },
                    })
                  }
                  className="text-rose-500 hover:text-rose-400"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Drawer Preview */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Interactive Drawer Layout Preview
          </h2>
          <div className="rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-950 flex h-80">
            <div className="w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div
                  className="p-4 text-white"
                  style={{ backgroundColor: project.navDrawer.headerBgColor }}
                >
                  <div className="font-bold text-sm">{project.navDrawer.headerTitle}</div>
                  <div className="text-[11px] opacity-85 mt-0.5">
                    {project.navDrawer.headerSubtitle}
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  {project.navDrawer.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`px-3 py-2 rounded-lg text-xs font-medium ${
                        idx === 0
                          ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                {project.navDrawer.footerText}
              </div>
            </div>
            <div className="flex-1 bg-slate-900/60 p-4 flex items-center justify-center text-xs text-slate-400 text-center">
              Main WebView Canvas
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MonetizationView: React.FC<DesignerProps> = ({
  project,
  onUpdateProject,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Google Mobile Ads SDK 23.6.0 · User Messaging Platform (UMP) Privacy Consent
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
          AdMob Monetization & Consent Configuration
        </h1>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={project.admob.enabled}
              onChange={() =>
                onUpdateProject({
                  ...project,
                  admob: { ...project.admob, enabled: !project.admob.enabled },
                })
              }
              className="accent-teal-600 w-4 h-4"
            />
            <span>Enable Google AdMob SDK Integration</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={project.admob.testMode}
              onChange={() =>
                onUpdateProject({
                  ...project,
                  admob: { ...project.admob, testMode: !project.admob.testMode },
                })
              }
              className="accent-teal-600"
            />
            <span>Use Safe Google Sample Test Ad IDs During Development</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label
              htmlFor="admob-app-id"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              AdMob Application ID (AndroidManifest.xml)
            </label>
            <input
              id="admob-app-id"
              type="text"
              value={project.admob.appId}
              onChange={(e) =>
                onUpdateProject({
                  ...project,
                  admob: { ...project.admob, appId: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>
          <div>
            <label
              htmlFor="admob-banner-id"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Banner Ad Unit ID
            </label>
            <input
              id="admob-banner-id"
              type="text"
              value={project.admob.bannerUnitId}
              onChange={(e) =>
                onUpdateProject({
                  ...project,
                  admob: { ...project.admob, bannerUnitId: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={project.admob.umpConsentEnabled}
              onChange={() =>
                onUpdateProject({
                  ...project,
                  admob: {
                    ...project.admob,
                    umpConsentEnabled: !project.admob.umpConsentEnabled,
                  },
                })
              }
              className="accent-teal-600"
            />
            <span>Enable Google UMP GDPR/CCPA Consent Form</span>
          </label>
          <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={project.admob.bannerEnabled}
              onChange={() =>
                onUpdateProject({
                  ...project,
                  admob: { ...project.admob, bannerEnabled: !project.admob.bannerEnabled },
                })
              }
              className="accent-teal-600"
            />
            <span>Enable Adaptive Bottom Banner</span>
          </label>
          <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={project.admob.childDirectedTreatment}
              onChange={() =>
                onUpdateProject({
                  ...project,
                  admob: {
                    ...project.admob,
                    childDirectedTreatment: !project.admob.childDirectedTreatment,
                  },
                })
              }
              className="accent-teal-600"
            />
            <span>Tag for Child-Directed Treatment (COPPA)</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export const FirebaseIntegrationView: React.FC<DesignerProps> = ({
  project,
  onUpdateProject,
}) => {
  const handleUploadGoogleServices = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    try {
      const parsed = JSON.parse(raw);
      const projId = parsed.project_info?.project_id || project.firebase.projectId;
      const projNum = parsed.project_info?.project_number || project.firebase.projectNumber;
      const client = parsed.client?.[0];
      const pkg =
        client?.client_info?.android_client_info?.package_name || project.applicationId;
      onUpdateProject({
        ...project,
        firebase: {
          ...project.firebase,
          enabled: true,
          googleServicesJsonProvided: true,
          googleServicesRaw: raw,
          projectId: projId,
          projectNumber: projNum,
          packageName: pkg,
        },
      });
    } catch {
      // Invalid JSON
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Firebase BoM 33.7.0 · Cloud Messaging (FCM) · In-App Messaging · Crashlytics
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
          Firebase Integration Center
        </h1>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={project.firebase.enabled}
              onChange={() =>
                onUpdateProject({
                  ...project,
                  firebase: { ...project.firebase, enabled: !project.firebase.enabled },
                })
              }
              className="accent-teal-600 w-4 h-4"
            />
            <span>Enable Firebase Services in Gradle Build</span>
          </label>

          <label className="px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white cursor-pointer flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>Import google-services.json</span>
            <input
              type="file"
              accept=".json"
              onChange={handleUploadGoogleServices}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="fb-project-id"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Firebase Project ID
            </label>
            <input
              id="fb-project-id"
              type="text"
              value={project.firebase.projectId}
              onChange={(e) =>
                onUpdateProject({
                  ...project,
                  firebase: { ...project.firebase, projectId: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>
          <div>
            <label
              htmlFor="fb-channel-id"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Default FCM Notification Channel ID (Android 13–16)
            </label>
            <input
              id="fb-channel-id"
              type="text"
              value={project.firebase.defaultNotificationChannel}
              onChange={(e) =>
                onUpdateProject({
                  ...project,
                  firebase: {
                    ...project.firebase,
                    defaultNotificationChannel: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          {(
            [
              { key: 'fcmEnabled', label: 'Cloud Messaging (FCM)' },
              { key: 'inAppMessagingEnabled', label: 'In-App Messaging' },
              { key: 'analyticsEnabled', label: 'Firebase Analytics' },
              { key: 'crashlyticsEnabled', label: 'Firebase Crashlytics' },
            ] as const
          ).map((mod) => (
            <label
              key={mod.key}
              className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={Boolean(project.firebase[mod.key])}
                onChange={() =>
                  onUpdateProject({
                    ...project,
                    firebase: {
                      ...project.firebase,
                      [mod.key]: !project.firebase[mod.key],
                    },
                  })
                }
                className="accent-teal-600"
              />
              <span>{mod.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
