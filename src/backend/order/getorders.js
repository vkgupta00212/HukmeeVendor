import axios from "axios";

// Order model
class GetOrderModel {
  constructor(
    ID,
    OrderID,
    UserID,
    OrderType,
    ItemImages,
    ItemName,
    Price,
    Quantity,
    Address,
    Slot,
    SlotDatetime,
    OrderDatetime,
    Status
  ) {
    this.ID = ID;
    this.OrderID = OrderID;
    this.UserID = UserID;
    this.OrderType = OrderType;
    this.ItemImages = ItemImages;
    this.ItemName = ItemName;
    this.Price = Price;
    this.Quantity = Quantity;
    this.Address = Address;
    this.Slot = Slot;
    this.SlotDatetime = SlotDatetime;
    this.OrderDatetime = OrderDatetime;
    this.Status = Status;
  }

  static fromJson(json) {
    // Use placeholder if no image
    const imageUrl = json.ItemImages
      ? json.ItemImages.startsWith("http")
        ? json.ItemImages
        : `https://weprettify.com/Images/${json.ItemImages}`
      : "";

    return new GetOrderModel(
      json.ID || 0,
      json.OrderID || "",
      json.UserID || "",
      json.OrderType || "",
      imageUrl,
      json.ItemName || "",
      json.Price || "",
      json.Quantity || "",
      json.Address || "",
      json.Slot || "",
      json.SlotDatetime || "",
      json.OrderDatetime || "",
      json.Status || ""
    );
  }
}

// Fetch orders
const GetOrders = async (VendorPhone, Status) => {
  const formData = new URLSearchParams();
  formData.append("token", "SWNCMPMSREMXAMCKALVAALI");
  formData.append("UserID", ""); // leave empty as API requires
  formData.append("VendorPhone", VendorPhone);
  formData.append("Status", Status);

  try {
    const response = await axios.post(
      "https://api.hukmee.in/APIs/APIs.asmx/ShowOrders",
      formData,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    let rawData = response.data;

    // Parse if string
    if (typeof rawData === "string") {
      rawData = JSON.parse(rawData);
    }

    if (!Array.isArray(rawData)) return [];

    return rawData.map((item) => GetOrderModel.fromJson(item));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

export default GetOrders;
export { GetOrderModel };
