package com.eduportal.twa

import android.app.DownloadManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings
import android.webkit.WebChromeClient
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts

private class ShareBridge(private val activity: AppCompatActivity) {
    @JavascriptInterface
    fun share(title: String?, text: String?, url: String?) {
        try {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                val pieces = listOfNotNull(title?.trim()?.takeIf { it.isNotEmpty() }, text?.trim()?.takeIf { it.isNotEmpty() }, url?.trim()?.takeIf { it.isNotEmpty() })
                putExtra(Intent.EXTRA_TEXT, pieces.joinToString("\n\n"))
            }
            activity.startActivity(Intent.createChooser(intent, "Share"))
        } catch (e: Exception) {
            Log.e("ShareBridge", "Share failed: ${e.message}")
        }
    }
}

class LauncherActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private var filePickerCallback: ValueCallback<Array<Uri>>? = null
    private lateinit var filePickerLauncher: ActivityResultLauncher<Array<String>>
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        try {
            // Hide system bars for full screen experience
            hideSystemBars()
            
            webView = WebView(this)
            setContentView(webView)

            filePickerLauncher = registerForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
                val cb = filePickerCallback
                filePickerCallback = null
                cb?.onReceiveValue(uris?.toTypedArray() ?: emptyArray())
            }
            
            // Configure WebView with error handling
            setupWebView()
            
            // Load your EduPortal URL
            webView.loadUrl("https://ietddugu.pythonanywhere.com")
            
        } catch (e: Exception) {
            Log.e("LauncherActivity", "Error in onCreate: ${e.message}")
            e.printStackTrace()
        }
    }
    
    private fun setupWebView() {
        try {
            webView.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                    if (url.isNullOrBlank()) {
                        return false
                    }
                    return handleExternalNavigation(url)
                }

                override fun shouldOverrideUrlLoading(view: WebView?, request: android.webkit.WebResourceRequest?): Boolean {
                    val url = request?.url?.toString()
                    if (url.isNullOrBlank()) {
                        return false
                    }
                    return handleExternalNavigation(url)
                }

                override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                    Log.e("WebView", "Error loading URL: $description")
                    super.onReceivedError(view, errorCode, description, failingUrl)
                }
                
                override fun onPageFinished(view: WebView?, url: String?) {
                    Log.d("WebView", "Page finished loading: $url")
                    injectSharePolyfill()
                    super.onPageFinished(view, url)
                }
            }

            webView.webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    try {
                        filePickerCallback?.onReceiveValue(null)
                        filePickerCallback = filePathCallback
                        val accept = fileChooserParams?.acceptTypes?.filter { !it.isNullOrBlank() }?.toTypedArray()
                        val mimeTypes = if (accept != null && accept.isNotEmpty()) accept else arrayOf("*/*")
                        filePickerLauncher.launch(mimeTypes)
                        return true
                    } catch (e: Exception) {
                        Log.e("WebView", "File chooser failed: ${e.message}")
                        filePickerCallback?.onReceiveValue(null)
                        filePickerCallback = null
                        return false
                    }
                }
            }
            
            val settings: WebSettings = webView.settings
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.javaScriptCanOpenWindowsAutomatically = true
            settings.setSupportMultipleWindows(true)
            settings.cacheMode = WebSettings.LOAD_DEFAULT

            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

            webView.addJavascriptInterface(ShareBridge(this), "AndroidShare")

            webView.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
                try {
                    if (url.isNullOrBlank()) {
                        return@DownloadListener
                    }
                    val request = DownloadManager.Request(Uri.parse(url))
                    request.setMimeType(mimeType)
                    request.addRequestHeader("User-Agent", userAgent)
                    val cookies = CookieManager.getInstance().getCookie(url)
                    if (!cookies.isNullOrBlank()) {
                        request.addRequestHeader("Cookie", cookies)
                    }
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, guessFileName(url, contentDisposition, mimeType))
                    val dm = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
                    dm.enqueue(request)
                } catch (e: Exception) {
                    Log.e("WebView", "Download failed: ${e.message}")
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    } catch (_: Exception) {
                    }
                }
            })
            
            // Enable debugging
            WebView.setWebContentsDebuggingEnabled(true)
            
        } catch (e: Exception) {
            Log.e("LauncherActivity", "Error setting up WebView: ${e.message}")
            e.printStackTrace()
        }
    }
    
    private fun hideSystemBars() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                window.insetsController?.let {
                    it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                    it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                }
            } else {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                )
            }
        } catch (e: Exception) {
            Log.e("LauncherActivity", "Error hiding system bars: ${e.message}")
        }
    }
    
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
    
    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.destroy()
        }
        super.onDestroy()
    }

    private fun handleExternalNavigation(url: String): Boolean {
        return try {
            val uri = Uri.parse(url)
            val scheme = (uri.scheme ?: "").lowercase()

            if (scheme == "http" || scheme == "https") {
                return false
            }

            if (scheme == "intent") {
                val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                val pm = packageManager
                val resolved = intent.resolveActivity(pm)
                if (resolved != null) {
                    startActivity(intent)
                    return true
                }
                val fallback = intent.getStringExtra("browser_fallback_url")
                if (!fallback.isNullOrBlank()) {
                    webView.loadUrl(fallback)
                    return true
                }
                return true
            }

            val intent = Intent(Intent.ACTION_VIEW, uri)
            if (intent.resolveActivity(packageManager) != null) {
                startActivity(intent)
            }
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun injectSharePolyfill() {
        val js = """
            (function() {
              try {
                if (navigator.share) return;
                navigator.share = function(data) {
                  data = data || {};
                  var title = data.title || '';
                  var text = data.text || '';
                  var url = data.url || window.location.href;
                  if (window.AndroidShare && window.AndroidShare.share) {
                    window.AndroidShare.share(String(title), String(text), String(url));
                    return Promise.resolve();
                  }
                  return Promise.reject('share_unavailable');
                };
              } catch (e) {}
            })();
        """.trimIndent()
        try {
            webView.evaluateJavascript(js, null)
        } catch (_: Exception) {
        }
    }

    private fun guessFileName(url: String, contentDisposition: String?, mimeType: String?): String {
        return try {
            android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType)
        } catch (_: Exception) {
            "download"
        }
    }
}
