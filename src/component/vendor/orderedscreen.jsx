import React, { useState, useEffect } from "react";
import GetOrders from "../../backend/order/getorders";
import COLORS from "../core/constant";

const MyOrder = ({ status = "Done" }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const VendorPhone = localStorage.getItem("userPhone");
  console.log("VendorPhone:", VendorPhone);

  useEffect(() => {
    if (!VendorPhone) return;

    let isMounted = true; // track if component is still mounted

    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const data = await GetOrders(VendorPhone, status);
        console.log("Fetched Orders:", data);
        if (isMounted) setOrders(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        if (isMounted) setOrders([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [VendorPhone, status]);

  return (
    <div className={`${COLORS.bgGray} py-10 min-h-screen`}>
      {isLoading ? (
        <div className={`text-center ${COLORS.primaryFrom} font-semibold`}>
          Loading orders...
        </div>
      ) : (
        <OrderDetails orders={orders} />
      )}
    </div>
  );
};

export default MyOrder;

const OrderDetails = ({ orders }) => {
  const headers = [
    "ID",
    "OrderID",
    "UserID",
    "OrderType",
    "ItemImages",
    "ItemName",
    "Price",
    "Quantity",
    "Address",
    "Slot",
    "SlotDatetime",
    "OrderDatetime",
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
        <table className={`min-w-full divide-y ${COLORS.divideGray}`}>
          <thead className={`${COLORS.tableHeadBg}`}>
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className={`px-6 py-3 text-left text-xs font-medium ${COLORS.tableHeadText} uppercase tracking-wider`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className={`bg-white divide-y ${COLORS.divideGray}`}>
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
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.ID}
                  </td>
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
                    {order.ItemImages ? (
                      <img
                        src={order.ItemImages}
                        alt={order.ItemName}
                        className="h-12 w-12 object-cover rounded"
                        onError={(e) =>
                          (e.target.src =
                            "https://via.placeholder.com/150?text=Image+Not+Found")
                        }
                      />
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.ItemName || "N/A"}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    ₹{order.Price || 0}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.Quantity || 0}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.Address || "N/A"}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.Slot || "N/A"}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.SlotDatetime || "N/A"}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    {order.OrderDatetime
                      ? new Date(order.OrderDatetime).toLocaleString()
                      : "N/A"}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.textGrayDark}`}
                  >
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.Status.toLowerCase() === "pending"
                          ? `${COLORS.pendingBg} ${COLORS.pendingText}`
                          : `${COLORS.successBg} ${COLORS.successText}`
                      }`}
                    >
                      {order.Status || "N/A"}
                    </span>
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
