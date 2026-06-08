export interface AiProvider {
  chat(message: string): Promise<string>;
}
