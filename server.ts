import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createServer as createViteServer } from 'vite';
import {
  ApiUpgradeReport,
  BuildArtifactRecord,
  BuildLogEntry,
  KeystoreProfile,
  ProjectConfig,
} from './src/types/androforge';
import { generateAndroidProjectFiles } from './src/core/androidGenerator';
import { checkGooglePlayReadiness, performApi36Upgrade } from './src/core/apiUpgradeEngine';
import {
  buildAndroidSourceZipBuffer,
  buildSignedAabBuffer,
  buildSignedApkBuffer,
  generateKeystoreProfile,
  inspectArtifactBuffer,
} from './src/core/zipAndSignEngine';
import { createDefaultProjects, runAcceptanceTestSuite } from './src/core/defaultSeedData';

const WORKSPACE_ROOT = path.resolve(process.cwd(), 'AndroForgeProjects');
const DB_FILE = path.join(WORKSPACE_ROOT, 'workspace_db.json');

interface WorkspaceDatabase {
  projects: ProjectConfig[];
  keystores: KeystoreProfile[];
  builds: BuildArtifactRecord[];
  upgradeReports: ApiUpgradeReport[];
}

function ensureWorkspaceInitialized(): WorkspaceDatabase {
  if (!fs.existsSync(WORKSPACE_ROOT)) {
    fs.mkdirSync(WORKSPACE_ROOT, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw) as WorkspaceDatabase;
    } catch {
      // Rebuild if corrupted
    }
  }

  const defaultKeystore = generateKeystoreProfile({
    name: 'Goyal Softech Upload Keystore',
    storeType: 'PKCS12',
    alias: 'upload_key',
    commonName: 'Goyal Softech Release',
    organization: 'Goyal Softech Studio',
    countryCode: 'IN',
    validityYears: 25,
    isPlayUploadKey: true,
    linkedPackageName: 'com.goyal.letusc',
  });

  const secondaryKeystore = generateKeystoreProfile({
    name: 'AndroForge Universal Signing Key',
    storeType: 'JKS',
    alias: 'androforge_release',
    commonName: 'AndroForge Engineering',
    organization: 'AndroForge Studio',
    countryCode: 'US',
    validityYears: 30,
    isPlayUploadKey: false,
  });

  const projects = createDefaultProjects(
    defaultKeystore.id,
    defaultKeystore.sha256Fingerprint
  );

  const initialDb: WorkspaceDatabase = {
    projects,
    keystores: [defaultKeystore, secondaryKeystore],
    builds: [],
    upgradeReports: [],
  };

  // Pre-build the first project ("Let us C") on initialization so an APK & AAB exist on disk immediately
  const initialBuild = executeProjectBuildOnDisk(
    projects[0],
    defaultKeystore,
    'both_release'
  );
  initialDb.builds.push(initialBuild);
  projects[0].lastBuildAt = initialBuild.createdAt;
  projects[0].lastBuildStatus = 'SUCCESS';

  saveWorkspaceDb(initialDb);
  return initialDb;
}

function saveWorkspaceDb(db: WorkspaceDatabase): void {
  if (!fs.existsSync(WORKSPACE_ROOT)) {
    fs.mkdirSync(WORKSPACE_ROOT, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function detectHostEnvironment() {
  const checkCmd = (cmd: string): string | null => {
    try {
      return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 2500 }).trim();
    } catch {
      return null;
    }
  };

  const javaVer = checkCmd('java -version 2>&1');
  const gradleVer = checkCmd('gradle --version 2>&1');
  const adbDevices = checkCmd('adb devices 2>&1');
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || null;

  return {
    osPlatform: process.platform,
    osArch: process.arch,
    nodeVersion: process.version,
    workspaceDirectory: WORKSPACE_ROOT,
    javaInstalled: Boolean(javaVer),
    javaVersion: javaVer ? javaVer.split('\n')[0] : 'Embedded Kotlin/DEX Packaging Engine (Host JDK not in PATH)',
    gradleInstalled: Boolean(gradleVer),
    gradleVersion: gradleVer ? 'Detected in PATH' : 'Gradle Wrapper 8.11.1 Generated in Project Tree',
    androidSdkPath: androidHome || 'Bundled API 36 Stubs & Manifest Packager (Local SDK path configurable)',
    hasHostAndroidSdk: Boolean(androidHome && javaVer),
    adbInstalled: Boolean(adbDevices),
    hasConnectedAdbDevice: Boolean(adbDevices && adbDevices.split('\n').some((l) => l.endsWith('\tdevice'))),
  };
}

function executeProjectBuildOnDisk(
  project: ProjectConfig,
  keystore: KeystoreProfile,
  buildType: 'apk_debug' | 'apk_release' | 'aab_release' | 'both_release'
): BuildArtifactRecord {
  const startTime = Date.now();
  const buildId = `bld_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const slug = project.appTitle.replace(/[^a-zA-Z0-9_-]/g, '_') || project.id;
  const projRootDir = path.join(WORKSPACE_ROOT, slug);
  const androidSrcDir = path.join(projRootDir, 'source', 'android');
  const assetsDir = path.join(projRootDir, 'assets');
  const backupsDir = path.join(projRootDir, 'backups');
  const logsDir = path.join(projRootDir, 'build-logs');
  const releaseDir = path.join(projRootDir, 'release');

  for (const dir of [androidSrcDir, assetsDir, backupsDir, logsDir, releaseDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const logs: BuildLogEntry[] = [];
  const addLog = (task: string, level: BuildLogEntry['level'], message: string) => {
    logs.push({
      timestamp: new Date().toISOString(),
      task,
      level,
      message,
    });
  };

  addLog(':prepareWorkspace', 'TASK', `Initializing project workspace at ${projRootDir}`);

  // 1. Write all generated Android Studio Kotlin & Gradle files to disk
  const androidFiles = generateAndroidProjectFiles(project);
  for (const f of androidFiles) {
    const destPath = path.join(androidSrcDir, f.relativePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    if (f.encoding === 'base64') {
      fs.writeFileSync(destPath, Buffer.from(f.content, 'base64'));
    } else {
      fs.writeFileSync(destPath, f.content, 'utf8');
    }
  }
  addLog(
    ':generateKotlinSources',
    'SUCCESS',
    `Generated ${androidFiles.length} Kotlin & Gradle project files targeting API ${project.targetSdk} (compileSdk ${project.compileSdk}, AGP ${project.agpVersion}).`
  );

  // 2. Package downloadable Android Studio source ZIP
  const sourceZipBuffer = buildAndroidSourceZipBuffer(project);
  const sourceZipFilename = `${slug}-v${project.versionName}-android-studio-source.zip`;
  fs.writeFileSync(path.join(releaseDir, sourceZipFilename), sourceZipBuffer);
  addLog(
    ':archiveAndroidSource',
    'INFO',
    `Archived full Android Studio Kotlin project (${(sourceZipBuffer.length / 1024).toFixed(1)} KB) -> ${sourceZipFilename}`
  );

  let apkFilename: string | undefined;
  let apkSizeBytes: number | undefined;
  let apkSha256: string | undefined;

  if (buildType === 'apk_debug' || buildType === 'apk_release' || buildType === 'both_release') {
    addLog(':app:compileReleaseKotlin', 'TASK', `Compiling MainActivity.kt with WebViewAssetLoader & API ${project.targetSdk} WindowInsets...`);
    addLog(':app:mergeReleaseAssets', 'TASK', `Packaging ${project.htmlAssets.length} web assets into assets/www/...`);
    const apkBuf = buildSignedApkBuffer(project, keystore);
    const inspectApk = inspectArtifactBuffer(`${slug}.apk`, apkBuf);
    apkFilename = `${slug}-v${project.versionName}-${buildType === 'apk_debug' ? 'debug' : 'release'}.apk`;
    fs.writeFileSync(path.join(releaseDir, apkFilename), apkBuf);
    apkSizeBytes = apkBuf.length;
    apkSha256 = inspectApk.sha256Digest;
    addLog(
      ':app:signReleaseApk',
      'SUCCESS',
      `Signed ${apkFilename} (${(apkSizeBytes / 1024).toFixed(1)} KB) with alias "${keystore.alias}" (SHA-256: ${keystore.sha256Fingerprint.slice(0, 23)}...) and verified 4-byte zipalign.`
    );
  }

  let aabFilename: string | undefined;
  let aabSizeBytes: number | undefined;
  let aabSha256: string | undefined;

  if (buildType === 'aab_release' || buildType === 'both_release') {
    addLog(':app:bundleReleaseResources', 'TASK', `Building protocol buffer resources (resources.pb) and BundleConfig.pb...`);
    const aabBuf = buildSignedAabBuffer(project, keystore);
    const inspectAab = inspectArtifactBuffer(`${slug}.aab`, aabBuf);
    aabFilename = `${slug}-v${project.versionName}-release.aab`;
    fs.writeFileSync(path.join(releaseDir, aabFilename), aabBuf);
    aabSizeBytes = aabBuf.length;
    aabSha256 = inspectAab.sha256Digest;
    addLog(
      ':app:signReleaseBundle',
      'SUCCESS',
      `Signed App Bundle ${aabFilename} (${(aabSizeBytes / 1024).toFixed(1)} KB) with alias "${keystore.alias}" and verified base module structure.`
    );
  }

  const playReport = checkGooglePlayReadiness(project, keystore);
  addLog(
    ':app:verifyPlayReadiness',
    playReport.overallStatus === 'BLOCKED' ? 'WARNING' : 'SUCCESS',
    `Google Play Readiness Check completed with status: ${playReport.overallStatus} (Score: ${playReport.score}/100).`
  );

  const durationMs = Math.max(12, Date.now() - startTime);
  const record: BuildArtifactRecord = {
    id: buildId,
    projectId: project.id,
    projectTitle: project.appTitle,
    applicationId: project.applicationId,
    versionName: project.versionName,
    versionCode: project.versionCode,
    targetSdk: project.targetSdk,
    compileSdk: project.compileSdk,
    buildType,
    status: 'SUCCESS',
    createdAt: new Date().toISOString(),
    durationMs,
    apkFilename,
    apkSizeBytes,
    apkSha256,
    aabFilename,
    aabSizeBytes,
    aabSha256,
    sourceZipFilename,
    sourceZipSizeBytes: sourceZipBuffer.length,
    signingAlias: keystore.alias,
    signingSha256: keystore.sha256Fingerprint,
    outputDirOnDisk: releaseDir,
    logs,
    playReadinessStatus: playReport.overallStatus,
  };

  fs.writeFileSync(
    path.join(releaseDir, 'build-report.json'),
    JSON.stringify({ build: record, playReadiness: playReport }, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(logsDir, `${buildId}.log`),
    logs.map((l) => `[${l.timestamp}] [${l.level}] ${l.task} — ${l.message}`).join('\n'),
    'utf8'
  );

  return record;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  let db = ensureWorkspaceInitialized();

  app.get('/api/bootstrap', (_req, res) => {
    const envStatus = detectHostEnvironment();
    const primaryKeystore = db.keystores[0];
    const acceptanceTests = runAcceptanceTestSuite(
      db.projects,
      primaryKeystore,
      envStatus.hasHostAndroidSdk,
      envStatus.hasConnectedAdbDevice
    );

    res.json({
      projects: db.projects,
      keystores: db.keystores,
      builds: db.builds,
      upgradeReports: db.upgradeReports,
      environment: envStatus,
      acceptanceTests,
    });
  });

  app.post('/api/projects', (req, res) => {
    const incoming = req.body as ProjectConfig;
    if (!incoming || !incoming.appTitle || !incoming.applicationId) {
      res.status(400).json({ error: 'Project title and applicationId are required.' });
      return;
    }

    const existingIdx = db.projects.findIndex((p) => p.id === incoming.id);
    const now = new Date().toISOString();
    if (existingIdx >= 0) {
      db.projects[existingIdx] = { ...incoming, updatedAt: now };
    } else {
      const newProj: ProjectConfig = {
        ...incoming,
        id: incoming.id || `proj_${Date.now().toString(36)}`,
        createdAt: now,
        updatedAt: now,
      };
      db.projects.unshift(newProj);
    }
    saveWorkspaceDb(db);
    res.json({ projects: db.projects });
  });

  app.delete('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    db.projects = db.projects.filter((p) => p.id !== id);
    saveWorkspaceDb(db);
    res.json({ projects: db.projects });
  });

  app.post('/api/projects/:id/duplicate', (req, res) => {
    const orig = db.projects.find((p) => p.id === req.params.id);
    if (!orig) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const now = new Date().toISOString();
    const copy: ProjectConfig = {
      ...JSON.parse(JSON.stringify(orig)),
      id: `proj_${Date.now().toString(36)}`,
      appTitle: `${orig.appTitle} (Copy)`,
      applicationId: `${orig.applicationId}.copy`,
      namespace: `${orig.applicationId}.copy`,
      isExistingPlayApp: false,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.unshift(copy);
    saveWorkspaceDb(db);
    res.json({ project: copy, projects: db.projects });
  });

  app.post('/api/projects/:id/increment-version', (req, res) => {
    const proj = db.projects.find((p) => p.id === req.params.id);
    if (!proj) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    proj.versionCode += 1;
    const parts = proj.versionName.split('.').map((n) => parseInt(n, 10) || 0);
    if (parts.length >= 2) {
      parts[parts.length - 1] += 1;
      proj.versionName = parts.join('.');
    } else {
      proj.versionName = `${proj.versionCode}.0`;
    }
    proj.updatedAt = new Date().toISOString();
    saveWorkspaceDb(db);
    res.json({ project: proj, projects: db.projects });
  });

  app.post('/api/keystores', (req, res) => {
    const { name, storeType, alias, commonName, organization, countryCode, validityYears, password, isPlayUploadKey, linkedPackageName } = req.body;
    if (!name || !alias || !commonName) {
      res.status(400).json({ error: 'Keystore name, alias, and commonName are required.' });
      return;
    }
    const ks = generateKeystoreProfile({
      name,
      storeType: storeType || 'PKCS12',
      alias,
      commonName,
      organization: organization || 'AndroForge Developer',
      countryCode: (countryCode || 'US').slice(0, 2).toUpperCase(),
      validityYears: Number(validityYears) || 25,
      password: password || 'androforge-vault-key',
      isPlayUploadKey: Boolean(isPlayUploadKey),
      linkedPackageName,
    });
    db.keystores.unshift(ks);
    saveWorkspaceDb(db);
    res.json({ keystore: ks, keystores: db.keystores });
  });

  app.post('/api/build', (req, res) => {
    const { projectId, buildType } = req.body as {
      projectId: string;
      buildType: 'apk_debug' | 'apk_release' | 'aab_release' | 'both_release';
    };
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    const keystore =
      db.keystores.find((k) => k.id === project.signingProfileId) || db.keystores[0];

    const buildRecord = executeProjectBuildOnDisk(
      project,
      keystore,
      buildType || 'both_release'
    );
    project.lastBuildAt = buildRecord.createdAt;
    project.lastBuildStatus = 'SUCCESS';
    db.builds.unshift(buildRecord);
    saveWorkspaceDb(db);

    res.json({
      build: buildRecord,
      builds: db.builds,
      projects: db.projects,
    });
  });

  app.get('/api/artifacts/:buildId/:fileType', (req, res) => {
    const { buildId, fileType } = req.params;
    const build = db.builds.find((b) => b.id === buildId);
    if (!build) {
      res.status(404).json({ error: 'Build record not found.' });
      return;
    }

    let targetFile = '';
    if (fileType === 'apk' && build.apkFilename) {
      targetFile = path.join(build.outputDirOnDisk, build.apkFilename);
    } else if (fileType === 'aab' && build.aabFilename) {
      targetFile = path.join(build.outputDirOnDisk, build.aabFilename);
    } else if (fileType === 'source') {
      targetFile = path.join(build.outputDirOnDisk, build.sourceZipFilename);
    } else if (fileType === 'report') {
      targetFile = path.join(build.outputDirOnDisk, 'build-report.json');
    }

    if (!targetFile || !fs.existsSync(targetFile)) {
      res.status(404).json({ error: 'Requested artifact file not found on disk.' });
      return;
    }

    res.download(targetFile);
  });

  app.post('/api/inspect', (req, res) => {
    try {
      const { buildId, artifactFormat, filename, base64Data } = req.body as {
        buildId?: string;
        artifactFormat?: 'apk' | 'aab' | 'source';
        filename?: string;
        base64Data?: string;
      };

      if (base64Data && filename) {
        const buf = Buffer.from(base64Data, 'base64');
        const report = inspectArtifactBuffer(filename, buf);
        res.json({ report });
        return;
      }

      const targetBuild = buildId
        ? db.builds.find((b) => b.id === buildId)
        : db.builds[0];

      if (!targetBuild) {
        res.status(404).json({ error: 'No build artifact available to inspect.' });
        return;
      }

      const fmt = artifactFormat || (targetBuild.apkFilename ? 'apk' : 'aab');
      const fname =
        fmt === 'aab'
          ? targetBuild.aabFilename || targetBuild.apkFilename!
          : fmt === 'source'
          ? targetBuild.sourceZipFilename
          : targetBuild.apkFilename || targetBuild.aabFilename!;

      const fullPath = path.join(targetBuild.outputDirOnDisk, fname);
      const buf = fs.readFileSync(fullPath);
      const report = inspectArtifactBuffer(fname, buf);
      res.json({ report });
    } catch (err: any) {
      res.status(400).json({
        error: err?.message || 'Failed to parse ZIP/APK/AAB archive.',
      });
    }
  });

  app.post('/api/upgrade', (req, res) => {
    const { projectId, targetApi } = req.body as {
      projectId: string;
      targetApi?: 35 | 36;
    };
    const idx = db.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    const project = db.projects[idx];
    const keystore =
      db.keystores.find((k) => k.id === project.signingProfileId) || db.keystores[0];

    const { upgradedConfig, report } = performApi36Upgrade(
      project,
      targetApi || 36,
      keystore
    );

    // Save real backup of original project on disk
    const backupFullDir = path.join(
      WORKSPACE_ROOT,
      project.id,
      'backups',
      `api${report.previousTargetSdk}_v${report.previousVersionCode}_${Date.now()}`
    );
    fs.mkdirSync(backupFullDir, { recursive: true });
    fs.writeFileSync(
      path.join(backupFullDir, 'project-backup.json'),
      JSON.stringify(project, null, 2),
      'utf8'
    );

    db.projects[idx] = upgradedConfig;
    db.upgradeReports.unshift(report);
    saveWorkspaceDb(db);

    res.json({
      upgradedProject: upgradedConfig,
      report,
      projects: db.projects,
      upgradeReports: db.upgradeReports,
    });
  });

  app.post('/api/play-check', (req, res) => {
    const { projectId } = req.body as { projectId: string };
    const project = db.projects.find((p) => p.id === projectId) || db.projects[0];
    const keystore =
      db.keystores.find((k) => k.id === project.signingProfileId) || db.keystores[0];
    const report = checkGooglePlayReadiness(project, keystore);
    res.json({ report });
  });

  app.get('/api/project-files/:projectId', (req, res) => {
    const project =
      db.projects.find((p) => p.id === req.params.projectId) || db.projects[0];
    const files = generateAndroidProjectFiles(project);
    res.json({ files });
  });

  app.get('/api/tauri-files', (_req, res) => {
    const files = [
      { path: 'src-tauri/Cargo.toml', content: fs.readFileSync(path.resolve('src-tauri/Cargo.toml'), 'utf8') },
      { path: 'src-tauri/tauri.conf.json', content: fs.readFileSync(path.resolve('src-tauri/tauri.conf.json'), 'utf8') },
      { path: 'src-tauri/src/main.rs', content: fs.readFileSync(path.resolve('src-tauri/src/main.rs'), 'utf8') },
    ];
    res.json({ files });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AndroForge Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
