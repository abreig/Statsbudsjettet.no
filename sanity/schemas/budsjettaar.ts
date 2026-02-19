import { defineType, defineField } from "sanity";

export default defineType({
  name: "budsjettaar",
  title: "Budsjettår",
  type: "document",
  fields: [
    defineField({
      name: "aar",
      title: "Årstall",
      type: "number",
      validation: (rule) => rule.required().min(2000).max(2100),
    }),
    defineField({
      name: "status",
      title: "Publiseringsstatus",
      type: "string",
      options: {
        list: [
          { title: "Utkast", value: "draft" },
          { title: "Til godkjenning", value: "pending_review" },
          { title: "Godkjent", value: "approved" },
        ],
      },
      initialValue: "draft",
    }),
    defineField({
      name: "publiseringsdato",
      title: "Publiseringsdato",
      type: "datetime",
    }),
    defineField({
      name: "moduler",
      title: "Moduler",
      type: "array",
      of: [{ type: "modul" }],
    }),
  ],
});
