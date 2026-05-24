import config from "@root/config.yml";
import { dump } from "js-yaml";

export const prerender = true;

export async function GET() {
  const yamlStr = dump(config);
  return new Response(yamlStr, {
    headers: {
      "Content-Type": "application/x-yaml",
      "Content-Disposition": 'inline; filename="schema.yml"',
    },
  });
}
