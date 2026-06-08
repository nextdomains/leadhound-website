import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'industry', title: 'Industry', type: 'string'}),
    defineField({name: 'location', title: 'Location', type: 'string'}),
    defineField({name: 'challenge', title: 'Challenge', type: 'text', rows: 3}),
    defineField({name: 'solution', title: 'Solution', type: 'text', rows: 3}),
    defineField({name: 'servicesUsed', title: 'Services Used', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'results', title: 'Results', type: 'text', rows: 3}),
    defineField({name: 'disclaimer', title: 'Disclaimer', type: 'text', rows: 2}),
    defineField({name: 'cta', title: 'CTA', type: 'string'}),
    defineField({name: 'publishStatus', title: 'Publish Status', type: 'string', options: {list: ['Draft', 'Published']}, initialValue: 'Draft'}),
  ],
})
