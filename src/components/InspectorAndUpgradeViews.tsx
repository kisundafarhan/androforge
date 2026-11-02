import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileArchive,
  FileCode2,
  HardDrive,
  KeyRound,
  Layers,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  ApiUpgradeReport,
  BuildArtifactRecord,
  InspectedArtifactReport,
  KeystoreProfile,
  ProjectConfig,
} from '../types/androforge';
import { ANDROID_TOOLCHAIN_MATRIX } from '../core/materialSchemes';

interface ApkAabInspectorViewProps {
  builds: BuildArtifactRecord[];
  onRebuildFromRecoveredAssets: (report: InspectedArtifactReport) => void;
}

export const ApkAabInspectorView: React.FC<ApkAabInspectorViewProps> = ({
  builds,
  onRebuildFromRecoveredAssets,
}) => {
  const [selectedBuildId, setSelectedBuildId] = useState<string>(builds[0]?.id || '');
  const [selectedFormat, setSelectedFormat] = useState<'apk' | 'aab' | 'source'>('apk');
  const [report, setReport] = useState<InspectedArtifactReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inspectBuildArtifact = async (buildId: string, format: 'apk' | 'aab' | 'source') => {
    if (!buildId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId, artifactFormat: format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to inspect artifact.');
      setReport(data.report);
    } catch (err: any) {
      setError(err.message || 'Inspection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (builds.length > 0 && !report) {
      const firstId = builds[0].id;
      setSelectedBuildId(firstId);
      inspectBuildArtifact(firstId, 'apk');
    }
  }, [builds]);

  const handleUploadArchiveFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);
      const res = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, base64Data }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid archive format');
      setReport(data.report);
    } catch (err: any) {
      setError(err.message || 'Could not inspect uploaded file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Binary Artifact Forensics</span>
            <span aria-hidden="true">·</span>
            <span>ZIP / Manifest / Certificate / ABI Analyzer</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            APK & App Bundle (AAB) Inspector
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select Build Artifact to Inspect"
            value={selectedBuildId}
            onChange={(e) => {
              setSelectedBuildId(e.target.value);
              inspectBuildArtifact(e.target.value, selectedFormat);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            {builds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.projectTitle} (v{b.versionName} · API {b.targetSdk})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            {(['apk', 'aab', 'source'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => {
                  setSelectedFormat(fmt);
                  inspectBuildArtifact(selectedBuildId, fmt);
                }}
                className={`px-2.5 py-1 text-xs font-mono uppercase rounded-md transition-colors ${
                  selectedFormat === fmt
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                .{fmt === 'source' ? 'zip' : fmt}
              </button>
            ))}
          </div>

          <label className="px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
            <Upload className="w-3.5 h-3.5" />
            <span>Inspect Local .APK / .AAB File</span>
            <input
              type="file"
              accept=".apk,.aab,.zip"
              onChange={handleUploadArchiveFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
          Parsing archive Central Directory, AndroidManifest.xml, and META-INF cryptographic signatures...
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6">
          {/* Truthful Architectural Limitation Notice (Mandatory per Section 13 & Test 11) */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-slate-800 dark:text-slate-200">
              <div className="font-semibold text-amber-700 dark:text-amber-300">
                Compiled Artifact vs. Editable Source Disclosure
              </div>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                {report.truthfulLimitationNotice}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <span>Private Signing Key Present in File: <strong>{report.hasPrivateSigningKey ? 'YES' : 'NO (Public Cert Only)'}</strong></span>
                <span>·</span>
                <span>Recoverable HTML/Web Assets: <strong>{report.hasRecoverableWebAssets ? `${report.embeddedWebAssets.length} files` : 'None'}</strong></span>
                <span>·</span>
                <span>Editable Kotlin Source in Archive: <strong>{report.hasOriginalKotlinSource ? 'YES' : 'NO (Compiled DEX)'}</strong></span>
              </div>
            </div>
          </div>

          {/* Summary KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Artifact & Package ID</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1 truncate">
                {report.applicationId}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                {report.artifactType} · {(report.fileSizeBytes / 1024).toFixed(1)} KB
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">SDK & Version Target</div>
              <div className="text-sm font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400 mt-1 whitespace-nowrap">
                targetSdk {report.targetSdk} · compileSdk {report.compileSdk}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                minSdk {report.minSdk} · v{report.versionName} (code {report.versionCode})
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Cryptographic Signature</div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{report.signatureVerified ? 'RSA-SHA256 Verified' : report.isSigned ? 'Signed' : 'Unsigned'}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 truncate font-mono">
                {report.signingSignerName}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">ABIs & Web Assets</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1 truncate">
                {report.abis.join(', ') || 'Universal'}
              </div>
              <div className="text-xs text-slate-500 mt-1 tabular-nums">
                {report.embeddedWebAssets.length} web assets · {report.entries.length} total zip entries
              </div>
            </div>
          </div>

          {/* Certificate Fingerprints & Permissions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Signing Certificate & Digest Fingerprints
              </h2>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Artifact SHA-256 Digest:</span>
                  <span className="text-slate-800 dark:text-slate-200 break-all">{report.sha256Digest}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Certificate SHA-256 Fingerprint:</span>
                  <span className="text-teal-600 dark:text-teal-400 break-all">{report.signingSha256}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Certificate SHA-1 Fingerprint:</span>
                  <span className="text-slate-800 dark:text-slate-200 break-all">{report.signingSha1}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Declared Manifest Permissions ({report.permissions.length})
                </h3>
                <div className="space-y-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                  {report.permissions.map((perm) => (
                    <div key={perm}>{perm}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Extracted AndroidManifest.xml
                </h2>
                {report.hasRecoverableWebAssets && (
                  <button
                    type="button"
                    onClick={() => onRebuildFromRecoveredAssets(report)}
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                  >
                    Open in API 36 Rebuilder
                  </button>
                )}
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 text-teal-300 font-mono text-[11px] overflow-x-auto max-h-64 leading-relaxed">
                {report.manifestPreview || 'Binary AXML manifest header detected'}
              </pre>
            </div>
          </div>

          {/* Archive Entry Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Archive Contents & 4-Byte Zipalign Verification ({report.entries.length} entries)
              </h2>
              <span className="text-xs font-mono text-slate-500">
                Filename: {report.filename}
              </span>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/50">
                    <th className="py-2.5 px-4 font-medium">Entry Path</th>
                    <th className="py-2.5 px-4 font-medium text-right">Uncompressed</th>
                    <th className="py-2.5 px-4 font-medium text-right">Compressed</th>
                    <th className="py-2.5 px-4 font-medium text-right">CRC32</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono tabular-nums">
                  {report.entries.map((entry) => (
                    <tr
                      key={entry.name}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-2 px-4 text-slate-800 dark:text-slate-200">
                        {entry.name}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-600 dark:text-slate-400">
                        {entry.uncompressedSize.toLocaleString()} B
                      </td>
                      <td className="py-2 px-4 text-right text-slate-600 dark:text-slate-400">
                        {entry.compressedSize.toLocaleString()} B
                      </td>
                      <td className="py-2 px-4 text-right text-teal-600 dark:text-teal-400">
                        0x{entry.crc32Hex}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AndroidApiUpgradeViewProps {
  projects: ProjectConfig[];
  keystores: KeystoreProfile[];
  upgradeReports: ApiUpgradeReport[];
  onUpgradeComplete: (
    upgradedProject: ProjectConfig,
    report: ApiUpgradeReport,
    allProjects: ProjectConfig[]
  ) => void;
  onBuildUpgradedProject: (projectId: string) => void;
}

export const AndroidApiUpgradeView: React.FC<AndroidApiUpgradeViewProps> = ({
  projects,
  keystores,
  upgradeReports,
  onUpgradeComplete,
  onBuildUpgradedProject,
}) => {
  // Default to any project below API 36 so the user immediately sees a real upgrade target
  const initialProj =
    projects.find((p) => p.targetSdk < 36) || projects[0];
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProj?.id || ''
  );
  const [targetApiPreset, setTargetApiPreset] = useState<35 | 36>(36);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [activeReport, setActiveReport] = useState<ApiUpgradeReport | null>(
    upgradeReports[0] || null
  );

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];
  const associatedKeystore =
    keystores.find((k) => k.id === selectedProject?.signingProfileId) ||
    keystores[0];

  const handleRunMigration = async () => {
    if (!selectedProject) return;
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          targetApi: targetApiPreset,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveReport(data.report);
        onUpgradeComplete(
          data.upgradedProject,
          data.report,
          data.projects
        );
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Automated Gradle, AGP, Edge-to-Edge & Manifest Migrator</span>
            <span aria-hidden="true">·</span>
            <span>First-Class Android 16 (API 36) Support</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Android SDK & API 36 Upgrade Center
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Select Project to Upgrade"
            value={selectedProject?.id || ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.appTitle} ({p.applicationId} — Currently API {p.targetSdk})
              </option>
            ))}
          </select>

          <select
            aria-label="Select Target API Level Preset"
            value={targetApiPreset}
            onChange={(e) => setTargetApiPreset(Number(e.target.value) as 35 | 36)}
            className="px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value={36}>Preset: API 36 — Android 16 Baklava (Default)</option>
            <option value={35}>Preset: API 35 — Android 15 VanillaIceCream</option>
          </select>

          <button
            type="button"
            disabled={isUpgrading}
            onClick={handleRunMigration}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            {isUpgrading
              ? 'Running 15-Step Migration...'
              : `Backup & Upgrade to API ${targetApiPreset}`}
          </button>
        </div>
      </div>

      {/* Selected Project Current vs Target Comparison */}
      {selectedProject && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Current Project Configuration Analysis
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Application ID (Preserved):</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {selectedProject.applicationId}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Current Version Code:</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {selectedProject.versionCode} ({selectedProject.versionName}) → Will increment to {selectedProject.versionCode + 1}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Current Target / Compile SDK:</span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    selectedProject.targetSdk < 35
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  API {selectedProject.targetSdk} / compileSdk {selectedProject.compileSdk}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Gradle & AGP Version:</span>
                <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                  Gradle {selectedProject.gradleVersion} · AGP {selectedProject.agpVersion}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Upload Key Continuity:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  Verified ({associatedKeystore?.alias})
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Verified Toolchain Compatibility Matrix
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 pr-3 font-medium">API Level</th>
                    <th className="py-2 px-3 font-medium">Android Release</th>
                    <th className="py-2 px-3 font-medium">AGP</th>
                    <th className="py-2 px-3 font-medium">Gradle</th>
                    <th className="py-2 px-3 font-medium">Kotlin</th>
                    <th className="py-2 pl-3 font-medium">Play Console Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                  {ANDROID_TOOLCHAIN_MATRIX.map((row) => (
                    <tr key={row.apiLevel}>
                      <td className="py-2 pr-3 font-bold text-teal-600 dark:text-teal-400">
                        API {row.apiLevel}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200">
                        {row.androidVersion} ({row.codename})
                      </td>
                      <td className="py-2 px-3">{row.recommendedAgp}</td>
                      <td className="py-2 px-3">{row.recommendedGradle}</td>
                      <td className="py-2 px-3">{row.recommendedKotlin}</td>
                      <td className="py-2 pl-3 font-sans text-slate-600 dark:text-slate-400">
                        {row.playConsoleStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Migration Report & Code Diffs (or Pre-Flight Migration Plan before execution) */}
      {activeReport ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Migration Report: {activeReport.projectTitle} (API {activeReport.previousTargetSdk} → API {activeReport.newTargetSdk})
              </h2>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                Backup Snapshot Saved: {activeReport.backupPath}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onBuildUpgradedProject(activeReport.projectId)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
            >
              Build Upgraded API {activeReport.newTargetSdk} Release AAB & APK
            </button>
          </div>

          <div className="space-y-3">
            {activeReport.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2 bg-slate-50/50 dark:bg-slate-950/40"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Step {step.stepNumber}. {step.title}
                  </span>
                  <span className="font-mono text-teal-600 dark:text-teal-400">
                    {step.fileAffected}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {step.explanation}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded bg-rose-950/30 border border-rose-500/20 font-mono text-[11px] text-rose-300 overflow-x-auto">
                    <div className="text-[10px] uppercase text-rose-400 mb-1">Before Migration</div>
                    <pre>{step.beforeSnippet}</pre>
                  </div>
                  <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/20 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                    <div className="text-[10px] uppercase text-emerald-400 mb-1">After API {activeReport.newTargetSdk} Migration</div>
                    <pre>{step.afterSnippet}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Automated API {targetApiPreset} Migration Pipeline Plan ({selectedProject?.appTitle})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click &ldquo;Backup &amp; Upgrade to API {targetApiPreset}&rdquo; above to execute all 9 non-destructive migration steps and view side-by-side Gradle, Manifest, and Kotlin diffs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunMigration}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer"
            >
              Execute Migration Now
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">01. Snapshot & Gradle 8.11.1</div>
              <p className="text-slate-500 dark:text-slate-400">Creates full backup in /backups/, updates gradle-wrapper.properties to 8.11.1, and upgrades AGP to 8.8.0 + Kotlin 2.1.0.</p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">02. API 36 Edge-to-Edge & Back</div>
              <p className="text-slate-500 dark:text-slate-400">Configures compileSdk 36, targetSdk 36, enableEdgeToEdge() WindowInsets, and enableOnBackInvokedCallback.</p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">03. WebViewAssetLoader & Signing</div>
              <p className="text-slate-500 dark:text-slate-400">Replaces unsafe file:// URLs with WebViewAssetLoader, preserves applicationId, and increments versionCode (+1).</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
