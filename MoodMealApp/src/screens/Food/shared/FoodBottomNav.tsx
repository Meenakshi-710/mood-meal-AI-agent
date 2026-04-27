import { FC } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import { router } from "expo-router"

import { Text } from "@/components/Text"

type BottomNavProps = {
  active: "home" | "discover"
}

export const FoodBottomNav: FC<BottomNavProps> = ({ active }) => {
  return (
    <View style={$container}>
      <Pressable onPress={() => router.replace("/")} style={$item}>
        <Text text="🏠" style={[$icon, active === "home" && $iconActive]} />
      </Pressable>

      <Pressable onPress={() => router.replace("./discover")} style={$item}>
        <Text text="🔍" style={[$icon, active === "discover" && $iconActive]} />
      </Pressable>
    </View>
  )
}

const $container: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-around",
  borderTopWidth: 1,
  borderTopColor: "#E8E8E8",
  paddingVertical: 12,
}

const $item: ViewStyle = {
  paddingHorizontal: 20,
  paddingVertical: 8,
}

const $icon: TextStyle = {
  fontSize: 20,
  opacity: 0.65,
}

const $iconActive: TextStyle = {
  opacity: 1,
}
