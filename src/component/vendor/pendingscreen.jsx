import React, { useState, useEffect } from "react";
import GetOrders from "../../backend/order/getorders";
import COLORS from "../core/constant";

const PendingScreen = () => {
  const [getorder, setGetOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const UserID = localStorage.getItem("userPhone");

  useEffect(() => {
    const fetchgetorder = async () => {
      setIsLoading(true);
      try {
        const data = await GetOrders(UserID, "Pending");
        console.log("Fetched Orders: ", data);
        setGetOrder(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setGetOrder([]);
      }
      setIsLoading(false);
    };

    if (UserID) fetchgetorder();
  }, [UserID]);

  return (
    <div className={`${COLORS.bgGray} py-10`}>
      {isLoading ? (
        <div className={`text-center ${COLORS.gradientFrom} font-semibold`}>
          Loading orders...
        </div>
      ) : (
        <OrderDetails orders={getorder} />
      )}
    </div>
  );
};

export default PendingScreen;

const OrderDetails = ({ orders }) => {
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
                  {/* <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.ID}
                  </td> */}
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.OrderID}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.UserID}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.OrderType}
                  </td>

                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.ItemName}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    ₹{order.Price}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.Quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.Status === "Pending"
                            ? `${COLORS.pendingBg} ${COLORS.pendingText}`
                            : `${COLORS.successBg} ${COLORS.successText}`
                        }`}
                      >
                        {order.Status}
                      </span>

                      {/* Action Buttons */}
                      {order.Status === "Pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(order.ID)}
                            className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-600 transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(order.ID)}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition"
                          >
                            Decline
                          </button>
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
