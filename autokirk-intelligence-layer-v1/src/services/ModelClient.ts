import OpenAI from "openai";

const MODEL = process.env.AUTOKIRK_MODEL || "gpt-4.1-mini";

export interface TransformRequest {
  path: string;
  currentContent: string;
  instruction: string;
}

export interface TransformResponse {
  newContent: string;
  reasoning: string;
}

export class ModelClient {
  private client: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY is required for ModelClient.");
    }
    this.client = new OpenAI({ apiKey: key });
  }

  async transformFile(req: TransformRequest): Promise<TransformResponse> {
    const { path, currentContent, instruction } = req;

    const system = `
You are Autokirk OS's code/content transformation unit.
- You ONLY return the full new file content in the 'newContent' field.
- You must preserve valid syntax and structure.
- You follow the user's instruction precisely but safely.
- If the instruction is unclear or dangerous, you respond conservatively.
`;

    const user = `
File path: ${path}

Instruction:
${instruction}

Current file content:
----------------------
${currentContent}
----------------------

Produce the FULL UPDATED FILE CONTENT.
`;

    const completion = await this.client.responses.create({
      model: MODEL,
      input: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
    });

    const content = completion.output[0].content;
    let newContent = "";
    let reasoning = "";

    for (const block of content) {
      if (block.type === "output_text") {
        newContent += block.text;
      }
      if (block.type === "output_reasoning") {
        reasoning += block.reasoning;
      }
    }

    if (!newContent || newContent.trim().length === 0) {
      throw new Error("Model returned empty newContent.");
    }

    return { newContent, reasoning };
  }
}