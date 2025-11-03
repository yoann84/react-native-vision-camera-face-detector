module.exports = {
  dependency: {
    platforms: {
      /**
       * @type {import('@react-native-community/cli-types').IOSDependencyParams}
       */
      ios: {
        podspecPath: './VisionCameraFaceDetector.podspec',
      },
      /**
       * @type {import('@react-native-community/cli-types').AndroidDependencyParams}
       */
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.visioncamerafacedetector.VisionCameraFaceDetectorPluginPackage;',
      },
    },
  },
}

// react-native.config.js file for local linking file