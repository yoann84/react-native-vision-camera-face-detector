import React from 'react';
import { Camera as VisionCamera } from 'react-native-vision-camera';
import type { CameraProps, Frame } from 'react-native-vision-camera';
import type { Face, FaceDetectionOptions } from './FaceDetector';
type CallbackType = (faces: Face[], frame: Frame) => void | Promise<void>;
/**
 * Vision camera wrapper
 *
 * @param {ComponentType} props Camera + face detection props
 * @returns
 */
export declare const Camera: React.ForwardRefExoticComponent<{
    faceDetectionOptions?: FaceDetectionOptions;
    faceDetectionCallback: CallbackType;
} & CameraProps & React.RefAttributes<VisionCamera>>;
export {};
//# sourceMappingURL=Camera.d.ts.map