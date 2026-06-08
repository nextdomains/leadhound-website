import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'industryBenchmark',
  title: 'Industry Benchmark',
  type: 'document',
  fields: [
    defineField({name: 'industry', title: 'Industry', type: 'string'}),
    defineField({name: 'averageCostPerLead', title: 'Average Cost Per Lead', type: 'string'}),
    defineField({name: 'averageCloseRate', title: 'Average Close Rate', type: 'string'}),
    defineField({name: 'averageCustomerValue', title: 'Average Customer Value', type: 'string'}),
    defineField({name: 'typicalMonthlyBudget', title: 'Typical Monthly Budget', type: 'string'}),
    defineField({name: 'typicalTimeToLaunch', title: 'Typical Time To Launch', type: 'string'}),
    defineField({name: 'disclaimer', title: 'Disclaimer', type: 'text', rows: 2}),
  ],
})
