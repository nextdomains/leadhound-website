import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'testimonials',
  title: 'Testimonials',
  type: 'document',
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'headline', title: 'Headline', type: 'text', rows: 2}),
    defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
    defineField({
      name: 'items',
      title: 'Testimonials',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string'}),
            defineField({name: 'role', title: 'Role', type: 'string'}),
            defineField({name: 'quote', title: 'Quote', type: 'text', rows: 4}),
            defineField({name: 'image', title: 'Image URL', type: 'url'}),
          ],
        }),
      ],
    }),
  ],
})
