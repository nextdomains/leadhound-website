import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'industryPage',
  title: 'Industry Page',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'heroHeadline', title: 'Hero Headline', type: 'text', rows: 2}),
    defineField({name: 'heroSubheadline', title: 'Hero Subheadline', type: 'text', rows: 3}),
    defineField({name: 'benefits', title: 'Benefits', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [defineArrayMember({type: 'object', fields: [
        defineField({name: 'question', title: 'Question', type: 'string'}),
        defineField({name: 'answer', title: 'Answer', type: 'text', rows: 3}),
      ]})],
    }),
    defineField({name: 'ctaText', title: 'CTA Text', type: 'string'}),
    defineField({name: 'seoTitle', title: 'SEO Title', type: 'string'}),
    defineField({name: 'seoDescription', title: 'SEO Description', type: 'text', rows: 2}),
  ],
})
