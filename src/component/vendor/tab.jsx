import { useState } from "react";
import { motion } from "framer-motion";
import COLORS from "../core/constant"; // adjust path as needed

const TabBar = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState("pending");

  const tabs = [
    { id: "pending", label: "Pending" },
    { id: "accepted", label: "Accepted" },
    { id: "declined", label: "Declined" },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className="relative mb-6 p-[3px]">
      <div className="relative border-2 border-black rounded-xl bg-white shadow-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex gap-5 p-5 bg-white rounded-lg"
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={`flex-1 px-3 py-3 rounded-md text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${COLORS.primaryFrom} ${COLORS.primaryTo} ${COLORS.textWhite} shadow-sm`
                  : `${COLORS.bgGray} ${COLORS.textGray} hover:bg-gradient-to-r ${COLORS.hoverFrom} ${COLORS.hoverTo} hover:${COLORS.textWhite}`
              }`}
              onClick={() => handleTabClick(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Select ${tab.label} tab`}
            >
              {tab.label}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default TabBar;
