import React, { useState, useEffect } from "react";
import GetWallet from "../../backend/getwallet/getwallet";
import GetTransaction from "../../backend/gettransaction/gettransaction";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [wallet, setWallet] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const phone = localStorage.getItem("userPhone");

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const data = await GetTransaction(phone);
        console.log("Fetched Transactions: ", { data });
        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      }
      setIsLoading(false);
    };
    if (phone) fetchTransactions();
  }, [phone]);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await GetWallet(phone);
        console.log("Fetched Wallet: ", { data });
        setWallet(data || []);
      } catch (error) {
        console.error("Error fetching wallet:", error);
        setWallet([]);
      }
    };
    if (phone) fetchWallet();
  }, [phone]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString; // fallback
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white shadow-xl rounded-3xl overflow-hidden">
        {/* Wallet Section */}
        <div className="p-6 sm:p-8 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
            Wallet
          </h3>
          <span className="text-xl sm:text-2xl font-semibold text-indigo-700">
            ₹{wallet[0]?.WalletBalance || 0}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-extrabold text-gray-900 p-6 sm:p-8 border-b border-gray-200">
          Transaction History
        </h2>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Header Row */}
            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <tr>
                <th className="px-4 py-4 sm:px-6 sm:py-5">ID</th>
                <th className="px-4 py-4 sm:px-6 sm:py-5">Transaction ID</th>
                <th className="px-4 py-4 sm:px-6 sm:py-5">Amount</th>
                <th className="px-4 py-4 sm:px-6 sm:py-5">Date</th>
                <th className="px-4 py-4 sm:px-6 sm:py-5">Phone</th>
              </tr>
            </thead>

            {/* Data Rows */}
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-600">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((txn, index) => (
                  <tr
                    key={txn.id || index}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-indigo-100 transition`}
                  >
                    <td className="px-4 py-4 sm:px-6 sm:py-5">{txn.id}</td>
                    <td className="px-4 py-4 sm:px-6 sm:py-5">
                      {txn.Transactionid}
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-5 font-semibold text-green-600">
                      ₹{parseFloat(txn.TransactionAmt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-5">
                      {formatDate(txn.DateTime || txn.DateTim)}
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-5">{txn.Phone}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
