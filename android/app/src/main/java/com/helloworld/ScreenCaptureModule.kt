package com.helloworld

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.res.Resources
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class ScreenCaptureModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    companion object {
        const val REQUEST_MEDIA_PROJECTION = 3456
    }

    private var pendingCapturePromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)

        // Wire frame listener to React Native EventEmitter
        ScreenCaptureService.frameListener = { base64Data, width, height ->
            try {
                val params = Arguments.createMap().apply {
                    putString("frame", base64Data)
                    putInt("width", width)
                    putInt("height", height)
                    putDouble("timestamp", System.currentTimeMillis().toDouble())
                }
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("onScreenFrame", params)
            } catch (e: Exception) {}
        }
    }

    override fun getName(): String = "ScreenCaptureModule"

    @ReactMethod
    fun requestAndStartCapture(promise: Promise) {
        val currentActivity = currentActivity
        if (currentActivity == null) {
            promise.reject("ACTIVITY_NULL", "Current Android activity is null")
            return
        }

        if (ScreenCaptureService.isCapturing) {
            promise.resolve(true)
            return
        }

        try {
            val projectionManager =
                reactContext.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            val intent = projectionManager.createScreenCaptureIntent()
            pendingCapturePromise = promise
            currentActivity.startActivityForResult(intent, REQUEST_MEDIA_PROJECTION)
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopCapture(promise: Promise) {
        try {
            val stopIntent = Intent(reactContext, ScreenCaptureService::class.java).apply {
                action = ScreenCaptureService.ACTION_STOP
            }
            reactContext.startService(stopIntent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isCapturing(promise: Promise) {
        promise.resolve(ScreenCaptureService.isCapturing)
    }

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        promise.resolve(RemoteAccessibilityService.isRunning())
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun openAppSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = android.net.Uri.fromParts("package", reactContext.packageName, null)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun dispatchTouch(relX: Double, relY: Double, promise: Promise) {
        try {
            val metrics = Resources.getSystem().displayMetrics
            val absX = (relX * metrics.widthPixels).toFloat()
            val absY = (relY * metrics.heightPixels).toFloat()

            val service = RemoteAccessibilityService.instance
            if (service != null) {
                val success = service.performTap(absX, absY)
                promise.resolve(success)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("TOUCH_ERROR", e.message)
        }
    }

    @ReactMethod
    fun dispatchSwipe(startRelX: Double, startRelY: Double, endRelX: Double, endRelY: Double, duration: Double, promise: Promise) {
        try {
            val metrics = Resources.getSystem().displayMetrics
            val startX = (startRelX * metrics.widthPixels).toFloat()
            val startY = (startRelY * metrics.heightPixels).toFloat()
            val endX = (endRelX * metrics.widthPixels).toFloat()
            val endY = (endRelY * metrics.heightPixels).toFloat()

            val service = RemoteAccessibilityService.instance
            if (service != null) {
                val success = service.performSwipe(startX, startY, endX, endY, duration.toLong())
                promise.resolve(success)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("SWIPE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun dispatchNav(action: String, promise: Promise) {
        try {
            val service = RemoteAccessibilityService.instance
            if (service != null) {
                val success = service.performNav(action)
                promise.resolve(success)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("NAV_ERROR", e.message)
        }
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == REQUEST_MEDIA_PROJECTION) {
            val promise = pendingCapturePromise
            pendingCapturePromise = null

            if (resultCode == Activity.RESULT_OK && data != null) {
                try {
                    val serviceIntent = Intent(reactContext, ScreenCaptureService::class.java).apply {
                        action = ScreenCaptureService.ACTION_START
                        putExtra(ScreenCaptureService.EXTRA_RESULT_CODE, resultCode)
                        putExtra(ScreenCaptureService.EXTRA_RESULT_DATA, data)
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        reactContext.startForegroundService(serviceIntent)
                    } else {
                        reactContext.startService(serviceIntent)
                    }

                    promise?.resolve(true)
                } catch (e: Exception) {
                    promise?.reject("START_SERVICE_ERROR", e.message)
                }
            } else {
                promise?.reject("USER_CANCELLED", "User denied screen capture permission")
            }
        }
    }

    override fun onNewIntent(intent: Intent?) {}
}
