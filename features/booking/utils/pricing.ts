export function calculateRemainingAmount(totalPrice: number, advanceAmount: number): number {
  return totalPrice - advanceAmount;
}

/** @deprecated Use calculateBookingSummary */
export function calculateBookingPrice(
  slots: { id: string; price: number }[],
  selectedSlotIds: string[],
  config: { fixedAdvanceAmount: number },
): {
  totalTurfPrice: number;
  advanceAmount: number;
  remainingAmount: number;
} {
  const totalTurfPrice = slots
    .filter((slot) => selectedSlotIds.includes(slot.id))
    .reduce((sum, slot) => sum + slot.price, 0);

  const advanceAmount = config.fixedAdvanceAmount;
  const remainingAmount = calculateRemainingAmount(totalTurfPrice, advanceAmount);

  return { totalTurfPrice, advanceAmount, remainingAmount };
}
