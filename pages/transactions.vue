<script setup>
import { ref, computed, onMounted } from 'vue'

/* ---------------- STATE ---------------- */
const tab = ref('transactions')
const invoices = ref([])
const filterFrom = ref('')
const filterTo = ref('')
const expandedInvoice = ref(null)
const loading = ref(false)
const notification = ref({ show: false, type: '', message: '' })
const printerStatus = ref({ connected: false, printerName: '' })

/* ---------------- NOTIFICATIONS ---------------- */
function showNotification(message, type = 'info') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 5000)
}

function closeNotification() {
  notification.value.show = false
}

/* ---------------- HELPERS ---------------- */
function formatCurrency(v) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(v || 0)
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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

/* ---------------- COMPUTED TOTALS ---------------- */
const totals = computed(() => {
  return filteredInvoices.value.reduce(
    (acc, inv) => {
      acc.vatSales += inv.vat_sales || 0
      acc.vatAmount += inv.vat_amount || 0
      acc.vatExempt += inv.vat_exempt_sales || 0
      acc.zeroRated += inv.zero_rated_sales || 0
      acc.discount += inv.discount || 0
      acc.total += inv.total || 0
      acc.count += 1
      return acc
    },
    {
      vatSales: 0,
      vatAmount: 0,
      vatExempt: 0,
      zeroRated: 0,
      discount: 0,
      total: 0,
      count: 0
    }
  )
})

function toggleInvoice(id) {
  expandedInvoice.value = expandedInvoice.value === id ? null : id
}

/* ---------------- CHECK PRINTER STATUS ---------------- */
async function checkPrinterStatus() {
  try {
    const status = await window.electron.invoke('check-printer-status')
    printerStatus.value = status
    
    if (!status.connected) {
      showNotification(
        `Printer not connected: ${status.message}`,
        'warning'
      )
    }
    
    return status.connected
  } catch (err) {
    showNotification('Failed to check printer status', 'error')
    return false
  }
}

/* ---------------- TRANSACTION ACTIONS ---------------- */
async function reprintReceipt(inv) {
  const printerReady = await checkPrinterStatus()
  if (!printerReady) {
    showNotification('Printer not ready.', 'error')
    return
  }

  loading.value = true

  try {
    showNotification('Reprinting receipt...', 'info')

    // Ask backend to map invoice → print history
    const { historyId } = await window.electron.invoke(
      'receipt:get-history-id',
      inv.id
    )

    if (!historyId) {
      throw new Error('No print history found for this invoice')
    }

    const result = await window.electron.invoke(
      'receipt:reprint',
      historyId
    )

    if (result.success) {
      showNotification(
        `Receipt ${inv.invoice_number} reprinted successfully`,
        'success'
      )
    } else {
      throw new Error(result.message)
    }
  } catch (err) {
    showNotification(`Reprint failed: ${err.message}`, 'error')
  } finally {
    loading.value = false
  }
}

/* ---------------- X-READING (Mid-shift report) ---------------- */
async function printXReading() {
  if (!filterFrom.value || !filterTo.value) {
    showNotification(
      'Please select date range for X-Reading',
      'warning'
    )
    return
  }

  const printerReady = await checkPrinterStatus()
  if (!printerReady) return

  loading.value = true
  
  try {
    showNotification('Generating X-Reading...', 'info')
    
    // Calculate totals for date range
    const xTotals = {
      first_inv: filteredInvoices.value[filteredInvoices.value.length - 1]?.invoice_number || 'N/A',
      last_inv: filteredInvoices.value[0]?.invoice_number || 'N/A',
      vat_sales: totals.value.vatSales,
      vat_amount: totals.value.vatAmount,
      vat_exempt: totals.value.vatExempt,
      zero_rated: totals.value.zeroRated,
      discount: totals.value.discount,
      total: totals.value.total,
      date_from: filterFrom.value,
      date_to: filterTo.value,
      type: 'X-READING'
    }

    const result = await window.electron.invoke('z-reading:print', xTotals)

    if (result.success) {
      showNotification(
        'X-Reading printed successfully',
        'success'
      )
    } else {
      showNotification(
        `X-Reading failed: ${result.message}`,
        'error'
      )
    }
  } catch (err) {
    showNotification(
      `X-Reading failed: ${err.message}`,
      'error'
    )
  } finally {
    loading.value = false
  }
}

/* ---------------- Z-READING (End-of-day) ---------------- */
async function printZReading() {
  const today = new Date().toISOString().slice(0, 10)

  // Confirm action
  if (!confirm('Z-Reading can only be printed ONCE per day. Continue?')) {
    return
  }

  const printerReady = await checkPrinterStatus()
  if (!printerReady) return

  loading.value = true

  try {
    showNotification('Generating Z-Reading...', 'info')
    
    const { success, error, totals } = await window.electron.invoke(
      'z-reading:generate',
      { date: today }
    )

    if (!success) {
      showNotification(`${error}`, 'error')
      return
    }

    // Print the Z-Reading
    const printResult = await window.electron.invoke('z-reading:print', totals)

    if (printResult.success) {
      showNotification(
        `Z-Reading for ${today} printed successfully`,
        'success'
      )
      // Reload invoices to reflect any changes
      await loadInvoices()
    } else {
      showNotification(
        `Z-Reading print failed: ${printResult.message}`,
        'error'
      )
    }
  } catch (err) {
    console.error('Z-Reading error:', err)
    showNotification(
      `Z-Reading failed: ${err.message || 'Unknown error'}`,
      'error'
    )
  } finally {
    loading.value = false
  }
}

/* ---------------- EXPORT SALES JOURNAL ---------------- */
async function exportSalesJournal() {
  if (!filterFrom.value || !filterTo.value) {
    showNotification(
      'Please select date range for export',
      'warning'
    )
    return
  }

  loading.value = true

  try {
    showNotification('Exporting sales journal...', 'info')
    
    await window.electron.invoke('export-sales-journal', {
      from: filterFrom.value,
      to: filterTo.value
    })

    showNotification(
      'Sales journal exported successfully',
      'success'
    )
  } catch (err) {
    showNotification(
      `Export failed: ${err.message}`,
      'error'
    )
  } finally {
    loading.value = false
  }
}

/* ---------------- LOAD DATA ---------------- */
async function loadInvoices() {
  loading.value = true
  try {
    invoices.value = await window.electron.invoke('get-all-invoice')
  } catch (err) {
    showNotification('Failed to load invoices', 'error')
  } finally {
    loading.value = false
  }
}

/* ---------------- LIFECYCLE ---------------- */
onMounted(async () => {
  // Set default date range to today
  const today = new Date().toISOString().slice(0, 10)
  filterFrom.value = today
  filterTo.value = today
  
  await loadInvoices()
  await checkPrinterStatus()
})
</script>

<template>
  <div class="p-6 space-y-4 text-slate-800 dark:text-slate-100">

    <!-- LOADING OVERLAY -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl">
        <div class="animate-spin h-12 w-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-center">Processing...</p>
      </div>
    </div>

    <!-- NOTIFICATION TOAST -->
    <transition name="slide-down">
      <div
        v-if="notification.show"
        :class="{
          'bg-green-500': notification.type === 'success',
          'bg-red-500': notification.type === 'error',
          'bg-yellow-500': notification.type === 'warning',
          'bg-blue-500': notification.type === 'info'
        }"
        class="fixed top-4 right-4 z-50 text-white px-6 py-4 rounded-lg shadow-xl max-w-md flex items-start gap-3"
      >
        <span class="flex-1">{{ notification.message }}</span>
        <button @click="closeNotification" class="text-white hover:text-gray-200 font-bold">
          ×
        </button>
      </div>
    </transition>
    <!-- TABS -->
    <div class="flex gap-2 border-b">
      <button
        @click="tab = 'transactions'"
        :class="tab === 'transactions' ? 'border-b-2 border-sky-400 font-semibold' : ''"
        class="px-4 py-2"
      >
        Transactions ({{ filteredInvoices.length }})
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
    <div class="flex gap-4 items-end">
      <div>
        <label class="text-sm text-slate-600 dark:text-slate-300 block mb-1">From Date</label>
        <input
          type="date"
          v-model="filterFrom"
          class="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>
      <div>
        <label class="text-sm text-slate-600 dark:text-slate-300 block mb-1">To Date</label>
        <input
          type="date"
          v-model="filterTo"
          class="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>
      <button
        @click="loadInvoices"
        class="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600"
      >
        Refresh
      </button>
    </div>

    <!-- ================= TRANSACTIONS ================= -->
    <div v-if="tab === 'transactions'" class="space-y-4">
      <div class="bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-4 rounded shadow overflow-x-auto">
        <table class="w-full border-collapse border border-slate-300 dark:border-slate-600">
          <thead class="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th class="border border-slate-300 dark:border-slate-600 p-2 text-left">Invoice #</th>
              <th class="border border-slate-300 dark:border-slate-600 p-2 text-left">Date</th>
              <th class="border border-slate-300 dark:border-slate-600 p-2 text-left">Customer</th>
              <th class="border border-slate-300 dark:border-slate-600 p-2 text-left">TIN</th>
              <th class="border border-slate-300 dark:border-slate-600 p-2 text-left">Issued By</th>
              <th class="border border-slate-300 dark:border-slate-600 p-2 text-right">Total</th>
              <th class="border border-slate-300 dark:border-slate-600 p-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            <template v-if="filteredInvoices.length === 0">
              <tr>
                <td colspan="7" class="border border-slate-300 dark:border-slate-600 p-4 text-center text-slate-500">
                  No transactions found for selected date range
                </td>
              </tr>
            </template>
            
            <template v-for="inv in filteredInvoices" :key="inv.id">
              <tr 
                class="hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                @click="toggleInvoice(inv.id)"
              >
                <td class="border border-slate-300 dark:border-slate-600 p-2">
                  {{ inv.invoice_number }}
                  <span v-if="inv.isSenior || inv.isPWD" class="ml-2 text-xs bg-purple-200 dark:bg-purple-700 px-2 py-0.5 rounded">
                    {{ inv.isSenior ? 'SC' : 'PWD' }}
                  </span>
                </td>
                <td class="border border-slate-300 dark:border-slate-600 p-2 text-sm">
                  {{ formatDateTime(inv.date) }}
                </td>
                <td class="border border-slate-300 dark:border-slate-600 p-2">
                  {{ inv.customer_name || '—' }}
                </td>
                <td class="border border-slate-300 dark:border-slate-600 p-2 text-sm">
                  {{ inv.customer_tin || '—' }}
                </td>
                <td class="border border-slate-300 dark:border-slate-600 p-2">
                  {{ inv.issued_by || '—' }}
                </td>
                <td class="border border-slate-300 dark:border-slate-600 p-2 text-right font-semibold">
                  {{ formatCurrency(inv.total) }}
                </td>
                <td class="border border-slate-300 dark:border-slate-600 p-2 text-center">
                  <button
                    @click.stop="reprintReceipt(inv)"
                    class="text-sky-500 hover:text-sky-700 underline"
                  >
                    Reprint
                  </button>
                </td>
              </tr>

              <!-- EXPANDED DETAILS -->
              <tr v-if="expandedInvoice === inv.id" class="bg-slate-100 dark:bg-slate-800">
                <td colspan="7" class="border border-slate-300 dark:border-slate-600 p-4">
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span class="font-semibold">VAT Sales:</span>
                      <span class="ml-2">{{ formatCurrency(inv.vat_sales) }}</span>
                    </div>
                    <div>
                      <span class="font-semibold">VAT Amount:</span>
                      <span class="ml-2">{{ formatCurrency(inv.vat_amount) }}</span>
                    </div>
                    <div>
                      <span class="font-semibold">VAT Exempt:</span>
                      <span class="ml-2">{{ formatCurrency(inv.vat_exempt_sales) }}</span>
                    </div>
                    <div>
                      <span class="font-semibold">Zero Rated:</span>
                      <span class="ml-2">{{ formatCurrency(inv.zero_rated_sales) }}</span>
                    </div>
                    <div>
                      <span class="font-semibold">Discount:</span>
                      <span class="ml-2">{{ formatCurrency(inv.discount) }}</span>
                    </div>
                    <div class="col-span-2">
                      <span class="font-semibold">Items:</span>
                      <ul class="ml-2 mt-1">
                        <li v-for="(item, idx) in inv.items" :key="idx" class="text-xs">
                          {{ item.productname }} × {{ item.quantity }} = {{ formatCurrency(item.total) }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>

          <!-- TOTALS FOOTER -->
          <tfoot class="bg-slate-200 dark:bg-slate-800 font-semibold">
            <tr>
              <td colspan="5" class="border border-slate-300 dark:border-slate-600 p-2 text-right">
                TOTALS ({{ totals.count }} transactions):
              </td>
              <td class="border border-slate-300 dark:border-slate-600 p-2 text-right">
                {{ formatCurrency(totals.total) }}
              </td>
              <td class="border border-slate-300 dark:border-slate-600 p-2"></td>
            </tr>
            <tr class="text-sm font-normal">
              <td colspan="7" class="border border-slate-300 dark:border-slate-600 p-2">
                <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div>VAT Sales: {{ formatCurrency(totals.vatSales) }}</div>
                  <div>VAT Amount: {{ formatCurrency(totals.vatAmount) }}</div>
                  <div>VAT Exempt: {{ formatCurrency(totals.vatExempt) }}</div>
                  <div>Zero Rated: {{ formatCurrency(totals.zeroRated) }}</div>
                  <div>Discounts: {{ formatCurrency(totals.discount) }}</div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ================= REPORTS ================= -->
    <div v-if="tab === 'reports'" class="space-y-4">

      <!-- X-READING -->
      <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded shadow">
        <h3 class="font-semibold mb-2 text-lg">📊 X-Reading (Mid-Shift Report)</h3>
        <p class="text-sm mb-3 text-slate-600 dark:text-slate-300">
          Generate a sales summary for the selected date range. Can be printed multiple times.
        </p>
        <button
          @click="printXReading"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          :disabled="!filterFrom || !filterTo"
        >
          Print X-Reading
        </button>
      </div>

      <!-- Z-READING -->
      <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded shadow border-2 border-orange-400">
        <h3 class="font-semibold mb-2 text-lg">📊 Z-Reading (End-of-Day Report)</h3>
        <p class="text-sm mb-3 text-slate-600 dark:text-slate-300">
          ⚠️ <strong>End-of-day closing report.</strong> Can only be printed <strong>ONCE per day</strong> as required by BIR.
        </p>
        <button
          @click="printZReading"
          class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Print Z-Reading (Today)
        </button>
      </div>

      <!-- SALES JOURNAL -->
      <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded shadow">
        <h3 class="font-semibold mb-2 text-lg">📥 Sales Journal Export</h3>
        <p class="text-sm mb-3 text-slate-600 dark:text-slate-300">
          BIR-compliant export (TXT/DAT format). One record per invoice for the selected date range.
        </p>
        <button
          @click="exportSalesJournal"
          class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          :disabled="!filterFrom || !filterTo"
        >
          Export Sales Journal
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>