import { defineDb, defineTable, column } from 'astro:db';

const main = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    "Date": column.date(),
    "Work Ethic": column.number(),
    "Time Efficiency": column.number(),
    "General Performance": column.number(),
    "Happiness": column.number(),
    "Awareness": column.number(),
    "Sleep Quality": column.number(),
    "Sleep Behaviour": column.number(),
    "School Courses": column.json(),
    "Comments": column.json(),
  }
});

const time = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    "Date": column.date(),
    "Computer": column.json(),
    "Phone": column.json(),
    "School & Career": column.json(),
    "Non-useful Hobby": column.json(),
    "Social": column.json(),
    "Errands & Maintenance": column.json(),
    "Exercise": column.json(),
    "Bedtime": column.date(),
    "Awakening": column.date(),
    "Awake Sleep": column.number(),
    "Light Sleep": column.number(),
    "Deep Sleep": column.number(),
    "Comments": column.json(),
  }
})


// https://astro.build/db/config
export default defineDb({
  tables: { main, time }
});
