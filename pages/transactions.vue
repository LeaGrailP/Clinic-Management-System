<script setup>
import { ref, computed, onMounted } from 'vue'

/* ---------------- STATE ---------------- */
const tab = ref('transactions')
const invoices = ref([])
const filterFrom = ref('')
const filterTo = ref('')
const expandedInvoice = ref(null)

/* ---------------- HELPERS ---------------- */
function formatCurrency(v) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(v || 0)
}

/* ---------------- FILTER ---------------- */
const filteredInvoices = computed(() => {
  return invoices.value.filter(inv => {
    const d = new Date(inv.date)
    if (filterFrom.value && d < new Date(filterFrom.value)) return false
    if (filterTo.value && d > new Date(filterTo.value)) return false
    return true
  })
})

function toggleInvoice(id) {
  expandedInvoice.value = expandedInvoice.value === id ? null : id
}

/* ---------------- TRANSACTION ACTIONS ---------------- */
async function reprintReceipt(inv) {
  try {
    const invoice = await window.electron.invoke(
      'receipt:get-for-reprint',
      inv.id
    )

    await window.electron.invoke('receipt:reprint', invoice)
  } catch (err) {
    alert(err.message || 'Failed to reprint receipt')
  }
}

/* ---------------- REPORT ACTIONS ---------------- */
async function exportSalesJournal() {
  await window.electron.invoke('export-sales-journal', {
    from: filterFrom.value,
    to: filterTo.value
  })
}

async function printZReading() {
  const today = new Date().toISOString().slice(0, 10)

  const { success, error, totals } =
    await window.electron.invoke('z-reading:generate', {
      date: today
    })

  if (!success) {
    alert(error)
    return
  }

  await window.electron.invoke('z-reading:print', totals)
}

/* ---------------- LOAD ---------------- */
onMounted(async () => {
  invoices.value = await window.electron.invoke('get-all-invoice')
})
</script>

<template>
  <div class="p-6 space-y-4 text-slate-800 dark:text-slate-100">

    <!-- TABS -->
    <div class="flex gap-2 border-b">
      <button
        @click="tab = 'transactions'"
        :class="tab === 'transactions' ? 'border-b-2 border-sky-400 font-semibold' : ''"
        class="px-4 py-2"
      >
        Transactions
      </button>

      <button
        @click="tab = 'reports'"
        :class="tab === 'reports' ? 'border-b-2 border-sky-400 font-semibold' : ''"
        class="px-4 py-2"
      >
        Reports
      </button>
    </div>

    <!-- DATE FILTER -->
    <div class="flex gap-4 items-end ">
      <div>
        <label class="text-sm text-slate-800 dark:text-slate-100">From</label>
        <input type="date" v-model="filterFrom" class="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border px-2 py-1 rounded">
      </div>
      <div>
        <label class="text-sm text-slate-800 dark:text-slate-100">To</label>
        <input type="date" v-model="filterTo" class="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border px-2 py-1 rounded">
      </div>
    </div>

    <!-- ================= TRANSACTIONS ================= -->
    <div v-if="tab === 'transactions'" class="bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-4 rounded shadow">

      <table class="w-full border-collapse border">
        <thead class="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
          <tr>
            <th class="border p-2">Invoice #</th>
            <th class="border p-2">Date</th>
            <th class="border p-2">Customer</th>
            <th class="border p-2">Total</th>
            <th class="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="inv in filteredInvoices" :key="inv.id">
            <tr class="hover:bg-slate-200 dark:hover:bg-slate-400 cursor-pointer" @click="toggleInvoice(inv.id)">
              <td class="border p-2">{{ inv.invoice_number }}</td>
              <td class="border p-2">{{ inv.date }}</td>
              <td class="border p-2">{{ inv.customer_name || '—' }}</td>
              <td class="border p-2">{{ formatCurrency(inv.total) }}</td>
              <td class="border p-2">
                <button
                  @click.stop="reprintReceipt(inv)"
                  class="text-sky-400">
                  Reprint
                </button>
              </td>
            </tr>

            <tr v-if="expandedInvoice === inv.id" class="bg-slate-100">
              <td colspan="5" class="border p-3 text-sm">
                <div class="grid grid-cols-2 gap-2">
                  <div>VAT Sales: {{ formatCurrency(inv.vat_sales) }}</div>
                  <div>VAT Amount: {{ formatCurrency(inv.vat_amount) }}</div>
                  <div>VAT Exempt: {{ formatCurrency(inv.vat_exempt_sales) }}</div>
                  <div>Zero Rated: {{ formatCurrency(inv.zero_rated_sales) }}</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- ================= REPORTS ================= -->
    <div v-if="tab === 'reports'" class="space-y-4">

      <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded shadow">
        <h3 class="font-semibold mb-2">Sales Journal</h3>
        <p class="text-sm mb-2">
          BIR-compliant export (TXT/DAT). One record per invoice.
        </p>
        <button
          @click="exportSalesJournal"
          class="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Export Sales Journal
        </button>
      </div>

      <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded shadow">
        <h3 class="font-semibold mb-2">Z-Reading</h3>
        <p class="text-sm mb-2">
          End-of-day closing report. Can only be printed once per day.
        </p>
        <button
          @click="printZReading"
          class="px-4 py-2 bg-emerald-600 text-white rounded"
        >
          Print Z-Reading
        </button>
      </div>

    </div>
  </div>
</template>
