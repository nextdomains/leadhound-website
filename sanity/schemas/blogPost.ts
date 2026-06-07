import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3}),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {list: ['Mortgage Marketing', 'Solar Marketing', 'Real Estate Marketing', 'Insurance Marketing', 'Lead Generation', 'Paid Advertising']},
    }),
    defineField({name: 'body', title: 'Body', type: 'array', of: [{type: 'block'}]}),
    defineField({name: 'featuredImage', title: 'Featured Image', type: 'image'}),
    defineField({name: 'seoTitle', title: 'SEO Title', type: 'string'}),
    defineField({name: 'seoDescription', title: 'SEO Description', type: 'text', rows: 2}),
    defineField({name: 'publishDate', title: 'Publish Date', type: 'datetime'}),
  ],
})
