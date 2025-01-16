"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Camera = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNativeVisionCamera = require("react-native-vision-camera");
var _reactNativeWorkletsCore = require("react-native-worklets-core");
var _FaceDetector = require("./FaceDetector");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// types

/**
 * Create a Worklet function that persists between re-renders.
 * The returned function can be called from both a Worklet context and the JS context, but will execute on a Worklet context.
 *
 * @param {function} func The Worklet. Must be marked with the `'worklet'` directive.
 * @param {DependencyList} dependencyList The React dependencies of this Worklet.
 * @returns {UseWorkletType} A memoized Worklet
 */
function useWorklet(func, dependencyList) {
  const worklet = _react.default.useMemo(() => {
    const context = _reactNativeWorkletsCore.Worklets.defaultContext;
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
  return _react.default.useMemo(() => _reactNativeWorkletsCore.Worklets.createRunOnJS(func), dependencyList);
}

/**
 * Vision camera wrapper
 * 
 * @param {ComponentType} props Camera + face detection props 
 * @returns 
 */
const Camera = exports.Camera = /*#__PURE__*/_react.default.forwardRef(({
  faceDetectionOptions,
  faceDetectionCallback,
  ...props
}, ref) => {
  const {
    detectFaces
  } = (0, _FaceDetector.useFaceDetector)(faceDetectionOptions);
  /** 
   * Is there an async task already running?
   */
  const isAsyncContextBusy = (0, _reactNativeWorkletsCore.useSharedValue)(false);

  /** 
   * Throws logs/errors back on js thread
   */
  const logOnJs = _reactNativeWorkletsCore.Worklets.createRunOnJS((log, error) => {
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
  const cameraFrameProcessor = (0, _reactNativeVisionCamera.useFrameProcessor)(frame => {
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

  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeVisionCamera.Camera, {
    ...props,
    ref: ref,
    frameProcessor: cameraFrameProcessor,
    pixelFormat: "yuv"
  });
});
//# sourceMappingURL=Camera.js.map