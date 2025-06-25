import { Ollama } from "ollama"
import fs from "fs"
import { ModelProvider, ModelProviderConfig, ModelResponse, ProblemAnalysis, SolutionResponse } from "../ModelProvider"

export class OllamaProvider extends ModelProvider {
  private ollama: Ollama
  private modelName: string

  constructor(config: ModelProviderConfig) {
    super(config)
    this.ollama = new Ollama({ 
      host: config.baseUrl || 'http://localhost:11434' 
    })
    this.modelName = config.modelName || 'llama3.1'
  }

  private async imageToBase64(imagePath: string): Promise<string> {
    const imageData = await fs.promises.readFile(imagePath)
    return imageData.toString("base64")
  }

  private async makeTextRequest(prompt: string): Promise<string> {
    try {
      const response = await this.ollama.chat({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false
      })

      return response.message.content
    } catch (error) {
      console.error("Ollama request failed:", error)
      throw error
    }
  }

  private async makeImageRequest(prompt: string, imagePaths: string[]): Promise<string> {
    try {
      const images = await Promise.all(
        imagePaths.map(path => this.imageToBase64(path))
      )

      const response = await this.ollama.chat({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          {
            role: 'user',
            content: prompt,
            images: images
          }
        ],
        stream: false
      })

      return response.message.content
    } catch (error) {
      console.error("Ollama image request failed:", error)
      throw error
    }
  }

  async extractProblemFromImages(imagePaths: string[]): Promise<ProblemAnalysis> {
    try {
      const prompt = `You are a wingman. Please analyze these images and extract the following information in JSON format:
{
  "problem_statement": "A clear statement of the problem or situation depicted in the images.",
  "context": "Relevant background or context from the images.",
  "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
  "reasoning": "Explanation of why these suggestions are appropriate."
}
Important: Return ONLY the JSON object, without any markdown formatting or code blocks.`

      const response = await this.makeImageRequest(prompt, imagePaths)
      const cleanedResponse = this.cleanJsonResponse(response)
      return JSON.parse(cleanedResponse)
    } catch (error) {
      console.error("Error extracting problem from images with Ollama:", error)
      throw error
    }
  }

  async generateSolution(problemInfo: any): Promise<SolutionResponse> {
    const prompt = `Given this problem or situation:
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

    console.log("[OllamaProvider] Calling Ollama for solution...");
    try {
      const response = await this.makeTextRequest(prompt)
      console.log("[OllamaProvider] Ollama returned result.");
      const cleanedResponse = this.cleanJsonResponse(response)
      const parsed = JSON.parse(cleanedResponse)
      console.log("[OllamaProvider] Parsed LLM response:", parsed)
      return parsed
    } catch (error) {
      console.error("[OllamaProvider] Error in generateSolution:", error);
      throw error;
    }
  }

  async debugSolutionWithImages(problemInfo: any, currentCode: string, debugImagePaths: string[]): Promise<SolutionResponse> {
    try {
      const prompt = `You are a wingman. Given:
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

      const response = await this.makeImageRequest(prompt, debugImagePaths)
      const cleanedResponse = this.cleanJsonResponse(response)
      const parsed = JSON.parse(cleanedResponse)
      console.log("[OllamaProvider] Parsed debug LLM response:", parsed)
      return parsed
    } catch (error) {
      console.error("Error debugging solution with images using Ollama:", error)
      throw error
    }
  }

  async analyzeAudioFile(audioPath: string): Promise<ModelResponse> {
    // Note: Ollama may not support audio analysis depending on the model
    // This implementation provides a text-only fallback
    const prompt = "I have an audio file that I need analyzed, but this model may not support audio input. Please provide guidance on how to proceed with audio analysis."

    try {
      const response = await this.makeTextRequest(prompt)
      return { text: response, timestamp: Date.now() }
    } catch (error) {
      console.error("Error analyzing audio file with Ollama:", error)
      throw error
    }
  }

  async analyzeAudioFromBase64(data: string, mimeType: string): Promise<ModelResponse> {
    // Note: Ollama may not support audio analysis depending on the model
    return this.analyzeAudioFile('')
  }

  async analyzeImageFile(imagePath: string): Promise<ModelResponse> {
    try {
      const prompt = "Describe the content of this image in a short, concise answer. In addition to your main answer, suggest several possible actions or responses the user could take next based on the image. Do not return a structured JSON object, just answer naturally as you would to a user. Be concise and brief."

      const response = await this.makeImageRequest(prompt, [imagePath])
      return { text: response, timestamp: Date.now() }
    } catch (error) {
      console.error("Error analyzing image file with Ollama:", error)
      throw error
    }
  }
}