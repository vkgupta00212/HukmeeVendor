import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GetOrders from "../../backend/order/getorders";
import COLORS from "../core/constant";
import UpdateOrderstatus from "../../backend/order/updateorderstatus";
import RecordVideo from "../ui/recordvideo";
import UpdateWallet from "../../backend/getwallet/updatewallet";
import { Phone } from "lucide-react";

const OnService = () => {
  const [getorder, setGetOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showotp, setShowotp] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [otp, setOtp] = useState(null);

  // ✅ track before/after video upload separately
  const [uploadedBeforeVideos, setUploadedBeforeVideos] = useState({});
  const [uploadedAfterVideos, setUploadedAfterVideos] = useState({});
  const [videoType, setVideoType] = useState("Before");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [amout, setAmount] = useState(null);
  const otpModalRef = useRef(null);
  const UserID = localStorage.getItem("userPhone");
  const isMobile = window.innerWidth < 768;

  // Prevent scroll when OTP modal is open
  useEffect(() => {
    const active = showotp;
    document.body.classList.toggle("overflow-hidden", active);
    return () => document.body.classList.remove("overflow-hidden");
  }, [showotp]);

  // Fetch orders
  useEffect(() => {
    const fetchgetorder = async () => {
      setIsLoading(true);
      try {
        const data = await GetOrders(UserID, "Onservice");
        console.log("Fetched Orders:", data);
        setGetOrder(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setGetOrder([]);
      }
      setIsLoading(false);
    };

    if (UserID) fetchgetorder();
  }, [UserID]);

  // Cancel Order
  const handleCancelService = async (orderId) => {
    try {
      const response = await UpdateOrderstatus({
        OrderID: orderId,
        Status: "Cancelled",
        VendorPhone: UserID,
        BeforVideo: "",
        AfterVideo: "",
        OTP: "",
        PaymentMethod: "",
      });

      alert(response?.message || "Order cancelled successfully!");
      const refreshedData = await GetOrders(UserID, "Done");
      setGetOrder(refreshedData || []);
    } catch (error) {
      console.error("Cancel Order Error:", error);
      alert("Failed to cancel the order.");
    }
  };

  const handlePaymentComplete = async (orderId, mode) => {
    try {
      const response = await UpdateOrderstatus({
        OrderID: orderId,
        Status: "",
        VendorPhone: UserID,
        BeforVideo: "",
        AfterVideo: "",
        OTP: "",
        PaymentMethod: mode,
      });

      alert(response?.message || "Payment successfully! Completed", mode);
      window.location.reload();
    } catch (error) {
      console.error("Cancel Order Error:", error);
      alert("Failed to cancel the order.");
    }
  };
  // Handle Before/After button click
  const handleVideoClick = (order, type) => {
    console.log(`Starting ${type} video for order:`, order);
    const otpValue = order?.OTP || order?.otp || (order?._doc?.OTP ?? null);
    setOtp(otpValue);
    setSelectedOrder(order);
    setVideoType(type);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setShowotp(true);
    }, 300);
  };

  const handlePayment = (orderId, Amount) => {
    setPaymentOrderId(orderId);
    setAmount(Amount);
    setShowPaymentModal(true);
  };

  const handleupdatewallet = (balance) => {
    try {
      const response = UpdateWallet(UserID, balance, "Add");
    } catch (error) {
      console.error("Cancel Order Error:", error);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const bottomSheetVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  };

  return (
    <div className={`${COLORS.bgGray} py-10`}>
      {isLoading ? (
        <div className={`text-center ${COLORS.gradientFrom} font-semibold`}>
          Loading orders...
        </div>
      ) : (
        <OrderDetails
          orders={getorder}
          onCancel={handleCancelService}
          onVideoClick={handleVideoClick}
          onPayment={handlePayment}
          uploadedBeforeVideos={uploadedBeforeVideos}
          uploadedAfterVideos={uploadedAfterVideos}
        />
      )}

      {/* ✅ Video Recording Modal */}
      <AnimatePresence>
        {showotp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center"
          >
            {isMobile ? (
              <motion.div
                variants={bottomSheetVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="fixed bottom-0 left-0 right-0 w-full h-[70vh] bg-white rounded-t-2xl shadow-2xl p-6 max-w-md mx-auto"
                ref={otpModalRef}
              >
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                <RecordVideo
                  onClose={() => setShowotp(false)}
                  OrderID={selectedOrder?.OrderID}
                  VendorPhone={UserID}
                  Status="Onservice"
                  type={videoType}
                  OTP={otp}
                  PaymentMethod={selectedOrder?.PaymentMethod || ""}
                  onUploaded={(orderId) => {
                    if (videoType === "Before") {
                      setUploadedBeforeVideos((prev) => ({
                        ...prev,
                        [orderId]: true,
                      }));
                    } else {
                      setUploadedAfterVideos((prev) => ({
                        ...prev,
                        [orderId]: true,
                      }));
                    }
                    setShowotp(false);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
                ref={otpModalRef}
              >
                <RecordVideo
                  onClose={() => setShowotp(false)}
                  OrderID={selectedOrder?.OrderID}
                  VendorPhone={UserID}
                  Status="Onservice"
                  type={videoType}
                  OTP={otp}
                  PaymentMethod={selectedOrder?.PaymentMethod || ""}
                  onUploaded={(orderId) => {
                    if (videoType === "Before") {
                      setUploadedBeforeVideos((prev) => ({
                        ...prev,
                        [orderId]: true,
                      }));
                    } else {
                      setUploadedAfterVideos((prev) => ({
                        ...prev,
                        [orderId]: true,
                      }));
                    }
                    setShowotp(false);
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative bg-white p-6 rounded-2xl shadow-2xl w-[90%] max-w-sm text-center"
            >
              {/* ❌ Cross (Close) Button */}
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition"
              >
                ✕
              </button>

              <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-2">
                Is Payment Completed?
              </h3>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    handlePaymentComplete(paymentOrderId, "Cash");
                    handleupdatewallet(amout);
                  }}
                  className="px-4 py-2 text-green-700 rounded-lg bg-green-200 hover:bg-green-700 hover:text-white hover:cursor-pointer transition"
                >
                  Cash
                </button>

                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    handlePaymentComplete(paymentOrderId, "Online");
                  }}
                  className="px-4 py-2 text-green-700 rounded-lg bg-green-200 hover:bg-green-700 hover:text-white hover:cursor-pointer transition"
                >
                  Online
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnService;

// ==========================
// ✅ OrderDetails Component
// ==========================
const OrderDetails = ({
  orders,
  onCancel,
  onVideoClick,
  uploadedBeforeVideos,
  uploadedAfterVideos,
  onPayment,
}) => {
  const headers = [
    "OrderID",
    "UserID",
    "OrderType",
    "ItemName",
    "Price",
    "Quantity",
    "Status",
  ];

  return (
    <div
      className={`max-w-full mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border ${COLORS.borderGray}`}
    >
      <h2
        className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${COLORS.gradientFrom} ${COLORS.gradientTo} bg-clip-text text-transparent p-6`}
      >
        Orders
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={COLORS.tableHeadBg}>
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${COLORS.tableHeadText}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className={`px-6 py-4 text-center ${COLORS.textGray}`}
                >
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.ID} className="hover:bg-gray-50 transition">
                  <td className={`px-6 py-4 text-sm ${COLORS.textGrayDark}`}>
                    {order.OrderID}
                  </td>
                  <td className={`px-6 py-4 text-sm ${COLORS.textGrayDark}`}>
                    {order.UserID}
                  </td>
                  <td className={`px-6 py-4 text-sm ${COLORS.textGrayDark}`}>
                    {order.OrderType}
                  </td>
                  <td className={`px-6 py-4 text-sm ${COLORS.textGrayDark}`}>
                    {order.ItemName}
                  </td>
                  <td className={`px-6 py-4 text-sm ${COLORS.textGrayDark}`}>
                    ₹{order.Price}
                  </td>
                  <td className={`px-6 py-4 text-sm ${COLORS.textGrayDark}`}>
                    {order.Quantity}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.Status === "Pending"
                            ? `${COLORS.pendingBg} ${COLORS.pendingText}`
                            : `${COLORS.successBg} ${COLORS.successText}`
                        }`}
                      >
                        {order.Status}
                      </span>

                      {order.Status === "Onservice" && (
                        <div className="flex gap-2">
                          {/* Before Service */}
                          {!order.BeforVideo &&
                            !order.PaymentMethod &&
                            !order.AfterVideo && (
                              <button
                                onClick={() => onVideoClick(order, "Before")}
                                className="px-3 py-1 rounded-lg text-xs font-semibold transition bg-green-500 hover:bg-green-600 text-white"
                              >
                                Before Service
                              </button>
                            )}

                          {order.BeforVideo &&
                            !order.PaymentMethod &&
                            !order.AfterVideo && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onVideoClick(order, "After")}
                                  disabled={order.AfterVideo !== ""}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                    order.AfterVideo !== ""
                                      ? "bg-gray-400 text-white cursor-not-allowed"
                                      : "bg-blue-500 hover:bg-blue-600 text-white"
                                  }`}
                                >
                                  Update service
                                </button>

                                <button
                                  onClick={() =>
                                    onPayment(order.OrderID, order.Price)
                                  }
                                  disabled={order.AfterVideo !== ""}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                    order.AfterVideo !== ""
                                      ? "bg-gray-400 text-white cursor-not-allowed"
                                      : "bg-blue-500 hover:bg-blue-600 text-white"
                                  }`}
                                >
                                  Proceed
                                </button>
                              </div>
                            )}

                          {order.BeforVideo &&
                            order.PaymentMethod &&
                            !order.AfterVideo && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onVideoClick(order, "After")}
                                  disabled={order.AfterVideo !== ""}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                    order.AfterVideo !== ""
                                      ? "bg-gray-400 text-white cursor-not-allowed"
                                      : "bg-blue-500 hover:bg-blue-600 text-white"
                                  }`}
                                >
                                  After Service
                                </button>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
