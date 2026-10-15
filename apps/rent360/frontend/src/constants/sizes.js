export const DEFAULT_RENTAL_SIZES = [
  { id: 'size-1', name: '36 (XS)', code: '36' },
  { id: 'size-2', name: '38 (S)', code: '38' },
  { id: 'size-3', name: '40 (M)', code: '40' },
  { id: 'size-4', name: '42 (L)', code: '42' },
  { id: 'size-5', name: '44 (XL)', code: '44' },
  { id: 'size-6', name: '46 (XXL)', code: '46' },
  { id: 'size-7', name: 'Free Size (Adjustable)', code: 'FS' }
];

export const getStoreSizes = () => {
  try {
    const saved = localStorage.getItem('rent360_master_sizes');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_RENTAL_SIZES;
};
