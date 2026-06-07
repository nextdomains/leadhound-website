import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'lead',
  title: 'Lead',
  type: 'document',
  fields: [
    defineField({name: 'leadId', title: 'Lead ID', type: 'string', readOnly: true}),
    defineField({name: 'firstName', title: 'First Name', type: 'string'}),
    defineField({name: 'lastName', title: 'Last Name', type: 'string'}),
    defineField({name: 'businessName', title: 'Business Name', type: 'string'}),
    defineField({name: 'website', title: 'Website', type: 'url'}),
    defineField({name: 'industry', title: 'Industry', type: 'string'}),
    defineField({name: 'leadType', title: 'Lead Type', type: 'string'}),
    defineField({name: 'monthlyTarget', title: 'Monthly Target', type: 'string'}),
    defineField({name: 'monthlyAdSpend', title: 'Monthly Ad Spend', type: 'string'}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'phone', title: 'Phone', type: 'string'}),
    defineField({name: 'preferredContactMethod', title: 'Preferred Contact Method', type: 'string'}),
    defineField({name: 'bestTimeToContact', title: 'Best Time To Contact', type: 'string'}),
    defineField({name: 'message', title: 'Message', type: 'text', rows: 4}),
    defineField({name: 'consent', title: 'Consent', type: 'boolean'}),
    defineField({name: 'submissionDate', title: 'Submission Date', type: 'datetime'}),
    defineField({
      name: 'leadStatus',
      title: 'Lead Status',
      type: 'string',
      options: {list: ['New', 'Contacted', 'Qualified', 'Closed'], layout: 'radio'},
      initialValue: 'New',
    }),
    defineField({
      name: 'leadScore',
      title: 'Lead Score',
      type: 'string',
      options: {list: ['High', 'Medium', 'Low'], layout: 'radio'},
    }),
    defineField({name: 'sourcePage', title: 'Source Page', type: 'string'}),
    defineField({name: 'referrer', title: 'Referrer', type: 'string'}),
    defineField({name: 'utmSource', title: 'UTM Source', type: 'string'}),
    defineField({name: 'utmMedium', title: 'UTM Medium', type: 'string'}),
    defineField({name: 'utmCampaign', title: 'UTM Campaign', type: 'string'}),
    defineField({name: 'utmContent', title: 'UTM Content', type: 'string'}),
    defineField({name: 'utmTerm', title: 'UTM Term', type: 'string'}),
  ],
  preview: {
    select: {
      title: 'businessName',
      subtitle: 'leadId',
      score: 'leadScore',
    },
    prepare({title, subtitle, score}) {
      return {
        title: title || 'Lead',
        subtitle: [subtitle, score].filter(Boolean).join(' - '),
      }
    },
  },
})
