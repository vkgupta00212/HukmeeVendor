import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import colors from "../core/constant";
import AcceptLeads from "../../backend/order/acceptleads";
import DeclineLeads from "../../backend/order/declineleads";
import ShowLeads from "../../backend/order/showleads";
import UpdateOrders from "../../backend/order/updateorderstatus";

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({ width: undefined });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth });
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Run once
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

const Popupcard = ({ onClose, onSubmit }) => {
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const modalRef = useRef(null);
  const [timer, setTimer] = useState(60);
  const UserID = localStorage.getItem("userPhone");
  const [leadsDetails, setLeadsDetails] = useState(null);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;

    const focusableElements = modalElement.querySelectorAll(
      'button, [href], [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    modalElement.addEventListener("keydown", handleKeyDown);
    firstElement?.focus();

    return () => modalElement.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchLeadsDetails = async () => {
      try {
        const data = await ShowLeads(UserID, "Pending");
        setLeadsDetails(data);
      } catch (error) {
        console.error("Error fetching leads details:", error);
      }
    };
    fetchLeadsDetails();
  }, [UserID]);

  const handleAccept = async () => {
    if (!leadsDetails || leadsDetails.length === 0) {
      console.error("No pending leads found");
      return;
    }

    // ✅ Use the first pending lead
    const order = leadsDetails[0];
    const orderId = order.OrderID;

    console.log("Accepting order:", orderId);

    try {
      const acceptResponse = await AcceptLeads(orderId, UserID);
      console.log("✅ Lead accepted:", acceptResponse);

      // Step 2️⃣: Update order status to "Onservice"
      const updateResponse = await UpdateOrders({
        OrderID: orderId,
        Status: "Done",
        VendorPhone: UserID,
        BeforVideo: "",
        AfterVideo: "",
        OTP: "",
        PaymentMethod: "",
      });

      console.log("✅ Order status updated:", updateResponse);
      window.location.reload();
      alert(`Order ${orderId} accepted and updated to "Onservice"`);
      onClose?.();
    } catch (error) {
      console.error("❌ Error accepting or updating order:", error);
      alert("Failed to accept or update the order. Please try again.");
      onClose?.(); // Close modal even on failure for UX
    }
  };

  const handleDecline = async () => {
    if (!leadsDetails || leadsDetails.length === 0) {
      console.error("❌ No pending leads found");
      return;
    }

    const orderId = leadsDetails[0].OrderID;

    try {
      const response = await DeclineLeads(orderId, UserID);

      if (response?.message === "Lead Declined Successfully") {
        console.log("✅ Order declined successfully:", orderId);
      } else {
        console.warn("⚠️ Unexpected response:", response);
      }
      window.location.reload();
      onClose?.(); // close modal after decline
    } catch (error) {
      console.error("❌ Error declining order:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
  };

  const leadsRef = useRef(leadsDetails);
  useEffect(() => {
    leadsRef.current = leadsDetails;
  }, [leadsDetails]);

  useEffect(() => {
    if (timer <= 0) return;

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown); // stop at 0

          // Auto-decline
          const currentLeads = leadsRef.current;
          if (currentLeads && currentLeads.length > 0) {
            const orderId = currentLeads[0].OrderID;
            DeclineLeads(orderId, UserID)
              .then((res) => console.log("⏱ Auto-declined:", res.message))
              .catch((err) => console.error("❌ Error auto-declining:", err));
          }

          onClose?.(); // close modal
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [UserID, onClose]);

  // Animations
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
    <AnimatePresence>
      {isMobile ? (
        // Mobile Bottom Sheet
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          role="dialog"
          aria-modal="true"
          ref={modalRef}
        >
          <motion.div
            variants={bottomSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed bottom-0 left-0 right-0 w-full h-[60vh] bg-white rounded-t-2xl shadow-2xl p-6 sm:p-8 font-sans max-w-md mx-auto"
          >
            {/* Handle bar */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

            {/* Close button */}
            {/* <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
            >
              <X className="w-6 h-6" />
            </button> */}

            {/* Content */}
            <div className="mb-6">
              <h2
                className={`text-2xl font-bold bg-gradient-to-r ${colors.primaryFrom} ${colors.primaryTo} bg-clip-text text-transparent`}
              >
                New Order
              </h2>
              <p className="text-sm text-gray-600 mt-2 flex items-center justify-between">
                <span>After 0 automatic decline will be applied.</span>
                <span className="text-red-500 font-semibold">
                  {timer > 0 ? `${timer}s` : "Time expired"}
                </span>
              </p>
            </div>

            {/* Service Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Service Details
              </h3>
              <p className="text-sm text-gray-600">
                By accepting, you agree to our service terms, which include
                secure access to our platform and compliance with our policies.
                This ensures a safe and personalized experience. For more
                information, review our Terms and Privacy Policy below.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAccept}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all bg-gradient-to-r ${colors.primaryFrom} ${colors.primaryTo} ${colors.textWhite} ${colors.hoverFrom} ${colors.hoverTo}`}
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all border ${colors.borderGray} text-gray-600 hover:bg-gray-100`}
              >
                Decline
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        // Desktop Modal
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          ref={modalRef}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 font-sans"
          >
            {/* Close button */}

            {/* Content */}
            <div className="mb-6">
              <h2
                className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${colors.primaryFrom} ${colors.primaryTo} bg-clip-text text-transparent`}
              >
                New Order
              </h2>
              <p className="text-sm text-gray-600 mt-2 flex items-center justify-between">
                <span>After 0 automatic decline will be applied.</span>
                <span className="text-red-500 font-semibold">
                  {timer > 0 ? `${timer}s` : "Time expired"}
                </span>
              </p>
            </div>

            {/* Service Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                New Order
              </h3>
              <p className="text-sm text-gray-600">
                By accepting, you agree to our service terms, which include
                secure access to our platform and compliance with our policies.
                This ensures a safe and personalized experience. For more
                information, review our Terms and Privacy Policy below.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAccept}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all bg-gradient-to-r ${colors.primaryFrom} ${colors.primaryTo} ${colors.textWhite} ${colors.hoverFrom} ${colors.hoverTo} hover:cursor-pointer`}
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all border ${colors.borderGray} text-gray-600 hover:bg-gray-100`}
              >
                Decline
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Popupcard;
