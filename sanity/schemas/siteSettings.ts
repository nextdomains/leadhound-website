import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({name: 'brand', title: 'Brand', type: 'string', initialValue: 'LeadHound'}),
    defineField({name: 'title', title: 'SEO Title', type: 'string'}),
    defineField({name: 'description', title: 'SEO Description', type: 'text', rows: 3}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'phone', title: 'Phone', type: 'string'}),
    defineField({name: 'logo', title: 'Logo', type: 'image', options: {hotspot: true}}),
  ],
})
