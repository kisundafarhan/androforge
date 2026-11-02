export interface MaterialColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  statusBar: string;
  navBar: string;
}

export const MATERIAL_COLOR_SCHEMES: MaterialColorScheme[] = [
  { id: 'classic-teal', name: '01. Classic Cyan Teal (W2APK)', primary: '#00687B', secondary: '#0097A7', tertiary: '#4DD0E1', statusBar: '#004F5E', navBar: '#003640' },
  { id: 'android-emerald', name: '02. Android Studio Emerald', primary: '#059669', secondary: '#10B981', tertiary: '#6EE7B7', statusBar: '#047857', navBar: '#064E3B' },
  { id: 'play-cobalt', name: '03. Google Play Cobalt', primary: '#1D4ED8', secondary: '#3B82F6', tertiary: '#93C5FD', statusBar: '#1E40AF', navBar: '#1E3A8A' },
  { id: 'indigo-slate', name: '04. Deep Indigo Slate', primary: '#4338CA', secondary: '#6366F1', tertiary: '#A5B4FC', statusBar: '#3730A3', navBar: '#312E81' },
  { id: 'ocean-breeze', name: '05. Pacific Ocean Blue', primary: '#0284C7', secondary: '#0EA5E9', tertiary: '#7DD3FC', statusBar: '#0369A1', navBar: '#0C4A6E' },
  { id: 'crimson-forge', name: '06. Builder Crimson Red', primary: '#DC2626', secondary: '#EF4444', tertiary: '#FCA5A5', statusBar: '#B91C1C', navBar: '#7F1D1D' },
  { id: 'amber-gold', name: '07. Solar Amber Gold', primary: '#D97706', secondary: '#F59E0B', tertiary: '#FCD34D', statusBar: '#B45309', navBar: '#78350F' },
  { id: 'forest-pine', name: '08. Nordic Forest Pine', primary: '#15803D', secondary: '#22C55E', tertiary: '#86EFAC', statusBar: '#166534', navBar: '#14532D' },
  { id: 'royal-plum', name: '09. Royal Plum Velvet', primary: '#7E22CE', secondary: '#A855F7', tertiary: '#D8B4FE', statusBar: '#6B21A8', navBar: '#581C87' },
  { id: 'rose-quartz', name: '10. Rose Quartz Modern', primary: '#BE123C', secondary: '#F43F5E', tertiary: '#FDA4AF', statusBar: '#9F1239', navBar: '#881337' },
  { id: 'graphite-mono', name: '11. Industrial Graphite', primary: '#334155', secondary: '#64748B', tertiary: '#CBD5E1', statusBar: '#1E293B', navBar: '#0F172A' },
  { id: 'terracotta-clay', name: '12. Warm Terracotta', primary: '#C2410C', secondary: '#F97316', tertiary: '#FDBA74', statusBar: '#9A3412', navBar: '#7C2D12' },
  { id: 'turquoise-lagoon', name: '13. Turquoise Lagoon', primary: '#0D9488', secondary: '#14B8A6', tertiary: '#5EEAD4', statusBar: '#0F766E', navBar: '#134E4A' },
  { id: 'sapphire-night', name: '14. Sapphire Midnight', primary: '#1E3A8A', secondary: '#2563EB', tertiary: '#60A5FA', statusBar: '#172554', navBar: '#0F172A' },
  { id: 'mint-sage', name: '15. Botanical Mint Sage', primary: '#3F6212', secondary: '#65A30D', tertiary: '#BEF264', statusBar: '#365314', navBar: '#1A2E05' },
  { id: 'coral-sunset', name: '16. Coral Reef Sunset', primary: '#E11D48', secondary: '#FB7185', tertiary: '#FECDD3', statusBar: '#BE123C', navBar: '#881337' },
  { id: 'bronze-espresso', name: '17. Roast Espresso Bronze', primary: '#78350F', secondary: '#A16207', tertiary: '#FDE047', statusBar: '#451A03', navBar: '#271202' },
  { id: 'sky-horizon', name: '18. Stratosphere Sky', primary: '#0369A1', secondary: '#38BDF8', tertiary: '#BAE6FD', statusBar: '#075985', navBar: '#082F49' },
  { id: 'fuchsia-berry', name: '19. Mulberry Wine', primary: '#A21CAF', secondary: '#D946EF', tertiary: '#F0ABFC', statusBar: '#86198F', navBar: '#4A044E' },
  { id: 'olive-tactical', name: '20. Tactical Olive', primary: '#4D7C0F', secondary: '#84CC16', tertiary: '#D9F99D', statusBar: '#3F6212', navBar: '#1A2E05' },
  { id: 'obsidian-oled', name: '21. Obsidian OLED Dark', primary: '#18181B', secondary: '#3F3F46', tertiary: '#A1A1AA', statusBar: '#09090B', navBar: '#000000' },
];

export interface AndroidToolchainMatrixItem {
  apiLevel: number;
  codename: string;
  androidVersion: string;
  recommendedAgp: string;
  recommendedGradle: string;
  recommendedKotlin: string;
  requiredJdk: string;
  buildTools: string;
  bundletoolVersion: string;
  playConsoleStatus: string;
  isDefault: boolean;
}

export const ANDROID_TOOLCHAIN_MATRIX: AndroidToolchainMatrixItem[] = [
  {
    apiLevel: 36,
    codename: 'Baklava',
    androidVersion: 'Android 16',
    recommendedAgp: '8.8.0',
    recommendedGradle: '8.11.1',
    recommendedKotlin: '2.1.0',
    requiredJdk: 'JDK 21 LTS (Temurin 21.0.5)',
    buildTools: '36.0.0',
    bundletoolVersion: '1.17.2',
    playConsoleStatus: 'Primary Recommended Target (First-Class Support)',
    isDefault: true,
  },
  {
    apiLevel: 35,
    codename: 'VanillaIceCream',
    androidVersion: 'Android 15',
    recommendedAgp: '8.7.3',
    recommendedGradle: '8.10.2',
    recommendedKotlin: '2.0.21',
    requiredJdk: 'JDK 17 or JDK 21 LTS',
    buildTools: '35.0.0',
    bundletoolVersion: '1.17.1',
    playConsoleStatus: 'Minimum Required for Google Play Updates',
    isDefault: false,
  },
  {
    apiLevel: 34,
    codename: 'UpsideDownCake',
    androidVersion: 'Android 14',
    recommendedAgp: '8.5.2',
    recommendedGradle: '8.7',
    recommendedKotlin: '1.9.24',
    requiredJdk: 'JDK 17 LTS',
    buildTools: '34.0.0',
    bundletoolVersion: '1.16.0',
    playConsoleStatus: 'Legacy Maintenance Only (Upgrade to API 36 Required)',
    isDefault: false,
  },
  {
    apiLevel: 33,
    codename: 'Tiramisu',
    androidVersion: 'Android 13',
    recommendedAgp: '8.2.2',
    recommendedGradle: '8.4',
    recommendedKotlin: '1.9.20',
    requiredJdk: 'JDK 17 LTS',
    buildTools: '33.0.2',
    bundletoolVersion: '1.15.6',
    playConsoleStatus: 'Blocked for New Play Console Submissions (Migrate to API 36)',
    isDefault: false,
  },
];

export const UI_TRANSLATIONS = {
  en: {
    appName: 'AndroForge Studio',
    subtitle: 'HTML-to-Android APK & AAB Builder · API 36 Rebuilder',
    navDashboard: 'Dashboard',
    navCreate: 'Create New App',
    navProjects: 'My Projects',
    navHtmlBuilder: 'HTML to APK/AAB',
    navInspector: 'APK/AAB Inspector',
    navUpgrade: 'Android API Upgrade',
    navBranding: 'App Branding',
    navWebView: 'WebView Designer',
    navDrawer: 'Navigation Drawer',
    navMonetization: 'Monetization',
    navFirebase: 'Firebase Integration',
    navKeystore: 'Keystore Manager',
    navSdk: 'SDK & Build Tools',
    navBuildCenter: 'Build Center',
    navDocs: 'Documentation',
    navSettings: 'Settings',
    buildApkBtn: 'Build Android APK',
    buildAabBtn: 'Build App Bundle',
    buildBothBtn: 'Build APK + AAB',
  },
  id: {
    appName: 'AndroForge Studio',
    subtitle: 'Pembuat APK & AAB HTML-ke-Android · Pembaru API 36',
    navDashboard: 'Dasbor Utama',
    navCreate: 'Buat Aplikasi Baru',
    navProjects: 'Proyek Saya',
    navHtmlBuilder: 'HTML ke APK/AAB',
    navInspector: 'Inspektur APK/AAB',
    navUpgrade: 'Upgrade API Android',
    navBranding: 'Branding Aplikasi',
    navWebView: 'Desainer WebView',
    navDrawer: 'Laci Navigasi',
    navMonetization: 'Monetisasi AdMob',
    navFirebase: 'Integrasi Firebase',
    navKeystore: 'Manajer Keystore',
    navSdk: 'SDK & Alat Build',
    navBuildCenter: 'Pusat Kompilasi',
    navDocs: 'Dokumentasi',
    navSettings: 'Pengaturan',
    buildApkBtn: 'Bangun APK Android',
    buildAabBtn: 'Bangun App Bundle',
    buildBothBtn: 'Bangun APK + AAB',
  },
};
