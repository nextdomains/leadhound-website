import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'servicesPage',
  title: 'Services',
  type: 'document',
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'headline', title: 'Headline', type: 'text', rows: 2}),
    defineField({
      name: 'items',
      title: 'Service Items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'tag', title: 'Tag', type: 'string'}),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
          ],
        }),
      ],
    }),
  ],
})
