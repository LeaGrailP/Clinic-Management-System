<template>
  <div class="border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">

    <!-- Date Filter -->
    <div class="flex gap-4 items-end mb-4">
      <div>
        <label class="block text-sm font-medium">From</label>
        <input type="date" v-model="filterFrom"
          class="mt-1 border rounded px-2 py-1 bg-slate-50 dark:bg-slate-800" />
      </div>
      <div>
        <label class="block text-sm font-medium">To</label>
        <input type="date" v-model="filterTo"
          class="mt-1 border rounded px-2 py-1 bg-slate-50 dark:bg-slate-800" />
      </div>

      <button @click="clearFilter" class="px-4 py-2 bg-gray-400 rounded">Clear</button>
      <button @click="saveAsFile" class="px-4 py-2 bg-sky-400 text-white rounded">Save as CSV</button>
      <button @click="saveAsPDF" class="px-4 py-2 bg-orange-400 text-white rounded">Save as PDF</button>
    </div>

    <!-- Invoice Table -->
    <div class="bg-slate-50 dark:bg-slate-600 p-4 rounded shadow mb-6">
<table class="min-w-full border border-slate-300 dark:border-slate-700 border-collapse">
  <thead class="bg-slate-400">
    <tr>
      <th class="px-4 py-2 border border-slate-300 dark:border-slate-700">Invoice #</th>
      <th class="px-4 py-2 border border-slate-300 dark:border-slate-700">Date</th>
      <th class="px-4 py-2 border border-slate-300 dark:border-slate-700">Customer</th>
      <th class="px-4 py-2 border border-slate-300 dark:border-slate-700">Product</th>
      <th class="px-4 py-2 border border-slate-300 dark:border-slate-700">Quantity</th>
      <th class="px-4 py-2 border border-slate-300 dark:border-slate-700">VAT from Product</th>
      <th class="px-4 py-2 border border-slate-300 dark:border-slate-700">Total With VAT</th>
      <th class="px-4 py-2 border border-slate-300 dark:border-slate-700">VAT Sales</th>
      <th class="px-4 py-2 border border-slate-300 dark:border-slate-700">Discount</th>
      <th class="px-4 py-2 border border-slate-300 dark:border-slate-700">Total</th>
      <th class="px-4 py-2 border border-slate-300 dark:border-slate-700">Issued By</th>
    </tr>
  </thead>

  <tbody>
    <template v-for="invoice in filteredInvoices" :key="invoice.id">
      <tr
        v-for="(item, idx) in invoice.items"
        :key="`${invoice.id}-${idx}`"
        @click="idx === 0 && toggleInvoice(invoice.id)"
        :class="[
          'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700',
          locked && 'opacity-60 cursor-not-allowed'
        ]"
      >
        <td v-if="idx === 0" :rowspan="invoice.items.length" class="border border-slate-300 dark:border-slate-700 px-2 py-1">
          {{ invoice.invoice_number }}
        </td>
        <td v-if="idx === 0" :rowspan="invoice.items.length" class="border border-slate-300 dark:border-slate-700 px-2 py-1">
          {{ invoice.date }}
        </td>
        <td v-if="idx === 0" :rowspan="invoice.items.length" class="border border-slate-300 dark:border-slate-700 px-2 py-1">
          {{ invoice.patient_id ? `${invoice.lastName}, ${invoice.firstName}` : invoice.customer_name }}
        </td>

        <td class="border border-slate-300 dark:border-slate-700 px-2 py-1">{{ item.productname }}</td>
        <td class="border border-slate-300 dark:border-slate-700 px-2 py-1">{{ item.quantity }}</td>
        <td class="border border-slate-300 dark:border-slate-700 px-2 py-1">{{ item.vat_amount }}</td>
        <td class="border border-slate-300 dark:border-slate-700 px-2 py-1">{{ formatCurrency(item.total) }}</td>

        <td v-if="idx === 0" :rowspan="invoice.items.length" class="border border-slate-300 dark:border-slate-700 px-2 py-1">
          {{ formatCurrency(invoice.vat_sales) }}
        </td>
        <td v-if="idx === 0" :rowspan="invoice.items.length" class="border border-slate-300 dark:border-slate-700 px-2 py-1">
          {{ formatCurrency(invoice.discount) }}
        </td>
        <td v-if="idx === 0" :rowspan="invoice.items.length" class="border border-slate-300 dark:border-slate-700 px-2 py-1">
          {{ formatCurrency(invoice.total) }}
        </td>
        <td v-if="idx === 0" :rowspan="invoice.items.length" class="border border-slate-300 dark:border-slate-700 px-2 py-1">
          {{ invoice.issued_by }}
        </td>
      </tr>

      <tr v-if="expandedInvoice === invoice.id" class="bg-slate-100 dark:bg-slate-700">
        <td colspan="11" class="border border-slate-300 dark:border-slate-700 px-2 py-1">
          <!-- VAT Summary -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>VAT Sales: {{ formatCurrency(invoice.vat_sales) }}</div>
            <div>VAT Amount: {{ formatCurrency(invoice.vat_amount) }}</div>
            <div>VAT-Exempt: {{ formatCurrency(invoice.vat_exempt_sales) }}</div>
            <div>Zero-Rated: {{ formatCurrency(invoice.zero_rated_sales) }}</div>
          </div>
        </td>
      </tr>
    </template>
  </tbody>
</table>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const invoices = ref([])
const filterFrom = ref('')
const filterTo = ref('')
const expandedInvoice = ref(null)
const locked = ref(false)

function formatCurrency(v) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(v || 0)
}

const filteredInvoices = computed(() => {
  return invoices.value.filter(inv => {
    const d = new Date(inv.date)
    if (filterFrom.value && d < new Date(filterFrom.value)) return false
    if (filterTo.value && d > new Date(filterTo.value)) return false
    return true
  })
})

watch(filteredInvoices, list => {
  expandedInvoice.value = list.length ? list[0].id : null
})

function toggleInvoice(id) {
  if (locked.value) return
  expandedInvoice.value = expandedInvoice.value === id ? null : id
}

const vatTotals = computed(() => {
  return filteredInvoices.value.reduce((t, i) => {
    t.vat_sales += i.vat_sales || 0
    t.vat_amount += i.vat_amount || 0
    t.vat_exempt_sales += i.vat_exempt_sales || 0
    t.zero_rated_sales += i.zero_rated_sales || 0
    t.discount += i.discount || 0
    t.total += i.total || 0
    return t
  }, {
    vat_sales: 0,
    vat_amount: 0,
    vat_exempt_sales: 0,
    zero_rated_sales: 0,
    discount: 0,
    total: 0
  })
})

function clearFilter() {
  filterFrom.value = ''
  filterTo.value = ''
}

/* CSV */
/* CSV */
function saveAsFile() {
  locked.value = true

  // CSV headers
  const headers = [
    'Invoice #','Date','Customer','Product','Quantity','VAT-Amount','Total With VAT',
    'VAT Sales','VAT Amount','Discount','Total','Issued By'
  ]

  // Flatten invoices: one row per item
  const rows = []
  filteredInvoices.value.forEach(invoice => {
    const customerName = invoice.patient_id
      ? `${invoice.lastName}, ${invoice.firstName}`
      : invoice.customer_name

    invoice.items.forEach(item => {
      rows.push([
        invoice.invoice_number,
        invoice.date,
        customerName,
        item.productname,
        item.quantity,
        item.vat_amount,
        formatCurrency(item.total),
        formatCurrency(invoice.vat_sales),
        formatCurrency(invoice.vat_amount),
        formatCurrency(invoice.discount),
        formatCurrency(invoice.total),
        invoice.issued_by
      ])
    })
  })

  const blob = new Blob([[headers, ...rows].map(r => r.join(',')).join('\n')])
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `invoices_${Date.now()}.csv`
  a.click()
}



async function saveAsPDF() {
  locked.value = true
  const payload = filteredInvoices.value.map(i => ({
    ...i,
    items: i.items,
    vat_breakdown: {
      vat_sales: i.vat_sales,
      vat_amount: i.vat_amount,
      vat_exempt_sales: i.vat_exempt_sales,
      zero_rated_sales: i.zero_rated_sales
    }
  }))
  await window.electron.invoke('export-invoices-pdf', payload)
}

onMounted(async () => {
  invoices.value = await window.electron.invoke('get-all-invoices')
})
</script>