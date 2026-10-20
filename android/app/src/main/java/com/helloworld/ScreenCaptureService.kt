package com.helloworld

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Base64
import java.io.ByteArrayOutputStream

class ScreenCaptureService : Service() {

    companion object {
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val EXTRA_RESULT_CODE = "EXTRA_RESULT_CODE"
        const val EXTRA_RESULT_DATA = "EXTRA_RESULT_DATA"
        const val CHANNEL_ID = "sm_screen_capture_channel"
        const val NOTIFICATION_ID = 2001

        var frameListener: ((base64Jpeg: String, width: Int, height: Int) -> Unit)? = null
        var isCapturing: Boolean = false
            private set
    }

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var backgroundHandler: Handler? = null
    private var lastFrameTime: Long = 0

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) return START_NOT_STICKY

        when (intent.action) {
            ACTION_START -> {
                val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0)
                val resultData = intent.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)
                if (resultCode != 0 && resultData != null) {
                    startScreenSharing(resultCode, resultData)
                }
            }
            ACTION_STOP -> {
                stopScreenSharing()
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun startScreenSharing(resultCode: Int, resultData: Intent) {
        val notification = buildForegroundNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        try {
            val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjection = projectionManager.getMediaProjection(resultCode, resultData)

            val metrics = Resources.getSystem().displayMetrics
            // Downscale to 540x960 for high-performance low-latency streaming
            val targetWidth = 540
            val targetHeight = (540f * metrics.heightPixels / metrics.widthPixels).toInt()
            val density = metrics.densityDpi

            imageReader = ImageReader.newInstance(targetWidth, targetHeight, PixelFormat.RGBA_8888, 2)
            virtualDisplay = mediaProjection?.createVirtualDisplay(
                "SMControllerCapture",
                targetWidth,
                targetHeight,
                density,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                imageReader?.surface,
                null,
                null
            )

            backgroundHandler = Handler(Looper.getMainLooper())
            imageReader?.setOnImageAvailableListener({ reader ->
                processImageFrame(reader, targetWidth, targetHeight)
            }, backgroundHandler)

            isCapturing = true
        } catch (e: Exception) {
            stopScreenSharing()
        }
    }

    private fun processImageFrame(reader: ImageReader, width: Int, height: Int) {
        var image: Image? = null
        try {
            image = reader.acquireLatestImage()
            if (image == null) return

            // Throttle to ~12 FPS (approx every 80ms) to ensure smooth 60 FPS rendering on viewer with zero network congestion
            val now = System.currentTimeMillis()
            if (now - lastFrameTime < 80) {
                return
            }
            lastFrameTime = now

            val planes = image.planes
            val buffer = planes[0].buffer
            val pixelStride = planes[0].pixelStride
            val rowStride = planes[0].rowStride
            val rowPadding = rowStride - pixelStride * width

            val bitmap = Bitmap.createBitmap(
                width + rowPadding / pixelStride,
                height,
                Bitmap.Config.ARGB_8888
            )
            bitmap.copyPixelsFromBuffer(buffer)

            val croppedBitmap = if (rowPadding > 0) {
                Bitmap.createBitmap(bitmap, 0, 0, width, height)
            } else {
                bitmap
            }

            val outStream = ByteArrayOutputStream()
            croppedBitmap.compress(Bitmap.CompressFormat.JPEG, 60, outStream)
            val jpegBytes = outStream.toByteArray()
            val base64String = Base64.encodeToString(jpegBytes, Base64.NO_WRAP)

            frameListener?.invoke(base64String, width, height)

            if (croppedBitmap != bitmap) {
                croppedBitmap.recycle()
            }
            bitmap.recycle()
        } catch (e: Exception) {
            // Frame processing error ignored
        } finally {
            image?.close()
        }
    }

    private fun stopScreenSharing() {
        isCapturing = false
        try {
            virtualDisplay?.release()
            virtualDisplay = null
            imageReader?.close()
            imageReader = null
            mediaProjection?.stop()
            mediaProjection = null
        } catch (e: Exception) {}
        stopForeground(true)
    }

    override fun onDestroy() {
        stopScreenSharing()
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SM Controller Screen Sharing",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Notifies when live screen capture is active"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }

        return builder
            .setContentTitle("SM Controller — Screen Sharing Active")
            .setContentText("Broadcasting live screen to remote partner device")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .build()
    }
}
