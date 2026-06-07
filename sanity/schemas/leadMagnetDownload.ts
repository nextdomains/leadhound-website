import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'leadMagnetDownload',
  title: 'Lead Magnet Download',
  type: 'document',
  fields: [
    defineField({name: 'magnet', title: 'Magnet', type: 'string'}),
    defineField({name: 'name', title: 'Name', type: 'string'}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'businessName', title: 'Business Name', type: 'string'}),
    defineField({name: 'industry', title: 'Industry', type: 'string'}),
    defineField({name: 'submissionDate', title: 'Submission Date', type: 'datetime'}),
  ],
})
