import { FC, useEffect, useMemo, useState } from "react"
import { Image, ImageStyle, Pressable, TextStyle, View, ViewStyle } from "react-native"
import { router } from "expo-router"

import { Icon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Skeleton } from "@/components/Skeleton"
import { Text } from "@/components/Text"
import { api } from "@/services/api"
import { MealItem } from "@/services/api/types"

type MealDetailsScreenProps = {
  mealId?: string
  reason?: string
  title?: string
  price?: string
  image?: string
  ingredients?: string
}

export const MealDetailsScreen: FC<MealDetailsScreenProps> = ({ mealId, reason, title, price, image, ingredients }) => {
  const [quantity, setQuantity] = useState(2)
  const [meal, setMeal] = useState<MealItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!mealId) return
    api
      .getMealDetails(mealId)
      .then((response) => {
        if (!active || !response.ok || !response.data?.ok || !response.data.data) return
        setMeal(response.data.data)
      })
      .catch(() => {
        // Keep route data fallback when backend detail request fails.
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [mealId])

  const routeIngredients = useMemo(() => (ingredients ? decodeURIComponent(ingredients).split(",").filter(Boolean) : []), [ingredients])
  const resolvedTitle = meal?.name || (title ? decodeURIComponent(title) : "Meal")
  const resolvedPrice = meal?.price ?? Number(price || 0)
  const resolvedImage = meal?.image || (image ? decodeURIComponent(image) : "https://images.unsplash.com/photo-1547592166-23ac45744acd")
  const resolvedIngredients = meal?.ingredients?.length ? meal.ingredients : routeIngredients

  return (
    <Screen preset="scroll" safeAreaEdges={["top"]} backgroundColor="#ECECEC">
      <View style={$phoneFrame}>
        <View style={$container}>
        <View style={$topRow}>
          <Pressable onPress={() => router.back()} style={$iconButton}>
            <Icon icon="back" size={16} />
          </Pressable>
          <Icon icon="bell" size={18} />
        </View>

        {isLoading ? (
          <>
            <Skeleton width="72%" height={30} borderRadius={8} style={$titleSkeleton} />
            <Skeleton width={120} height={30} borderRadius={8} style={$priceSkeleton} />
          </>
        ) : (
          <>
            <Text text={resolvedTitle} style={$title} />
            <Text text={`₹${resolvedPrice.toFixed(2)}`} style={$price} />
          </>
        )}

          <View style={$reasonCard}>
            <Text text="Why this meal?" style={$reasonTitle} />
          {isLoading ? (
            <>
              <Skeleton width="95%" height={12} borderRadius={8} style={$reasonSkeleton} />
              <Skeleton width="75%" height={12} borderRadius={8} style={$reasonSkeleton} />
            </>
          ) : (
            <Text
              text={reason || "Comforting, warm, and spicy profile for low mood and rainy evening."}
              style={$reasonBody}
            />
          )}
          </View>

        {isLoading ? <Skeleton width={210} height={210} borderRadius={105} style={$image} /> : <Image source={{ uri: resolvedImage }} style={$image} />}

        <View style={$quantityRow}>
          <Pressable onPress={() => setQuantity(Math.max(1, quantity - 1))} style={$qtyButton}>
            <Text text="-" style={$qtyButtonText} />
          </Pressable>
          <Text text={String(quantity)} style={$qtyValue} />
          <Pressable onPress={() => setQuantity(quantity + 1)} style={$qtyButton}>
            <Text text="+" style={$qtyButtonText} />
          </Pressable>
        </View>

        <Text text="Ingredients" style={$ingredientsTitle} />
        <View style={$ingredientsWrap}>
          {isLoading
            ? Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={`ingredient-skeleton-${index}`} width={95} height={36} borderRadius={18} />
            ))
            : resolvedIngredients.map((ingredient) => (
              <View key={ingredient} style={$ingredientChip}>
                <Text text={ingredient} style={$ingredientText} />
              </View>
            ))}
        </View>

        <Pressable style={$addButton}>
          <Text text="Add To Mood Cart" style={$addButtonText} />
        </Pressable>
      </View>
      </View>
    </Screen>
  )
}

const $phoneFrame: ViewStyle = {
  width: "100%",
  maxWidth: 420,
  alignSelf: "center",
  backgroundColor: "#F7F7F7",
  borderRadius: 28,
  overflow: "hidden",
}

const $container: ViewStyle = {
  paddingHorizontal: 18,
  paddingTop: 14,
  paddingBottom: 18,
}

const $topRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $iconButton: ViewStyle = {
  width: 28,
}

const $title: TextStyle = {
  marginTop: 10,
  textAlign: "center",
  fontSize: 28,
  fontWeight: "700",
  color: "#111111",
}

const $titleSkeleton: ViewStyle = {
  alignSelf: "center",
  marginTop: 10,
}

const $price: TextStyle = {
  textAlign: "center",
  fontSize: 30,
  color: "#CC5035",
  fontWeight: "700",
}

const $priceSkeleton: ViewStyle = {
  alignSelf: "center",
  marginTop: 6,
}

const $reasonCard: ViewStyle = {
  marginTop: 10,
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#E7E7E7",
  padding: 12,
}

const $reasonTitle: TextStyle = {
  fontSize: 14,
  fontWeight: "700",
  color: "#111111",
}

const $reasonBody: TextStyle = {
  marginTop: 4,
  fontSize: 12,
  color: "#2F2F2F",
}

const $reasonSkeleton: ViewStyle = {
  marginTop: 5,
}

const $image: ImageStyle = {
  width: 210,
  height: 210,
  borderRadius: 105,
  alignSelf: "center",
  marginTop: 12,
}

const $quantityRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginTop: 20,
  marginBottom: 16,
}

const $qtyButton: ViewStyle = {
  width: 34,
  height: 34,
  borderRadius: 8,
  backgroundColor: "#2C7A52",
  alignItems: "center",
  justifyContent: "center",
}

const $qtyButtonText: TextStyle = {
  color: "#FFF",
  fontSize: 20,
  fontWeight: "700",
}

const $qtyValue: TextStyle = {
  marginHorizontal: 18,
  fontSize: 24,
  fontWeight: "600",
}

const $ingredientsTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 10,
}

const $ingredientsWrap: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 24,
}

const $ingredientChip: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 18,
  paddingVertical: 10,
  paddingHorizontal: 14,
}

const $ingredientText: TextStyle = {
  color: "#2F2F2F",
}

const $addButton: ViewStyle = {
  backgroundColor: "#2C7A52",
  borderRadius: 12,
  paddingVertical: 16,
  alignItems: "center",
}

const $addButtonText: TextStyle = {
  color: "#FFFFFF",
  fontWeight: "700",
  letterSpacing: 0.8,
}
