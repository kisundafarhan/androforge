import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRequiredPermissions,
  generateAndroidManifestXml,
  generateAndroidProjectFiles,
  sanitizePackageName,
} from './androidGenerator';
import { checkGooglePlayReadiness, performApi36Upgrade } from './apiUpgradeEngine';
import {
  buildAndroidSourceZipBuffer,
  buildSignedAabBuffer,
  buildSignedApkBuffer,
  decryptKeystorePrivateKey,
  generateKeystoreProfile,
  inspectArtifactBuffer,
  readZipBuffer,
} from './zipAndSignEngine';
import { createDefaultProjects, runAcceptanceTestSuite } from './defaultSeedData';

test('sanitizePackageName normalizes invalid segments and reserved Kotlin keywords', () => {
  assert.equal(sanitizePackageName('com.goyal.letusc'), 'com.goyal.letusc');
  assert.equal(sanitizePackageName('com.123app.in'), 'com.app_123app.inapp');
  assert.equal(sanitizePackageName('singleword'), 'singleword.app');
});

test('RSA-2048 keystore generator encrypts private key at rest and computes valid fingerprints', () => {
  const ks = generateKeystoreProfile({
    name: 'Production Upload Key',
    alias: 'upload_key',
    commonName: 'AndroForge Developer',
    organization: 'AndroForge Studio',
    countryCode: 'US',
    password: 'my-secret-password',
  });

  assert.ok(ks.sha256Fingerprint.split(':').length === 32);
  assert.ok(ks.sha1Fingerprint.split(':').length === 20);
  assert.ok(!ks.encryptedPrivateKeyHex.includes('BEGIN PRIVATE KEY'));

  const decryptedPem = decryptKeystorePrivateKey(ks, 'my-secret-password');
  assert.ok(decryptedPem.includes('BEGIN PRIVATE KEY'));
});

test('HTML-to-Android engine generates complete Kotlin API 36 project with WebViewAssetLoader', () => {
  const ks = generateKeystoreProfile({
    name: 'Default Keystore',
    alias: 'upload',
    commonName: 'Goyal Softech',
    organization: 'Goyal',
    countryCode: 'IN',
  });
  const projects = createDefaultProjects(ks.id, ks.sha256Fingerprint);
  const letUsC = projects[0];

  const files = generateAndroidProjectFiles(letUsC);
  const paths = files.map((f) => f.relativePath);

  assert.ok(paths.includes('settings.gradle.kts'));
  assert.ok(paths.includes('build.gradle.kts'));
  assert.ok(paths.includes('app/build.gradle.kts'));
  assert.ok(paths.includes('app/src/main/AndroidManifest.xml'));
  assert.ok(paths.includes('app/src/main/java/com/goyal/letusc/MainActivity.kt'));
  assert.ok(paths.includes('app/src/main/assets/www/index.html'));
  assert.ok(paths.includes('app/src/main/assets/www/css/style.css'));
  assert.ok(paths.includes('app/src/main/assets/www/js/app.js'));

  const mainKt = files.find((f) => f.relativePath.endsWith('MainActivity.kt'))!.content;
  assert.ok(mainKt.includes('WebViewAssetLoader.Builder()'));
  assert.ok(mainKt.includes('https://appassets.androidplatform.net/assets/www/index.html'));
  assert.ok(mainKt.includes('settings.allowFileAccess = false'));
});

test('APK and AAB builder produces cryptographically signed archives verified by Inspector', () => {
  const ks = generateKeystoreProfile({
    name: 'Release Keystore',
    alias: 'upload',
    commonName: 'AndroForge',
    organization: 'AndroForge',
    countryCode: 'US',
  });
  const [project] = createDefaultProjects(ks.id, ks.sha256Fingerprint);

  const apkBuf = buildSignedApkBuffer(project, ks);
  const apkReport = inspectArtifactBuffer('LetUsC-release.apk', apkBuf);

  assert.equal(apkReport.artifactType, 'APK');
  assert.equal(apkReport.applicationId, 'com.goyal.letusc');
  assert.equal(apkReport.targetSdk, 36);
  assert.equal(apkReport.compileSdk, 36);
  assert.equal(apkReport.isSigned, true);
  assert.equal(apkReport.signatureVerified, true);
  assert.equal(apkReport.signingSha256, ks.sha256Fingerprint);
  assert.equal(apkReport.hasPrivateSigningKey, false);
  assert.ok(apkReport.embeddedWebAssets.includes('assets/www/index.html'));

  const aabBuf = buildSignedAabBuffer(project, ks);
  const aabReport = inspectArtifactBuffer('LetUsC-release.aab', aabBuf);

  assert.equal(aabReport.artifactType, 'AAB');
  assert.equal(aabReport.isSigned, true);
  assert.equal(aabReport.signatureVerified, true);
  assert.ok(aabReport.bundleModules.includes('base'));
  assert.ok(aabReport.embeddedWebAssets.includes('base/assets/www/index.html'));

  const srcZipBuf = buildAndroidSourceZipBuffer(project);
  const srcEntries = readZipBuffer(srcZipBuf);
  assert.ok(srcEntries.some((e) => e.name === 'app/build.gradle.kts'));
});

test('Android API 36 Upgrade Center migrates API 33 project to API 36 preserving package and incrementing versionCode', () => {
  const ks = generateKeystoreProfile({
    name: 'Play Upload Key',
    alias: 'upload',
    commonName: 'Nusantara',
    organization: 'Nusantara POS',
    countryCode: 'ID',
  });
  const projects = createDefaultProjects(ks.id, ks.sha256Fingerprint);
  const legacyProj = projects[1]; // API 33

  const beforePlayCheck = checkGooglePlayReadiness(legacyProj, ks);
  assert.equal(beforePlayCheck.overallStatus, 'BLOCKED');

  const { upgradedConfig, report } = performApi36Upgrade(legacyProj, 36, ks);
  assert.equal(upgradedConfig.targetSdk, 36);
  assert.equal(upgradedConfig.compileSdk, 36);
  assert.equal(upgradedConfig.applicationId, legacyProj.applicationId);
  assert.equal(upgradedConfig.versionCode, legacyProj.versionCode + 1);
  assert.equal(report.packageContinuityVerified, true);
  assert.equal(report.signingContinuityVerified, true);

  const afterPlayCheck = checkGooglePlayReadiness(upgradedConfig, ks);
  assert.equal(afterPlayCheck.overallStatus, 'PASS');
});

test('Full 12-point Definition of Done Acceptance Suite executes cleanly', () => {
  const ks = generateKeystoreProfile({
    name: 'QA Keystore',
    alias: 'upload',
    commonName: 'QA',
    organization: 'AndroForge',
    countryCode: 'US',
  });
  const projects = createDefaultProjects(ks.id, ks.sha256Fingerprint);
  const suite = runAcceptanceTestSuite(projects, ks, false, false);

  assert.equal(suite.length, 12);
  const failed = suite.filter((t) => t.status === 'FAIL');
  assert.equal(failed.length, 0);
  // Test 3 is truthfully marked NOT_TESTED when no physical USB Android device is attached
  const test3 = suite.find((t) => t.testNumber === 3)!;
  assert.equal(test3.status, 'NOT_TESTED');
});
