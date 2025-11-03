import { GenerationModel, Generation } from '../models/Generation';
import { GenerationInput } from '../validators/schemas';

export class GenerationService {
  static async create(
    userId: number,
    data: GenerationInput,
    imageUrl: string
  ): Promise<Generation> {
    // Simulate 20% error rate for "Model overloaded"
    const shouldFail = Math.random() < 0.2;
    
    if (shouldFail) {
      throw new Error('Model overloaded');
    }

    // Simulate processing delay (1-2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Create generation record
    const generation = GenerationModel.create({
      user_id: userId,
      prompt: data.prompt,
      style: data.style,
      image_url: imageUrl,
      status: 'completed',
    });

    return generation;
  }

  static getRecentGenerations(userId: number, limit: number = 5): Generation[] {
    return GenerationModel.findByUserId(userId, limit);
  }
}

