import React from 'react';
import { Camera as VisionCamera,
// runAsync,
useFrameProcessor } from 'react-native-vision-camera';
import { Worklets,
// useRunOnJS,
useSharedValue } from 'react-native-worklets-core';
import { useFaceDetector } from './FaceDetector';

// types
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Create a Worklet function that persists between re-renders.
 * The returned function can be called from both a Worklet context and the JS context, but will execute on a Worklet context.
 *
 * @param {function} func The Worklet. Must be marked with the `'worklet'` directive.
 * @param {DependencyList} dependencyList The React dependencies of this Worklet.
 * @returns {UseWorkletType} A memoized Worklet
 */
function useWorklet(func, dependencyList) {
  const worklet = React.useMemo(() => {
    const context = Worklets.defaultContext;
    return context.createRunAsync(func);
  }, dependencyList);
  return worklet;
}

/**
 * Create a Worklet function that runs the giver function on JS context.
 * The returned function can be called from a Worklet to hop back to the JS thread.
 * 
 * @param {function} func The Worklet. Must be marked with the `'worklet'` directive.
 * @param {DependencyList} dependencyList The React dependencies of this Worklet.
 * @returns {UseRunInJSType} a memoized Worklet
 */
function useRunInJS(func, dependencyList) {
  return React.useMemo(() => Worklets.createRunOnJS(func), dependencyList);
}

/**
 * Vision camera wrapper
 * 
 * @param {ComponentType} props Camera + face detection props 
 * @returns 
 */
export const Camera = /*#__PURE__*/React.forwardRef(({
  faceDetectionOptions,
  faceDetectionCallback,
  ...props
}, ref) => {
  const {
    detectFaces
  } = useFaceDetector(faceDetectionOptions);
  /** 
   * Is there an async task already running?
   */
  const isAsyncContextBusy = useSharedValue(false);

  /** 
   * Throws logs/errors back on js thread
   */
  const logOnJs = Worklets.createRunOnJS((log, error) => {
    if (error) {
      console.error(log, error.message ?? JSON.stringify(error));
    } else {
      console.log(log);
    }
  });

  /**
   * Runs on detection callback on js thread
   */
  const runOnJs = useRunInJS(faceDetectionCallback, [faceDetectionCallback]);

  /**
   * Async context that will handle face detection
   */
  const runOnAsyncContext = useWorklet(frame => {
    'worklet';

    try {
      const faces = detectFaces(frame);
      // increment frame count so we can use frame on 
      // js side without frame processor getting stuck
      frame.incrementRefCount();
      runOnJs(faces, frame).finally(() => {
        'worklet';

        // finally decrement frame count so it can be dropped
        frame.decrementRefCount();
      });
    } catch (error) {
      logOnJs('Execution error:', error);
    } finally {
      frame.decrementRefCount();
      isAsyncContextBusy.value = false;
    }
  }, [detectFaces, runOnJs]);

  /**
   * Detect faces on frame on an async context without blocking camera preview
   * 
   * @param {Frame} frame Current frame
   */
  function runAsync(frame) {
    'worklet';

    if (isAsyncContextBusy.value) return;
    // set async context as busy
    isAsyncContextBusy.value = true;
    // cast to internal frame and increment ref count
    const internal = frame;
    internal.incrementRefCount();
    // detect faces in async context
    runOnAsyncContext(internal);
  }

  /**
   * Camera frame processor
   */
  const cameraFrameProcessor = useFrameProcessor(frame => {
    'worklet';

    runAsync(frame);
  }, [runOnAsyncContext]);

  //
  // use bellow when vision-camera's  
  // context creation issue is solved
  //
  // /**
  //  * Runs on detection callback on js thread
  //  */
  // const runOnJs = useRunOnJS( faceDetectionCallback, [
  //   faceDetectionCallback
  // ] )

  // const cameraFrameProcessor = useFrameProcessor( ( frame ) => {
  //   'worklet'
  //   runAsync( frame, () => {
  //     'worklet'
  //     runOnJs(
  //       detectFaces( frame ),
  //       frame
  //     )
  //   } )
  // }, [ runOnJs ] )

  return /*#__PURE__*/_jsx(VisionCamera, {
    ...props,
    ref: ref,
    frameProcessor: cameraFrameProcessor,
    pixelFormat: "yuv"
  });
});
//# sourceMappingURL=Camera.js.map