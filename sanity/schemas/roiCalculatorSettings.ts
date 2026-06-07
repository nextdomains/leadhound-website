import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'roiCalculatorSettings',
  title: 'ROI Calculator Settings',
  type: 'document',
  fields: [
    defineField({name: 'headline', title: 'Headline', type: 'text', rows: 2}),
    defineField({name: 'subtext', title: 'Subtext', type: 'text', rows: 3}),
    defineField({name: 'ctaText', title: 'CTA Text', type: 'string'}),
    defineField({name: 'disclaimer', title: 'Disclaimer', type: 'text', rows: 2}),
  ],
})
