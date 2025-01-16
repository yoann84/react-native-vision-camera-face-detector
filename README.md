## 📚 Introduction

`react-native-vision-camera-face-detector` is a React Native library that integrates with the Vision Camera module to provide face detection functionality. It allows you to easily detect faces in real-time using device's front and back camera.

If you like this package please give it a ⭐ on [GitHub](https://github.com/luicfrr/react-native-vision-camera-face-detector).

## 🏗️ Features

- Real-time face detection using front and back camera
- Adjustable face detection settings
- Optional native side face bounds, contour and landmarks auto scaling
- Can be combined with [Skia Frame Processor](https://react-native-vision-camera.com/docs/guides/skia-frame-processors)

## 🧰 Installation

```bash
yarn add react-native-vision-camera-face-detector
```

Then you need to add `react-native-worklets-core` plugin to `babel.config.js`. More details [here](https://react-native-vision-camera.com/docs/guides/frame-processors#react-native-worklets-core).

## 💡 Usage

Recommended way:
```jsx
import { 
  StyleSheet, 
  Text, 
  View 
} from 'react-native'
import { 
  useEffect, 
  useState,
  useRef
} from 'react'
import {
  Frame,
  useCameraDevice
} from 'react-native-vision-camera'
import {
  Face,
  Camera,
  FaceDetectionOptions
} from 'react-native-vision-camera-face-detector'

export default function App() {
  const faceDetectionOptions = useRef<FaceDetectionOptions>( {
    // detection options
  } ).current

  const device = useCameraDevice('front')

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission()
      console.log({ status })
    })()
  }, [device])

  function handleFacesDetection(
    faces: Face[],
    frame: Frame
  ) { 
    console.log(
      'faces', faces.length,
      'frame', frame.toString()
    )
  }

  return (
    <View style={{ flex: 1 }}>
      {!!device? <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        faceDetectionCallback={ handleFacesDetection }
        faceDetectionOptions={ faceDetectionOptions }
      /> : <Text>
        No Device
      </Text>}
    </View>
  )
}
```

Or use it following [vision-camera docs](https://react-native-vision-camera.com/docs/guides/frame-processors-interacting):
```jsx
import { 
  StyleSheet, 
  Text, 
  View 
} from 'react-native'
import { 
  useEffect, 
  useState,
  useRef
} from 'react'
import {
  Camera,
  useCameraDevice,
  useFrameProcessor
} from 'react-native-vision-camera'
import { 
  Face,
  runAsync,
  useFaceDetector,
  FaceDetectionOptions
} from 'react-native-vision-camera-face-detector'
import { Worklets } from 'react-native-worklets-core'

export default function App() {
  const faceDetectionOptions = useRef<FaceDetectionOptions>( {
    // detection options
  } ).current

  const device = useCameraDevice('front')
  const { detectFaces } = useFaceDetector( faceDetectionOptions )

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission()
      console.log({ status })
    })()
  }, [device])

  const handleDetectedFaces = Worklets.createRunOnJS( (
    faces: Face[]
  ) => { 
    console.log( 'faces detected', faces )
  })

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    runAsync(frame, () => {
      'worklet'
      const faces = detectFaces(frame)
      // ... chain some asynchronous frame processor
      // ... do something asynchronously with frame
      handleDetectedFaces(faces)
    })
    // ... chain frame processors
    // ... do something with frame
  }, [handleDetectedFaces])

  return (
    <View style={{ flex: 1 }}>
      {!!device? <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      /> : <Text>
        No Device
      </Text>}
    </View>
  )
}
```

As face detection is a heavy process you should run it in an asynchronous thread so it can be finished without blocking your camera preview.
You should read `vision-camera` [docs](https://react-native-vision-camera.com/docs/guides/frame-processors-interacting#running-asynchronously) about this feature.


## Face Detection Options

The face detector can be configured with the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| performanceMode | 'fast' \| 'accurate' | 'fast' | Favor speed or accuracy when detecting faces |
| landmarkMode | 'none' \| 'all' | 'none' | Whether to detect facial landmarks |
| contourMode | 'none' \| 'all' | 'none' | Whether to detect facial contours |
| classificationMode | 'none' \| 'all' | 'none' | Whether to classify faces (smiling, eyes open) |
| minFaceSize | number | 0.15 | Minimum face size as ratio of image width |
| trackingEnabled | boolean | false | Whether to track faces across frames |
| autoScale | boolean | false | Auto-scale face bounds to screen dimensions |
| windowWidth | number | 1.0 | Screen width for auto-scaling |
| windowHeight | number | 1.0 | Screen height for auto-scaling |
| outputOrientation | 'portrait' \| 'landscapeLeft' \| 'landscapeRight' \| 'portraitUpsideDown' \| 'preview' | 'preview' | Control face detection orientation |

### Output Orientation

The `outputOrientation` option controls how face detection coordinates are oriented:
- `'preview'`: Uses the camera preview's natural orientation (default)
- `'portrait'`: Forces portrait orientation
- `'landscapeLeft'`: Forces landscape left orientation
- `'landscapeRight'`: Forces landscape right orientation
- `'portraitUpsideDown'`: Forces portrait upside down orientation

## 🔧 Troubleshooting

Here is a common issue when trying to use this package and how you can try to fix it:

- `Regular javascript function cannot be shared. Try decorating the function with the 'worklet' keyword...`:
  - If you're using `react-native-reanimated` maybe you're missing [this](https://github.com/mrousavy/react-native-vision-camera/issues/1791#issuecomment-1892130378) step.
- `Execution failed for task ':react-native-vision-camera-face-detector:compileDebugKotlin'...`:
  - This error is probably related to gradle cache. Try [this](https://github.com/luicfrr/react-native-vision-camera-face-detector/issues/71#issuecomment-2186614831) sollution first.
  - Also check [this](https://github.com/luicfrr/react-native-vision-camera-face-detector/issues/90#issuecomment-2358160166) comment.

If you find other errors while using this package you're wellcome to open a new issue or create a PR with the fix.

## 👷 Built With

- [React Native](https://reactnative.dev/)
- [Google MLKit](https://developers.google.com/ml-kit)
- [Vision Camera](https://react-native-vision-camera.com/)

## 🔎 About

This package was tested using the following:

- `react-native`: `0.74.3` (new arch disabled)
- `react-native-vision-camera`: `4.5.0`
- `react-native-worklets-core`: `1.3.3`
- `react-native-reanimated`: `3.12.1`
- `expo`: `51.0.17`

Min O.S version:

- `Android`: `SDK 26` (Android 8)
- `IOS`: `14`

Make sure to follow tested versions and your device is using the minimum O.S version before opening issues.

## 📚 Author

Made with ❤️ by [luicfrr](https://github.com/luicfrr)
