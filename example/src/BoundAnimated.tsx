import Animated, { SharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// For debugging

export const BoundsAnimatedCameraView = ({ bounds }: { bounds: SharedValue<Bounds> }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    borderWidth: 4,
    borderLeftColor: "rgb(0,255,0)",
    borderRightColor: "rgb(221, 255, 0)",
    borderBottomColor: "rgb(0,255,0)",
    borderTopColor: "rgb(255,0,0)",
    width: withTiming(bounds.value.width, {
      duration: 100,
    }),
    height: withTiming(bounds.value.height, {
      duration: 100,
    }),
    left: withTiming(bounds.value.x, {
      duration: 100,
    }),
    top: withTiming(bounds.value.y, {
      duration: 100,
    }),
  }));

  return <Animated.View style={animatedStyle} />;
};
