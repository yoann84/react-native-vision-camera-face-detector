import { useMemo } from 'react';
import { VisionCameraProxy } from 'react-native-vision-camera';
/**
 * Create a new instance of face detector plugin
 *
 * @param {FaceDetectionOptions | undefined} options Detection options
 * @returns {FaceDetectorPlugin} Plugin instance
 */
function createFaceDetectorPlugin(options) {
  const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectFaces', {
    ...options
  });
  if (!plugin) {
    throw new Error('Failed to load Frame Processor Plugin "detectFaces"!');
  }
  return {
    detectFaces: frame => {
      'worklet';

      // @ts-ignore
      return plugin.call(frame);
    }
  };
}

/**
 * Use an instance of face detector plugin.
 *
 * @param {FaceDetectionOptions | undefined} options Detection options
 * @returns {FaceDetectorPlugin} Memoized plugin instance that will be
 * destroyed once the component using `useFaceDetector()` unmounts.
 */
export function useFaceDetector(options) {
  return useMemo(() => createFaceDetectorPlugin(options), [options]);
}
//# sourceMappingURL=FaceDetector.js.map