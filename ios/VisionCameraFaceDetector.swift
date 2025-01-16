import AVFoundation
import CoreML
import Foundation
import MLKitFaceDetection
import MLKitVision
import SceneKit
import UIKit
import VisionCamera

@objc(VisionCameraFaceDetector)
public class VisionCameraFaceDetector: FrameProcessorPlugin {
  // detection props
  private var autoScale = false
  private var faceDetector: FaceDetector! = nil
  private var runLandmarks = false
  private var runClassifications = false
  private var runContours = false
  private var trackingEnabled = false
  private var windowWidth = 1.0
  private var windowHeight = 1.0
  private var outputOrientation: String = "portrait"

  public override init(
    proxy: VisionCameraProxyHolder,
    options: [AnyHashable: Any]! = [:]
  ) {
    super.init(proxy: proxy, options: options)
    let config = getConfig(withArguments: options)

    if let outputOrientationParam = config?["outputOrientation"] as? String {
      outputOrientation = outputOrientationParam

    }

    let windowWidthParam = config?["windowWidth"] as? Double
    if windowWidthParam != nil && windowWidthParam != windowWidth {
      windowWidth = CGFloat(windowWidthParam!)
    }

    let windowHeightParam = config?["windowHeight"] as? Double
    if windowHeightParam != nil && windowHeightParam != windowHeight {
      windowHeight = CGFloat(windowHeightParam!)
    }

    // handle auto scaling
    autoScale = config?["autoScale"] as? Bool == true

    // initializes faceDetector on creation
    let minFaceSize = 0.15
    let optionsBuilder = FaceDetectorOptions()
    optionsBuilder.performanceMode = .fast
    optionsBuilder.landmarkMode = .none
    optionsBuilder.contourMode = .none
    optionsBuilder.classificationMode = .none
    optionsBuilder.minFaceSize = minFaceSize
    optionsBuilder.isTrackingEnabled = false

    if config?["performanceMode"] as? String == "accurate" {
      optionsBuilder.performanceMode = .accurate
    }

    if config?["landmarkMode"] as? String == "all" {
      runLandmarks = true
      optionsBuilder.landmarkMode = .all
    }

    if config?["classificationMode"] as? String == "all" {
      runClassifications = true
      optionsBuilder.classificationMode = .all
    }

    if config?["contourMode"] as? String == "all" {
      runContours = true
      optionsBuilder.contourMode = .all
    }

    let minFaceSizeParam = config?["minFaceSize"] as? Double
    if minFaceSizeParam != nil && minFaceSizeParam != minFaceSize {
      optionsBuilder.minFaceSize = CGFloat(minFaceSizeParam!)
    }

    if config?["trackingEnabled"] as? Bool == true {
      trackingEnabled = true
      optionsBuilder.isTrackingEnabled = true
    }

    faceDetector = FaceDetector.faceDetector(options: optionsBuilder)
  }

  func getConfig(
    withArguments arguments: [AnyHashable: Any]!
  ) -> [String: Any]! {
    if arguments.count > 0 {
      let config = arguments.map { dictionary in
        Dictionary(
          uniqueKeysWithValues: dictionary.map { (key, value) in
            (key as? String ?? "", value)
          })
      }

      return config
    }

    return nil
  }

  func processBoundingBox(
    from face: Face,
    sourceWidth: CGFloat,
    sourceHeight: CGFloat,
    orientation: UIImage.Orientation,
    scaleX: CGFloat,
    scaleY: CGFloat
  ) -> [String: Any] {
    let boundingBox = face.frame
    let width = boundingBox.width * scaleX
    let height = boundingBox.height * scaleY
    let x = boundingBox.origin.y * scaleX
    let y = boundingBox.origin.x * scaleY

    return [
      "width": width,
      "height": height,
      "x": (-x + sourceWidth * scaleX) - width,
      "y": y,
    ]
  }

  func processLandmarks(
    from face: Face,
    scaleX: CGFloat,
    scaleY: CGFloat
  ) -> [String: [String: CGFloat?]] {
    let faceLandmarkTypes = [
      FaceLandmarkType.leftCheek,
      FaceLandmarkType.leftEar,
      FaceLandmarkType.leftEye,
      FaceLandmarkType.mouthBottom,
      FaceLandmarkType.mouthLeft,
      FaceLandmarkType.mouthRight,
      FaceLandmarkType.noseBase,
      FaceLandmarkType.rightCheek,
      FaceLandmarkType.rightEar,
      FaceLandmarkType.rightEye,
    ]

    let faceLandmarksTypesStrings = [
      "LEFT_CHEEK",
      "LEFT_EAR",
      "LEFT_EYE",
      "MOUTH_BOTTOM",
      "MOUTH_LEFT",
      "MOUTH_RIGHT",
      "NOSE_BASE",
      "RIGHT_CHEEK",
      "RIGHT_EAR",
      "RIGHT_EYE",
    ]

    var faceLandMarksTypesMap: [String: [String: CGFloat?]] = [:]
    for i in 0..<faceLandmarkTypes.count {
      let landmark = face.landmark(ofType: faceLandmarkTypes[i])
      let position = [
        "x": landmark?.position.x ?? 0.0 * scaleX,
        "y": landmark?.position.y ?? 0.0 * scaleY,
      ]
      faceLandMarksTypesMap[faceLandmarksTypesStrings[i]] = position
    }

    return faceLandMarksTypesMap
  }

  func processFaceContours(
    from face: Face,
    scaleX: CGFloat,
    scaleY: CGFloat
  ) -> [String: [[String: CGFloat]]] {
    let faceContoursTypes = [
      FaceContourType.face,
      FaceContourType.leftCheek,
      FaceContourType.leftEye,
      FaceContourType.leftEyebrowBottom,
      FaceContourType.leftEyebrowTop,
      FaceContourType.lowerLipBottom,
      FaceContourType.lowerLipTop,
      FaceContourType.noseBottom,
      FaceContourType.noseBridge,
      FaceContourType.rightCheek,
      FaceContourType.rightEye,
      FaceContourType.rightEyebrowBottom,
      FaceContourType.rightEyebrowTop,
      FaceContourType.upperLipBottom,
      FaceContourType.upperLipTop,
    ]

    let faceContoursTypesStrings = [
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
      "UPPER_LIP_TOP",
    ]

    var faceContoursTypesMap: [String: [[String: CGFloat]]] = [:]
    for i in 0..<faceContoursTypes.count {
      let contour = face.contour(ofType: faceContoursTypes[i])
      var pointsArray: [[String: CGFloat]] = []

      if let points = contour?.points {
        for point in points {
          let currentPointsMap = [
            "x": point.x * scaleX,
            "y": point.y * scaleY,
          ]

          pointsArray.append(currentPointsMap)
        }

        faceContoursTypesMap[faceContoursTypesStrings[i]] = pointsArray
      }
    }

    return faceContoursTypesMap
  }

  private func orientationToDegrees(_ orientation: UIImage.Orientation) -> Int {
    switch orientation {
    case .up: return 0
    case .right: return 270  // return left
    case .down: return 180  // return down
    case .left: return 90  // return right
    default: return 0
    }
  }

  private func degreesToOrientation(_ degrees: Int) -> UIImage.Orientation {
    switch (degrees + 360) % 360 {
    case 0: return .up
    case 90: return .right
    case 180: return .down
    case 270: return .left
    default: return .up
    }
  }

  func getOrientation(orientation: UIImage.Orientation) -> UIImage.Orientation {
    // Convert current orientation to degrees
    let currentDegrees = orientationToDegrees(orientation)

    // Add additional rotation based on outputOrientation
    let additionalDegrees =
      switch outputOrientation {
      case "landscape-left": 90  // home button on left
      case "landscape-right": 270  // home button on right
      case "portrait-upside-down": 180  // home button on top
      case "portrait": 0  // home button on bottom
      default: 0  // "portrait" or default
      }

    // Combine rotations and convert back to UIImage.Orientation
    return degreesToOrientation((currentDegrees + additionalDegrees) % 360)
  }

  public override func callback(
    _ frame: Frame,
    withArguments arguments: [AnyHashable: Any]?
  ) -> Any {
    var result: [Any] = []

    do {
      // Frame is always in landscape orientation (-90° rotated)
      // So we need to swap width and height
      let width = CGFloat(frame.height)
      let height = CGFloat(frame.width)
      let orientation = getOrientation(
        orientation: frame.orientation
      )
      let image = VisionImage(buffer: frame.buffer)
      image.orientation = orientation

      var scaleX: CGFloat
      var scaleY: CGFloat
      if autoScale {
        // Scale factors should also be swapped to match the rotated frame

        scaleX = windowWidth / width
        scaleY = windowHeight / height
      } else {
        scaleX = CGFloat(1)
        scaleY = CGFloat(1)
      }

      let faces: [Face] = try faceDetector!.results(in: image)
      for face in faces {
        var map: [String: Any] = [:]

        if runLandmarks {
          map["landmarks"] = processLandmarks(
            from: face,
            scaleX: scaleX,
            scaleY: scaleY
          )
        }

        if runClassifications {
          map["leftEyeOpenProbability"] = face.leftEyeOpenProbability
          map["rightEyeOpenProbability"] = face.rightEyeOpenProbability
          map["smilingProbability"] = face.smilingProbability
        }

        if runContours {
          map["contours"] = processFaceContours(
            from: face,
            scaleX: scaleX,
            scaleY: scaleY
          )
        }

        if trackingEnabled {
          map["trackingId"] = face.trackingID
        }

        map["rollAngle"] = face.headEulerAngleZ
        map["pitchAngle"] = face.headEulerAngleX
        map["yawAngle"] = face.headEulerAngleY
        map["bounds"] = processBoundingBox(
          from: face,
          sourceWidth: width,
          sourceHeight: height,
          orientation: frame.orientation,
          scaleX: scaleX,
          scaleY: scaleY
        )

        result.append(map)
      }
    } catch let error {
      print("Error processing face detection: \(error)")
    }

    return result
  }
}
