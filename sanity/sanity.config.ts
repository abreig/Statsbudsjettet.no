import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import budsjettaar from "./schemas/budsjettaar";
import modul from "./schemas/modul";
import tema from "./schemas/tema";
import nokkeltall from "./schemas/nokkeltall";
import sitat from "./schemas/sitat";

export default defineConfig({
  name: "statsbudsjettet",
  title: "Statsbudsjettet – Redaksjonelt verktøy",

  // Erstatt med ekte prosjekt-ID og datasett fra sanity.io/manage
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "your-project-id",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [structureTool()],

  schema: {
    types: [budsjettaar, modul, tema, nokkeltall, sitat],
  },
});
