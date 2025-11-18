// src/components/wallet/TransactionHistory.jsx
import React, { useState, useEffect } from "react";
import { Wallet, History, IndianRupee, Calendar, Phone } from "lucide-react";
import { motion } from "framer-motion";
import GetWallet from "../../backend/getwallet/getwallet";
import GetTransaction from "../../backend/gettransaction/gettransaction";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const phone = localStorage.getItem("userPhone");

  useEffect(() => {
    const fetchData = async () => {
      if (!phone) return;

      setIsLoading(true);
      try {
        const [walletData, txnData] = await Promise.all([
          GetWallet(phone).catch(() => ({ WalletBalance: 0 })),
          GetTransaction(phone).catch(() => []),
        ]);

        setWalletBalance(
          Number(
            walletData?.[0]?.WalletBalance || walletData?.WalletBalance || 0
          ) || 0
        );
        setTransactions(Array.isArray(txnData) ? txnData : []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [phone]);

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "—";
    }
  };

  if (!phone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">
            Please log in to view wallet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-1 py-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Wallet Balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet size={22} />
              <span className="text-sm font-medium">Wallet Balance</span>
            </div>
            <span className="text-3xl font-bold">
              ₹{walletBalance.toLocaleString("en-IN")}
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <div className="flex items-center gap-3">
          <History size={26} className="text-orange-500" />
          <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-orange-500 border-t-transparent"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <History size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((txn, i) => (
                <motion.div
                  key={txn.id || txn.Transactionid || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <IndianRupee size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        #{txn.Transactionid || txn.id || "—"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(txn.DateTime || txn.DateTim)}
                        </span>
                        {txn.Phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} />
                            {txn.Phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">
                      +₹
                      {parseFloat(txn.TransactionAmt || 0).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          All transactions are secure
        </p>
      </div>
    </div>
  );
};

export default TransactionHistory;
