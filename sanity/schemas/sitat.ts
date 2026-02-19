import { defineType, defineField } from "sanity";

export default defineType({
  name: "sitat",
  title: "Sitat",
  type: "document",
  fields: [
    defineField({ name: "tekst", title: "Sitattekst", type: "text", rows: 4 }),
    defineField({ name: "person", title: "Personnavn", type: "string" }),
    defineField({ name: "tittel", title: "Tittel/rolle", type: "string" }),
    defineField({ name: "bilde", title: "Portrettbilde", type: "image" }),
  ],
});
