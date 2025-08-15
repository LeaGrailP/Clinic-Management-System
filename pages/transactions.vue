<template>
  <div class="bg-slate-50 min-h-screen p-6 space-y-6">
    <h1 class="text-4xl font-bold text-gray-800">Invoices</h1>

    <div class="bg-white shadow rounded overflow-x-auto">
      <table class="min-w-full border-collapse">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 border">Invoice #</th>
            <th class="px-4 py-2 border">Date</th>
            <th class="px-4 py-2 border">Customer</th>
            <th class="px-4 py-2 border">VAT Sales</th>
            <th class="px-4 py-2 border">VAT Amount</th>
            <th class="px-4 py-2 border">VAT-Exempt Sales</th>
            <th class="px-4 py-2 border">Zero-Rated Sales</th>
            <th class="px-4 py-2 border">Discount</th>
            <th class="px-4 py-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in invoices" :key="invoice.id">
            <td class="px-4 py-2 border">{{ invoice.invoice_number }}</td>
            <td class="px-4 py-2 border">{{ invoice.date }}</td>
            <td class="px-4 py-2 border">{{ invoice.customer_name }}</td>
            <td class="px-4 py-2 border">{{ formatCurrency(invoice.vat_sales) }}</td>
            <td class="px-4 py-2 border">{{ formatCurrency(invoice.vat_amount) }}</td>
            <td class="px-4 py-2 border">{{ formatCurrency(invoice.vat_exempt_sales) }}</td>
            <td class="px-4 py-2 border">{{ formatCurrency(invoice.zero_rated_sales) }}</td>
            <td class="px-4 py-2 border">{{ formatCurrency(invoice.discount) }}</td>
            <td class="px-4 py-2 border">{{ formatCurrency(invoice.total) }}</td>
          </tr>
          <tr v-if="invoices.length === 0">
            <td class="px-4 py-2 border text-center text-gray-500" colspan="9">No invoices found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const invoices = ref([])

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount || 0)
}

onMounted(async () => {
  try {
    invoices.value = await window.electron.invoke('get-all-invoices')
  } catch (err) {
    console.error('Failed to fetch invoices:', err)
  }
})
</script>