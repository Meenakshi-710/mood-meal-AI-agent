import { FC, useEffect, useRef } from "react"
import { Animated, StyleProp, ViewStyle } from "react-native"

type SkeletonProps = {
  width?: ViewStyle["width"]
  height: number
  borderRadius?: number
  style?: StyleProp<ViewStyle>
}

export const Skeleton: FC<SkeletonProps> = ({ width = "100%", height, borderRadius = 12, style }) => {
  const opacity = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#D9D9D9",
          opacity,
        },
        style,
      ]}
    />
  )
}
