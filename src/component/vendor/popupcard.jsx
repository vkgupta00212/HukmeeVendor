import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import colors from "../core/constant";
import DeclineLeads from "../../backend/order/declineleads";
import ShowLeads from "../../backend/order/showleads";
import UpdateOrders from "../../backend/order/updateorderstatus";
import AcceptLeads from "../../backend/order/acceptleads";

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

const Popupcard = ({ onClose }) => {
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const modalRef = useRef(null);

  const [timer, setTimer] = useState(60);
  const [leadsDetails, setLeadsDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const UserID = localStorage.getItem("userPhone");

  // Fetch leads
  useEffect(() => {
    const fetchLeadsDetails = async () => {
      try {
        const data = await ShowLeads(UserID, "Pending");
        setLeadsDetails(data || []);
      } catch (error) {
        console.error("Error fetching leads details:", error);
      }
    };
    fetchLeadsDetails();
  }, [UserID]);

  // Timer logic (auto decline)
  const leadsRef = useRef(leadsDetails);
  useEffect(() => {
    leadsRef.current = leadsDetails;
  }, [leadsDetails]);

  useEffect(() => {
    if (timer <= 0) return;

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          const currentLeads = leadsRef.current;
          if (currentLeads && currentLeads.length > 0) {
            const orderId = currentLeads[0].OrderID;
            DeclineLeads(orderId, UserID)
              .then((res) => console.log("⏱ Auto-declined:", res?.message))
              .catch((err) => console.error("❌ Auto-decline error:", err));
          }
          onClose?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [UserID, onClose]);

  // Handle Accept
  const handleAccept = async () => {
    if (!leadsDetails?.length) {
      alert("No pending leads found.");
      return;
    }

    const order = leadsDetails[0];
    setLoading(true);

    try {
      const response = await UpdateOrders({
        OrderID: order.OrderID,
        Address: "",  
        Slot: "",
        Status: "Done",
        VendorPhone: UserID,
        BeforVideo: "",
        AfterVideo: "",
        OTP: "",
        PaymentMethod: "",
      });

      console.log("✅ UpdateOrders Response:", response);

      try {
        await AcceptLeads(order.OrderID, UserID);
        // alert("Order accepted successfully!");
      } catch (err) {
        console.error("❌ AcceptLeads Error:", err);
      }
      if (response === "Updated Successfully") {
        // alert("Order updated successfully!");
        window.location.reload();
      } else {
        alert("Unexpected API response: " + response);
      }
    } catch (error) {
      console.error("❌ handleAccept Error:", error);
      alert("Something went wrong while updating order.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Decline
  const handleDecline = async () => {
    if (!leadsDetails?.length) {
      alert("No pending leads found.");
      return;
    }

    const orderId = leadsDetails[0].OrderID;
    setLoading(true);

    try {
      const response = await DeclineLeads(orderId, UserID);
      console.log("DeclineLeads Response:", response);

      if (response?.message === "Lead Declined Successfully") {
        alert("Order declined successfully.");
        window.location.reload();
      } else {
        alert("Unexpected response: " + response?.message);
      }
    } catch (error) {
      console.error("DeclineLeads Error:", error);
      alert("Failed to decline order.");
    } finally {
      setLoading(false);
      onClose?.();
    }
  };

  // Animation Variants
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

  // Shared UI content
  const Content = (
    <>
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

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Service Details
        </h3>
        <p className="text-sm text-gray-600">
          By accepting, you agree to our service terms, which include secure
          access to our platform and compliance with our policies.
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={handleAccept}
          disabled={loading}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all bg-gradient-to-r ${
            colors.primaryFrom
          } ${colors.primaryTo} ${colors.textWhite} ${colors.hoverFrom} ${
            colors.hoverTo
          } ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:cursor-pointer"
          }`}
        >
          {loading ? "Processing..." : "Accept"}
        </button>
        <button
          onClick={handleDecline}
          disabled={loading}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all border ${
            colors.borderGray
          } text-gray-600 hover:bg-gray-100 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Please wait..." : "Decline"}
        </button>
      </div>
    </>
  );

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
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            {Content}
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
            {Content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Popupcard;
