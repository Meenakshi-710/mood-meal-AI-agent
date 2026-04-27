import { FC, useEffect, useMemo, useState } from "react"
import { Image, ImageStyle, Pressable, ScrollView, TextInput, TextStyle, View, ViewStyle } from "react-native"
import { router, useLocalSearchParams } from "expo-router"

import { Icon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Skeleton } from "@/components/Skeleton"
import { Text } from "@/components/Text"
import { FoodBottomNav } from "@/screens/Food/shared/FoodBottomNav"
import { api } from "@/services/api"
import { BackendRecommendationData } from "@/services/api/types"

type DiscoverMealItem = {
  id: string
  title: string
  subtitle: string
  calories: number
  price: number
  image: string
  reason: string
  ingredients: string[]
  category: string
}

const PROMPT_FALLBACK_CATALOG: Array<{ keywords: string[]; category: string; meals: Array<{ name: string; ingredients: string[]; price: number }> }> = [
  {
    keywords: ["spicy", "masala", "hot", "chilli"],
    category: "spicy",
    meals: [
      { name: "Paneer Tikka Masala Bowl", ingredients: ["paneer", "onion", "tomato", "spices"], price: 249 },
      { name: "Spicy Schezwan Noodles", ingredients: ["noodles", "capsicum", "garlic", "chilli"], price: 219 },
      { name: "Andhra Veg Curry with Rice", ingredients: ["vegetables", "curry", "rice", "chilli"], price: 239 },
    ],
  },
  {
    keywords: ["sweet", "dessert", "chocolate", "cake"],
    category: "sweet",
    meals: [
      { name: "Chocolate Oat Pancakes", ingredients: ["oats", "cocoa", "banana", "milk"], price: 199 },
      { name: "Fruit Yogurt Parfait", ingredients: ["yogurt", "berries", "granola", "honey"], price: 179 },
      { name: "Warm Cinnamon French Toast", ingredients: ["bread", "cinnamon", "egg", "maple"], price: 209 },
    ],
  },
  {
    keywords: ["light", "healthy", "tired", "night"],
    category: "light",
    meals: [
      { name: "Lemon Herb Grilled Bowl", ingredients: ["grilled veggies", "quinoa", "lemon", "herbs"], price: 229 },
      { name: "Miso Soup and Rice Set", ingredients: ["miso", "tofu", "rice", "greens"], price: 189 },
      { name: "Steamed Momos Plate", ingredients: ["momo", "veggies", "ginger", "chilli dip"], price: 169 },
    ],
  },
  {
    keywords: ["comfort", "low", "rain", "warm"],
    category: "comfort",
    meals: [
      { name: "Rajma Chawal Comfort Plate", ingredients: ["rajma", "rice", "onion", "spices"], price: 199 },
      { name: "Khichdi with Ghee Tadka", ingredients: ["rice", "lentils", "ghee", "cumin"], price: 179 },
      { name: "Tomato Basil Soup Combo", ingredients: ["tomato", "basil", "cream", "bread"], price: 169 },
    ],
  },
]

export const DiscoverScreen: FC = function DiscoverScreen() {
  const params = useLocalSearchParams<{ query?: string }>()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [query, setQuery] = useState(params.query ?? "")
  const [backendData, setBackendData] = useState<BackendRecommendationData | null>(null)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof params.query === "string") setQuery(params.query)
  }, [params.query])

  useEffect(() => {
    let isMounted = true
    const prompt = query.trim()
    if (!prompt) {
      setBackendData(null)
      setBackendError(null)
      return
    }

    setIsLoading(true)
    setBackendError(null)

    api
      .getRecommendations({ input: prompt, location: "Bengaluru" })
      .then((response) => {
        if (!isMounted) return
        if (response.ok && response.data?.ok && response.data.data) {
          setBackendData(response.data.data)
        } else {
          setBackendData(null)
          setBackendError("Backend request failed. Please ensure backend is running on :4000.")
        }
      })
      .catch(() => {
        if (!isMounted) return
        setBackendData(null)
        setBackendError("Backend request failed. Please ensure backend is running on :4000.")
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [query])

  const extractedMood = backendData?.extracted?.mood ?? "unknown"
  const extractedCraving = backendData?.extracted?.craving ?? "unknown"
  const extractedEnergy = backendData?.extracted?.energy ?? "unknown"
  const extractedContext = backendData
    ? [backendData.extracted?.context, backendData.context?.weather?.condition, backendData.context?.time?.mealType]
        .filter(Boolean)
        .map(String)
    : []

  const recommendationText = backendData?.recommendationText ?? "Waiting for backend recommendation."

  const contextChips = useMemo(() => extractedContext.map((label) => ({ id: label, label })), [extractedContext])

  const dynamicCategories = useMemo(() => {
    const categories = new Set<string>(["all"])
    const decisionCategory = backendData?.decision?.category
    if (decisionCategory) categories.add(decisionCategory)
    return Array.from(categories)
  }, [backendData])

  const backendItems = useMemo<DiscoverMealItem[]>(() => {
    if (!backendData) return []
    const menu = backendData.menu ?? []
    const restaurantName = backendData.restaurants?.[0]?.name ?? "Recommended Restaurant"

    return menu.map((menuItem, index) => {
      return {
        id: menuItem.id || `${index}`,
        title: menuItem.name,
        subtitle: menuItem.subtitle || restaurantName,
        calories: 0,
        price: menuItem.price ?? 0,
        image: menuItem.image || `https://source.unsplash.com/600x600/?${encodeURIComponent(menuItem.name + " food")}`,
        reason: backendData.recommendationText,
        ingredients: menuItem.ingredients?.length
          ? menuItem.ingredients.slice(0, 6)
          : (backendData.decision?.suggestions ?? []).slice(0, 4),
        category: backendData.decision?.category || "all",
      }
    })
  }, [backendData])

  const promptFallbackItems = useMemo<DiscoverMealItem[]>(() => {
    const prompt = query.trim().toLowerCase()
    if (!prompt) return []

    const matchedGroup =
      PROMPT_FALLBACK_CATALOG.find((group) => group.keywords.some((keyword) => prompt.includes(keyword))) ||
      PROMPT_FALLBACK_CATALOG.find((group) => group.category === "comfort")

    if (!matchedGroup) return []

    return matchedGroup.meals.map((meal, index) => ({
      id: `prompt-fallback-${matchedGroup.category}-${index}`,
      title: meal.name,
      subtitle: "Prompt-based suggestion",
      calories: 0,
      price: meal.price,
      image: `https://source.unsplash.com/600x600/?${encodeURIComponent(meal.name + " food")}`,
      reason: `Suggested for your prompt: "${query.trim()}"`,
      ingredients: meal.ingredients,
      category: matchedGroup.category,
    }))
  }, [query])

  const recommendationItems = backendItems.length ? backendItems : promptFallbackItems

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") return recommendationItems
    return recommendationItems.filter((item) =>
      [item.subtitle, item.category, backendData?.decision?.category, backendData?.decision?.tasteProfile]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(selectedCategory.toLowerCase()),
    )
  }, [backendData, recommendationItems, selectedCategory])

  const aiReplyMessage = useMemo(() => {
    if (!query.trim()) return "Tell me how you feel and what you are craving, and I will suggest the best meal."

    const mood = extractedMood !== "unknown" ? extractedMood : "this mood"
    const craving = extractedCraving !== "unknown" ? extractedCraving : "your craving"
    const contextText = extractedContext.length ? ` in ${extractedContext.join(", ")}` : ""
    const topMeal = filteredItems[0]?.title || backendData?.menu?.[0]?.name

    if (topMeal) {
      return `You can try ${topMeal} if you are feeling ${mood} and craving ${craving}${contextText}.`
    }

    return `You can try a comforting meal if you are feeling ${mood} and craving ${craving}${contextText}.`
  }, [backendData?.menu, extractedContext, extractedCraving, extractedMood, filteredItems, query])

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      backgroundColor="#ECECEC"
      contentContainerStyle={$screenContentContainer}
    >
      <View style={$phoneFrame}>
        <View style={$shell}>
          <View style={$titleRow}>
            <View>
              <Text text="AI Recommendations" style={$heading} />
              <Text text="Based on mood + craving + context" style={$subheading} />
            </View>
            <Pressable onPress={() => router.push("/")}>
              <Icon icon="back" size={20} />
            </Pressable>
          </View>

          <ScrollView style={$scrollArea} contentContainerStyle={$scrollContent} showsVerticalScrollIndicator={false}>
            <View style={$searchRow}>
              <View style={$searchContainer}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Refine recommendation prompt"
                  style={$searchInput}
                  placeholderTextColor="#4A4A4A"
                />
                <Icon icon="view" size={16} />
              </View>
              <View style={$filtersButton}>
                <Icon icon="settings" size={16} color="#FFF" />
              </View>
            </View>

            <View style={$summaryCard}>
              {isLoading ? (
                <>
                  <Skeleton width="40%" height={14} borderRadius={8} />
                  <Skeleton width="95%" height={12} borderRadius={8} style={$skeletonGap} />
                  <Skeleton width="75%" height={12} borderRadius={8} style={$skeletonGap} />
                  <Skeleton width="100%" height={12} borderRadius={8} style={$skeletonGap} />
                </>
              ) : (
                <>
                  <Text text="Extracted Signals" style={$summaryTitle} />
                  <Text
                    text={`Mood: ${extractedMood} • Craving: ${extractedCraving} • Energy: ${extractedEnergy}`}
                    style={$summaryBody}
                  />
                  <Text text={`Context: ${extractedContext.join(" • ")}`} style={$summaryBody} />
                  <Text text={recommendationText} style={$summaryRecommendation} />
                </>
              )}
              {isLoading ? <Text text="Loading from backend..." style={$summaryInfo} /> : null}
              {backendError ? <Text text={backendError} style={$summaryWarning} /> : null}
            </View>

            {!isLoading && !backendError ? (
              <View style={$aiReplyCard}>
                <Text text="AI Reply" style={$aiReplyTitle} />
                <Text text={aiReplyMessage} style={$aiReplyText} />
              </View>
            ) : null}

            <View style={$chipsRow}>
              {isLoading
                ? Array.from({ length: 3 }, (_, index) => <Skeleton key={`context-skeleton-${index}`} width={92} height={26} borderRadius={12} />)
                : contextChips.map((context) => (
                  <View key={context.id} style={$contextChip}>
                    <Text text={context.label} style={$contextChipText} />
                  </View>
                ))}
            </View>

            <View style={$chipsRow}>
              {isLoading
                ? Array.from({ length: 3 }, (_, index) => <Skeleton key={`category-skeleton-${index}`} width={80} height={34} borderRadius={14} />)
                : dynamicCategories.map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={[$chip, selectedCategory === category && $chipActive]}
                  >
                    <Text text={category.toUpperCase()} style={[$chipLabel, selectedCategory === category && $chipLabelActive]} />
                  </Pressable>
                ))}
            </View>

            <View style={$sectionRow}>
              <Text text="Recommended Meals" style={$sectionTitle} />
              <Text text={`${filteredItems.length} results`} style={$seeAll} />
            </View>

            {isLoading
              ? Array.from({ length: 3 }, (_, index) => (
                <View key={`meal-skeleton-${index}`} style={$listItem}>
                  <View style={$listItemLeft}>
                    <Skeleton width="70%" height={18} borderRadius={8} />
                    <Skeleton width="55%" height={12} borderRadius={8} style={$skeletonGap} />
                    <Skeleton width="45%" height={12} borderRadius={8} style={$skeletonGap} />
                    <Skeleton width={84} height={24} borderRadius={8} style={$skeletonGap} />
                  </View>
                  <Skeleton width={88} height={88} borderRadius={44} />
                </View>
              ))
              : filteredItems.map((item) => (
              <Pressable
                key={item.id}
                style={$listItem}
                onPress={() =>
                  router.push(
                    (`/meal/${item.id}?title=${encodeURIComponent(item.title)}&price=${item.price}&image=${encodeURIComponent(item.image)}&reason=${encodeURIComponent(item.reason)}&ingredients=${encodeURIComponent(item.ingredients.join(","))}`) as never,
                  )
                }
              >
                <View style={$listItemLeft}>
                  <Text text={item.title} style={$listTitle} />
                  <Text text={item.subtitle} style={$listSub} />
                  <Text text={backendData?.decision?.tasteProfile || "matched profile"} style={$listCalories} />
                  <Text text={`Rs ${item.price.toFixed(0)}`} style={$listPrice} />
                </View>
                <Image source={{ uri: item.image }} style={$listImage} />
              </Pressable>
              ))}
          </ScrollView>
        </View>
        <FoodBottomNav active="discover" />
      </View>
    </Screen>
  )
}

const $phoneFrame: ViewStyle = {
  flex: 1,
  width: "100%",
  height: "100%",
  maxWidth: 420,
  alignSelf: "center",
  backgroundColor: "#F7F7F7",
  borderRadius: 28,
  overflow: "hidden",
}

const $shell: ViewStyle = {
  flex: 1,
}

const $screenContentContainer: ViewStyle = {
  flex: 1,
  justifyContent: "flex-start",
}

const $titleRow: ViewStyle = {
  paddingHorizontal: 18,
  paddingTop: 14,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 8,
}

const $scrollArea: ViewStyle = {
  flex: 1,
}

const $scrollContent: ViewStyle = {
  paddingHorizontal: 18,
  paddingBottom: 12,
}

const $heading: TextStyle = {
  fontSize: 24,
  fontWeight: "700",
  lineHeight: 30,
  color: "#111111",
}

const $subheading: TextStyle = {
  fontSize: 13,
  color: "#2F2F2F",
}

const $searchRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 20,
}

const $searchContainer: ViewStyle = {
  flex: 1,
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#E8E8E8",
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 12,
  marginRight: 8,
}

const $searchInput: TextStyle = {
  flex: 1,
  fontSize: 15,
  paddingVertical: 10,
  color: "#111111",
}

const $filtersButton: ViewStyle = {
  width: 42,
  height: 42,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#2C7A52",
}

const $summaryCard: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#E7E7E7",
  padding: 12,
  marginBottom: 10,
}

const $summaryTitle: TextStyle = {
  fontSize: 14,
  fontWeight: "700",
  marginBottom: 4,
}

const $summaryBody: TextStyle = {
  fontSize: 12,
  color: "#2F2F2F",
}

const $summaryRecommendation: TextStyle = {
  marginTop: 6,
  fontSize: 12,
  color: "#2C7A52",
  fontWeight: "600",
}

const $summaryInfo: TextStyle = {
  marginTop: 6,
  fontSize: 11,
  color: "#1C5D3F",
}

const $summaryWarning: TextStyle = {
  marginTop: 6,
  fontSize: 11,
  color: "#A54F31",
}

const $aiReplyCard: ViewStyle = {
  backgroundColor: "#EEF7F2",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#D2E9DC",
  padding: 12,
  marginBottom: 10,
}

const $aiReplyTitle: TextStyle = {
  fontSize: 13,
  fontWeight: "700",
  color: "#1C5D3F",
  marginBottom: 4,
}

const $aiReplyText: TextStyle = {
  fontSize: 12,
  color: "#1C5D3F",
  lineHeight: 18,
}

const $skeletonGap: ViewStyle = {
  marginTop: 6,
}

const $chipsRow: ViewStyle = {
  flexDirection: "row",
  marginBottom: 10,
  gap: 8,
}

const $contextChip: ViewStyle = {
  backgroundColor: "#EEF7F2",
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 12,
}

const $contextChipText: TextStyle = {
  color: "#2C7A52",
  fontSize: 11,
}

const $chip: ViewStyle = {
  minWidth: 80,
  borderWidth: 1,
  borderColor: "#E8E8E8",
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 8,
  backgroundColor: "#FFFFFF",
}

const $chipActive: ViewStyle = {
  borderColor: "#2C7A52",
  backgroundColor: "#F1F7F4",
}

const $chipLabel: TextStyle = {
  fontSize: 11,
  color: "#222222",
}

const $chipLabelActive: TextStyle = {
  color: "#2C7A52",
  fontWeight: "600",
}

const $sectionRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
}

const $sectionTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "700",
}

const $seeAll: TextStyle = {
  color: "#2F2F2F",
}

const $listItem: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
}

const $listItemLeft: ViewStyle = {
  flex: 1,
  paddingRight: 8,
}

const $listTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "700",
  lineHeight: 22,
}

const $listSub: TextStyle = {
  color: "#2F2F2F",
  marginTop: 3,
}

const $listCalories: TextStyle = {
  color: "#2F2F2F",
  marginTop: 3,
}

const $listPrice: TextStyle = {
  marginTop: 6,
  color: "#D44B2A",
  fontSize: 22,
  fontWeight: "800",
  lineHeight: 26,
}

const $listImage: ImageStyle = {
  width: 88,
  height: 88,
  borderRadius: 44,
}
