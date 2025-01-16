import { useMemo } from 'react';
import { VisionCameraProxy, type Frame } from 'react-native-vision-camera';

type FaceDetectorPlugin = {
  /**
   * Detect faces on frame
   *
   * @param {Frame} frame Frame to detect faces
   */
  detectFaces: (frame: Frame) => Face[];
};

type Point = {
  x: number;
  y: number;
};

export interface Face {
  pitchAngle: number;
  rollAngle: number;
  yawAngle: number;
  bounds: Bounds;
  leftEyeOpenProbability: number;
  rightEyeOpenProbability: number;
  smilingProbability: number;
  contours: Contours;
  landmarks: Landmarks;
}

export type OrientationOutput =
  | 'portrait'
  | 'landscape-left'
  | 'landscape-right'
  | 'portrait-upside-down';

export interface Bounds {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface Contours {
  FACE: Point[];
  LEFT_EYEBROW_TOP: Point[];
  LEFT_EYEBROW_BOTTOM: Point[];
  RIGHT_EYEBROW_TOP: Point[];
  RIGHT_EYEBROW_BOTTOM: Point[];
  LEFT_EYE: Point[];
  RIGHT_EYE: Point[];
  UPPER_LIP_TOP: Point[];
  UPPER_LIP_BOTTOM: Point[];
  LOWER_LIP_TOP: Point[];
  LOWER_LIP_BOTTOM: Point[];
  NOSE_BRIDGE: Point[];
  NOSE_BOTTOM: Point[];
  LEFT_CHEEK: Point[];
  RIGHT_CHEEK: Point[];
}

export interface Landmarks {
  LEFT_CHEEK: Point;
  LEFT_EAR: Point;
  LEFT_EYE: Point;
  MOUTH_BOTTOM: Point;
  MOUTH_LEFT: Point;
  MOUTH_RIGHT: Point;
  NOSE_BASE: Point;
  RIGHT_CHEEK: Point;
  RIGHT_EAR: Point;
  RIGHT_EYE: Point;
}

export interface FaceDetectionOptions {
  /**
   * Favor speed or accuracy when detecting faces.
   *
   * @default 'fast'
   */
  performanceMode?: 'fast' | 'accurate';

  /**
   * Whether to attempt to identify facial 'landmarks': eyes, ears, nose, cheeks, mouth, and so on.
   *
   * @default 'none'
   */
  landmarkMode?: 'none' | 'all';

  /**
   * Whether to detect the contours of facial features. Contours are detected for only the most prominent face in an image.
   *
   * @default 'none'
   */
  contourMode?: 'none' | 'all';

  /**
   * Whether or not to classify faces into categories such as 'smiling', and 'eyes open'.
   *
   * @default 'none'
   */
  classificationMode?: 'none' | 'all';

  /**
   * Sets the smallest desired face size, expressed as the ratio of the width of the head to width of the image.
   *
   * @default 0.15
   */
  minFaceSize?: number;

  /**
   * Whether or not to assign faces an ID, which can be used to track faces across images.
   *
   * @default false
   */
  trackingEnabled?: boolean;

  /**
   * Should auto scale face bounds, contour and landmarks on native side?
   *
   * @default false
   */
  autoScale?: boolean;

  /**
   * Required if you want to use `autoScale`. Screen width.
   *
   * @default 1.0
   */
  windowWidth?: number;

  /**
   * Required if you want to use `autoScale`. Screen height.
   *
   * @default 1.0
   */
  windowHeight?: number;

  /**
   * Control the orientation of face detection. It should be use with onOutputOrientationChanged
   * - 'portrait': Force portrait orientation
   * - 'landscape-left': Force landscape left orientation
   * - 'landscape-right': Force landscape right orientation
   * - 'portrait-upside-down': Force portrait upside down orientation
   *
   * @default 'preview'
   */
  outputOrientation?: OrientationOutput;
}

/**
 * Create a new instance of face detector plugin
 *
 * @param {FaceDetectionOptions | undefined} options Detection options
 * @returns {FaceDetectorPlugin} Plugin instance
 */
function createFaceDetectorPlugin(
  options?: FaceDetectionOptions
): FaceDetectorPlugin {
  const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectFaces', {
    ...options,
  });

  if (!plugin) {
    throw new Error('Failed to load Frame Processor Plugin "detectFaces"!');
  }

  return {
    detectFaces: (frame: Frame): Face[] => {
      'worklet';
      // @ts-ignore
      return plugin.call(frame) as Face[];
    },
  };
}

/**
 * Use an instance of face detector plugin.
 *
 * @param {FaceDetectionOptions | undefined} options Detection options
 * @returns {FaceDetectorPlugin} Memoized plugin instance that will be
 * destroyed once the component using `useFaceDetector()` unmounts.
 */
export function useFaceDetector(
  options?: FaceDetectionOptions
): FaceDetectorPlugin {
  return useMemo(() => createFaceDetectorPlugin(options), [options]);
}
