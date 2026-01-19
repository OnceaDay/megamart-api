module.exports = (cart) => {
  let total = 0;

  for (const item of cart.items) {
    const price = item.productId?.price ?? 0;
    total += price * item.quantity;
  }

  return total;
};
