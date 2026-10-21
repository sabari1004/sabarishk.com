import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.enum(['technical', 'non-technical']),
    tags: z.array(z.string()),
    readingTime: z.string().optional(),
    draft: z.boolean().default(false),
    linkedInUrl: z.string().url().optional(),
  }),
});

export const collections = { blog };
