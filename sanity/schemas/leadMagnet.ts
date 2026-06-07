import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'leadMagnet',
  title: 'Lead Magnet',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 3}),
    defineField({name: 'assetNote', title: 'PDF Asset Note', type: 'text', rows: 2}),
    defineField({name: 'seoTitle', title: 'SEO Title', type: 'string'}),
    defineField({name: 'seoDescription', title: 'SEO Description', type: 'text', rows: 2}),
  ],
})
