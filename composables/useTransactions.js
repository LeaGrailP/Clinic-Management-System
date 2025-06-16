export const useTransactions = () => {
  const insertTransaction = async (data) => {
    return await window.electron.insertTransaction(data);
  };

  const getTransactions = async () => {
    return await window.electron.getTransactions();
  };

  return { insertTransaction, getTransactions };
};
