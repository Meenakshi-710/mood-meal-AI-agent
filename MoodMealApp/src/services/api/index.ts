/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://github.com/tequity/rn-cli/blob/master/docs/boilerplate/app/services/README.md)
 * documentation for more details.
 */
import { ApisauceInstance, create } from "apisauce"

import Config from "@/config"

import type {
  ApiConfig,
  HealthResponse,
  HomeCatalogResponse,
  MealDetailsResponse,
  RecommendationRequest,
  RecommendationResponse,
} from "./types"

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 30000,
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  async health() {
    const response = await this.apisauce.get<HealthResponse>("/health")
    return response
  }

  async getRecommendations(payload: RecommendationRequest) {
    const response = await this.apisauce.post<RecommendationResponse>("/recommendations", payload)
    return response
  }

  async getHomeCatalog() {
    const response = await this.apisauce.get<HomeCatalogResponse>("/catalog/home")
    return response
  }

  async getMealDetails(mealId: string) {
    const response = await this.apisauce.get<MealDetailsResponse>(`/meals/${encodeURIComponent(mealId)}`)
    return response
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
