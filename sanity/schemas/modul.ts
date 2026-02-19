import { defineType, defineField } from "sanity";

export default defineType({
  name: "modul",
  title: "Modul",
  type: "object",
  fields: [
    defineField({
      name: "type",
      title: "Modultype",
      type: "string",
      options: {
        list: [
          { title: "Hero", value: "hero" },
          { title: "Plan for Norge", value: "plan_for_norge" },
          { title: "Budsjettgrafer", value: "budsjettgrafer" },
          { title: "Nøkkeltall", value: "nokkeltall" },
          { title: "Egendefinert tekst", value: "egendefinert_tekst" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "synlig",
      title: "Synlig",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "rekkefolge",
      title: "Rekkefølge",
      type: "number",
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: "konfigurasjon",
      title: "Konfigurasjon",
      type: "object",
      fields: [
        // Hero-konfigurasjon
        defineField({ name: "tittel", title: "Tittel", type: "string" }),
        defineField({ name: "undertittel", title: "Undertittel", type: "string" }),
        defineField({ name: "bakgrunnsbilde", title: "Bakgrunnsbilde", type: "image" }),
        defineField({
          name: "nokkeltall",
          title: "Nøkkeltall",
          type: "array",
          of: [{ type: "nokkeltall" }],
        }),
        // Budsjettgrafer-konfigurasjon
        defineField({
          name: "visEndringDefault",
          title: "Vis endring som standard",
          type: "boolean",
          initialValue: false,
        }),
        defineField({ name: "overskrift", title: "Overskrift", type: "string" }),
        defineField({ name: "forklaringstekst", title: "Forklaringstekst", type: "text" }),
        defineField({ name: "spuForklaring", title: "SPU-forklaring", type: "text" }),
        // Egendefinert tekst
        defineField({ name: "innhold", title: "Innhold", type: "array", of: [{ type: "block" }] }),
        defineField({
          name: "bakgrunnsfarge",
          title: "Bakgrunnsfarge",
          type: "string",
        }),
        defineField({
          name: "bredde",
          title: "Bredde",
          type: "string",
          options: {
            list: [
              { title: "Smal", value: "smal" },
              { title: "Bred", value: "bred" },
              { title: "Fullbredde", value: "fullbredde" },
            ],
          },
        }),
        // Plan for Norge
        defineField({
          name: "temaer",
          title: "Temaer",
          type: "array",
          of: [{ type: "reference", to: [{ type: "tema" }] }],
        }),
        // Nøkkeltall-modul
        defineField({
          name: "layout",
          title: "Layout",
          type: "string",
          options: {
            list: [
              { title: "Horisontal rad", value: "horisontal" },
              { title: "Vertikal liste", value: "vertikal" },
              { title: "Rutenett", value: "rutenett" },
            ],
          },
        }),
      ],
    }),
  ],
});
