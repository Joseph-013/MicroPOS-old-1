export const mmToChars = (mm: number) => {
  return Math.floor((mm / 58) * 32);
};

export const mmToPixelWidth = (mm: number): number => {
  return mm >= 80 ? 576 : 384;
};

export const formatCurrency = (valueInCents: number): string => {
  return (valueInCents / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
