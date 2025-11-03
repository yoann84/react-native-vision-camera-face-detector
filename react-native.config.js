module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: './VisionCameraFaceDetector.podspec',
      },
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.visioncamerafacedetector.VisionCameraFaceDetectorPluginPackage;',
      },
    },
  },
}

