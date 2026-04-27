import { useLocalSearchParams } from "expo-router"

import { MealDetailsScreen } from "@/screens/MealDetailsScreen"

export default function MealDetailsRoute() {
  const params = useLocalSearchParams<{
    id?: string
    reason?: string
    title?: string
    price?: string
    image?: string
    ingredients?: string
  }>()

  return (
    <MealDetailsScreen
      mealId={params.id}
      reason={params.reason}
      title={params.title}
      price={params.price}
      image={params.image}
      ingredients={params.ingredients}
    />
  )
}
