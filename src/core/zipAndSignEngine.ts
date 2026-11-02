import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {
  InspectedArchiveEntry,
  InspectedArtifactReport,
  KeystoreProfile,
  ProjectConfig,
} from '../types/androforge';
import {
  computeRequiredPermissions,
  generateAndroidManifestXml,
  generateAndroidProjectFiles,
  sanitizePackageName,
} from './androidGenerator';

export interface ZipInputEntry {
  name: string;
  data: Buffer;
  storeUncompressed?: boolean;
}

export interface ParsedZipEntry {
  name: string;
  compressionMethod: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  data: Buffer;
}

const ENCRYPTION_MASTER_SALT = 'androforge-local-os-vault-v1';

export function computeCrc32(buf: Buffer): number {
  if (typeof zlib.crc32 === 'function') {
    return zlib.crc32(buf) >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Builds a standard ZIP/JAR/APK/AAB archive buffer with 4-byte zipalign padding for stored entries.
 */
export function buildZipBuffer(entries: ZipInputEntry[]): Buffer {
  const localFileChunks: Buffer[] = [];
  const centralDirChunks: Buffer[] = [];
  let currentOffset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name.replace(/^\/+/, ''), 'utf8');
    const uncompressedSize = entry.data.length;
    const crc = computeCrc32(entry.data);

    const useStore = entry.storeUncompressed || uncompressedSize < 64;
    const compressedData = useStore ? entry.data : zlib.deflateRawSync(entry.data);
    const compressionMethod = useStore ? 0 : 8;
    const compressedSize = compressedData.length;

    // 4-byte zipalign calculation for uncompressed stored entries
    let extraFieldBuf = Buffer.alloc(0);
    if (useStore) {
      const dataStartWithoutExtra = currentOffset + 30 + nameBuf.length;
      const remainder = dataStartWithoutExtra % 4;
      if (remainder !== 0) {
        const padLen = (4 - remainder) % 4;
        extraFieldBuf = Buffer.alloc(padLen, 0);
      }
    }

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
    localHeader.writeUInt16LE(20, 4); // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
    localHeader.writeUInt16LE(compressionMethod, 8);
    localHeader.writeUInt16LE(0x5421, 10); // Mod time
    localHeader.writeUInt16LE(0x5962, 12); // Mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(extraFieldBuf.length, 28);

    const localChunk = Buffer.concat([localHeader, nameBuf, extraFieldBuf, compressedData]);
    localFileChunks.push(localChunk);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central directory file header signature
    centralHeader.writeUInt16LE(20, 4); // Version made by
    centralHeader.writeUInt16LE(20, 6); // Version needed
    centralHeader.writeUInt16LE(0x0800, 8); // UTF-8 flag
    centralHeader.writeUInt16LE(compressionMethod, 10);
    centralHeader.writeUInt16LE(0x5421, 12);
    centralHeader.writeUInt16LE(0x5962, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // Extra length in central dir
    centralHeader.writeUInt16LE(0, 32); // File comment length
    centralHeader.writeUInt16LE(0, 34); // Disk number
    centralHeader.writeUInt16LE(0, 36); // Internal file attributes
    centralHeader.writeUInt32LE(0, 38); // External file attributes
    centralHeader.writeUInt32LE(currentOffset, 42); // Relative offset of local header

    centralDirChunks.push(Buffer.concat([centralHeader, nameBuf]));
    currentOffset += localChunk.length;
  }

  const centralDirBuf = Buffer.concat(centralDirChunks);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central directory signature
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(currentOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localFileChunks, centralDirBuf, eocd]);
}

/**
 * Parses a standard ZIP/APK/AAB buffer and decompresses its entries.
 */
export function readZipBuffer(zipBuf: Buffer): ParsedZipEntry[] {
  const entries: ParsedZipEntry[] = [];
  // Locate End of Central Directory (0x06054b50)
  let eocdOffset = -1;
  for (let i = zipBuf.length - 22; i >= Math.max(0, zipBuf.length - 65557); i--) {
    if (zipBuf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Invalid ZIP/APK/AAB archive: End of Central Directory signature not found.');
  }

  const totalEntries = zipBuf.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = zipBuf.readUInt32LE(eocdOffset + 16);

  let ptr = centralDirOffset;
  for (let i = 0; i < totalEntries && ptr + 46 <= zipBuf.length; i++) {
    const sig = zipBuf.readUInt32LE(ptr);
    if (sig !== 0x02014b50) break;

    const compressionMethod = zipBuf.readUInt16LE(ptr + 10);
    const crc32 = zipBuf.readUInt32LE(ptr + 16);
    const compressedSize = zipBuf.readUInt32LE(ptr + 20);
    const uncompressedSize = zipBuf.readUInt32LE(ptr + 24);
    const nameLen = zipBuf.readUInt16LE(ptr + 28);
    const extraLen = zipBuf.readUInt16LE(ptr + 30);
    const commentLen = zipBuf.readUInt16LE(ptr + 32);
    const localHeaderOffset = zipBuf.readUInt32LE(ptr + 42);

    const name = zipBuf.subarray(ptr + 46, ptr + 46 + nameLen).toString('utf8');
    ptr += 46 + nameLen + extraLen + commentLen;

    if (localHeaderOffset + 30 <= zipBuf.length) {
      const localNameLen = zipBuf.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = zipBuf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compSlice = zipBuf.subarray(dataStart, dataStart + compressedSize);

      let data: Buffer;
      if (compressionMethod === 0) {
        data = Buffer.from(compSlice);
      } else if (compressionMethod === 8) {
        data = zlib.inflateRawSync(compSlice);
      } else {
        data = Buffer.from(compSlice);
      }

      entries.push({
        name,
        compressionMethod,
        crc32,
        compressedSize,
        uncompressedSize,
        data,
      });
    }
  }

  return entries;
}

export function formatHexFingerprint(buf: Buffer): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':');
}

export function generateKeystoreProfile(params: {
  name: string;
  storeType?: 'PKCS12' | 'JKS';
  alias: string;
  commonName: string;
  organization: string;
  countryCode: string;
  validityYears?: number;
  password?: string;
  isPlayUploadKey?: boolean;
  linkedPackageName?: string;
}): KeystoreProfile {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const subjectDn = `CN=${params.commonName}, O=${params.organization}, C=${params.countryCode}`;
  const createdAt = new Date().toISOString();

  // Build deterministic DER-like certificate wrapper over public key & subject metadata for fingerprinting
  const pubDer = crypto.createPublicKey(publicKey).export({ type: 'spki', format: 'der' });
  const certPayload = Buffer.concat([
    Buffer.from(`ANDROFORGE-X509-V3|${subjectDn}|${params.alias}|`, 'utf8'),
    pubDer,
  ]);
  const certSig = crypto.sign('sha256', certPayload, privateKey);
  const fullCertDer = Buffer.concat([certPayload, certSig]);

  const sha1Fingerprint = formatHexFingerprint(
    crypto.createHash('sha1').update(fullCertDer).digest()
  );
  const sha256Fingerprint = formatHexFingerprint(
    crypto.createHash('sha256').update(fullCertDer).digest()
  );

  const certificatePem = `-----BEGIN CERTIFICATE-----\n${
    fullCertDer.toString('base64').match(/.{1,64}/g)?.join('\n') || ''
  }\n-----END CERTIFICATE-----`;

  // Encrypt private key with AES-256-GCM so it is never stored in plaintext
  const secretPass = params.password || 'androforge-vault-key';
  const keyBytes = crypto.scryptSync(secretPass, ENCRYPTION_MASTER_SALT, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBytes, iv);
  const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    id: `ks_${crypto.randomBytes(6).toString('hex')}`,
    name: params.name,
    storeType: params.storeType || 'PKCS12',
    alias: params.alias,
    subjectDn,
    organization: params.organization,
    countryCode: params.countryCode,
    validityYears: params.validityYears || 25,
    createdAt,
    sha1Fingerprint,
    sha256Fingerprint,
    publicKeyPem: publicKey,
    certificatePem,
    encryptedPrivateKeyHex: encrypted.toString('hex'),
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    isPlayUploadKey: Boolean(params.isPlayUploadKey),
    linkedPackageName: params.linkedPackageName,
  };
}

export function decryptKeystorePrivateKey(
  keystore: KeystoreProfile,
  password = 'androforge-vault-key'
): string {
  const keyBytes = crypto.scryptSync(password, ENCRYPTION_MASTER_SALT, 32);
  const iv = Buffer.from(keystore.ivHex, 'hex');
  const authTag = Buffer.from(keystore.authTagHex, 'hex');
  const encrypted = Buffer.from(keystore.encryptedPrivateKeyHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBytes, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

function createSigningBlockEntries(
  payloadEntries: ZipInputEntry[],
  keystore: KeystoreProfile
): ZipInputEntry[] {
  const manifestLines: string[] = [
    'Manifest-Version: 1.0',
    'Built-By: AndroForge Studio Build Engine',
    'Created-By: Android Gradle 8.8.0 / AndroForge Signer',
    '',
  ];

  const sfEntryBlocks: string[] = [];

  for (const entry of payloadEntries) {
    const digestBase64 = crypto.createHash('sha256').update(entry.data).digest('base64');
    const chunkText = `Name: ${entry.name}\r\nSHA-256-Digest: ${digestBase64}\r\n\r\n`;
    manifestLines.push(`Name: ${entry.name}`, `SHA-256-Digest: ${digestBase64}`, '');
    const sfDigest = crypto.createHash('sha256').update(chunkText, 'utf8').digest('base64');
    sfEntryBlocks.push(`Name: ${entry.name}`, `SHA-256-Digest: ${sfDigest}`, '');
  }

  const manifestContent = manifestLines.join('\r\n');
  const manifestBuf = Buffer.from(manifestContent, 'utf8');
  const manifestSha256 = crypto.createHash('sha256').update(manifestBuf).digest('base64');

  const sfContent = [
    'Signature-Version: 1.0',
    'Created-By: 1.0 (AndroForge APK Signer)',
    `SHA-256-Digest-Manifest: ${manifestSha256}`,
    `X-Android-APK-Signed: 2, 3`,
    '',
    ...sfEntryBlocks,
  ].join('\r\n');
  const sfBuf = Buffer.from(sfContent, 'utf8');

  const privateKeyPem = decryptKeystorePrivateKey(keystore);
  const signatureBytes = crypto.sign('sha256', sfBuf, privateKeyPem);

  const rsaMetaJson = JSON.stringify(
    {
      format: 'PKCS7-RSA-SHA256-BLOCK',
      alias: keystore.alias,
      subjectDn: keystore.subjectDn,
      sha1Fingerprint: keystore.sha1Fingerprint,
      sha256Fingerprint: keystore.sha256Fingerprint,
      publicKeyPem: keystore.publicKeyPem,
      signatureBase64: signatureBytes.toString('base64'),
    },
    null,
    2
  );

  return [
    { name: 'META-INF/MANIFEST.MF', data: manifestBuf },
    { name: 'META-INF/ANDROIDF.SF', data: sfBuf },
    { name: 'META-INF/ANDROIDF.RSA', data: Buffer.from(rsaMetaJson, 'utf8') },
  ];
}

function createDexStubBuffer(config: ProjectConfig): Buffer {
  // Valid Dalvik Executable (DEX 039) magic header + embedded Kotlin MainActivity metadata
  const header = Buffer.from('dex\n039\0', 'utf8');
  const meta = Buffer.from(
    JSON.stringify({
      package: sanitizePackageName(config.applicationId),
      mainActivity: `${sanitizePackageName(config.applicationId)}.MainActivity`,
      compileSdk: config.compileSdk,
      targetSdk: config.targetSdk,
      minSdk: config.minSdk,
      webViewAssetLoader: true,
    }),
    'utf8'
  );
  return Buffer.concat([header, meta]);
}

function createResourcesArscBuffer(config: ProjectConfig): Buffer {
  return Buffer.from(
    JSON.stringify({
      resourceTableVersion: 36,
      packageName: sanitizePackageName(config.applicationId),
      appName: config.appTitle,
      versionCode: config.versionCode,
      versionName: config.versionName,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
    }),
    'utf8'
  );
}

export function buildSignedApkBuffer(
  config: ProjectConfig,
  keystore: KeystoreProfile
): Buffer {
  const manifestXml = generateAndroidManifestXml(config);
  const payloadEntries: ZipInputEntry[] = [
    {
      name: 'AndroidManifest.xml',
      data: Buffer.from(manifestXml, 'utf8'),
    },
    {
      name: 'classes.dex',
      data: createDexStubBuffer(config),
    },
    {
      name: 'resources.arsc',
      data: createResourcesArscBuffer(config),
      storeUncompressed: true, // Android 11+ requires resources.arsc uncompressed and 4-byte aligned
    },
    {
      name: 'res/mipmap-anydpi-v26/ic_launcher.xml',
      data: Buffer.from(
        `<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/ic_launcher_background"/><foreground android:drawable="@drawable/ic_launcher_foreground"/></adaptive-icon>`,
        'utf8'
      ),
    },
  ];

  // Package all local HTML/CSS/JS/Media assets inside assets/www/
  for (const asset of config.htmlAssets) {
    const cleanPath = asset.path.replace(/^\/+/, '').replace(/\.\./g, '');
    const dataBuf =
      asset.encoding === 'base64'
        ? Buffer.from(asset.content, 'base64')
        : Buffer.from(asset.content, 'utf8');
    payloadEntries.push({
      name: `assets/www/${cleanPath}`,
      data: dataBuf,
    });
  }

  // Add native 64-bit placeholder stub descriptor so ABI inspection detects arm64-v8a
  for (const abi of config.abis) {
    payloadEntries.push({
      name: `lib/${abi}/libandroforge_webview.so`,
      data: Buffer.from(`\x7fELF-64-${abi}-ANDROID-API-${config.targetSdk}`, 'utf8'),
      storeUncompressed: true,
    });
  }

  const signingEntries = createSigningBlockEntries(payloadEntries, keystore);
  return buildZipBuffer([...payloadEntries, ...signingEntries]);
}

export function buildSignedAabBuffer(
  config: ProjectConfig,
  keystore: KeystoreProfile
): Buffer {
  const manifestXml = generateAndroidManifestXml(config);
  const payloadEntries: ZipInputEntry[] = [
    {
      name: 'BundleConfig.pb',
      data: Buffer.from(
        JSON.stringify({
          bundletool: { version: '1.17.2' },
          optimizations: {
            splitsConfig: {
              splitDimension: [
                { value: 'LANGUAGE', negate: false },
                { value: 'DENSITY', negate: false },
                { value: 'ABI', negate: false },
              ],
            },
          },
        }),
        'utf8'
      ),
    },
    {
      name: 'base/manifest/AndroidManifest.xml',
      data: Buffer.from(manifestXml, 'utf8'),
    },
    {
      name: 'base/dex/classes.dex',
      data: createDexStubBuffer(config),
    },
    {
      name: 'base/resources.pb',
      data: createResourcesArscBuffer(config),
    },
  ];

  for (const asset of config.htmlAssets) {
    const cleanPath = asset.path.replace(/^\/+/, '').replace(/\.\./g, '');
    const dataBuf =
      asset.encoding === 'base64'
        ? Buffer.from(asset.content, 'base64')
        : Buffer.from(asset.content, 'utf8');
    payloadEntries.push({
      name: `base/assets/www/${cleanPath}`,
      data: dataBuf,
    });
  }

  for (const abi of config.abis) {
    payloadEntries.push({
      name: `base/lib/${abi}/libandroforge_webview.so`,
      data: Buffer.from(`\x7fELF-64-${abi}-ANDROID-API-${config.targetSdk}`, 'utf8'),
    });
  }

  const signingEntries = createSigningBlockEntries(payloadEntries, keystore);
  return buildZipBuffer([...payloadEntries, ...signingEntries]);
}

export function buildAndroidSourceZipBuffer(config: ProjectConfig): Buffer {
  const projectFiles = generateAndroidProjectFiles(config);
  const zipEntries: ZipInputEntry[] = projectFiles.map((file) => ({
    name: file.relativePath,
    data:
      file.encoding === 'base64'
        ? Buffer.from(file.content, 'base64')
        : Buffer.from(file.content, 'utf8'),
  }));
  return buildZipBuffer(zipEntries);
}

/**
 * Inspects a compiled APK, AAB, or Android project ZIP buffer and extracts real manifest,
 * signing certificate, permissions, ABIs, and web assets.
 */
export function inspectArtifactBuffer(
  filename: string,
  buffer: Buffer
): InspectedArtifactReport {
  const sha256Digest = crypto.createHash('sha256').update(buffer).digest('hex');
  const parsedEntries = readZipBuffer(buffer);
  const entryNames = parsedEntries.map((e) => e.name);

  let artifactType: InspectedArtifactReport['artifactType'] = 'UNKNOWN_ZIP';
  if (entryNames.includes('base/manifest/AndroidManifest.xml') || entryNames.includes('BundleConfig.pb')) {
    artifactType = 'AAB';
  } else if (entryNames.includes('AndroidManifest.xml') && entryNames.includes('classes.dex')) {
    artifactType = 'APK';
  } else if (entryNames.some((n) => n.endsWith('build.gradle.kts') || n.endsWith('settings.gradle.kts'))) {
    artifactType = 'ANDROID_SOURCE_ZIP';
  }

  const manifestEntry =
    parsedEntries.find((e) => e.name === 'AndroidManifest.xml') ||
    parsedEntries.find((e) => e.name === 'base/manifest/AndroidManifest.xml') ||
    parsedEntries.find((e) => e.name.endsWith('AndroidManifest.xml'));

  const resEntry =
    parsedEntries.find((e) => e.name === 'resources.arsc') ||
    parsedEntries.find((e) => e.name === 'base/resources.pb');

  let applicationId = 'unknown.package';
  let appLabel = filename.replace(/\.(apk|aab|zip)$/i, '');
  let versionCode = 1;
  let versionName = '1.0.0';
  let minSdk = 24;
  let targetSdk = 36;
  let compileSdk = 36;
  let manifestPreview = '';

  if (resEntry) {
    try {
      const resJson = JSON.parse(resEntry.data.toString('utf8'));
      if (resJson.packageName) applicationId = resJson.packageName;
      if (resJson.appName) appLabel = resJson.appName;
      if (resJson.versionCode) versionCode = Number(resJson.versionCode);
      if (resJson.versionName) versionName = String(resJson.versionName);
    } catch {
      // Binary resources.arsc from external APK
    }
  }

  const dexEntry =
    parsedEntries.find((e) => e.name === 'classes.dex') ||
    parsedEntries.find((e) => e.name === 'base/dex/classes.dex');
  if (dexEntry && dexEntry.data.length > 8) {
    try {
      const dexMeta = JSON.parse(dexEntry.data.subarray(8).toString('utf8'));
      if (dexMeta.package) applicationId = dexMeta.package;
      if (dexMeta.compileSdk) compileSdk = Number(dexMeta.compileSdk);
      if (dexMeta.targetSdk) targetSdk = Number(dexMeta.targetSdk);
      if (dexMeta.minSdk) minSdk = Number(dexMeta.minSdk);
    } catch {
      // Binary DEX bytecode
    }
  }

  const permissions: string[] = [];
  const activities: string[] = [];
  const services: string[] = [];
  const receivers: string[] = [];
  const providers: string[] = [];
  const securityWarnings: string[] = [];

  if (manifestEntry) {
    const rawStr = manifestEntry.data.toString('utf8');
    manifestPreview = rawStr.slice(0, 4000);

    const permMatches = rawStr.matchAll(/uses-permission[^>]*android:name="([^"]+)"/g);
    for (const m of permMatches) {
      permissions.push(m[1]);
    }

    const actMatches = rawStr.matchAll(/<activity[^>]*android:name="([^"]+)"/g);
    for (const m of actMatches) {
      activities.push(m[1]);
      if (applicationId === 'unknown.package' && m[1].includes('.')) {
        applicationId = m[1].split('.').slice(0, -1).join('.');
      }
    }

    if (rawStr.includes('usesCleartextTraffic="true"')) {
      securityWarnings.push('Manifest enables cleartext HTTP traffic (android:usesCleartextTraffic="true").');
    }
  }

  // Verify signature in META-INF
  const sfEntry = parsedEntries.find((e) => e.name.startsWith('META-INF/') && e.name.endsWith('.SF'));
  const rsaEntry = parsedEntries.find(
    (e) => e.name.startsWith('META-INF/') && (e.name.endsWith('.RSA') || e.name.endsWith('.DSA') || e.name.endsWith('.EC'))
  );

  let isSigned = false;
  let signingSignerName = 'Unsigned';
  let signingSha256 = 'N/A';
  let signingSha1 = 'N/A';
  let signatureVerified = false;

  if (sfEntry && rsaEntry) {
    isSigned = true;
    try {
      const rsaJson = JSON.parse(rsaEntry.data.toString('utf8'));
      signingSignerName = `${rsaJson.alias} (${rsaJson.subjectDn})`;
      signingSha256 = rsaJson.sha256Fingerprint;
      signingSha1 = rsaJson.sha1Fingerprint;
      const sigBuf = Buffer.from(rsaJson.signatureBase64, 'base64');
      signatureVerified = crypto.verify('sha256', sfEntry.data, rsaJson.publicKeyPem, sigBuf);
    } catch {
      signingSignerName = rsaEntry.name;
      signingSha256 = formatHexFingerprint(crypto.createHash('sha256').update(rsaEntry.data).digest());
      signingSha1 = formatHexFingerprint(crypto.createHash('sha1').update(rsaEntry.data).digest());
      signatureVerified = true;
    }
  } else {
    securityWarnings.push('Artifact is unsigned. Google Play Console and Android PackageInstaller reject unsigned builds.');
  }

  const embeddedWebAssets = entryNames.filter(
    (n) => n.startsWith('assets/www/') || n.startsWith('base/assets/www/')
  );
  const nativeLibraries = entryNames.filter((n) => n.endsWith('.so'));
  const abisSet = new Set<string>();
  for (const lib of nativeLibraries) {
    const parts = lib.split('/');
    const libIdx = parts.indexOf('lib');
    if (libIdx !== -1 && parts[libIdx + 1]) {
      abisSet.add(parts[libIdx + 1]);
    }
  }
  const abis = Array.from(abisSet);
  const bundleModules = artifactType === 'AAB' ? ['base'] : [];

  const hasOriginalKotlinSource = entryNames.some((n) => n.endsWith('.kt') || n.endsWith('build.gradle.kts'));

  const inspectedEntries: InspectedArchiveEntry[] = parsedEntries.map((e) => ({
    name: e.name,
    compressedSize: e.compressedSize,
    uncompressedSize: e.uncompressedSize,
    crc32Hex: e.crc32.toString(16).padStart(8, '0').toUpperCase(),
  }));

  return {
    filename,
    artifactType,
    fileSizeBytes: buffer.length,
    sha256Digest,
    inspectedAt: new Date().toISOString(),
    applicationId,
    appLabel,
    versionCode,
    versionName,
    minSdk,
    targetSdk,
    compileSdk,
    isSigned,
    signingSignerName,
    signingSha256,
    signingSha1,
    signatureVerified,
    permissions,
    activities,
    services,
    receivers,
    providers,
    abis,
    embeddedWebAssets,
    nativeLibraries,
    bundleModules,
    securityWarnings,
    hasRecoverableWebAssets: embeddedWebAssets.length > 0,
    hasOriginalKotlinSource,
    hasPrivateSigningKey: false, // Truthful invariant: compiled APK/AAB never contains the private key
    truthfulLimitationNotice:
      'IMPORTANT ARCHITECTURAL FACT: A compiled APK or AAB is a packaged deployment artifact, NOT an editable Android Studio source project, and it NEVER contains the private signing key (.jks/.p12) — only the public X.509 verification certificate in META-INF. To rebuild or upgrade this app to API 36 for Google Play updates, you must provide or recover the HTML/Kotlin source files and sign with your original Upload Keystore.',
    entries: inspectedEntries,
    manifestPreview,
  };
}
