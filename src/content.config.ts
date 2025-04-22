import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';


const awards = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/data/awards" }),
    schema: z.object({
        "title": z.string(),
        "description": z.string(),
        "date": z.string(),
        "imagePath": z.string().optional(),
    })
});

const projects = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/data/projects" }),
    schema: z.object({
        "title": z.string(),
        "description": z.string(),
        "date": z.string(),
        "imagePath": z.string().optional(),
    })
});

const directives = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/data/directives" }),
    schema: z.object({
        "title": z.string(),
        "description": z.string(),
        "date": z.string(),
        "imagePath": z.string().optional(),
    })
});

const blog = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/data/blog" }),
    schema: z.object({
        "url": z.string(),
        "title": z.string(),
        "description": z.string(),
        "publicationDate": z.string(),
        "dateLastUpdated": z.string(),
        "category": z.array(z.string()),
    })
});

const cards = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/data/cards" }),
    schema: z.object({
        "title": z.string(),
        "imagePath": z.string(),
        "description": z.string()
    })
});

const privacyPolicies = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/data/privacyPolicies" }),
    schema: z.object({
        "title": z.string(),
        "dateLastUpdated": z.coerce.date(),
        "summary": z.string(),
        "datapointsReleased": z.array(z.string()),
        "datapointsKeptPrivate": z.array(z.string()),
    })
});

const schedules = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/data/schedules" }),
    schema: z.object({
        "title": z.string(),
        "dateLastUpdated": z.coerce.date(),
        "content": z.array(z.object({
            time: z.string(),
            monday: z.string(),
            tuesday: z.string(),
            wednesday: z.string(),
            thursday: z.string(),
            friday: z.string(),
            saturday: z.string(),
            sunday: z.string(),
        }))
    })
});

const wishlist = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/data/wishlist" }),
    schema: z.object({
        "title": z.string(),
        "dateLastUpdated": z.coerce.date(),
    })
});

const datasets = defineCollection({
    loader: glob({ pattern: "**/*.json", base: "./src/data/datasets" }),
    schema: z.object({
        "description": z.string(),
        "startDate": z.coerce.date(),
        "endDate": z.coerce.date(),
        "dateLastUpdated": z.coerce.date(),
        "suppress": z.optional(z.array(z.string())),
        "data": z.record(z.any()), // @TODO make type safety through good schema
        "totals": z.optional(z.any()), // @TODO make type safety through good schema
        "constraints": z.optional(z.object({}).extend({}).catchall(z.object({
            min: z.number(),
            max: z.number(),
        }).extend({}).catchall(z.object({
            min: z.number(),
            max: z.number(),
            weight: z.number(),
        })))),
    })
});

export const collections = { awards, projects, directives, blog, cards, privacyPolicies, schedules, wishlist, datasets };