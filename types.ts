export type MessagePart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64 encoded string
  };
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'error';
  parts: MessagePart[];
}

// Image Editor Filters Interface
export interface ImageFilters {
  rotation: number;
  inverted: boolean;
  sepia: boolean;
  grayscale: boolean;
  blur: number;
  brightness: number;
  contrast: number;
}

// OpenRouter general model options
export const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', supportsImages: true },
  { id: 'google/gemini-2.5-flash-image-preview:free', name: 'Gemini 2.5 Flash Image Preview (Free)', supportsImages: true },
  { id: 'google/gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview', supportsImages: true },
  { id: 'google/gemini-2.5-pro-preview-03-25', name: 'Gemini 2.5 Pro Preview', supportsImages: true },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', supportsImages: true },
  { id: 'google/gemini-2.0-flash-thinking-exp:free', name: 'Gemini 2.0 Flash Thinking (Free)', supportsImages: true },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', supportsImages: true },
  { id: 'anthropic/claude-3.5-sonnet:beta', name: 'Claude 3.5 Sonnet (Beta)', supportsImages: true },
  { id: 'openai/gpt-4o', name: 'GPT-4o', supportsImages: true },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', supportsImages: true },
] as const;

export type OpenRouterModelId = typeof OPENROUTER_MODELS[number]['id'] | string;

// Image Generation Models with detailed info
export interface ImageGenerationModel {
  id: string;
  name: string;
  provider: string;
  shortName: string;
  tokens: string;
  description: string;
}

export const IMAGE_GENERATION_MODELS: ImageGenerationModel[] = [
  {
    id: 'google/gemini-2.5-flash-image-preview',
    name: 'Gemini 2.5 Flash Image Preview (Nano Banana)',
    provider: 'Google',
    shortName: 'Nano Banana',
    tokens: 'Created Aug 26, 2025 | 32,768 context',
    description: 'Gemini 2.5 Flash Image Preview, a.k.a. "Nano Banana," is a state of the art image generation model with contextual understanding. It is capable of image generation, edits, and multi-turn conversations.'
  },
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image (Nano Banana)',
    provider: 'Google',
    shortName: 'Nano Banana',
    tokens: 'Created Oct 7, 2025 | 32,768 context | $0.30/M input tokens | $2.50/M output tokens | $30/M tokens | $1/M audio tokens',
    description: 'Gemini 2.5 Flash Image, a.k.a. "Nano Banana," is now generally available. It is a state of the art image generation model with contextual understanding. It is capable of image generation, edits, and multi-turn conversations. Aspect ratios can be controlled with the image_config API Parameter'
  },
  {
    id: 'openai/gpt-5-image',
    name: 'GPT-5 Image',
    provider: 'OpenAI',
    shortName: 'GPT-5 Image',
    tokens: 'Created Oct 14, 2025 | 400,000 context | $10/M input tokens | $10/M output tokens | $40/M tokens | $10/K web search',
    description: "GPT-5 Image combines OpenAI's GPT-5 model with state-of-the-art image generation capabilities. It offers major improvements in reasoning, code quality, and user experience while incorporating GPT Image 1's superior instruction following, text rendering, and detailed image editing."
  },
  {
    id: 'openai/gpt-5-image-mini',
    name: 'GPT-5 Image Mini',
    provider: 'OpenAI',
    shortName: 'GPT-5 Image Mini',
    tokens: 'Created Oct 16, 2025 | 400,000 context | $2.50/M input tokens | $2/M output tokens | $8/M tokens | $10/K web search',
    description: "GPT-5 Image Mini combines OpenAI's advanced language capabilities, powered by GPT-5 Mini, with GPT Image 1 Mini for efficient image generation. This natively multimodal model features superior instruction following, text rendering, and detailed image editing with reduced latency and cost. It excels at high-quality visual creation while maintaining strong text understanding, making it ideal for applications that require both efficient image generation and text processing at scale."
  },
  {
    id: 'google/gemini-3-pro-image-preview',
    name: 'Nano Banana Pro (Gemini 3 Pro Image Preview)',
    provider: 'Google',
    shortName: 'Nano Banana Pro',
    tokens: 'Created Nov 20, 2025 | 65,536 context | $2/M input tokens | $12/M output tokens | $120/M tokens | $2/M audio tokens',
    description: "Nano Banana Pro is Google's most advanced image-generation and editing model, built on Gemini 3 Pro. It extends the original Nano Banana with significantly improved multimodal reasoning, real-world grounding, and high-fidelity visual synthesis. The model generates context-rich graphics, from infographics and diagrams to cinematic composites, and can incorporate real-time information via Search grounding. It offers industry-leading text rendering in images (including long passages and multilingual layouts), consistent multi-image blending, and accurate identity preservation across up to five subjects. Nano Banana Pro adds fine-grained creative controls such as localized edits, lighting and focus adjustments, camera transformations, and support for 2K/4K outputs and flexible aspect ratios. It is designed for professional-grade design, product visualization, storyboarding, and complex multi-element compositions while remaining efficient for general image creation workflows."
  },
  {
    id: 'black-forest-labs/flux.2-pro',
    name: 'FLUX.2 Pro',
    provider: 'Black Forest Labs',
    shortName: 'FLUX.2 Pro',
    tokens: 'Created Nov 25, 2025 | 46,864 context | $0/M input tokens | $0/M output tokens | $7.324/M tokens',
    description: 'A high-end image generation and editing model focused on frontier-level visual quality and reliability. It delivers strong prompt adherence, stable lighting, sharp textures, and consistent character/style reproduction across multi-reference inputs. Designed for production workloads, it balances speed and quality while supporting text-to-image and image editing up to 4 MP resolution. Pricing: Input: $0.015 per megapixel on input (reference images for editing). Output: First megapixel $0.03, subsequent MP $0.015.'
  },
  {
    id: 'black-forest-labs/flux.2-flex',
    name: 'FLUX.2 Flex',
    provider: 'Black Forest Labs',
    shortName: 'FLUX.2 Flex',
    tokens: 'Created Nov 25, 2025 | 67,344 context | $0/M input tokens | $0/M output tokens | $14.65/M tokens',
    description: 'FLUX.2 [flex] excels at rendering complex text, typography, and fine details, and supports multi-reference editing in the same unified architecture. Pricing: $0.06 per megapixel on both input and output side.'
  },
  {
    id: 'sourceful/riverflow-v2-fast-preview',
    name: 'Riverflow V2 Fast Preview',
    provider: 'Sourceful',
    shortName: 'Riverflow V2 Fast',
    tokens: 'Created Dec 8, 2025 | 8,192 context | $0/M input tokens | $0/M output tokens | $7.186/M tokens',
    description: "Riverflow V2 Fast Preview is the fastest variant of Sourceful's Riverflow V2 preview lineup. This preview version exceeds the performance of Riverflow 1 Family and is Sourceful's first unified text-to-image and image-to-image model family. Pricing is $0.03 per output image, regardless of size. Sourceful imposes a 4.5MB request size limit, therefore it is highly recommended to pass image URLs instead of Base64 data."
  },
  {
    id: 'sourceful/riverflow-v2-standard-preview',
    name: 'Riverflow V2 Standard Preview',
    provider: 'Sourceful',
    shortName: 'Riverflow V2 Standard',
    tokens: 'Created Dec 8, 2025 | 8,192 context | $0/M input tokens | $0/M output tokens | $8.383/M tokens',
    description: "Riverflow V2 Standard Preview is the standard variant of Sourceful's Riverflow V2 preview lineup. This preview version exceeds the performance of Riverflow 1 Family and is Sourceful's first unified text-to-image and image-to-image model family. Pricing is $0.035 per output image, regardless of size. Sourceful imposes a 4.5MB request size limit, therefore it is highly recommended to pass image URLs instead of Base64 data."
  },
  {
    id: 'sourceful/riverflow-v2-max-preview',
    name: 'Riverflow V2 Max Preview',
    provider: 'Sourceful',
    shortName: 'Riverflow V2 Max',
    tokens: 'Created Dec 8, 2025 | 8,192 context | $0/M input tokens | $0/M output tokens | $17.96/M tokens',
    description: "Riverflow V2 Max Preview is the most powerful variant of Sourceful's Riverflow V2 preview lineup. This preview version exceeds the performance of Riverflow 1 Family and is Sourceful's first unified text-to-image and image-to-image model family. Pricing is $0.075 per output image, regardless of size. Sourceful imposes a 4.5MB request size limit, therefore it is highly recommended to pass image URLs instead of Base64 data."
  },
  {
    id: 'black-forest-labs/flux.2-max',
    name: 'FLUX.2 Max',
    provider: 'Black Forest Labs',
    shortName: 'FLUX.2 Max',
    tokens: 'Created Dec 16, 2025 | 46,864 context | $0/M input tokens | $0/M output tokens | $17.09/M tokens',
    description: 'FLUX.2 [max] is the new top-tier image model from Black Forest Labs, pushing image quality, prompt understanding, and editing consistency to the highest level yet. Pricing: Input: $0.03 per megapixel on input (reference images for editing). Output: First generated megapixel $0.07, subsequent megapixel $0.03.'
  },
  {
    id: 'bytedance-seed/seedream-4.5',
    name: 'Seedream 4.5',
    provider: 'ByteDance Seed',
    shortName: 'Seedream 4.5',
    tokens: 'Created Dec 23, 2025 | 4,096 context | $0/M input tokens | $0/M output tokens | $9.581/M tokens',
    description: "Seedream 4.5 is the latest in-house image generation model developed by ByteDance. Compared with Seedream 4.0, it delivers comprehensive improvements, especially in editing consistency, including better preservation of subject details, lighting, and color tone. It also enhances portrait refinement and small-text rendering. The model's multi-image composition capabilities have been significantly strengthened, and both reasoning performance and visual aesthetics continue to advance, enabling more accurate and artistically expressive image generation. Pricing is $0.04 per output image, regardless of size."
  },
  {
    id: 'black-forest-labs/flux.2-klein-4b',
    name: 'FLUX.2 Klein 4B',
    provider: 'Black Forest Labs',
    shortName: 'FLUX.2 Klein',
    tokens: 'Created Jan 14, 2026 | 40,960 context | $0/M input tokens | $0/M output tokens | $3.418/M tokens',
    description: 'FLUX.2 [klein] 4B is the fastest and most cost-effective model in the FLUX.2 family, optimized for high-throughput use cases while maintaining excellent image quality. Pricing: First generated megapixel $0.014, subsequent megapixel $0.001.'
  },
  {
    id: 'sourceful/riverflow-v2-fast',
    name: 'Riverflow V2 Fast',
    provider: 'Sourceful',
    shortName: 'Riverflow V2 Fast',
    tokens: 'Created Feb 2, 2026 | 8,192 context | $0/M input tokens | $0/M output tokens | $4.79/M tokens',
    description: "Riverflow V2 Fast is the fastest variant of Sourceful's Riverflow 2.0 lineup, best for production deployments and latency-critical workflows. The Riverflow 2.0 series represents SOTA performance on image generation and editing tasks, using an integrated reasoning model to boost reliability and tackle complex challenges. Pricing: $0.02 per 1K output image and $0.04 per 2K output image. Does not support 4K image output. Additional features: Custom font rendering via font_inputs ($0.03/font, max 2). Image enhancement via super_resolution_references ($0.20/reference, max 4). Note: Sourceful imposes a 4.5MB request size limit, therefore it is highly recommended to pass image URLs instead of Base64 data."
  },
  {
    id: 'sourceful/riverflow-v2-pro',
    name: 'Riverflow V2 Pro',
    provider: 'Sourceful',
    shortName: 'Riverflow V2 Pro',
    tokens: 'Created Feb 2, 2026 | 8,192 context | $0/M input tokens | $0/M output tokens | $35.93/M tokens',
    description: "Riverflow V2 Pro is the most powerful variant of Sourceful's Riverflow 2.0 lineup, best for top-tier control and perfect text rendering. The Riverflow 2.0 series represents SOTA performance on image generation and editing tasks, using an integrated reasoning model to boost reliability and tackle complex challenges. Pricing: $0.15 per 1K/2K output image and $0.33 per 4K output image. Additional features: Custom font rendering via font_inputs ($0.03/font, max 2). Image enhancement via super_resolution_references ($0.20/reference, max 4). Note: Sourceful imposes a 4.5MB request size limit, therefore it is highly recommended to pass image URLs instead of Base64 data."
  }
];
