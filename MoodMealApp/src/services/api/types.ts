/**
 * These types indicate the shape of the data you expect to receive from your
 * API endpoint, assuming it's a JSON object like we have.
 */
export interface EpisodeItem {
  title: string
  pubDate: string
  link: string
  guid: string
  author: string
  thumbnail: string
  description: string
  content: string
  enclosure: {
    link: string
    type: string
    length: number
    duration: number
    rating: { scheme: string; value: string }
  }
  categories: string[]
}

export interface ApiFeedResponse {
  status: string
  feed: {
    url: string
    title: string
    link: string
    author: string
    description: string
    image: string
  }
  items: EpisodeItem[]
}

/**
 * The options used to configure apisauce.
 */
export interface ApiConfig {
  /**
   * The URL of the api.
   */
  url: string

  /**
   * Milliseconds before we timeout the request.
   */
  timeout: number
}

export interface HealthResponse {
  ok: boolean
  service: string
  message: string
}

export interface RecommendationRequest {
  input: string
  location?: string
}

export interface SignalTag {
  id: string
  label: string
}

export interface MealItem {
  id: string
  name: string
  subtitle?: string
  price?: number
  image?: string
  ingredients?: string[]
}

export interface HomeCatalogResponse {
  ok: boolean
  data: {
    moodSignals: SignalTag[]
    cravingSignals: SignalTag[]
    quickPicks: MealItem[]
    todayMatch: {
      title: string
      reason: string
      meal: MealItem
    } | null
  }
}

export interface BackendRecommendationData {
  extracted: {
    mood: string
    craving: string
    energy: string
    context: string
    extractionSource?: string
  }
  context: {
    weather: {
      condition?: string
      source?: string
      location?: string
    }
    time: {
      mealType?: string
      hour?: number
      partOfDay?: string
    }
  }
  decision: {
    category?: string
    tasteProfile?: string
    suggestions?: string[]
  }
  restaurants?: Array<{ id: string; name: string }>
  menu?: Array<{ id: string; name: string; price?: number; image?: string; ingredients?: string[]; subtitle?: string }>
  recommendationText: string
}

export interface RecommendationResponse {
  ok: boolean
  data: BackendRecommendationData
}

export interface MealDetailsResponse {
  ok: boolean
  data: MealItem
}
