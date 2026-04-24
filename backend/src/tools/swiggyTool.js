async function searchRestaurants({ query, tasteProfile, location }) {
  return [
    {
      id: "rest_001",
      name: "Spice Street Kitchen",
      rating: 4.4,
      etaMinutes: 28,
      location: location || "default-city",
      matchedBy: `${query}:${tasteProfile}`,
    },
    {
      id: "rest_002",
      name: "Rainy Day Bites",
      rating: 4.2,
      etaMinutes: 32,
      location: location || "default-city",
      matchedBy: `${query}:${tasteProfile}`,
    },
  ];
}

async function getMenu(restaurantId) {
  return [
    { id: `${restaurantId}_dish_1`, name: "Spicy Momos", price: 189 },
    { id: `${restaurantId}_dish_2`, name: "Mirchi Pakoda", price: 149 },
  ];
}

async function createCart(items) {
  return { cartId: "cart_mock_001", items };
}

async function placeOrder(cartId) {
  return { orderId: "order_mock_001", cartId, status: "placed" };
}

module.exports = {
  searchRestaurants,
  getMenu,
  createCart,
  placeOrder,
};
