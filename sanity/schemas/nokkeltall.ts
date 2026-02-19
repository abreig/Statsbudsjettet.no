import { defineType, defineField } from "sanity";

export default defineType({
  name: "nokkeltall",
  title: "Nøkkeltall",
  type: "object",
  fields: [
    defineField({ name: "etikett", title: "Etikett", type: "string" }),
    defineField({ name: "verdi", title: "Verdi (manuell)", type: "string" }),
    defineField({ name: "enhet", title: "Enhet", type: "string" }),
    defineField({
      name: "datareferanse",
      title: "Datareferanse",
      type: "string",
      description: "Referanse til verdi i budsjettdata, f.eks. 'utgifter.total'",
    }),
  ],
});
