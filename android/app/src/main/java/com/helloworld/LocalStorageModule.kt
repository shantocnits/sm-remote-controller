package com.helloworld

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LocalStorageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val prefs: SharedPreferences = reactContext.getSharedPreferences("sm_controller_prefs", Context.MODE_PRIVATE)

    override fun getName(): String = "LocalStorageModule"

    @ReactMethod
    fun setItem(key: String, value: String, promise: Promise) {
        try {
            prefs.edit().putString(key, value).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STORAGE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getItem(key: String, promise: Promise) {
        try {
            val value = prefs.getString(key, null)
            promise.resolve(value)
        } catch (e: Exception) {
            promise.reject("STORAGE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun removeItem(key: String, promise: Promise) {
        try {
            prefs.edit().remove(key).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STORAGE_ERROR", e.message)
        }
    }
}
