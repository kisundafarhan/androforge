export type InputSourceType = 'local_html' | 'web_url' | 'android_project';

export type AppOrientation = 'auto' | 'portrait' | 'landscape';
export type CacheMode = 'no_cache' | 'default' | 'highly_cached';
export type ProgressWheelStyle = 'Lollipop' | 'Material3' | 'Circular' | 'LinearBar' | 'Minimal' | 'None';

export interface NavDrawerItem {
  id: string;
  label: string;
  icon: string;
  actionType: 'local_page' | 'web_url' | 'external_app' | 'share' | 'exit' | 'separator';
  target: string;
}

export interface AdMobConfig {
  enabled: boolean;
  testMode: boolean;
  appId: string;
  bannerEnabled: boolean;
  bannerUnitId: string;
  bannerPosition: 'top' | 'bottom';
  interstitialEnabled: boolean;
  interstitialUnitId: string;
  interstitialIntervalSec: number;
  rewardedEnabled: boolean;
  rewardedUnitId: string;
  nativeAdsEnabled: boolean;
  umpConsentEnabled: boolean;
  childDirectedTreatment: boolean;
  testDeviceIds: string[];
}

export interface FirebaseConfig {
  enabled: boolean;
  googleServicesJsonProvided: boolean;
  googleServicesRaw?: string;
  projectId: string;
  projectNumber: string;
  mobilesdkAppId: string;
  packageName: string;
  fcmEnabled: boolean;
  defaultNotificationChannel: string;
  inAppMessagingEnabled: boolean;
  analyticsEnabled: boolean;
  crashlyticsEnabled: boolean;
  remoteConfigEnabled: boolean;
}

export interface WebViewExtrasConfig {
  supportZoom: boolean;
  zoomButtons: boolean;
  sideScrollBars: boolean;
  textSelection: boolean;
  saveFormData: boolean;
  fullScreen: boolean;
  javascriptApis: boolean;
  httpsOnlyContent: boolean;
  allowExternalUrls: boolean;
  confirmOnExit: boolean;
  enableGpsPrompt: boolean;
  disallowScreenshot: boolean;
  allowFileAccess: boolean; // Disabled by default in favor of WebViewAssetLoader
  allowCrossOriginLocal: boolean; // Handled safely via WebViewAssetLoader https://appassets.androidplatform.net
  showToolbarTitle: boolean;
  liveToolbarTitle: boolean;
  homeButton: boolean;
  pullToRefresh: boolean;
  deepLinking: boolean;
  popupBlocker: boolean;
  domStorage: boolean;
  mediaPlaybackRequiresUserGesture: boolean;
  safeBrowsing: boolean;
  keepScreenAwake: boolean;
  downloadsEnabled: boolean;
  fileUploadEnabled: boolean;
  cameraPermission: boolean;
  microphonePermission: boolean;
  hideWebViewUa: boolean;
  hideAndroidMobileUa: boolean;
  desktopMode: boolean;
  customUserAgent: string;
  allowedDomains: string[];
  deepLinkScheme: string;
  deepLinkHost: string;
}

export interface SplashConfig {
  enabled: boolean;
  durationMs: number;
  mode: 'default' | 'custom';
  backgroundColor: string;
  textColor: string;
  subtitleText: string;
  logoDataUrl?: string;
}

export interface NavigationDrawerConfig {
  enabled: boolean;
  bottomNavEnabled: boolean;
  headerTitle: string;
  headerSubtitle: string;
  headerBgColor: string;
  footerText: string;
  items: NavDrawerItem[];
}

export interface HtmlAssetFile {
  path: string; // e.g. "index.html", "css/style.css", "js/app.js"
  content: string; // UTF-8 or base64 content
  encoding: 'utf8' | 'base64';
  sizeBytes: number;
  mimeType: string;
}

export interface ProjectConfig {
  id: string;
  createdAt: string;
  updatedAt: string;
  sourceType: InputSourceType;
  appTitle: string;
  packageSegments: [string, string, string]; // e.g. ['com', 'goyal', 'letusc']
  applicationId: string; // e.g. 'com.goyal.letusc'
  namespace: string;
  versionName: string;
  versionCode: number;
  minSdk: number;
  targetSdk: number;
  compileSdk: number;
  gradleVersion: string;
  agpVersion: string;
  kotlinVersion: string;
  abis: ('arm64-v8a' | 'armeabi-v7a' | 'x86_64')[];
  orientation: AppOrientation;
  outputDirectory: string;
  aboutDialogText: string;
  appShareText: string;
  appExitText: string;
  cacheMode: CacheMode;
  customErrorPageMode: 'default' | 'custom';
  customErrorHtml: string;
  urlProtocol: 'https://' | 'http://';
  webUrl: string;
  localHtmlEntry: string;
  frameworkDetected: string;
  htmlAssets: HtmlAssetFile[];
  iconDataUrl?: string;
  iconBackgroundHex: string;
  iconForegroundText: string;
  materialSchemeId: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  statusBarColor: string;
  navigationBarColor: string;
  themeAppearance: 'system' | 'light' | 'dark';
  progressWheelMode: 'system' | 'custom';
  progressWheelStyle: ProgressWheelStyle;
  splash: SplashConfig;
  extras: WebViewExtrasConfig;
  admob: AdMobConfig;
  firebase: FirebaseConfig;
  navDrawer: NavigationDrawerConfig;
  signingProfileId: string;
  releaseNotes: string;
  isExistingPlayApp: boolean;
  originalApplicationId?: string;
  originalSigningSha256?: string;
  lastBuildAt?: string;
  lastBuildStatus?: 'SUCCESS' | 'FAILED' | 'NONE';
}

export interface KeystoreProfile {
  id: string;
  name: string;
  storeType: 'PKCS12' | 'JKS';
  alias: string;
  subjectDn: string;
  organization: string;
  countryCode: string;
  validityYears: number;
  createdAt: string;
  sha1Fingerprint: string;
  sha256Fingerprint: string;
  publicKeyPem: string;
  certificatePem: string;
  encryptedPrivateKeyHex: string;
  ivHex: string;
  authTagHex: string;
  isPlayUploadKey: boolean;
  linkedPackageName?: string;
}

export interface BuildLogEntry {
  timestamp: string;
  task: string;
  level: 'INFO' | 'TASK' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

export interface BuildArtifactRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  applicationId: string;
  versionName: string;
  versionCode: number;
  targetSdk: number;
  compileSdk: number;
  buildType: 'apk_debug' | 'apk_release' | 'aab_release' | 'both_release';
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
  durationMs: number;
  apkFilename?: string;
  apkSizeBytes?: number;
  apkSha256?: string;
  aabFilename?: string;
  aabSizeBytes?: number;
  aabSha256?: string;
  sourceZipFilename: string;
  sourceZipSizeBytes: number;
  signingAlias: string;
  signingSha256: string;
  outputDirOnDisk: string;
  logs: BuildLogEntry[];
  playReadinessStatus: 'PASS' | 'WARNING' | 'BLOCKED';
}

export interface PlayCheckItem {
  id: string;
  category: 'API Level' | 'Signing & Identity' | 'Security & WebView' | 'Architecture & Bundle' | 'Branding & Manifest' | 'Policy & Privacy';
  title: string;
  status: 'PASS' | 'WARNING' | 'BLOCKED';
  currentValue: string;
  requiredValue: string;
  explanation: string;
  actionableFix: string;
}

export interface PlayReadinessReport {
  overallStatus: 'PASS' | 'WARNING' | 'BLOCKED';
  generatedAt: string;
  applicationId: string;
  versionCode: number;
  versionName: string;
  targetSdk: number;
  compileSdk: number;
  score: number;
  checks: PlayCheckItem[];
  disclaimer: string;
}

export interface MigrationStepItem {
  stepNumber: number;
  title: string;
  status: 'COMPLETED' | 'WARNING' | 'MANUAL_REVIEW';
  fileAffected: string;
  beforeSnippet: string;
  afterSnippet: string;
  explanation: string;
}

export interface ApiUpgradeReport {
  projectId: string;
  projectTitle: string;
  backupPath: string;
  upgradedAt: string;
  previousMinSdk: number;
  previousTargetSdk: number;
  previousCompileSdk: number;
  previousGradle: string;
  previousAgp: string;
  newMinSdk: number;
  newTargetSdk: number;
  newCompileSdk: number;
  newGradle: string;
  newAgp: string;
  previousVersionCode: number;
  newVersionCode: number;
  packageContinuityVerified: boolean;
  signingContinuityVerified: boolean;
  steps: MigrationStepItem[];
  warnings: string[];
}

export interface InspectedArchiveEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  crc32Hex: string;
}

export interface InspectedArtifactReport {
  filename: string;
  artifactType: 'APK' | 'AAB' | 'ANDROID_SOURCE_ZIP' | 'UNKNOWN_ZIP';
  fileSizeBytes: number;
  sha256Digest: string;
  inspectedAt: string;
  applicationId: string;
  appLabel: string;
  versionCode: number;
  versionName: string;
  minSdk: number;
  targetSdk: number;
  compileSdk: number;
  isSigned: boolean;
  signingSignerName: string;
  signingSha256: string;
  signingSha1: string;
  signatureVerified: boolean;
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  providers: string[];
  abis: string[];
  embeddedWebAssets: string[];
  nativeLibraries: string[];
  bundleModules: string[];
  securityWarnings: string[];
  hasRecoverableWebAssets: boolean;
  hasOriginalKotlinSource: boolean;
  hasPrivateSigningKey: boolean; // Always false for compiled APK/AAB
  truthfulLimitationNotice: string;
  entries: InspectedArchiveEntry[];
  manifestPreview: string;
}

export interface AcceptanceTestResult {
  testNumber: number;
  code: string;
  title: string;
  status: 'PASS' | 'NOT_TESTED' | 'FAIL';
  executionTimeMs: number;
  evidenceSummary: string;
  limitationOrReason?: string;
}
