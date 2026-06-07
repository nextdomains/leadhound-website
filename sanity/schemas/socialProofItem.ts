import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'socialProofItem',
  title: 'Social Proof Item',
  type: 'document',
  fields: [
    defineField({name: 'message', title: 'Message', type: 'string'}),
    defineField({name: 'region', title: 'Region', type: 'string'}),
    defineField({name: 'isActive', title: 'Active', type: 'boolean', initialValue: true}),
  ],
})
