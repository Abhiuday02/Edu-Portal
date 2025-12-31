package com.eduportal.twa

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.google.androidbrowserhelper.trusted.TwaLauncher

class LauncherActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Launch TWA directly
        val twaLauncher = TwaLauncher(this)
        twaLauncher.launch(
            getString(R.string.launch_url),
            null,
            null,
            null,
            null
        )
        
        finish()
    }
}
