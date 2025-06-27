<!--


<template>
  <div class="p-6">
    <h1 class="text-2xl font-semibold mb-4">TRANSACTION HISTORY</h1>

    <-- Filter/Search Bar ->


    <div class="flex flex-wrap justify-between items-center mb-4 bg-white p-4 rounded shadow">
      <div class="flex items-center gap-2 w-full md:w-auto mb-2 md:mb-0">
        <input
          type="text"
          placeholder="Search..."
          class="border rounded px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <button class="text-purple-700">
          <Icon name="material-symbols:search" size="24" />
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button class="border rounded px-4 py-2 text-sm text-gray-700 flex items-center">
          <Icon name="material-symbols:calendar-month" class="mr-2" />
          Past 31 days
        </button>
        <span class="text-sm text-gray-600">Mar 10, 2025 to Apr 11, 2025</span>
        <button class="border border-purple-700 text-purple-700 px-4 py-2 rounded text-sm ml-4">
          Download as
          <Icon name="material-symbols:arrow-drop-down" class="ml-1" />
        </button>
      </div>
    </div>

    <-- Table ->


    <div class="overflow-x-auto bg-white rounded shadow">
      <table class="min-w-full text-sm text-left text-gray-700">
        <thead class="border-b text-xs uppercase bg-gray-100 text-gray-600">
          <tr>
            <th class="p-3"><input type="checkbox" /></th>
            <th class="p-3">Date</th>
            <th class="p-3">Customer</th>
            <th class="p-3">Invoice ID</th>
            <th class="p-3">Amount</th>
            <th class="p-3">Issued By</th>
            <th class="p-3">Status</th>
            <th class="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tx, index) in transactions" :key="index" class="border-b hover:bg-gray-50">
            <td class="p-3"><input type="checkbox" /></td>
            <td class="p-3">{{ tx.date }}</td>
            <td class="p-3">{{ tx.customer }}</td>
            <td class="p-3">{{ tx.invoice }}</td>
            <td class="p-3">{{ tx.amount }}</td>
            <td class="p-3">{{ tx.issuedBy }}</td>
            <td class="p-3">
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  tx.status === 'Completed' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-700'
                ]"
              >
                {{ tx.status }}
              </span>
            </td>
            <td class="p-3 flex gap-2">
              <button><Icon name="material-symbols:edit" /></button>
              <button><Icon name="material-symbols:delete" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <-- Pagination ->


    <div class="flex justify-between items-center mt-4 text-sm text-gray-600">
      <span>0 of 20 row(s) selected.</span>
      <template>
  <UPagination v-model:page="page" :total="100" />
</template>
    </div>
  </div>
</template>

<--Retrieve Data Using Backend->


<-Sample Data->


<script setup>

const page = ref(5)
const transactions = [
  {
    date: 'Mar 10, 19:45',
    customer: 'Ethan Harris',
    invoice: '90745',
    amount: '100.00',
    issuedBy: 'Niko Hashimura',
    status: 'Completed',
  },
  {
    date: 'Mar 15, 15:55',
    customer: 'Emma Davis',
    invoice: '75456',
    amount: '1,983.00',
    issuedBy: 'Hanna Bronne',
    status: 'Completed',
  },
  {
    date: 'Mar 17, 15:30',
    customer: 'William Brown',
    invoice: '67899',
    amount: '67,899.00',
    issuedBy: 'Hanna Bronne',
    status: 'Cancelled',
  },
  // Add more entries as needed
]
</script>


-->

<template>

  Transactions
</template>