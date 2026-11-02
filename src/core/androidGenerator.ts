import { ProjectConfig } from '../types/androforge';

export interface GeneratedAndroidFile {
  relativePath: string;
  content: string;
  encoding: 'utf8' | 'base64';
}

export function sanitizePackageName(pkg: string): string {
  const parts = pkg
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '')
    .split('.')
    .filter(Boolean)
    .map((segment) => {
      if (/^[0-9]/.test(segment)) return `app_${segment}`;
      if (['in', 'is', 'as', 'object', 'class', 'val', 'var', 'fun', 'package', 'import'].includes(segment)) {
        return `${segment}app`;
      }
      return segment;
    });

  while (parts.length < 2) {
    parts.push('app');
  }
  return parts.join('.');
}

export function computeRequiredPermissions(config: ProjectConfig): string[] {
  const perms = new Set<string>();
  // Internet is required for online web apps, AdMob, or Firebase, or if external URLs are enabled
  if (
    config.sourceType === 'web_url' ||
    config.extras.allowExternalUrls ||
    config.admob.enabled ||
    config.firebase.enabled
  ) {
    perms.add('android.permission.INTERNET');
    perms.add('android.permission.ACCESS_NETWORK_STATE');
  } else {
    // Even local apps often inspect network connectivity state cleanly
    perms.add('android.permission.ACCESS_NETWORK_STATE');
  }

  if (config.extras.enableGpsPrompt) {
    perms.add('android.permission.ACCESS_FINE_LOCATION');
    perms.add('android.permission.ACCESS_COARSE_LOCATION');
  }
  if (config.extras.cameraPermission) {
    perms.add('android.permission.CAMERA');
  }
  if (config.extras.microphonePermission) {
    perms.add('android.permission.RECORD_AUDIO');
    perms.add('android.permission.MODIFY_AUDIO_SETTINGS');
  }
  if (config.firebase.enabled && config.firebase.fcmEnabled) {
    perms.add('android.permission.POST_NOTIFICATIONS');
  }
  if (config.admob.enabled) {
    perms.add('com.google.android.gms.permission.AD_ID');
  }
  return Array.from(perms);
}

export function generateAndroidManifestXml(config: ProjectConfig): string {
  const pkg = sanitizePackageName(config.applicationId);
  const perms = computeRequiredPermissions(config);
  const cleartextAllowed = config.urlProtocol === 'http://' || !config.extras.httpsOnlyContent;
  const orientationAttr =
    config.orientation === 'portrait'
      ? 'android:screenOrientation="portrait"'
      : config.orientation === 'landscape'
      ? 'android:screenOrientation="landscape"'
      : 'android:screenOrientation="unspecified"';

  const permissionLines = perms
    .map((p) => `    <uses-permission android:name="${p}" />`)
    .join('\n');

  const deepLinkFilter = config.extras.deepLinking
    ? `
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="${config.extras.deepLinkScheme || 'https'}"
                    android:host="${config.extras.deepLinkHost || `${pkg}.app`}" />
            </intent-filter>`
    : '';

  const admobMeta = config.admob.enabled
    ? `
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="${
              config.admob.testMode
                ? 'ca-app-pub-3940256099942544~3347511713'
                : config.admob.appId || 'ca-app-pub-3940256099942544~3347511713'
            }" />`
    : '';

  const firebaseMeta =
    config.firebase.enabled && config.firebase.fcmEnabled
      ? `
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="${config.firebase.defaultNotificationChannel || 'androforge_high_importance'}" />`
      : '';

  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

${permissionLines}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:usesCleartextTraffic="${cleartextAllowed ? 'true' : 'false'}"
        android:enableOnBackInvokedCallback="true"
        android:theme="@style/Theme.AndroForgeApp">${admobMeta}${firebaseMeta}

        <activity
            android:name="${pkg}.MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden|uiMode"
            ${orientationAttr}>
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>${deepLinkFilter}
        </activity>
    </application>
</manifest>
`;
}

export function generateAppBuildGradleKts(config: ProjectConfig): string {
  const pkg = sanitizePackageName(config.applicationId);
  const namespace = sanitizePackageName(config.namespace || config.applicationId);
  const abisList = config.abis.map((a) => `"${a}"`).join(', ');

  const admobDeps = config.admob.enabled
    ? `
    // Google Mobile Ads SDK & User Messaging Platform (Consent)
    implementation("com.google.android.gms:play-services-ads:23.6.0")
    implementation("com.google.android.ump:user-messaging-platform:3.1.0")`
    : '';

  const firebaseDeps = config.firebase.enabled
    ? `
    // Firebase BoM & Selected Integrations
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    ${config.firebase.analyticsEnabled ? 'implementation("com.google.firebase:firebase-analytics-ktx")' : ''}
    ${config.firebase.fcmEnabled ? 'implementation("com.google.firebase:firebase-messaging-ktx")' : ''}
    ${config.firebase.inAppMessagingEnabled ? 'implementation("com.google.firebase:firebase-inappmessaging-display-ktx")' : ''}
    ${config.firebase.crashlyticsEnabled ? 'implementation("com.google.firebase:firebase-crashlytics-ktx")' : ''}
    ${config.firebase.remoteConfigEnabled ? 'implementation("com.google.firebase:firebase-config-ktx")' : ''}`
    : '';

  const firebasePlugins = config.firebase.enabled
    ? `
    id("com.google.gms.google-services")
    ${config.firebase.crashlyticsEnabled ? 'id("com.google.firebase.crashlytics")' : ''}`
    : '';

  return `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")${firebasePlugins}
}

android {
    namespace = "${namespace}"
    compileSdk = ${config.compileSdk}

    defaultConfig {
        applicationId = "${pkg}"
        minSdk = ${config.minSdk}
        targetSdk = ${config.targetSdk}
        versionCode = ${config.versionCode}
        versionName = "${config.versionName}"

        ndk {
            abiFilters += listOf(${abisList})
        }

        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("ANDROFORGE_KEYSTORE_PATH") ?: "keystore/release.p12")
            storePassword = System.getenv("ANDROFORGE_KEYSTORE_PASS") ?: ""
            keyAlias = System.getenv("ANDROFORGE_KEY_ALIAS") ?: "upload"
            keyPassword = System.getenv("ANDROFORGE_KEY_PASS") ?: ""
            enableV1Signing = true
            enableV2Signing = true
            enableV3Signing = true
        }
    }

    buildTypes {
        debug {
            isDebuggable = true
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }

    bundle {
        language { enableSplit = true }
        density { enableSplit = true }
        abi { enableSplit = true }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.2.0")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
    implementation("androidx.core:core-splashscreen:1.0.1")${admobDeps}${firebaseDeps}
}
`;
}

export function generateMainActivityKt(config: ProjectConfig): string {
  const pkg = sanitizePackageName(config.applicationId);
  const startUrl =
    config.sourceType === 'local_html'
      ? `https://appassets.androidplatform.net/assets/www/${config.localHtmlEntry || 'index.html'}`
      : `${config.urlProtocol}${config.webUrl.replace(/^https?:\/\//, '')}`;

  const allowedOriginsList = [
    '"https://appassets.androidplatform.net"',
    ...config.extras.allowedDomains.map((d) => `"${d.trim()}"`),
  ].join(', ');

  const cacheModeConst =
    config.cacheMode === 'no_cache'
      ? 'WebSettings.LOAD_NO_CACHE'
      : config.cacheMode === 'highly_cached'
      ? 'WebSettings.LOAD_CACHE_ELSE_NETWORK'
      : 'WebSettings.LOAD_DEFAULT';

  return `package ${pkg}

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat

/**
 * Generated by AndroForge Studio — API ${config.targetSdk} Target
 * Uses AndroidX WebViewAssetLoader for secure local HTML asset hosting without file:// vulnerabilities.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private val allowedHostDomains = setOf(${allowedOriginsList})

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
        fileUploadCallback?.onReceiveValue(uris)
        fileUploadCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        if (${config.extras.disallowScreenshot}) {
            window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        }
        if (${config.extras.keepScreenAwake}) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }

        swipeRefresh = SwipeRefreshLayout(this).apply {
            isEnabled = ${config.extras.pullToRefresh}
        }
        webView = WebView(this)
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            visibility = View.GONE
        }

        swipeRefresh.addView(webView)
        setContentView(swipeRefresh)

        ViewCompat.setOnApplyWindowInsetsListener(swipeRefresh) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/res/", WebViewAssetLoader.ResourcesPathHandler(this))
            .build()

        configureWebViewSettings(webView.settings)

        if (${config.extras.javascriptApis}) {
            webView.addJavascriptInterface(AndroForgeBridge(), "AndroForgeNative")
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url
                val host = url.host ?: ""
                if (host == "appassets.androidplatform.net" || allowedHostDomains.any { host.endsWith(it) }) {
                    return false
                }
                if (${config.extras.allowExternalUrls}) {
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                    return true
                }
                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false
                progressBar.visibility = View.GONE
                if (${config.extras.liveToolbarTitle}) {
                    supportActionBar?.title = view?.title ?: "${config.appTitle.replace(/"/g, '\\"')}"
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                if (request.isForMainFrame) {
                    view?.loadUrl("https://appassets.androidplatform.net/assets/www/offline_error.html")
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
            }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, ${config.extras.enableGpsPrompt}, false)
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.let {
                    val granted = mutableListOf<String>()
                    if (${config.extras.cameraPermission} && it.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                        granted.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE)
                    }
                    if (${config.extras.microphonePermission} && it.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                        granted.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                    }
                    if (granted.isNotEmpty()) {
                        it.grant(granted.toTypedArray())
                    } else {
                        it.deny()
                    }
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                if (!${config.extras.fileUploadEnabled}) return false
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback
                val intent = fileChooserParams?.createIntent() ?: return false
                fileChooserLauncher.launch(intent)
                return true
            }
        }

        if (${config.extras.downloadsEnabled}) {
            webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
                val request = DownloadManager.Request(Uri.parse(url)).apply {
                    setMimeType(mimeType)
                    addRequestHeader("cookie", CookieManager.getInstance().getCookie(url))
                    addRequestHeader("User-Agent", userAgent)
                    setDescription("Downloading file...")
                    setTitle(URLUtil.guessFileName(url, contentDisposition, mimeType))
                    setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    setDestinationInExternalPublicDir(
                        Environment.DIRECTORY_DOWNLOADS,
                        URLUtil.guessFileName(url, contentDisposition, mimeType)
                    )
                }
                val dm = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(request)
                Toast.makeText(applicationContext, "Downloading file...", Toast.LENGTH_SHORT).show()
            }
        }

        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else if (${config.extras.confirmOnExit}) {
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle("${config.appTitle.replace(/"/g, '\\"')}")
                        .setMessage("${config.appExitText.replace(/"/g, '\\"')}")
                        .setPositiveButton("Exit") { _, _ -> finish() }
                        .setNegativeButton("Cancel", null)
                        .show()
                } else {
                    finish()
                }
            }
        })

        if (savedInstanceState == null) {
            webView.loadUrl("${startUrl}")
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebViewSettings(settings: WebSettings) {
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = ${config.extras.domStorage}
        settings.databaseEnabled = ${config.extras.domStorage}
        settings.allowFileAccess = false // Hardened security: use WebViewAssetLoader instead
        settings.allowContentAccess = false
        settings.setSupportZoom(${config.extras.supportZoom})
        settings.builtInZoomControls = ${config.extras.supportZoom}
        settings.displayZoomControls = ${config.extras.zoomButtons}
        settings.mediaPlaybackRequiresUserGesture = ${config.extras.mediaPlaybackRequiresUserGesture}
        settings.javaScriptCanOpenWindowsAutomatically = !${config.extras.popupBlocker}
        settings.cacheMode = ${cacheModeConst}

        if (${config.extras.desktopMode}) {
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
        }

        val customUa = "${(config.extras.customUserAgent || '').replace(/"/g, '\\"')}"
        if (customUa.isNotBlank()) {
            settings.userAgentString = customUa
        } else if (${config.extras.hideWebViewUa}) {
            settings.userAgentString = settings.userAgentString.replace("; wv", "")
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    inner class AndroForgeBridge {
        @JavascriptInterface
        fun shareApp() {
            runOnUiThread {
                val currentUrl = webView.url ?: ""
                if (!currentUrl.startsWith("https://appassets.androidplatform.net") &&
                    allowedHostDomains.none { currentUrl.contains(it) }
                ) {
                    return@runOnUiThread
                }
                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, "${config.appShareText.replace(/"/g, '\\"')}")
                }
                startActivity(Intent.createChooser(shareIntent, "Share ${config.appTitle.replace(/"/g, '\\"')}"))
            }
        }

        @JavascriptInterface
        fun showAboutDialog() {
            runOnUiThread {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("About ${config.appTitle.replace(/"/g, '\\"')}")
                    .setMessage("${config.aboutDialogText.replace(/"/g, '\\"')}")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }
}
`;
}

export function generateAndroidProjectFiles(config: ProjectConfig): GeneratedAndroidFile[] {
  const pkg = sanitizePackageName(config.applicationId);
  const pkgPath = pkg.replace(/\./g, '/');

  const files: GeneratedAndroidFile[] = [
    {
      relativePath: 'settings.gradle.kts',
      encoding: 'utf8',
      content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${config.appTitle.replace(/[^a-zA-Z0-9_-]/g, '_') || 'AndroForgeApp'}"
include(":app")
`,
    },
    {
      relativePath: 'build.gradle.kts',
      encoding: 'utf8',
      content: `plugins {
    id("com.android.application") version "${config.agpVersion || '8.8.0'}" apply false
    id("org.jetbrains.kotlin.android") version "${config.kotlinVersion || '2.1.0'}" apply false
    ${config.firebase.enabled ? 'id("com.google.gms.google-services") version "4.4.2" apply false' : ''}
    ${config.firebase.enabled && config.firebase.crashlyticsEnabled ? 'id("com.google.firebase.crashlytics") version "3.0.2" apply false' : ''}
}
`,
    },
    {
      relativePath: 'gradle.properties',
      encoding: 'utf8',
      content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`,
    },
    {
      relativePath: 'gradle/wrapper/gradle-wrapper.properties',
      encoding: 'utf8',
      content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-${config.gradleVersion || '8.11.1'}-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`,
    },
    {
      relativePath: 'app/build.gradle.kts',
      encoding: 'utf8',
      content: generateAppBuildGradleKts(config),
    },
    {
      relativePath: 'app/proguard-rules.pro',
      encoding: 'utf8',
      content: `# AndroForge Studio ProGuard Rules
-keepattributes *Annotation*,JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-dontwarn android.webkit.**
`,
    },
    {
      relativePath: 'app/src/main/AndroidManifest.xml',
      encoding: 'utf8',
      content: generateAndroidManifestXml(config),
    },
    {
      relativePath: `app/src/main/java/${pkgPath}/MainActivity.kt`,
      encoding: 'utf8',
      content: generateMainActivityKt(config),
    },
    {
      relativePath: 'app/src/main/res/values/strings.xml',
      encoding: 'utf8',
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${config.appTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</string>
    <string name="about_text">${config.aboutDialogText.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</string>
    <string name="share_text">${config.appShareText.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</string>
    <string name="exit_text">${config.appExitText.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</string>
</resources>
`,
    },
    {
      relativePath: 'app/src/main/res/values/colors.xml',
      encoding: 'utf8',
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">${config.primaryColor}</color>
    <color name="colorSecondary">${config.secondaryColor}</color>
    <color name="colorTertiary">${config.tertiaryColor}</color>
    <color name="statusBarColor">${config.statusBarColor}</color>
    <color name="navigationBarColor">${config.navigationBarColor}</color>
    <color name="splashBackground">${config.splash.backgroundColor}</color>
    <color name="ic_launcher_background">${config.iconBackgroundHex}</color>
</resources>
`,
    },
    {
      relativePath: 'app/src/main/res/values/themes.xml',
      encoding: 'utf8',
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.AndroForgeApp" parent="Theme.Material3.DayNight.NoActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorSecondary">@color/colorSecondary</item>
        <item name="colorTertiary">@color/colorTertiary</item>
        <item name="android:statusBarColor">@color/statusBarColor</item>
        <item name="android:navigationBarColor">@color/navigationBarColor</item>
    </style>
</resources>
`,
    },
    {
      relativePath: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
      encoding: 'utf8',
      content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`,
    },
    {
      relativePath: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
      encoding: 'utf8',
      content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M54,24L80,39V69L54,84L28,69V39L54,24ZM54,34L36,44.5V63.5L54,74L72,63.5V44.5L54,34Z"/>
</vector>
`,
    },
    {
      relativePath: 'app/src/main/assets/www/offline_error.html',
      encoding: 'utf8',
      content:
        config.customErrorPageMode === 'custom' && config.customErrorHtml.trim()
          ? config.customErrorHtml
          : `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Offline — ${config.appTitle}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
    .card { max-width: 420px; border: 1px solid #1e293b; background: #1e293b40; border-radius: 12px; padding: 28px; }
    button { background: ${config.primaryColor}; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; margin-top: 16px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Connection Unavailable</h2>
    <p>${config.appTitle} could not reach the network. Please check your connection and try again.</p>
    <button onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>`,
    },
  ];

  if (config.firebase.enabled && config.firebase.googleServicesRaw) {
    files.push({
      relativePath: 'app/google-services.json',
      encoding: 'utf8',
      content: config.firebase.googleServicesRaw,
    });
  }

  for (const asset of config.htmlAssets) {
    const cleanPath = asset.path.replace(/^\/+/, '').replace(/\.\./g, '');
    files.push({
      relativePath: `app/src/main/assets/www/${cleanPath}`,
      encoding: asset.encoding,
      content: asset.content,
    });
  }

  return files;
}
