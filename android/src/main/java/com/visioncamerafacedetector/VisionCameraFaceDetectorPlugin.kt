package com.visioncamerafacedetector

import android.graphics.Rect
import android.util.Log
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceContour
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark
import com.mrousavy.camera.core.FrameInvalidError
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

private const val TAG = "FaceDetector"
class VisionCameraFaceDetectorPlugin(
  proxy: VisionCameraProxy,
  options: Map<String, Any>?
) : FrameProcessorPlugin() {
  // detection props
  private var autoScale = false
  private var faceDetector: FaceDetector? = null
  private var runLandmarks = false
  private var runClassifications = false
  private var runContours = false
  private var trackingEnabled = false
  private var windowWidth = 1.0
  private var windowHeight = 1.0
  private var outputOrientation: String = "portrait"

  init {
    // handle auto scaling
    autoScale = options?.get("autoScale").toString() == "true"

    // initializes faceDetector on creation
    var performanceModeValue = FaceDetectorOptions.PERFORMANCE_MODE_FAST
    var landmarkModeValue = FaceDetectorOptions.LANDMARK_MODE_NONE
    var classificationModeValue = FaceDetectorOptions.CLASSIFICATION_MODE_NONE
    var contourModeValue = FaceDetectorOptions.CONTOUR_MODE_NONE

    windowWidth = (options?.get("windowWidth") ?: 1.0) as Double
    windowHeight = (options?.get("windowHeight") ?: 1.0) as Double

    if (options?.get("performanceMode").toString() == "accurate") {
      performanceModeValue = FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE
    }

    if (options?.get("landmarkMode").toString() == "all") {
      runLandmarks = true
      landmarkModeValue = FaceDetectorOptions.LANDMARK_MODE_ALL
    }

    if (options?.get("classificationMode").toString() == "all") {
      runClassifications = true
      classificationModeValue = FaceDetectorOptions.CLASSIFICATION_MODE_ALL
    }

    if (options?.get("contourMode").toString() == "all") {
      runContours = true
      contourModeValue = FaceDetectorOptions.CONTOUR_MODE_ALL
    }

    if (options?.get("outputOrientation") != null) {
      outputOrientation = options["outputOrientation"] as String
    }

    val minFaceSize: Double = (options?.get("minFaceSize") ?: 0.15) as Double
    val optionsBuilder = FaceDetectorOptions.Builder()
      .setPerformanceMode(performanceModeValue)
      .setLandmarkMode(landmarkModeValue)
      .setContourMode(contourModeValue)
      .setClassificationMode(classificationModeValue)
      .setMinFaceSize(minFaceSize.toFloat())

    if (options?.get("trackingEnabled").toString() == "true") {
      trackingEnabled = true
      optionsBuilder.enableTracking()
    }

    faceDetector = FaceDetection.getClient(
      optionsBuilder.build()
    )
  }

  private fun processBoundingBox(
    boundingBox: Rect,
    sourceWidth: Double,
    sourceHeight: Double,
    orientation: Int,
    scale: Double
  ): Map<String, Any> {
    val bounds: MutableMap<String, Any> = HashMap()
   
    // Log raw input
    println("Raw bounds - left: ${boundingBox.left}, top: ${boundingBox.top}, width: ${boundingBox.width()}, height: ${boundingBox.height()}")
    println("Raw scale - scaleX: $scaleX, scaleY: $scaleY")

    // Scale dimensions first
    val width = boundingBox.width().toDouble() * scale
    val height = boundingBox.height().toDouble() * scale
    val x = boundingBox.left.toDouble() * scale
    val y = boundingBox.top.toDouble() * scale

    println("After scaling - x: $x, y: $y, width: $width, height: $height")
    println("sourceWidth: $sourceWidth, sourceHeight: $sourceHeight")
    println("orientation: $orientation")


    when(orientation) {
        0 -> {  // PORTRAIT
            bounds["x"] = sourceWidth - (x + width)
            bounds["y"] = y
        }
        90 -> {  // LANDSCAPE_RIGHT
            bounds["x"] = sourceWidth - (x + width)
            bounds["y"] = sourceHeight - (y + height)
        }
        180 -> {  // PORTRAIT_UPSIDE_DOWN
            bounds["x"] = sourceWidth - (x + width)
            bounds["y"] = sourceHeight - (y + height)
        }
        270 -> {  // LANDSCAPE_LEFT
            bounds["x"] = sourceWidth - (x + width)
            bounds["y"] = y
        }
    }

    bounds["width"] = width
    bounds["height"] = height
    
    println("Final bounds - x: ${bounds["x"]}, y: ${bounds["y"]}, width: ${bounds["width"]}, height: ${bounds["height"]}")
    return bounds
  }


  private fun processLandmarks(
    face: Face,
    scaleX: Double,
    scaleY: Double
  ): Map<String, Any> {
    val faceLandmarksTypes = intArrayOf(
      FaceLandmark.LEFT_CHEEK,
      FaceLandmark.LEFT_EAR,
      FaceLandmark.LEFT_EYE,
      FaceLandmark.MOUTH_BOTTOM,
      FaceLandmark.MOUTH_LEFT,
      FaceLandmark.MOUTH_RIGHT,
      FaceLandmark.NOSE_BASE,
      FaceLandmark.RIGHT_CHEEK,
      FaceLandmark.RIGHT_EAR,
      FaceLandmark.RIGHT_EYE
    )
    val faceLandmarksTypesStrings = arrayOf(
      "LEFT_CHEEK",
      "LEFT_EAR",
      "LEFT_EYE",
      "MOUTH_BOTTOM",
      "MOUTH_LEFT",
      "MOUTH_RIGHT",
      "NOSE_BASE",
      "RIGHT_CHEEK",
      "RIGHT_EAR",
      "RIGHT_EYE"
    )
    val faceLandmarksTypesMap: MutableMap<String, Any> = HashMap()
    for (i in faceLandmarksTypesStrings.indices) {
      val landmark = face.getLandmark(faceLandmarksTypes[i])
      val landmarkName = faceLandmarksTypesStrings[i]
      Log.d(
        TAG,
        "Getting '$landmarkName' landmark"
      )
      if (landmark == null) {
        Log.d(
          TAG,
          "Landmark '$landmarkName' is null - going next"
        )
        continue
      }
      val point = landmark.position
      val currentPointsMap: MutableMap<String, Double> = HashMap()
      currentPointsMap["x"] = point.x.toDouble() * scaleX
      currentPointsMap["y"] = point.y.toDouble() * scaleY
      faceLandmarksTypesMap[landmarkName] = currentPointsMap
    }

    return faceLandmarksTypesMap
  }

  private fun processFaceContours(
    face: Face,
    scaleX: Double,
    scaleY: Double
  ): Map<String, Any> {
    val faceContoursTypes = intArrayOf(
      FaceContour.FACE,
      FaceContour.LEFT_CHEEK,
      FaceContour.LEFT_EYE,
      FaceContour.LEFT_EYEBROW_BOTTOM,
      FaceContour.LEFT_EYEBROW_TOP,
      FaceContour.LOWER_LIP_BOTTOM,
      FaceContour.LOWER_LIP_TOP,
      FaceContour.NOSE_BOTTOM,
      FaceContour.NOSE_BRIDGE,
      FaceContour.RIGHT_CHEEK,
      FaceContour.RIGHT_EYE,
      FaceContour.RIGHT_EYEBROW_BOTTOM,
      FaceContour.RIGHT_EYEBROW_TOP,
      FaceContour.UPPER_LIP_BOTTOM,
      FaceContour.UPPER_LIP_TOP
    )
    val faceContoursTypesStrings = arrayOf(
      "FACE",
      "LEFT_CHEEK",
      "LEFT_EYE",
      "LEFT_EYEBROW_BOTTOM",
      "LEFT_EYEBROW_TOP",
      "LOWER_LIP_BOTTOM",
      "LOWER_LIP_TOP",
      "NOSE_BOTTOM",
      "NOSE_BRIDGE",
      "RIGHT_CHEEK",
      "RIGHT_EYE",
      "RIGHT_EYEBROW_BOTTOM",
      "RIGHT_EYEBROW_TOP",
      "UPPER_LIP_BOTTOM",
      "UPPER_LIP_TOP"
    )
    val faceContoursTypesMap: MutableMap<String, Any> = HashMap()
    for (i in faceContoursTypesStrings.indices) {
      val contour = face.getContour(faceContoursTypes[i])
      val contourName = faceContoursTypesStrings[i]
      Log.d(
        TAG,
        "Getting '$contourName' contour"
      )
      if (contour == null) {
        Log.d(
          TAG,
          "Face contour '$contourName' is null - going next"
        )
        continue
      }
      val points = contour.points
      val pointsMap: MutableMap<String, Map<String, Double>> = HashMap()
      for (j in points.indices) {
        val currentPointsMap: MutableMap<String, Double> = HashMap()
        currentPointsMap["x"] = points[j].x.toDouble() * scaleX
        currentPointsMap["y"] = points[j].y.toDouble() * scaleY
        pointsMap[j.toString()] = currentPointsMap
      }

      faceContoursTypesMap[contourName] = pointsMap
    }
    return faceContoursTypesMap
  }

  private fun getOrientation(
    orientation: Orientation
  ): Int {
    // First apply default device orientation
    val rotation = when (orientation) {
      Orientation.PORTRAIT -> 0            
      Orientation.LANDSCAPE_LEFT -> 270     
      Orientation.PORTRAIT_UPSIDE_DOWN -> 180
      Orientation.LANDSCAPE_RIGHT -> 90   
    }
    
    // Then apply additional rotation if specified
    return when (outputOrientation) {
      "landscape-left" -> (rotation + 270) % 360    // home button left
      "landscape-right" -> (rotation + 90) % 360  // home button right
      "portrait-upside-down" -> (rotation + 180) % 360
      else -> rotation  // "portrait" or default
    }
  }

  private fun getNormalizedDimensions(
    frameWidth: Double,
    frameHeight: Double,
    outputOrientation: String
  ): Pair<Double, Double> {
    val isOutputLandscape = outputOrientation.contains("landscape")
    val width = if (isOutputLandscape) 
      maxOf(frameWidth, frameHeight) 
    else 
      minOf(frameWidth, frameHeight)
    val height = if (isOutputLandscape) 
      minOf(frameWidth, frameHeight) 
    else 
      maxOf(frameWidth, frameHeight)
    return Pair(width, height)
  }

  override fun callback(
    frame: Frame,
    params: Map<String, Any>?
  ): Any {
    val result = ArrayList<Map<String, Any>>()
    
    try {
      val orientation = getOrientation(frame.orientation)
      val image = InputImage.fromMediaImage(frame.image, orientation)
      
      // Get normalized dimensions
      val normalizedDimensions = getNormalizedDimensions(
        image.height.toDouble(),  // we use height as width because frame is rotated
        image.width.toDouble(),   // we use width as height because frame is rotated
        outputOrientation
      )
      
      val scaleX = if(autoScale) windowWidth / normalizedDimensions.first else 1.0
      val scaleY = if(autoScale) windowHeight / normalizedDimensions.second else 1.0

      // Choose scale based on outputOrientation
      val finalScale = when (outputOrientation) {
          "portrait", "portrait-upside-down" -> baseScaleY  // Use Y scale for portrait modes
          "landscape-left", "landscape-right" -> baseScaleX  // Use X scale for landscape modes
          else -> baseScaleY  // Default to Y scale for portrait as fallback
      }
      
      val task = faceDetector!!.process(image)
      val faces = Tasks.await(task)
      faces.forEach{face ->
        val map: MutableMap<String, Any> = HashMap()

        if (runLandmarks) {
          map["landmarks"] = processLandmarks(
            face, 
            scaleX,
            scaleY
          )
        }

        if (runClassifications) {
          map["leftEyeOpenProbability"] = face.leftEyeOpenProbability?.toDouble() ?: -1
          map["rightEyeOpenProbability"] = face.rightEyeOpenProbability?.toDouble() ?: -1
          map["smilingProbability"] = face.smilingProbability?.toDouble() ?: -1
        }

        if (runContours) {
          map["contours"] = processFaceContours(
            face,
            scaleX,
            scaleY
          )
        }

        if (trackingEnabled) {
          map["trackingId"] = face.trackingId ?: -1
        }

        map["rollAngle"] = face.headEulerAngleZ.toDouble()
        map["pitchAngle"] = face.headEulerAngleX.toDouble()
        map["yawAngle"] = face.headEulerAngleY.toDouble()
        map["bounds"] = processBoundingBox(
          face.boundingBox,
          normalizedDimensions.first,  // normalized width
          normalizedDimensions.second, // normalized height
          orientation,
          finalScale
        )
        result.add(map)
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error processing face detection: ", e)
    } catch (e: FrameInvalidError) {
      Log.e(TAG, "Frame invalid error: ", e)
    }

    return result
  }
}