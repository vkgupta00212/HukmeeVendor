import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GetOrders from "../../backend/order/getorders";
import COLORS from "../core/constant";
import UpdateOrderstatus from "../../backend/order/updateorderstatus";
import RecordVideo from "../ui/recordvideo";
import UpdateWallet from "../../backend/getwallet/updatewallet";
import InsertTransaction from "../../backend/gettransaction/inserttransaction";
import {
  Video,
  Camera,
  IndianRupee,
  CheckCircle,
  Clock,
  Package,
  User,
  ShoppingBag,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

const OnService = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [videoType, setVideoType] = useState("Before");
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(null);

  const [uploadedBefore, setUploadedBefore] = useState({});
  const [uploadedAfter, setUploadedAfter] = useState({});

  const UserID = localStorage.getItem("userPhone");
  const isMobile = window.innerWidth < 768;

  // Prevent scroll
  useEffect(() => {
    const active = showVideoModal || showPaymentModal;
    document.body.style.overflow = active ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showVideoModal, showPaymentModal]);

  // Fetch Onservice orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!UserID) return;
      setIsLoading(true);
      try {
        const data = await GetOrders(UserID, "Onservice");
        setOrders(data || []);
      } catch (error) {
        console.error("Error fetching Onservice orders:", error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [UserID]);

  // Update Wallet
  const updateWalletBalance = async (amount) => {
    try {
      await UpdateWallet(UserID, amount, "Add");
    } catch (error) {
      console.error("Wallet update failed:", error);
    }
  };

  // Handle Payment Completion
  const handlePaymentComplete = async (orderId, amount, mode) => {
    try {
      const transactionId = `TRN${Math.floor(100000 + Math.random() * 900000)}`;
      const currentDate = new Date().toISOString().split("T")[0];

      // 1. Update Order Status (PaymentMethod)
      const updateResponse = await UpdateOrderstatus({
        OrderID: orderId,
        Status: "Onservice",
        VendorPhone: UserID,
        BeforVideo: "",
        AfterVideo: "",
        OTP: "",
        PaymentMethod: mode,
      });

      if (updateResponse) {
        // 2. Insert Transaction
        const inserted = await InsertTransaction(
          transactionId,
          amount,
          currentDate,
          UserID
        );
        if (inserted) {
          alert(`Payment via ${mode} successful! TXN: ${transactionId}`);
          updateWalletBalance(amount);
        } else {
          alert("Payment recorded, but transaction log failed.");
        }
      } else {
        alert("Failed to update payment status.");
      }

      window.location.reload();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment process failed.");
    }
  };

  // Open Video Modal
  const openVideoModal = (order, type) => {
    const otp = order?.OTP || order?.otp || order?._doc?.OTP || null;
    setSelectedOrder({ ...order, OTP: otp });
    setVideoType(type);
    setShowVideoModal(true);
  };

  // Open Payment Modal
  const openPaymentModal = (orderId, amount) => {
    setPaymentOrderId(orderId);
    setPaymentAmount(amount);
    setShowPaymentModal(true);
  };

  return (
    <div className={`${COLORS.bgGray} min-h-screen py-6 px-4`}>
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${COLORS.gradientFrom} ${COLORS.gradientTo} bg-clip-text text-transparent mb-8 text-center`}
        >
          On Service Orders
        </motion.h1>

        {isLoading ? (
          <LoadingSkeleton />
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {orders.map((order, index) => (
                <OnServiceCard
                  key={order.OrderID}
                  order={order}
                  index={index}
                  onVideoClick={openVideoModal}
                  onPayment={openPaymentModal}
                  uploadedBefore={uploadedBefore}
                  uploadedAfter={uploadedAfter}
                  onVideoUploaded={(orderId, type) => {
                    if (type === "Before") {
                      setUploadedBefore((prev) => ({
                        ...prev,
                        [orderId]: true,
                      }));
                    } else {
                      setUploadedAfter((prev) => ({
                        ...prev,
                        [orderId]: true,
                      }));
                    }
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Video Recording Modal */}
      <VideoRecordModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        order={selectedOrder}
        videoType={videoType}
        onUploaded={(orderId) => {
          setShowVideoModal(false);
          if (videoType === "Before") {
            setUploadedBefore((prev) => ({ ...prev, [orderId]: true }));
          } else {
            setUploadedAfter((prev) => ({ ...prev, [orderId]: true }));
          }
        }}
        isMobile={isMobile}
      />

      {/* Payment Confirmation Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderId={paymentOrderId}
        amount={paymentAmount}
        onConfirm={handlePaymentComplete}
      />
    </div>
  );
};

// ==========================
// OnService Card
// ==========================
const OnServiceCard = ({
  order,
  index,
  onVideoClick,
  onPayment,
  uploadedBefore,
  uploadedAfter,
  onVideoUploaded,
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const hasBefore = !!order.BeforVideo || uploadedBefore[order.OrderID];
  const hasPayment = !!order.PaymentMethod;
  const hasAfter = !!order.AfterVideo || uploadedAfter[order.OrderID];

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-[14px] text-gray-800 flex items-center gap-2">
              <Package size={18} />#{order.OrderID}
            </h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <User size={14} />
              {order.UserID}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
            <Clock size={14} />
            On Service
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600 flex items-center gap-1">
              <ShoppingBag size={14} />
              Service
            </span>
            <span className="font-medium">{order.ItemName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type</span>
            <span className="font-medium capitalize">{order.OrderType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 flex items-center gap-1">
              <IndianRupee size={14} />
              Amount
            </span>
            <span className="font-semibold text-blue-600">₹{order.Price}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Qty</span>
            <span className="font-medium">{order.Quantity}</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between text-xs mb-5">
          <div
            className={`flex flex-col items-center ${
              hasBefore ? "text-green-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                hasBefore ? "bg-green-100 border-green-600" : "border-gray-300"
              }`}
            >
              {hasBefore ? <CheckCircle size={16} /> : <Camera size={16} />}
            </div>
            <span className="mt-1">Before</span>
          </div>
          <div className="flex-1 h-1 bg-gray-200 mx-2 relative">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                hasPayment
                  ? "w-full bg-green-500"
                  : hasBefore
                  ? "w-1/2 bg-blue-500"
                  : "w-0"
              }`}
            />
          </div>
          <div
            className={`flex flex-col items-center ${
              hasPayment ? "text-green-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                hasPayment ? "bg-green-100 border-green-600" : "border-gray-300"
              }`}
            >
              {hasPayment ? (
                <CheckCircle size={16} />
              ) : (
                <IndianRupee size={16} />
              )}
            </div>
            <span className="mt-1">Payment</span>
          </div>
          <div className="flex-1 h-1 bg-gray-200 mx-2 relative">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                hasAfter
                  ? "w-full bg-green-500"
                  : hasPayment
                  ? "w-1/2 bg-blue-500"
                  : "w-0"
              }`}
            />
          </div>
          <div
            className={`flex flex-col items-center ${
              hasAfter ? "text-green-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                hasAfter ? "bg-green-100 border-green-600" : "border-gray-300"
              }`}
            >
              {hasAfter ? <CheckCircle size={16} /> : <Video size={16} />}
            </div>
            <span className="mt-1">After</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2">
          {!hasBefore && (
            <button
              onClick={() => onVideoClick(order, "Before")}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 rounded-xl font-medium text-sm hover:shadow-md transition flex items-center justify-center gap-2"
            >
              <Camera size={16} />
              Record Before Video
            </button>
          )}

          {hasBefore && !hasPayment && (
            <button
              onClick={() => onPayment(order.OrderID, order.Price)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-xl font-medium text-sm hover:shadow-md transition flex items-center justify-center gap-2"
            >
              <IndianRupee size={16} />
              Confirm Payment
            </button>
          )}

          {hasBefore && hasPayment && !hasAfter && (
            <button
              onClick={() => onVideoClick(order, "After")}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2.5 rounded-xl font-medium text-sm hover:shadow-md transition flex items-center justify-center gap-2"
            >
              <Video size={16} />
              Record After Video
            </button>
          )}

          {hasAfter && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2.5 rounded-xl font-medium text-sm text-center flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              Service Complete
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ==========================
// Video Record Modal
// ==========================
const VideoRecordModal = ({
  isOpen,
  onClose,
  order,
  videoType,
  onUploaded,
  isMobile,
}) => {
  const modalVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  };

  const bottomSheet = {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            variants={isMobile ? bottomSheet : modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`${
              isMobile
                ? "fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl p-6 pb-8"
                : "bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {isMobile && (
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />
            )}

            <RecordVideo
              onClose={onClose}
              OrderID={order?.OrderID}
              VendorPhone={localStorage.getItem("userPhone")}
              Status="Onservice"
              type={videoType}
              OTP={order?.OTP}
              PaymentMethod={order?.PaymentMethod || ""}
              onUploaded={onUploaded}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==========================
// Payment Confirmation Modal
// ==========================
const PaymentModal = ({ isOpen, onClose, orderId, amount, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="text-blue-600" size={32} />
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Payment Received?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Confirm ₹{amount} has been paid for Order #{orderId}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onConfirm(orderId, amount, "Cash");
                  onClose();
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-xl font-medium hover:shadow-md transition"
              >
                Cash
              </button>
              <button
                onClick={() => {
                  onConfirm(orderId, amount, "Online");
                  onClose();
                }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2.5 rounded-xl font-medium hover:shadow-md transition"
              >
                Online
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==========================
// Loading & Empty States
// ==========================
const LoadingSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-2xl shadow-lg p-5 animate-pulse border border-gray-100"
      >
        <div className="flex justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="mt-5 h-10 bg-gray-200 rounded-xl"></div>
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-16"
  >
    <div className="bg-gray-100 w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center">
      <Clock size={48} className="text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-700 mb-2">
      No Active Services
    </h3>
    <p className="text-gray-500 max-w-md mx-auto">
      Orders in progress will appear here. Start recording to track service
      flow.
    </p>
  </motion.div>
);

export default OnService;
