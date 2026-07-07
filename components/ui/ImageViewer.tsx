import { useEffect } from "react";
import { Modal, Pressable, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  uri?: string;
  onClose: () => void;
}

const MAX_SCALE = 4;

/** Full-screen image preview with pinch-to-zoom, pan, and double-tap to zoom. */
export function ImageViewer({ visible, uri, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Reset the transform whenever the viewer is (re)opened.
  useEffect(() => {
    if (visible) {
      scale.value = 1;
      savedScale.value = 1;
      tx.value = 0;
      ty.value = 0;
      savedTx.value = 0;
      savedTy.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const resetTransform = () => {
    "worklet";
    scale.value = withTiming(1);
    savedScale.value = 1;
    tx.value = withTiming(0);
    ty.value = withTiming(0);
    savedTx.value = 0;
    savedTy.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(1, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) resetTransform();
    });

  const pan = Gesture.Pan()
    .maxPointers(2)
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        resetTransform();
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)" }}>
          <GestureDetector gesture={composed}>
            <Animated.View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              {uri ? (
                <Animated.View style={imageStyle}>
                  <Image
                    source={{ uri }}
                    style={{ width, height: height * 0.85 }}
                    contentFit="contain"
                    transition={150}
                  />
                </Animated.View>
              ) : null}
            </Animated.View>
          </GestureDetector>

          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={{ position: "absolute", right: 16, top: insets.top + 8 }}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/15 active:opacity-70"
          >
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
