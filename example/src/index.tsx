import {
  useEffect,
  useRef,
  useState
} from 'react'
import {
  StyleSheet,
  Text,
  Button,
  View,
  useWindowDimensions
} from 'react-native'
import {
  Frame,
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera'
import { useIsFocused } from '@react-navigation/core'
import { useAppState } from '@react-native-community/hooks'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import {
  Camera,
  Face,
  FaceDetectionOptions,
  OrientationOutput
} from 'react-native-vision-camera-face-detector'
import  {
  useSharedValue,
} from 'react-native-reanimated'
import { Bounds } from '../../lib/typescript/src'
import { BoundsAnimatedCameraView } from './BoundAnimated'

/**
 * Entry point component
 *
 * @return {JSX.Element} Component
 */
function Index() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <FaceDetection />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

/**
 * Face detection component
 *
 * @return {JSX.Element} Component
 */
function FaceDetection() {
  const {
    width,
    height
  } = useWindowDimensions()
  const {
    hasPermission,
    requestPermission
  } = useCameraPermission()
  const [
    cameraMounted,
    setCameraMounted
  ] = useState<boolean>( false )
  const [
    cameraPaused,
    setCameraPaused
  ] = useState<boolean>( false )

  const [
    outputOrientation,
    setOutputOrientation
  ] = useState<OrientationOutput>('portrait')
 


  const bounds = useSharedValue<Bounds>({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })



  const faceDetectionOptions = useRef<FaceDetectionOptions>( {
    performanceMode: 'fast',
    classificationMode: 'all',
    windowWidth: width,
    windowHeight: height,
    autoScale: true,
    contourMode: "all",
    minFaceSize: 0.4,
   // outputOrientation: outputOrientation,
  } ).current
  const isFocused = useIsFocused()
  const appState = useAppState()
  const isCameraActive = (
    !cameraPaused &&
    isFocused &&
    appState === 'active'
  )
  const cameraDevice = useCameraDevice("front", {
    supportsDepthCapture: true,
  });


  const camera = useRef<VisionCamera>( null )

  useEffect( () => {
    if ( hasPermission ) return
    requestPermission()
  }, [] )




  function handleCameraMountError(
    error: any
  ) {
    console.error( 'camera mount error', error )
  }


  function handleFacesDetected(
    faces: Face[],
    frame: Frame
  ): void {
    console.log(
      'faces', faces.length,
      'frame', frame.toString()
    )

    // if no faces are detected we do nothing
    if ( Object.keys( faces ).length <= 0 ) return



    const { bounds: faceBounds } = faces[ 0 ]

    console.log('faceBounds', faceBounds)
    bounds.value = faceBounds


    // only call camera methods if ref is defined
    if ( camera.current ) {
      // take photo, capture video, etc...
    }
  }

  return ( <>
    <View
      style={ [
        StyleSheet.absoluteFill, {
          alignItems: 'center',
          justifyContent: 'center'
        }
      ] }
    >
      { hasPermission && cameraDevice ? <>
        { cameraMounted && <>
          <Camera
            ref={ camera }
            style={ StyleSheet.absoluteFill }
            isActive={ isCameraActive }
            device={ cameraDevice }
            onError={ handleCameraMountError }
            faceDetectionCallback={ handleFacesDetected }
            androidPreviewViewType="texture-view"
            onOutputOrientationChanged={(outputOrientation: OrientationOutput) =>
              setOutputOrientation(outputOrientation)
            }
            faceDetectionOptions={ {
              ...faceDetectionOptions,
            } }
          />

       <BoundsAnimatedCameraView bounds={bounds} />

          { cameraPaused && <Text
            style={ {
              width: '100%',
              backgroundColor: 'rgb(0,0,255)',
              textAlign: 'center',
              color: 'white'
            } }
          >
            Camera is PAUSED
          </Text> }
        </> }

        { !cameraMounted && <Text
          style={ {
            width: '100%',
            backgroundColor: 'rgb(255,255,0)',
            textAlign: 'center'
          } }
        >
          Camera is NOT mounted
        </Text> }
      </> : <Text
        style={ {
          width: '100%',
          backgroundColor: 'rgb(255,0,0)',
          textAlign: 'center',
          color: 'white'
        } }
      >
        No camera device or permission
      </Text> }
    </View>

    <View
      style={ {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column'
      } }
    >
   
      <View
        style={ {
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around'
        } }
      >
        <Button
          onPress={ () => setCameraPaused( ( current ) => !current ) }
          title={ `${ cameraPaused ? 'Resume' : 'Pause' } Cam` }
        />

        <Button
          onPress={ () => setCameraMounted( ( current ) => !current ) }
          title={ `${ cameraMounted ? 'Unmount' : 'Mount' } Cam` }
        />
      </View>
    </View>
  </> )
}

export default Index
