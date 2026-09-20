package com.anhnt.qrscan

import android.content.ClipData
import android.content.ClipboardManager
import android.net.Uri
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class NativeImageClipboardModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName(): String = "NativeImageClipboard"

  @ReactMethod
  fun copyImage(path: String, promise: Promise) {
    try {
      val normalized = path.removePrefix("file://")
      val file = File(normalized)
      if (!file.exists()) {
        promise.reject("IMAGE_CLIPBOARD_FAILED", "The image could not be loaded")
        return
      }
      val authority = "${context.packageName}.fileprovider"
      val uri: Uri = FileProvider.getUriForFile(context, authority, file)
      val clipboard = context.getSystemService(ClipboardManager::class.java)
      clipboard.setPrimaryClip(ClipData.newUri(context.contentResolver, "QR Scan image", uri))
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("IMAGE_CLIPBOARD_FAILED", error.message, error)
    }
  }
}
