<template>
  <div class="bg-slate-50 dark:bg-slate-600 min-h-screen p-6 space-y-6">
    <!-- Date Filter -->
    <div class="flex gap-4 items-end mb-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">From</label>
        <input type="date" v-model="filterFrom" class="mt-1 border rounded px-2 py-1" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">To</label>
        <input type="date" v-model="filterTo" class="mt-1 border rounded px-2 py-1" />
      </div>
      <button @click="clearFilter" class="px-4 py-2 bg-gray-300 rounded">Clear</button>
      <button @click="saveAsFile" class="px-4 py-2 bg-blue-500 text-white rounded">Save as CSV</button>
      <button @click="saveAsPDF" class="px-4 py-2 bg-red-500 text-white rounded">Save as PDF</button>
    </div>

    <!-- Invoice Table -->
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
          <tr v-for="invoice in filteredInvoices" :key="invoice.id">
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
          <tr v-if="filteredInvoices.length === 0">
            <td class="px-4 py-2 border text-center text-gray-500" colspan="9">No invoices found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const invoices = ref([])
const filterFrom = ref('')
const filterTo = ref('')

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0)
}

// Filtered invoices based on date range
const filteredInvoices = computed(() => {
  return invoices.value.filter(inv => {
    const invDate = new Date(inv.date)
    const from = filterFrom.value ? new Date(filterFrom.value) : null
    const to = filterTo.value ? new Date(filterTo.value) : null

    if (from && invDate < from) return false
    if (to && invDate > to) return false
    return true
  })
})

// Clear date filter
function clearFilter() {
  filterFrom.value = ''
  filterTo.value = ''
}

// ✅ Save filtered list as CSV
function saveAsFile() {
  const headers = [
    'Invoice #','Date','Customer','VAT Sales','VAT Amount',
    'VAT-Exempt Sales','Zero-Rated Sales','Discount','Total'
  ]
  const rows = filteredInvoices.value.map(inv => [
    inv.invoice_number, inv.date, inv.customer_name,
    inv.vat_sales, inv.vat_amount, inv.vat_exempt_sales,
    inv.zero_rated_sales, inv.discount, inv.total
  ])

  const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `invoices_${Date.now()}.csv`
  link.click()

  URL.revokeObjectURL(url)
}

// ✅ Save filtered list as PDF (through Electron main process)
async function saveAsPDF() {
  try {
    // ✅ force plain JSON copy
    const plainInvoices = filteredInvoices.value.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      date: inv.date,
      customer_name: inv.customer_name,
      vat_sales: inv.vat_sales,
      vat_amount: inv.vat_amount,
      vat_exempt_sales: inv.vat_exempt_sales,
      zero_rated_sales: inv.zero_rated_sales,
      discount: inv.discount,
      total: inv.total
    }))

    const filePath = await window.electron.invoke('export-invoices-pdf', plainInvoices)
    alert(`PDF saved at: ${filePath}`)
  } catch (err) {
    console.error('Failed to save PDF:', err)
    alert('Failed to generate PDF')
  }
}

// ✅ Load invoices from Electron on mount
onMounted(async () => {
  try {
    invoices.value = await window.electron.invoke('get-all-invoices')
  } catch (err) {
    console.error('Failed to fetch invoices:', err)
  }
})
</script>
