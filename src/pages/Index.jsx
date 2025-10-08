import React, { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../component/Footer";
import MyOrder from "../component/vendor/orderedscreen";
import TabBar from "../component/vendor/tab";
import PendingScreen from "../component/vendor/pendingscreen";
import DeclinedScreen from "../component/vendor/declinedscreen";
import COLORS from "../component/core/constant";
import LoginCard from "../component/ui/loginCard.jsx";
import OtpVerification from "../component/ui/otpverification.jsx";
import GetUser from "../backend/authentication/getuser.js";
import VendorVerification from "../component/ui/verification.jsx";

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({ width: undefined });
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth });
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
};
const Index = () => {
  const [selectedTab, setSelectedTab] = useState("pending");
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [user, setUser] = useState([]);
  const loginModalRef = useRef(null);
  const otpModalRef = useRef(null);
  const { width } = useWindowSize();
  const [pendingPhone, setPendingPhone] = useState("");
  const isMobile = width < 640;
  const mobile = localStorage.getItem("userPhone");

  const renderContent = () => {
    switch (selectedTab) {
      case "pending":
        return <PendingScreen status="pending" />;
      case "accepted":
        return <MyOrder status="accepted" />;
      case "declined":
        return <DeclinedScreen status="declined" />;
      default:
        return null;
    }
  };

  const handleLoginClick = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowLoginModal(true);
    }, 500);
  };

  useEffect(() => {
    if (showLoginModal || showOtpModal) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [showLoginModal, showOtpModal]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await GetUser(mobile);
        console.log("user have fetched from the index", data);
        setUser(data || []);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    if (mobile) fetchUser();
  }, [mobile]);

  useEffect(() => {
    if (!showLoginModal || !loginModalRef.current) return;
    const modalElement = loginModalRef.current;
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
  }, [showLoginModal]);

  useEffect(() => {
    if (!showOtpModal || !otpModalRef.current) return;
    const modalElement = otpModalRef.current;
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
  }, [showOtpModal]);

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

  const handleLoginSubmit = (phoneNumber) => {
    setIsProcessing(true);
    setTimeout(() => {
      setPendingPhone(phoneNumber);
      setShowLoginModal(false);
      setShowOtpModal(true);
      setIsProcessing(false);
    }, 500);
  };

  const handleOtpSuccess = (verifiedPhone) => {
    localStorage.setItem("userPhone", verifiedPhone);
    localStorage.setItem("isLoggedIn", "true");
    setShowOtpModal(false);
    window.location.reload();
  };

  if (!isLoggedIn) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${COLORS.bgGray} px-4`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center"
        >
          <h2
            className={`text-2xl sm:text-3xl font-bold ${COLORS.textGrayDark} mb-4`}
          >
            You’re not logged in
          </h2>
          <p className={`${COLORS.textMuted} mb-8 text-sm sm:text-base`}>
            To access your profile and start using all features, please log in
            to your account.
          </p>
          <button
            onClick={handleLoginClick}
            disabled={isProcessing}
            className={`px-8 py-3 text-lg font-semibold bg-gradient-to-r ${
              COLORS.gradientFrom
            } ${COLORS.gradientTo} ${COLORS.textWhite} rounded-xl shadow-lg ${
              COLORS.hoverFrom
            } ${COLORS.hoverTo} transition-all duration-300 ${
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label={
              isProcessing ? "Processing login" : "Log in to your account"
            }
            aria-busy={isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                Processing...
              </div>
            ) : (
              "Get Started"
            )}
          </button>
        </motion.div>

        <AnimatePresence>
          {showLoginModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 pointer-events-auto"
              ref={loginModalRef}
              aria-modal="true"
              role="dialog"
            >
              {isMobile ? (
                <motion.div
                  variants={bottomSheetVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="fixed bottom-0 left-0 right-0 w-full h-[70vh] bg-white rounded-t-2xl shadow-2xl p-6 max-w-md mx-auto pointer-events-auto"
                >
                  <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                  <LoginCard
                    onClose={() => setShowLoginModal(false)}
                    onSubmit={handleLoginSubmit}
                  />
                </motion.div>
              ) : (
                <motion.div
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex items-center justify-center h-full"
                >
                  <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full pointer-events-auto">
                    <LoginCard
                      onClose={() => setShowLoginModal(false)}
                      onSubmit={handleLoginSubmit}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showOtpModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 pointer-events-auto"
              ref={otpModalRef}
              aria-modal="true"
              role="dialog"
            >
              {isMobile ? (
                <motion.div
                  variants={bottomSheetVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="fixed bottom-0 left-0 right-0 w-full h-[70vh] bg-white rounded-t-2xl shadow-2xl p-6 max-w-md mx-auto pointer-events-auto"
                >
                  <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                  <OtpVerification
                    phone={pendingPhone}
                    onSuccess={handleOtpSuccess}
                    onClose={() => setShowOtpModal(false)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex items-center justify-center h-full"
                >
                  <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full pointer-events-auto">
                    <OtpVerification
                      phone={pendingPhone}
                      onSuccess={handleOtpSuccess}
                      onClose={() => setShowOtpModal(false)}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      {user[0]?.verified === "approved" ? (
        <div className="min-h-screen bg-gray-50">
          <section className="relative bg-white p-4">
            {/* Tab bar with change handler */}
            <TabBar onTabChange={setSelectedTab} />

            {/* Render the selected tab's content */}
            <div className="mt-6">
              <Suspense fallback={<div>Loading...</div>}>
                {renderContent()}
              </Suspense>
            </div>
          </section>

          <footer className="mt-8 bg-gray-100 z-10 md:hidden">
            <Footer />
          </footer>
        </div>
      ) : (
        <VendorVerification />
      )}
    </>
  );
};

export default Index;
