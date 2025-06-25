import axios from "axios"
import fs from "fs"
import { ModelProvider, ModelProviderConfig, ModelResponse, ProblemAnalysis, SolutionResponse } from "../ModelProvider"

export class RedHatProvider extends ModelProvider {
  private baseUrl: string
  private modelName: string
  private apiKey: string

  constructor(config: ModelProviderConfig) {
    super(config)
    this.baseUrl = config.baseUrl || "https://api.redhat.com/ai/v1"
    this.modelName = config.modelName || "meta-llama/Llama-3.1-8B-Instruct"
    this.apiKey = config.apiKey!
  }

  private async makeRequest(messages: any[], includeImages: boolean = false): Promise<string> {
    try {
      const payload = {
        model: this.modelName,
        messages: messages,
        max_tokens: 4096,
        temperature: 0.7,
        stream: false
      }

      const response = await axios.post(`${this.baseUrl}/chat/completions`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return response.data.choices[0].message.content
    } catch (error) {
      console.error("Red Hat API request failed:", error)
      throw error
    }
  }

  private async imageToBase64(imagePath: string): Promise<string> {
    const imageData = await fs.promises.readFile(imagePath)
    return imageData.toString("base64")
  }

  async extractProblemFromImages(imagePaths: string[]): Promise<ProblemAnalysis> {
    try {
      const imageContents = await Promise.all(
        imagePaths.map(async (path) => ({
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${await this.imageToBase64(path)}`
          }
        }))
      )

      const messages = [
        {
          role: "system",
          content: this.systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a wingman. Please analyze these images and extract the following information in JSON format:
{
  "problem_statement": "A clear statement of the problem or situation depicted in the images.",
  "context": "Relevant background or context from the images.",
  "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
  "reasoning": "Explanation of why these suggestions are appropriate."
}
Important: Return ONLY the JSON object, without any markdown formatting or code blocks.`
            },
            ...imageContents
          ]
        }
      ]

      const response = await this.makeRequest(messages, true)
      const cleanedResponse = this.cleanJsonResponse(response)
      return JSON.parse(cleanedResponse)
    } catch (error) {
      console.error("Error extracting problem from images with Red Hat:", error)
      throw error
    }
  }

  async generateSolution(problemInfo: any): Promise<SolutionResponse> {
    const messages = [
      {
        role: "system",
        content: this.systemPrompt
      },
      {
        role: "user",
        content: `Given this problem or situation:
${JSON.stringify(problemInfo, null, 2)}

Please provide your response in the following JSON format:
{
  "solution": {
    "code": "The code or main answer here.",
    "problem_statement": "Restate the problem or situation.",
    "context": "Relevant background/context.",
    "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
    "reasoning": "Explanation of why these suggestions are appropriate."
  }
}
Important: Return ONLY the JSON object, without any markdown formatting or code blocks.`
      }
    ]

    console.log("[RedHatProvider] Calling Red Hat Model as a Service for solution...");
    try {
      const response = await this.makeRequest(messages)
      console.log("[RedHatProvider] Red Hat API returned result.");
      const cleanedResponse = this.cleanJsonResponse(response)
      const parsed = JSON.parse(cleanedResponse)
      console.log("[RedHatProvider] Parsed LLM response:", parsed)
      return parsed
    } catch (error) {
      console.error("[RedHatProvider] Error in generateSolution:", error);
      throw error;
    }
  }

  async debugSolutionWithImages(problemInfo: any, currentCode: string, debugImagePaths: string[]): Promise<SolutionResponse> {
    try {
      const imageContents = await Promise.all(
        debugImagePaths.map(async (path) => ({
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${await this.imageToBase64(path)}`
          }
        }))
      )

      const messages = [
        {
          role: "system",
          content: this.systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a wingman. Given:
1. The original problem or situation: ${JSON.stringify(problemInfo, null, 2)}
2. The current response or approach: ${currentCode}
3. The debug information in the provided images

Please analyze the debug information and provide feedback in this JSON format:
{
  "solution": {
    "code": "The code or main answer here.",
    "problem_statement": "Restate the problem or situation.",
    "context": "Relevant background/context.",
    "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
    "reasoning": "Explanation of why these suggestions are appropriate."
  }
}
Important: Return ONLY the JSON object, without any markdown formatting or code blocks.`
            },
            ...imageContents
          ]
        }
      ]

      const response = await this.makeRequest(messages, true)
      const cleanedResponse = this.cleanJsonResponse(response)
      const parsed = JSON.parse(cleanedResponse)
      console.log("[RedHatProvider] Parsed debug LLM response:", parsed)
      return parsed
    } catch (error) {
      console.error("Error debugging solution with images using Red Hat:", error)
      throw error
    }
  }

  async analyzeAudioFile(audioPath: string): Promise<ModelResponse> {
    // Note: Red Hat Model as a Service may not support audio analysis
    // This implementation provides a text-only fallback
    const messages = [
      {
        role: "system",
        content: this.systemPrompt
      },
      {
        role: "user",
        content: "I have an audio file that I need analyzed, but this model doesn't support audio input. Please provide guidance on how to proceed with audio analysis."
      }
    ]

    try {
      const response = await this.makeRequest(messages)
      return { text: response, timestamp: Date.now() }
    } catch (error) {
      console.error("Error analyzing audio file with Red Hat:", error)
      throw error
    }
  }

  async analyzeAudioFromBase64(data: string, mimeType: string): Promise<ModelResponse> {
    // Note: Red Hat Model as a Service may not support audio analysis
    return this.analyzeAudioFile('')
  }

  async analyzeImageFile(imagePath: string): Promise<ModelResponse> {
    try {
      const imageBase64 = await this.imageToBase64(imagePath)
      const messages = [
        {
          role: "system",
          content: this.systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe the content of this image in a short, concise answer. In addition to your main answer, suggest several possible actions or responses the user could take next based on the image. Do not return a structured JSON object, just answer naturally as you would to a user. Be concise and brief."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${imageBase64}`
              }
            }
          ]
        }
      ]

      const response = await this.makeRequest(messages, true)
      return { text: response, timestamp: Date.now() }
    } catch (error) {
      console.error("Error analyzing image file with Red Hat:", error)
      throw error
    }
  }
}