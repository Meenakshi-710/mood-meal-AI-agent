import { FC, useEffect, useMemo, useState } from "react"
import { Image, ImageStyle, Pressable, ScrollView, TextInput, TextStyle, View, ViewStyle } from "react-native"
import { router } from "expo-router"

import { Icon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Skeleton } from "@/components/Skeleton"
import { Text } from "@/components/Text"
import { FoodBottomNav } from "@/screens/Food/shared/FoodBottomNav"
import { api } from "@/services/api"
import { MealItem, SignalTag } from "@/services/api/types"

const FALLBACK_MOOD_SIGNALS: SignalTag[] = [
  { id: "low", label: "Feeling low" },
  { id: "stressed", label: "Stressed" },
  { id: "happy", label: "Happy" },
  { id: "tired", label: "Tired" },
]

const FALLBACK_CRAVING_SIGNALS: SignalTag[] = [
  { id: "spicy", label: "Spicy" },
  { id: "warm", label: "Warm comfort" },
  { id: "light", label: "Light meal" },
  { id: "sweet", label: "Sweet" },
]

const CONTEXT_PROMPTS = [
  "for a rainy evening",
  "for a quick lunch break",
  "for a late-night light dinner",
  "for a cozy weekend",
]
const DESSERT_HINTS = ["cake", "pastry", "dessert", "cupcake", "brownie", "donut", "cookie", "tart"]
const SAVORY_HINTS = ["spicy", "curry", "bowl", "rice", "meal", "masala", "soup", "noodle", "wrap", "biryani"]

const toPhrase = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ")

const buildCuratedPrompt = (type: "mood" | "craving" | "context", value: string, existingInput: string) => {
  const normalizedValue = toPhrase(value)
  const hasExisting = existingInput.trim().length > 0

  if (type === "mood") {
    if (!hasExisting) return `I am feeling ${normalizedValue} and want a meal recommendation.`
    return `${existingInput.trim()} I am currently feeling ${normalizedValue}.`
  }

  if (type === "craving") {
    if (!hasExisting) return `I am craving ${normalizedValue} flavors right now.`
    return `${existingInput.trim()} I am craving ${normalizedValue} flavors.`
  }

  if (!hasExisting) return `Please suggest something suitable ${normalizedValue}.`
  return `${existingInput.trim()} Please keep it suitable ${normalizedValue}.`
}

const hasAnyKeyword = (text: string, keywords: string[]) => keywords.some((keyword) => text.includes(keyword))

const resolveMealImage = (item: MealItem) => {
  const searchText = `${item.name || ""} ${item.subtitle || ""}`.trim().toLowerCase()
  const imageText = (item.image || "").toLowerCase()
  const hasSavoryIntent = hasAnyKeyword(searchText, SAVORY_HINTS)
  const looksLikeDessertImage = hasAnyKeyword(imageText, DESSERT_HINTS)
  const fallbackQuery = encodeURIComponent(`${item.name || "indian"} savory meal`)

  if (!item.image || (hasSavoryIntent && looksLikeDessertImage)) {
    return `https://source.unsplash.com/600x600/?${fallbackQuery}`
  }

  return item.image
}

export const HomeScreen: FC = function HomeScreen() {
  const [moodInput, setMoodInput] = useState("")
  const [moodSignals, setMoodSignals] = useState<SignalTag[]>([])
  const [cravingSignals, setCravingSignals] = useState<SignalTag[]>([])
  const [quickPicks, setQuickPicks] = useState<MealItem[]>([])
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null)
  const [selectedCravingId, setSelectedCravingId] = useState<string | null>(null)
  const [selectedContextPrompt, setSelectedContextPrompt] = useState<string | null>(null)
  const [todayMatchReason, setTodayMatchReason] = useState("Because: low mood + spicy craving + rainy context")
  const [todayMatchTitle, setTodayMatchTitle] = useState("Lentil Curry Bowl")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    api
      .getHomeCatalog()
      .then((response) => {
        if (!active || !response.ok || !response.data?.ok || !response.data.data) return
        const { moodSignals: moodTags, cravingSignals: cravingTags, quickPicks: picks, todayMatch } = response.data.data
        setMoodSignals(moodTags || [])
        setCravingSignals(cravingTags || [])
        setQuickPicks(picks || [])
        if (todayMatch) {
          setTodayMatchReason(todayMatch.reason || todayMatchReason)
          setTodayMatchTitle(todayMatch.title || todayMatch.meal?.name || todayMatchTitle)
        }
      })
      .catch(() => {
        // Keep UI resilient if backend is temporarily unavailable.
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const firstMealImage = useMemo(() => {
    if (!quickPicks[0]) return "https://images.unsplash.com/photo-1547592166-23ac45744acd"
    return resolveMealImage(quickPicks[0])
  }, [quickPicks])
  const resolvedMoodSignals = moodSignals.length ? moodSignals : FALLBACK_MOOD_SIGNALS
  const resolvedCravingSignals = cravingSignals.length ? cravingSignals : FALLBACK_CRAVING_SIGNALS
  const selectedMoodLabel = resolvedMoodSignals.find((signal) => signal.id === selectedMoodId)?.label
  const selectedCravingLabel = resolvedCravingSignals.find((signal) => signal.id === selectedCravingId)?.label

  const buildSelectionPrompt = (moodLabel?: string, cravingLabel?: string, contextPrompt?: string) => {
    const parts: string[] = []
    if (moodLabel) parts.push(`I am feeling ${toPhrase(moodLabel)}`)
    if (cravingLabel) parts.push(`and craving ${toPhrase(cravingLabel)} flavors`)
    if (contextPrompt) parts.push(`${parts.length ? "" : "Please suggest something suitable"} ${toPhrase(contextPrompt)}`)

    if (!parts.length) return ""
    const base = parts.join(" ").replace(/\s+/g, " ").trim()
    return base.endsWith(".") ? base : `${base}.`
  }

  useEffect(() => {
    const generatedPrompt = buildSelectionPrompt(selectedMoodLabel, selectedCravingLabel, selectedContextPrompt || undefined)
    if (generatedPrompt) setMoodInput(generatedPrompt)
  }, [selectedMoodLabel, selectedCravingLabel, selectedContextPrompt])

  const startRecommendationFlow = () => {
    const prompt = moodInput.trim() || "I feel low and want something spicy for a rainy evening"
    router.push(`/discover?query=${encodeURIComponent(prompt)}` as never)
  }

  const onSelectSuggestion = (type: "mood" | "craving" | "context", value: string, id?: string) => {
    if (type === "mood" && id) {
      setSelectedMoodId((prev) => (prev === id ? null : id))
      return
    }
    if (type === "craving" && id) {
      setSelectedCravingId((prev) => (prev === id ? null : id))
      return
    }
    setSelectedContextPrompt((prev) => (prev === value ? null : value))
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      backgroundColor="#ECECEC"
      contentContainerStyle={$screenContentContainer}
    >
      <View style={$phoneFrame}>
        <View style={$shell}>
          <View style={$headerRow}>
            <View>
              <Text text="Hi there!" style={$greeting} />
              <Text text="Mood Meal AI Agent" style={$title} />
              <Text text="Share your mood, craving, and context. We suggest what to eat." style={$subtitle} />
            </View>
            <View style={$headerIcons}>
              <Icon icon="bell" size={18} />
              <Icon icon="menu" size={18} />
            </View>
          </View>

          <ScrollView style={$scrollArea} contentContainerStyle={$scrollContent} showsVerticalScrollIndicator={false}>
            <View style={$promptCard}>
              <Text text="How are you feeling right now?" style={$promptTitle} />
              <TextInput
                value={moodInput}
                onChangeText={setMoodInput}
                placeholder="I feel low and want something warm and spicy..."
                placeholderTextColor="#808080"
                style={$promptInput}
                multiline
                numberOfLines={2}
                maxLength={180}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={$contextRow}>
                {CONTEXT_PROMPTS.map((contextPrompt) => (
                  <Pressable
                    key={contextPrompt}
                    style={[$contextChip, selectedContextPrompt === contextPrompt && $contextChipActive]}
                    onPress={() => onSelectSuggestion("context", contextPrompt)}
                  >
                    <Text text={contextPrompt} style={[$contextChipText, selectedContextPrompt === contextPrompt && $contextChipTextActive]} />
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable style={[$primaryButton, isLoading && $primaryButtonDisabled]} onPress={startRecommendationFlow} disabled={isLoading}>
                <Text text={isLoading ? "Loading recommendations..." : "Get AI Meal Suggestions"} style={$primaryButtonText} />
              </Pressable>
            </View>

            <Text text="Mood Signals" style={$sectionTitle} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={$chipsRow}>
              {isLoading
                ? Array.from({ length: 4 }, (_, index) => <Skeleton key={`mood-skeleton-${index}`} width={90} height={30} borderRadius={14} />)
                : resolvedMoodSignals.map((signal) => (
                <Pressable
                  key={signal.id}
                  style={[$chip, selectedMoodId === signal.id && $chipActive]}
                  onPress={() => onSelectSuggestion("mood", signal.label, signal.id)}
                >
                  <Text text={signal.label} style={[$chipText, selectedMoodId === signal.id && $chipTextActive]} />
                </Pressable>
                ))}
            </ScrollView>

            <Text text="Craving" style={$sectionTitle} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={$chipsRow}>
              {isLoading
                ? Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={`craving-skeleton-${index}`} width={90} height={30} borderRadius={14} />
                ))
                : resolvedCravingSignals.map((signal) => (
                <Pressable
                  key={signal.id}
                  style={[$chip, selectedCravingId === signal.id && $chipActive]}
                  onPress={() => onSelectSuggestion("craving", signal.label, signal.id)}
                >
                  <Text text={signal.label} style={[$chipText, selectedCravingId === signal.id && $chipTextActive]} />
                </Pressable>
                ))}
            </ScrollView>

            <Text text="Quick Picks" style={$sectionTitle} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={$cardsRow}>
              {isLoading
                ? Array.from({ length: 3 }, (_, index) => (
                  <View key={`quick-skeleton-${index}`} style={$mealCard}>
                    <Skeleton width={92} height={92} borderRadius={46} style={$mealSkeletonImage} />
                    <Skeleton width="70%" height={16} borderRadius={8} />
                    <Skeleton width="55%" height={12} borderRadius={8} style={$mealSkeletonLine} />
                    <View style={$priceRow}>
                      <Skeleton width={50} height={18} borderRadius={8} />
                      <Skeleton width={32} height={32} borderRadius={16} />
                    </View>
                  </View>
                ))
                : quickPicks.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/meal/${item.id}` as never)}
                  style={$mealCard}
                >
                  <Image source={{ uri: resolveMealImage(item) }} style={$mealImage} />
                  <Text text={item.name} style={$mealTitle} />
                  <Text text={item.subtitle || "Recommended meal"} style={$mealSubTitle} />
                  <View style={$priceRow}>
                    <Text text={`₹${(item.price || 0).toFixed(2)}`} style={$mealPrice} />
                    <View style={$plusButton}>
                      <Text text="+" style={$plusText} />
                    </View>
                  </View>
                </Pressable>
                ))}
            </ScrollView>
            {!isLoading && quickPicks.length === 0 ? (
              <View style={$emptyQuickPicksCard}>
                <Text text="No quick picks available right now." style={$emptyQuickPicksTitle} />
                <Text text="Try the AI prompt above to get a personalized recommendation." style={$emptyQuickPicksSubtitle} />
              </View>
            ) : null}

            <View style={$specialCard}>
              {isLoading ? <Skeleton width={56} height={56} borderRadius={28} style={$specialImage} /> : <Image source={{ uri: firstMealImage }} style={$specialImage} />}
              <View style={$specialContent}>
                <Text text="Today AI Match" style={$specialBadge} />
                {isLoading ? (
                  <>
                    <Skeleton width="80%" height={14} borderRadius={8} />
                    <Skeleton width="95%" height={12} borderRadius={8} style={$mealSkeletonLine} />
                  </>
                ) : (
                  <>
                    <Text text={todayMatchTitle} style={$specialName} />
                    <Text text={todayMatchReason} style={$specialReason} />
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
        <FoodBottomNav active="home" />
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

const $headerRow: ViewStyle = {
  paddingHorizontal: 18,
  paddingTop: 14,
  flexDirection: "row",
  justifyContent: "space-between",
  gap: 16,
  paddingBottom: 10,
}

const $scrollArea: ViewStyle = {
  flex: 1,
}

const $scrollContent: ViewStyle = {
  paddingHorizontal: 18,
  paddingBottom: 12,
}

const $headerIcons: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-start",
  gap: 10,
  paddingTop: 6,
}

const $greeting: TextStyle = {
  fontSize: 14,
  color: "#2F2F2F",
}

const $title: TextStyle = {
  fontSize: 28,
  fontWeight: "700",
  lineHeight: 34,
  marginTop: 4,
  color: "#111111",
}

const $subtitle: TextStyle = {
  marginTop: 4,
  fontSize: 14,
  lineHeight: 20,
  color: "#2F2F2F",
}

const $promptCard: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 14,
  borderWidth: 1,
  borderColor: "#E8E8E8",
  marginBottom: 16,
}

const $promptTitle: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#111111",
}

const $promptInput: TextStyle = {
  marginTop: 10,
  borderWidth: 1,
  borderColor: "#DFDFDF",
  borderRadius: 10,
  paddingHorizontal: 10,
  paddingVertical: 10,
  fontSize: 14,
  color: "#111111",
}

const $primaryButton: ViewStyle = {
  marginTop: 10,
  backgroundColor: "#2C7A52",
  borderRadius: 10,
  paddingVertical: 12,
  alignItems: "center",
}

const $primaryButtonDisabled: ViewStyle = {
  opacity: 0.7,
}

const $primaryButtonText: TextStyle = {
  color: "#FFFFFF",
  fontWeight: "700",
  fontSize: 14,
}

const $contextRow: ViewStyle = {
  gap: 8,
  paddingTop: 10,
}

const $contextChip: ViewStyle = {
  backgroundColor: "#F1F7F4",
  borderRadius: 12,
  paddingHorizontal: 10,
  paddingVertical: 6,
}

const $contextChipActive: ViewStyle = {
  backgroundColor: "#2C7A52",
}

const $contextChipText: TextStyle = {
  fontSize: 11,
  color: "#1C5D3F",
}

const $contextChipTextActive: TextStyle = {
  color: "#FFFFFF",
}

const $chipsRow: ViewStyle = {
  gap: 8,
  paddingBottom: 6,
}

const $chip: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#E4E4E4",
  paddingHorizontal: 12,
  paddingVertical: 7,
}

const $chipText: TextStyle = {
  fontSize: 12,
  color: "#222222",
}

const $chipActive: ViewStyle = {
  borderColor: "#2C7A52",
  backgroundColor: "#EEF7F2",
}

const $chipTextActive: TextStyle = {
  color: "#1C5D3F",
  fontWeight: "600",
}

const $cardsRow: ViewStyle = {
  gap: 12,
  paddingVertical: 6,
}

const $mealCard: ViewStyle = {
  width: 170,
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 12,
}

const $mealImage: ImageStyle = {
  width: 92,
  height: 92,
  borderRadius: 46,
  alignSelf: "center",
  marginBottom: 8,
}

const $mealSkeletonImage: ViewStyle = {
  alignSelf: "center",
  marginBottom: 8,
}

const $mealSkeletonLine: ViewStyle = {
  marginTop: 6,
}

const $mealTitle: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
}

const $mealSubTitle: TextStyle = {
  marginTop: 2,
  fontSize: 12,
  color: "#2F2F2F",
}

const $priceRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 8,
}

const $mealPrice: TextStyle = {
  fontSize: 18,
  fontWeight: "700",
}

const $plusButton: ViewStyle = {
  backgroundColor: "#111",
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
}

const $plusText: TextStyle = {
  color: "#FFF",
  fontSize: 18,
  fontWeight: "700",
}

const $sectionTitle: TextStyle = {
  marginTop: 10,
  marginBottom: 8,
  fontSize: 16,
  fontWeight: "700",
}

const $specialCard: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 12,
  flexDirection: "row",
  alignItems: "flex-start",
  marginTop: 8,
  marginBottom: 12,
}

const $emptyQuickPicksCard: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#E8E8E8",
  padding: 12,
  marginTop: 4,
  marginBottom: 10,
}

const $emptyQuickPicksTitle: TextStyle = {
  fontSize: 14,
  fontWeight: "700",
  color: "#111111",
}

const $emptyQuickPicksSubtitle: TextStyle = {
  marginTop: 4,
  fontSize: 12,
  color: "#2F2F2F",
}

const $specialImage: ImageStyle = {
  width: 56,
  height: 56,
  borderRadius: 28,
  marginRight: 10,
}

const $specialContent: ViewStyle = {
  flex: 1,
}

const $specialBadge: TextStyle = {
  fontSize: 12,
  color: "#2C7A52",
  fontWeight: "700",
}

const $specialName: TextStyle = {
  fontSize: 14,
  fontWeight: "700",
  marginTop: 2,
  color: "#111111",
}

const $specialReason: TextStyle = {
  marginTop: 3,
  fontSize: 12,
  color: "#2F2F2F",
}
