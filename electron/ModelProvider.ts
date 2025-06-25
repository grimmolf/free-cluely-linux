// Base abstract class for model providers
export interface ModelProviderConfig {
  provider: 'gemini' | 'redhat' | 'ollama'
  apiKey?: string
  baseUrl?: string
  modelName?: string
}

export interface ModelResponse {
  text: string
  timestamp: number
}

export interface ProblemAnalysis {
  problem_statement: string
  context: string
  suggested_responses: string[]
  reasoning: string
}

export interface SolutionResponse {
  solution: {
    code: string
    problem_statement: string
    context: string
    suggested_responses: string[]
    reasoning: string
  }
}

export abstract class ModelProvider {
  protected config: ModelProviderConfig
  protected readonly systemPrompt = `You are Wingman AI, a helpful, proactive assistant for any kind of problem or situation (not just coding). For any user input, analyze the situation, provide a clear problem statement, relevant context, and suggest several possible responses or actions the user could take next. Always explain your reasoning. Present your suggestions as a list of options or next steps.`

  constructor(config: ModelProviderConfig) {
    this.config = config
  }

  protected cleanJsonResponse(text: string): string {
    // Remove markdown code block syntax if present
    text = text.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    // Remove any leading/trailing whitespace
    text = text.trim();
    return text;
  }

  // Abstract methods that must be implemented by each provider
  abstract extractProblemFromImages(imagePaths: string[]): Promise<ProblemAnalysis>
  abstract generateSolution(problemInfo: any): Promise<SolutionResponse>
  abstract debugSolutionWithImages(problemInfo: any, currentCode: string, debugImagePaths: string[]): Promise<SolutionResponse>
  abstract analyzeAudioFile(audioPath: string): Promise<ModelResponse>
  abstract analyzeAudioFromBase64(data: string, mimeType: string): Promise<ModelResponse>
  abstract analyzeImageFile(imagePath: string): Promise<ModelResponse>
}