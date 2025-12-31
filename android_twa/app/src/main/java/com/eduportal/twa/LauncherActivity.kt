package com.eduportal.twa

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings
import android.webkit.WebChromeClient
import android.util.Log
import androidx.appcompat.app.AppCompatActivity

class LauncherActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        try {
            // Hide system bars for full screen experience
            hideSystemBars()
            
            webView = WebView(this)
            setContentView(webView)
            
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
                override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                    Log.e("WebView", "Error loading URL: $description")
                    super.onReceivedError(view, errorCode, description, failingUrl)
                }
                
                override fun onPageFinished(view: WebView?, url: String?) {
                    Log.d("WebView", "Page finished loading: $url")
                    super.onPageFinished(view, url)
                }
            }
            
            webView.webChromeClient = WebChromeClient()
            
            val settings: WebSettings = webView.settings
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            
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
}
