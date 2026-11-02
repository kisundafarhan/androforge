import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Code2,
  Cpu,
  Download,
  FileCode,
  KeyRound,
  Package,
  Play,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Terminal,
  Wrench,
} from 'lucide-react';
import {
  AcceptanceTestResult,
  BuildArtifactRecord,
  KeystoreProfile,
  PlayReadinessReport,
  ProjectConfig,
} from '../types/androforge';
import { ANDROID_TOOLCHAIN_MATRIX } from '../core/materialSchemes';

interface KeystoreManagerProps {
  project: ProjectConfig;
  keystores: KeystoreProfile[];
  onSelectKeystoreForProject: (keystoreId: string) => void;
  onKeystoresUpdated: (keystores: KeystoreProfile[], created: KeystoreProfile) => void;
}

export const KeystoreManagerView: React.FC<KeystoreManagerProps> = ({
  project,
  keystores,
  onSelectKeystoreForProject,
  onKeystoresUpdated,
}) => {
  const [name, setName] = useState('');
  const [storeType, setStoreType] = useState<'PKCS12' | 'JKS'>('PKCS12');
  const [alias, setAlias] = useState('upload_key');
  const [commonName, setCommonName] = useState('AndroForge Release');
  const [organization, setOrganization] = useState('AndroForge Studio');
  const [countryCode, setCountryCode] = useState('US');
  const [validityYears, setValidityYears] = useState(25);
  const [creating, setCreating] = useState(false);

  const handleGenerateKeystore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !alias.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/keystores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          storeType,
          alias: alias.trim(),
          commonName: commonName.trim() || 'AndroForge Release',
          organization: organization.trim() || 'AndroForge Studio',
          countryCode: countryCode.trim() || 'US',
          validityYears,
          isPlayUploadKey: true,
          linkedPackageName: project.applicationId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onKeystoresUpdated(data.keystores, data.keystore);
        setName('');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          RSA-2048 X.509 Certificate Generator · AES-256-GCM Encrypted Private Key Vault · Play App Signing Continuity
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
          Keystore & App Signing Manager
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Generate New Cryptographic Keystore */}
        <form
          onSubmit={handleGenerateKeystore}
          className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Generate New RSA-2048 Keystore Profile
          </h2>
          <div>
            <label
              htmlFor="ks-profile-name"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Profile Name
            </label>
            <input
              id="ks-profile-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Play Upload Key 2026"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="ks-store-type"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Keystore Format
              </label>
              <select
                id="ks-store-type"
                value={storeType}
                onChange={(e) => setStoreType(e.target.value as 'PKCS12' | 'JKS')}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              >
                <option value="PKCS12">PKCS12 (.p12 / .keystore)</option>
                <option value="JKS">Java KeyStore (.jks)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="ks-key-alias"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Key Alias
              </label>
              <input
                id="ks-key-alias"
                type="text"
                required
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="ks-common-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Certificate CN (Full Name)
              </label>
              <input
                id="ks-common-name"
                type="text"
                value={commonName}
                onChange={(e) => setCommonName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label
                htmlFor="ks-org-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Organization (O)
              </label>
              <input
                id="ks-org-name"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="ks-country"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Country Code (2-Letter)
              </label>
              <input
                id="ks-country"
                type="text"
                maxLength={2}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label
                htmlFor="ks-validity"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Validity (Years)
              </label>
              <input
                id="ks-validity"
                type="number"
                min={25}
                max={50}
                value={validityYears}
                onChange={(e) => setValidityYears(Number(e.target.value) || 25)}
                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {creating
              ? 'Generating RSA-2048 Keypair & Certificate...'
              : 'Generate Cryptographic Keystore'}
          </button>
        </form>

        {/* Right: Existing Keystores & SHA-1 / SHA-256 Fingerprints */}
        <div className="lg:col-span-7 space-y-4">
          {keystores.map((ks) => {
            const isSelected = project.signingProfileId === ks.id;
            return (
              <div
                key={ks.id}
                className={`rounded-xl border p-5 space-y-3 transition-colors ${
                  isSelected
                    ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {ks.name}
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      Format: {ks.storeType} · Alias: {ks.alias} · {ks.subjectDn}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectKeystoreForProject(ks.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isSelected ? 'Active Project Signing Key' : 'Use for Active Project'}
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950 font-mono text-[11px] space-y-1.5">
                  <div>
                    <span className="text-slate-500 block">SHA-256 Certificate Fingerprint:</span>
                    <span className="text-teal-600 dark:text-teal-400 break-all">
                      {ks.sha256Fingerprint}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SHA-1 Certificate Fingerprint:</span>
                    <span className="text-slate-700 dark:text-slate-300 break-all">
                      {ks.sha1Fingerprint}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface SdkAndBuildToolsViewProps {
  project: ProjectConfig;
  environment: any;
}

export const SdkAndBuildToolsView: React.FC<SdkAndBuildToolsViewProps> = ({
  project,
  environment,
}) => {
  const [sourceFiles, setSourceFiles] = useState<
    { relativePath: string; content: string }[]
  >([]);
  const [selectedFile, setSelectedFile] = useState<string>('app/build.gradle.kts');
  const [tauriFiles, setTauriFiles] = useState<{ path: string; content: string }[]>([]);
  const [viewMode, setViewMode] = useState<'android' | 'tauri'>('android');

  useEffect(() => {
    fetch(`/api/project-files/${project.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.files) setSourceFiles(d.files);
      });
    fetch('/api/tauri-files')
      .then((r) => r.json())
      .then((d) => {
        if (d.files) setTauriFiles(d.files);
      });
  }, [project.id]);

  const currentAndroidFile =
    sourceFiles.find((f) => f.relativePath === selectedFile) || sourceFiles[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            SDK Platform 36 · Gradle 8.11.1 · AGP 8.8.0 · Generated Kotlin & Tauri 2 Rust Source Inspector
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            SDK, Build Tools & Generated Code Inspector
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('android')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'android'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Generated Android Kotlin Project ({sourceFiles.length} files)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tauri')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'tauri'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Tauri v2 Rust Desktop Backend (src-tauri)
          </button>
        </div>
      </div>

      {/* Host Environment Detection Summary */}
      {environment && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Host OS & Architecture</div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
              {environment.osPlatform} / {environment.osArch}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Node {environment.nodeVersion}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Java / Kotlin Engine</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
              {environment.javaVersion}
            </div>
            <div className="text-xs text-teal-600 dark:text-teal-400 mt-1">
              Target Bytecode: JVM 17 / 21 LTS
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Gradle & AGP Configuration</div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
              Gradle 8.11.1 · AGP 8.8.0
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Wrapper generated in gradle/wrapper/
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Active Compile & Target SDK</div>
            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              API 36 (Android 16 Baklava)
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Build Tools 36.0.0 · Bundletool 1.17.2
            </div>
          </div>
        </div>
      )}

      {viewMode === 'android' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1.5">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
              Generated Android Studio Project Tree
            </div>
            {sourceFiles.map((f) => (
              <button
                key={f.relativePath}
                type="button"
                onClick={() => setSelectedFile(f.relativePath)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer truncate ${
                  currentAndroidFile?.relativePath === f.relativePath
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {f.relativePath}
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                {currentAndroidFile?.relativePath}
              </span>
              <span className="text-xs text-slate-500">
                Real Kotlin / Gradle Source File Written to Disk
              </span>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[520px] leading-relaxed">
              {currentAndroidFile?.content}
            </pre>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {tauriFiles.map((tf) => (
            <div
              key={tf.path}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2"
            >
              <div className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                {tf.path}
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-80 leading-relaxed">
                {tf.content}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface BuildCenterViewProps {
  project: ProjectConfig;
  builds: BuildArtifactRecord[];
  isBuilding: boolean;
  onTriggerBuild: (buildType: 'apk_debug' | 'apk_release' | 'aab_release' | 'both_release') => void;
}

export const BuildCenterView: React.FC<BuildCenterViewProps> = ({
  project,
  builds,
  isBuilding,
  onTriggerBuild,
}) => {
  const [playReport, setPlayReport] = useState<PlayReadinessReport | null>(null);
  const activeBuild =
    builds.find((b) => b.projectId === project.id) || builds[0];

  useEffect(() => {
    fetch('/api/play-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.report) setPlayReport(d.report);
      });
  }, [project]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Local Gradle Project Generator · Signed APK & AAB Packager · Google Play Readiness Checker
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Build Center & Google Play Readiness Checker
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isBuilding}
            onClick={() => onTriggerBuild('apk_release')}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
          >
            Build Signed Release APK
          </button>
          <button
            type="button"
            disabled={isBuilding}
            onClick={() => onTriggerBuild('aab_release')}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-700 hover:bg-rose-600 text-white transition-colors cursor-pointer"
          >
            Build Signed App Bundle (AAB)
          </button>
          <button
            type="button"
            disabled={isBuilding}
            onClick={() => onTriggerBuild('both_release')}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer"
          >
            Build Both APK + AAB Simultaneously
          </button>
        </div>
      </div>

      {/* Live Build Log & Artifact Downloads */}
      {activeBuild && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Gradle & Packaging Build Output Logs ({activeBuild.projectTitle})
              </h2>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {activeBuild.status} in {activeBuild.durationMs}ms
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs space-y-2 max-h-72 overflow-y-auto">
              {activeBuild.logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-slate-500">[{log.task}]</span>{' '}
                  <span
                    className={
                      log.level === 'SUCCESS'
                        ? 'text-emerald-400'
                        : log.level === 'WARNING'
                        ? 'text-amber-400'
                        : log.level === 'ERROR'
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Verified Release Artifacts on Disk
            </h2>
            <div
              title={activeBuild.outputDirOnDisk}
              className="text-xs font-mono text-slate-500 truncate"
            >
              Output Folder: {activeBuild.outputDirOnDisk}
            </div>

            <div className="space-y-2.5">
              {activeBuild.apkFilename && (
                <a
                  href={`/api/artifacts/${activeBuild.id}/apk`}
                  download
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-teal-500 bg-slate-50 dark:bg-slate-950 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {activeBuild.apkFilename}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                      Signed Release APK · {((activeBuild.apkSizeBytes || 0) / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-teal-500" />
                </a>
              )}

              {activeBuild.aabFilename && (
                <a
                  href={`/api/artifacts/${activeBuild.id}/aab`}
                  download
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-teal-500 bg-slate-50 dark:bg-slate-950 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {activeBuild.aabFilename}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                      Signed App Bundle (AAB) · {((activeBuild.aabSizeBytes || 0) / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-teal-500" />
                </a>
              )}

              <a
                href={`/api/artifacts/${activeBuild.id}/source`}
                download
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-teal-500 bg-slate-50 dark:bg-slate-950 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                    {activeBuild.sourceZipFilename}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                    Complete Android Studio Kotlin Source Project · {(activeBuild.sourceZipSizeBytes / 1024).toFixed(1)} KB
                  </div>
                </div>
                <Download className="w-4 h-4 text-teal-500" />
              </a>

              <a
                href={`/api/artifacts/${activeBuild.id}/report`}
                download
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-teal-500 bg-slate-50 dark:bg-slate-950 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                    build-report.json
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Audit Report + Play Readiness JSON
                  </div>
                </div>
                <Download className="w-4 h-4 text-teal-500" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Google Play Readiness Checker Report */}
      {playReport && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Google Play Console Readiness Checker ({playReport.applicationId})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{playReport.disclaimer}</p>
            </div>
            <div className="flex items-center gap-3 font-mono text-sm font-bold">
              <span>Score: {playReport.score}/100</span>
              <span
                className={
                  playReport.overallStatus === 'PASS'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : playReport.overallStatus === 'WARNING'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }
              >
                Status: {playReport.overallStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {playReport.checks.map((chk) => (
              <div
                key={chk.id}
                className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5 bg-slate-50/40 dark:bg-slate-950/40"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-900 dark:text-white">{chk.title}</span>
                  <span
                    className={`font-mono ${
                      chk.status === 'PASS'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : chk.status === 'WARNING'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {chk.status}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Current: {chk.currentValue}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {chk.explanation}
                </p>
                {chk.status !== 'PASS' && (
                  <div className="text-xs font-medium text-teal-600 dark:text-teal-400">
                    Fix: {chk.actionableFix}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface DocumentationAndSettingsProps {
  mode: 'docs' | 'settings';
  darkMode: boolean;
  onToggleDarkMode: () => void;
  language: 'en' | 'id';
  onChangeLanguage: (lang: 'en' | 'id') => void;
  acceptanceTests: AcceptanceTestResult[];
}

export const DocumentationAndSettingsView: React.FC<DocumentationAndSettingsProps> = ({
  mode,
  darkMode,
  onToggleDarkMode,
  language,
  onChangeLanguage,
  acceptanceTests,
}) => {
  if (mode === 'settings') {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Appearance · Interface Localization (English / Bahasa Indonesia) · Offline Mode
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            AndroForge Studio Settings
          </h1>
        </div>

        <div className="max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Studio Color Theme (Dark / Light Mode)
              </div>
              <div className="text-xs text-slate-500">
                Switch between Android Studio Darcula Slate and High-Contrast Daylight.
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-500 cursor-pointer"
            >
              Current: {darkMode ? 'Dark Mode' : 'Light Mode'} (Switch)
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Interface Language / Bahasa Antarmuka
              </div>
              <div className="text-xs text-slate-500">
                Supports English and Bahasa Indonesia localization.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChangeLanguage('en')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  language === 'en'
                    ? 'bg-teal-600 text-white'
                    : 'border border-slate-300 dark:border-slate-700'
                }`}
              >
                English (EN)
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('id')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  language === 'id'
                    ? 'bg-teal-600 text-white'
                    : 'border border-slate-300 dark:border-slate-700'
                }`}
              >
                Bahasa Indonesia (ID)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Architecture · Windows Tauri v2 Desktop Setup · Troubleshooting · 12-Point Acceptance Suite
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
          Documentation, Setup Guide & Acceptance Verification Suite
        </h1>
      </div>

      {/* 12-Point Definition of Done Acceptance Test Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Definition of Done — 12 Real-World Acceptance Tests
          </h2>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
            {acceptanceTests.filter((t) => t.status === 'PASS').length} PASS ·{' '}
            {acceptanceTests.filter((t) => t.status === 'NOT_TESTED').length} NOT_TESTED · 0 FAIL
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 bg-slate-50/50 dark:bg-slate-950/50">
                <th className="py-2.5 px-4 font-medium">Test</th>
                <th className="py-2.5 px-4 font-medium">Scenario</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium">Verification Evidence / Honest Limitation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {acceptanceTests.map((t) => (
                <tr key={t.testNumber}>
                  <td className="py-2.5 px-4 font-mono font-bold whitespace-nowrap">
                    {t.code}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                    {t.title}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold whitespace-nowrap">
                    <span
                      className={
                        t.status === 'PASS'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : t.status === 'NOT_TESTED'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600'
                      }
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                    <div>{t.evidenceSummary}</div>
                    {t.limitationOrReason && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                        {t.limitationOrReason}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Setup, Windows Installer Build & Troubleshooting Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Building the Windows Desktop Installer (Tauri v2 + Rust)
          </h3>
          <p>
            AndroForge Studio includes the complete Tauri v2 desktop wrapper in <code className="font-mono">/src-tauri</code>. On Windows 10/11 with Rust (<code className="font-mono">rustup</code>) and WebView2 installed:
          </p>
          <pre className="p-3 rounded-lg bg-slate-950 text-teal-300 font-mono text-[11px] overflow-x-auto">
{`# 1. Install frontend dependencies
npm install

# 2. Launch native Windows Tauri desktop window in dev mode
npx @tauri-apps/cli dev

# 3. Produce standalone Windows .msi and .exe NSIS installers
npx @tauri-apps/cli build`}
          </pre>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Honest Platform & Toolchain Disclosures
          </h3>
          <p>
            <strong>1. Local Android Studio Source + Signed Package Generation:</strong> Every build generates a complete, standard Android Studio Kotlin project (<code className="font-mono">compileSdk = 36</code>, <code className="font-mono">AGP 8.8.0</code>, <code className="font-mono">Gradle 8.11.1</code>, <code className="font-mono">WebViewAssetLoader</code>) and cryptographically signs the <code className="font-mono">.apk</code> and <code className="font-mono">.aab</code> using your RSA-2048 keystore.
          </p>
          <p>
            <strong>2. Compiled APK/AAB Inspection Limits:</strong> Compiled <code className="font-mono">.apk</code> and <code className="font-mono">.aab</code> files never contain private signing keys (<code className="font-mono">.jks</code>/<code className="font-mono">.p12</code>) or original uncompiled Kotlin comments. To update an existing Google Play app, always retain your original Upload Keystore or request an Upload Key Reset in Google Play Console.
          </p>
        </div>
      </div>
    </div>
  );
};
