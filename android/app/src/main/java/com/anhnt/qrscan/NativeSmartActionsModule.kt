package com.anhnt.qrscan

import android.content.Intent
import android.provider.CalendarContract
import android.provider.ContactsContract
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** Focused native handoff for actions that need platform intents. */
class NativeSmartActionsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName(): String = "NativeSmartActions"

  @ReactMethod
  fun openWifiSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_WIFI_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("WIFI_SETTINGS_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun addContact(name: String, phone: String?, email: String?, organization: String?, promise: Promise) {
    try {
      val intent = Intent(ContactsContract.Intents.Insert.ACTION).apply {
        type = ContactsContract.RawContacts.CONTENT_TYPE
        putExtra(ContactsContract.Intents.Insert.NAME, name)
        if (!phone.isNullOrBlank()) putExtra(ContactsContract.Intents.Insert.PHONE, phone)
        if (!email.isNullOrBlank()) putExtra(ContactsContract.Intents.Insert.EMAIL, email)
        if (!organization.isNullOrBlank()) putExtra(ContactsContract.Intents.Insert.COMPANY, organization)
      }
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("CONTACT_HANDOFF_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun addCalendarEvent(title: String, startDate: String?, endDate: String?, location: String?, description: String?, promise: Promise) {
    try {
      val intent = Intent(Intent.ACTION_INSERT).apply {
        data = CalendarContract.Events.CONTENT_URI
        putExtra(CalendarContract.Events.TITLE, title)
        if (!startDate.isNullOrBlank()) putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, parseCalendarDate(startDate))
        if (!endDate.isNullOrBlank()) putExtra(CalendarContract.EXTRA_EVENT_END_TIME, parseCalendarDate(endDate))
        if (!location.isNullOrBlank()) putExtra(CalendarContract.Events.EVENT_LOCATION, location)
        if (!description.isNullOrBlank()) putExtra(CalendarContract.Events.DESCRIPTION, description)
      }
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("CALENDAR_HANDOFF_FAILED", error.message, error)
    }
  }

  private fun parseCalendarDate(value: String): Long {
    val normalized = value.trim().removeSuffix("Z")
    if (normalized.matches(Regex("\\d{8}T\\d{6}"))) {
      val year = normalized.substring(0, 4).toInt()
      val month = normalized.substring(4, 6).toInt()
      val day = normalized.substring(6, 8).toInt()
      val hour = normalized.substring(9, 11).toInt()
      val minute = normalized.substring(11, 13).toInt()
      val second = normalized.substring(13, 15).toInt()
      return java.util.Calendar.getInstance().apply {
        set(year, month - 1, day, hour, minute, second)
        set(java.util.Calendar.MILLISECOND, 0)
      }.timeInMillis
    }
    if (normalized.matches(Regex("\\d{8}"))) {
      val year = normalized.substring(0, 4).toInt()
      val month = normalized.substring(4, 6).toInt()
      val day = normalized.substring(6, 8).toInt()
      return java.util.Calendar.getInstance().apply {
        set(year, month - 1, day, 0, 0, 0)
        set(java.util.Calendar.MILLISECOND, 0)
      }.timeInMillis
    }
    return java.time.Instant.parse(value).toEpochMilli()
  }
}

class NativeSmartActionsPackage : com.facebook.react.ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) = listOf(NativeSmartActionsModule(reactContext))
  override fun createViewManagers(reactContext: ReactApplicationContext) = emptyList<com.facebook.react.uimanager.ViewManager<*, *>>()
}
