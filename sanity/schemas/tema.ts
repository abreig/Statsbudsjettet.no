import { defineType, defineField } from "sanity";

export default defineType({
  name: "tema",
  title: "Tema (Plan for Norge)",
  type: "document",
  fields: [
    defineField({ name: "nr", title: "Temanummer", type: "number" }),
    defineField({ name: "tittel", title: "Tittel", type: "string" }),
    defineField({ name: "ingress", title: "Ingress", type: "text", rows: 3 }),
    defineField({ name: "farge", title: "Aksentfarge (hex)", type: "string" }),
    defineField({ name: "ikon", title: "Ikon", type: "image" }),
    defineField({
      name: "problembeskrivelse",
      title: "Problembeskrivelse",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "analysegraf",
      title: "Analysegraf",
      type: "object",
      fields: [
        defineField({
          name: "type",
          title: "Graftype",
          type: "string",
          options: {
            list: [
              { title: "Linjegraf", value: "linjegraf" },
              { title: "Barplot", value: "barplot" },
              { title: "Nøkkeltall", value: "nokkeltall" },
            ],
          },
        }),
        defineField({
          name: "data",
          title: "Dataverdier",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "etikett", title: "Etikett", type: "string" }),
                defineField({ name: "verdi", title: "Verdi", type: "number" }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: "prioriteringer",
      title: "Prioriteringer",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "tittel", title: "Tittel", type: "string" }),
            defineField({
              name: "beskrivelse",
              title: "Beskrivelse",
              type: "array",
              of: [{ type: "block" }],
            }),
          ],
        },
      ],
    }),
    defineField({ name: "sitat", title: "Sitat fra statsråd", type: "reference", to: [{ type: "sitat" }] }),
    defineField({
      name: "budsjettlenker",
      title: "Kobling til budsjettet",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "omr_nr", title: "Programområdenummer", type: "number" }),
            defineField({ name: "visningsnavn", title: "Visningsnavn", type: "string" }),
            defineField({ name: "datareferanse", title: "Datareferanse (beløp)", type: "string" }),
          ],
        },
      ],
    }),
  ],
});
