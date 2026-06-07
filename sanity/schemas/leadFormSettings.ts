import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'leadFormSettings',
  title: 'Lead Form Settings',
  type: 'document',
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'headline', title: 'Headline', type: 'text', rows: 2}),
    defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
    defineField({name: 'button', title: 'Button Label', type: 'string'}),
    defineField({name: 'successMessage', title: 'Success Message', type: 'string'}),
    defineField({name: 'fallbackEmail', title: 'Fallback Email', type: 'string'}),
  ],
})
