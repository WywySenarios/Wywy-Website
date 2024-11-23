import { z, defineCollection } from 'astro:content';


export const collections = {
    "awards": defineCollection({ type: 'content', schema: z.object({
        "title": z.string(),
        "description": z.string(),
        "date": z.string(),
        "imagePath": z.string().optional(),
    }) }),
};