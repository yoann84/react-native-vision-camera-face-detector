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
  private var faceDetector: FaceDetector! = nil
  private var runLandmarks = false
  private var runClassifications = false
  private var runContours = false
  private var trackingEnabled = false
  private var windowWidth = 1.0
  private var windowHeight = 1.0

  override public init(
    proxy: VisionCameraProxyHolder,
    options: [AnyHashable: Any]! = [:]
  ) {
    super.init(proxy: proxy, options: options)
    let config = getConfig(withArguments: options)

    let windowWidthParam = config?["windowWidth"] as? Double
    if windowWidthParam != nil && windowWidthParam != windowWidth {
      windowWidth = CGFloat(windowWidthParam!)
    }

    let windowHeightParam = config?["windowHeight"] as? Double
    if windowHeightParam != nil && windowHeightParam != windowHeight {
      windowHeight = CGFloat(windowHeightParam!)
    }

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
          uniqueKeysWithValues: dictionary.map { key, value in
            (key as? String ?? "", value)
          })
      }

      return config
    }

    return nil
  }

  private func transformMatrix(
    frameWidth: Int,
    frameHeight: Int,
    viewWidth: CGFloat,
    viewHeight: CGFloat
  ) -> CGAffineTransform {
    let imageWidth = CGFloat(frameWidth)
    let imageHeight = CGFloat(frameHeight)

    let imageViewAspectRatio = viewWidth / viewHeight
    let imageAspectRatio = imageWidth / imageHeight
    let scale =
      (imageViewAspectRatio > imageAspectRatio)
      ? viewHeight / imageHeight
      : viewWidth / imageWidth

    let scaledImageWidth = imageWidth * scale
    let scaledImageHeight = imageHeight * scale
    let xValue = (viewWidth - scaledImageWidth) / CGFloat(2.0)
    let yValue = (viewHeight - scaledImageHeight) / CGFloat(2.0)

    var transform = CGAffineTransform.identity.translatedBy(x: xValue, y: yValue)
    transform = transform.scaledBy(x: scale, y: scale)
    return transform
  }

  func processBoundingBox(
    from face: Face,
    transform: CGAffineTransform
  ) -> [String: Any] {
    // Apply transform to the face frame
    let transformedRect = face.frame.applying(transform)

    return [
      "width": transformedRect.width,
      "height": transformedRect.height,
      "x": transformedRect.origin.x,
      "y": transformedRect.origin.y,
    ]
  }

  private func pointFrom(_ visionPoint: VisionPoint) -> CGPoint {
    return CGPoint(x: visionPoint.x, y: visionPoint.y)
  }

  func processLandmarks(
    from face: Face,
    transform: CGAffineTransform
  ) -> [String: [String: CGFloat?]] {
    let faceLandmarkTypes: [FaceLandmarkType] = [
      .leftCheek,
      .leftEar,
      .leftEye,
      .mouthBottom,
      .mouthLeft,
      .mouthRight,
      .noseBase,
      .rightCheek,
      .rightEar,
      .rightEye,
    ]

    var faceLandMarksTypesMap: [String: [String: CGFloat?]] = [:]
    for landmarkType in faceLandmarkTypes {
      if let landmark = face.landmark(ofType: landmarkType) {
        let point = pointFrom(landmark.position)
        let transformedPoint = point.applying(transform)
        faceLandMarksTypesMap[landmarkType.rawValue] = [
          "x": transformedPoint.x,
          "y": transformedPoint.y,
        ]
      }
    }

    return faceLandMarksTypesMap
  }

  func processFaceContours(
    from face: Face,
    transform: CGAffineTransform
  ) -> [String: [[String: CGFloat]]] {
    let faceContoursTypes: [FaceContourType] = [
      .face,
      .leftCheek,
      .leftEye,
      .leftEyebrowBottom,
      .leftEyebrowTop,
      .lowerLipBottom,
      .lowerLipTop,
      .noseBottom,
      .noseBridge,
      .rightCheek,
      .rightEye,
      .rightEyebrowBottom,
      .rightEyebrowTop,
      .upperLipBottom,
      .upperLipTop,
    ]

    var faceContoursTypesMap: [String: [[String: CGFloat]]] = [:]
    for contourType in faceContoursTypes {
      if let contour = face.contour(ofType: contourType) {
        var pointsArray: [[String: CGFloat]] = []

        for point in contour.points {
          let cgPoint = pointFrom(point)
          let transformedPoint = cgPoint.applying(transform)
          pointsArray.append([
            "x": transformedPoint.x,
            "y": transformedPoint.y,
          ])
        }

        faceContoursTypesMap[contourType.rawValue] = pointsArray
      }
    }

    return faceContoursTypesMap
  }

  private func currentUIOrientation() -> UIDeviceOrientation {
    let deviceOrientation = { () -> UIDeviceOrientation in
      switch UIApplication.shared.statusBarOrientation {
      case .landscapeLeft:
        return .landscapeRight
      case .landscapeRight:
        return .landscapeLeft
      case .portraitUpsideDown:
        return .portraitUpsideDown
      case .portrait, .unknown:
        return .portrait
      @unknown default:
        return .portrait
      }
    }

    guard Thread.isMainThread else {
      var currentOrientation: UIDeviceOrientation = .portrait
      DispatchQueue.main.sync {
        currentOrientation = deviceOrientation()
      }
      return currentOrientation
    }
    return deviceOrientation()
  }

  private func imageOrientation(
    cameraPosition: AVCaptureDevice.Position
  ) -> UIImage.Orientation {
    var deviceOrientation = UIDevice.current.orientation
    if deviceOrientation == .faceDown || deviceOrientation == .faceUp
      || deviceOrientation == .unknown
    {
      deviceOrientation = currentUIOrientation()
    }

    switch deviceOrientation {
    case .portrait:
      return cameraPosition == .front ? .leftMirrored : .right
    case .landscapeLeft:
      return cameraPosition == .front ? .downMirrored : .up
    case .portraitUpsideDown:
      return cameraPosition == .front ? .rightMirrored : .left
    case .landscapeRight:
      return cameraPosition == .front ? .upMirrored : .down
    case .faceDown, .faceUp, .unknown:
      return .up
    @unknown default:
      return .up
    }
  }

  override public func callback(
    _ frame: Frame,
    withArguments arguments: [AnyHashable: Any]?
  ) -> Any {
    var result: [Any] = []

    do {
      let image = VisionImage(buffer: frame.buffer)
      image.orientation = imageOrientation(
        cameraPosition: frame.isMirrored ? .front : .back
      )

      let faces: [Face] = try faceDetector!.results(in: image)

      let transform = transformMatrix(
        frameWidth: frame.width,
        frameHeight: frame.height,
        viewWidth: windowWidth,
        viewHeight: windowHeight
      )

      for face in faces {

        var map: [String: Any] = [:]
        map["bounds"] = processBoundingBox(
          from: face,
          transform: transform
        )

        if runLandmarks {
          map["landmarks"] = processLandmarks(
            from: face,
            transform: transform
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
            transform: transform
          )
        }

        if trackingEnabled {
          map["trackingId"] = face.trackingID
        }

        map["rollAngle"] = face.headEulerAngleZ
        map["pitchAngle"] = face.headEulerAngleX
        map["yawAngle"] = face.headEulerAngleY

        result.append(map)
      }
    } catch {
      print("Error processing face detection: \(error)")
    }

    return result
  }
}
