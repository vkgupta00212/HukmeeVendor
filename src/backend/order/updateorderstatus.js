import axios from "axios";

const UpdateOrders = async ({
  OrderID,
  Status,
  VendorPhone,
  BeforVideo = "",
  AfterVideo = "",
  OTP = "",
  PaymentMethod = "",
}) => {
  const formData = new URLSearchParams();
  formData.append("token", "SWNCMPMSREMXAMCKALVAALI");
  formData.append("OrderID", OrderID);
  formData.append("Status", Status);
  formData.append("VendorPhone", VendorPhone);
  formData.append("BeforVideo", BeforVideo);
  formData.append("AfterVideo", AfterVideo);
  formData.append("OTP", OTP);
  formData.append("PaymentMethod", PaymentMethod);

  try {
    const response = await axios.post(
      "https://api.hukmee.in/APIs/APIs.asmx/UpdateOrders",
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Handle JSON or XML-like string response safely
    let data = response.data;

    // Sometimes .asmx returns stringified JSON — try parsing it
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        // leave as string if it's not valid JSON
      }
    }

    // Return message only if present
    return data?.message || data;
  } catch (error) {
    console.error("UpdateOrders Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return "Failed to update order.";
  }
};

export default UpdateOrders;
