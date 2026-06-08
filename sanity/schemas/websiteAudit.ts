import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'websiteAudit',
  title: 'Website Audit',
  type: 'document',
  fields: [
    defineField({name: 'websiteUrl', title: 'Website URL', type: 'url'}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'businessName', title: 'Business Name', type: 'string'}),
    defineField({name: 'submissionDate', title: 'Submission Date', type: 'datetime'}),
    defineField({name: 'leadCaptureScore', title: 'Lead Capture Score', type: 'number'}),
    defineField({name: 'conversionScore', title: 'Conversion Score', type: 'number'}),
    defineField({name: 'seoBasicsScore', title: 'SEO Basics Score', type: 'number'}),
    defineField({name: 'speedUxScore', title: 'Speed/UX Score', type: 'number'}),
    defineField({name: 'trustScore', title: 'Trust Score', type: 'number'}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 3}),
  ],
})
