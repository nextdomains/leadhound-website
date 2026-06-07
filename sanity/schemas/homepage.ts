import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'headline', title: 'Headline', type: 'text', rows: 2}),
        defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
        defineField({name: 'primaryCta', title: 'Primary CTA', type: 'string'}),
        defineField({name: 'secondaryCta', title: 'Secondary CTA', type: 'string'}),
        defineField({name: 'badges', title: 'Badges', type: 'array', of: [defineArrayMember({type: 'string'})]}),
      ],
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'value', title: 'Value', type: 'string'}),
            defineField({name: 'label', title: 'Label', type: 'string'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'leadFunnels',
      title: 'Lead Funnels',
      type: 'object',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'headline', title: 'Headline', type: 'text', rows: 2}),
        defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
        defineField({
          name: 'steps',
          title: 'Steps',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({name: 'number', title: 'Number', type: 'string'}),
                defineField({name: 'title', title: 'Title', type: 'string'}),
                defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'roi',
      title: 'ROI Calculator',
      type: 'object',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'headline', title: 'Headline', type: 'text', rows: 2}),
        defineField({name: 'subtext', title: 'Subtext', type: 'text', rows: 3}),
        defineField({name: 'ctaText', title: 'CTA Text', type: 'string'}),
        defineField({name: 'disclaimer', title: 'Disclaimer', type: 'text', rows: 2}),
      ],
    }),
  ],
})
