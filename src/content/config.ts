import { z, defineCollection } from 'astro:content';


export const collections = {
    "awards": defineCollection({ type: 'content', schema: z.object({
        "title": z.string(),
        "description": z.string(),
        "date": z.string(),
        "imagePath": z.string().optional(),
    }) }),
    "directives": defineCollection({ type: 'content', schema: z.object({
        "title": z.string(),
        "description": z.string(),
        "date": z.string(),
        "imagePath": z.string().optional(),
    })}),
    "blog": defineCollection({ type: 'content', schema: z.object({
        "url": z.string(),
        "title": z.string(),
        "description": z.string(),
        "publicationDate": z.string(),
        "dateLastUpdated": z.string(),
        "category": z.array(z.string()),
    })})
};