export const mockCountries = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
];

export const mockRecipients = [
  {
    id: "1",
    name: "Mary Okafor",
    phone: "+2348031234567",
    country: "Nigeria",
    flag: "🇳🇬",
    initials: "MO",
  },
  {
    id: "2",
    name: "James Kone",
    email: "james@email.com",
    country: "Ghana",
    flag: "🇬🇭",
    initials: "JK",
  },
  {
    id: "3",
    name: "Amina Nyong",
    phone: "+237691234567",
    country: "Cameroon",
    flag: "🇨🇲",
    initials: "AN",
  },
];

export const mockCurrencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "UGX" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "XOF", name: "West African CFA", symbol: "CFA" },
  { code: "CDF", name: "Congolese Franc", symbol: "FC" },
  { code: "XAF", name: "Central African CFA", symbol: "FCFA" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF" },
  { code: "SLE", name: "Sierra Leonean Leone", symbol: "Le" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
];

export const mockExchangeRates = {
  "USD-KES": 129.0,
  "KES-USD": 0.0077,
};

export const mockFAQs = [
  {
    question: "How long do transfers take?",
    answer: "Most transfers complete within 5 minutes to African countries. Bank transfers may take up to 1-2 business days.",
  },
  {
    question: "What are the transfer fees?",
    answer: "Fees start from $2.99 per transfer. The exact fee depends on the amount, destination, and delivery method.",
  },
  {
    question: "How to verify my account?",
    answer: "Upload a valid ID (passport, national ID, or driver's license), proof of address, and take a selfie. Verification usually takes 24-48 hours.",
  },
  {
    question: "Can I cancel a transfer?",
    answer: "Yes, you can cancel a transfer if it hasn't been processed yet. Go to Transactions and tap on the pending transfer to cancel.",
  },
  {
    question: "Is my money safe?",
    answer: "Yes, we use bank-level security and are regulated by financial authorities. Your funds are protected by FDIC insurance.",
  },
  {
    question: "How much can I send?",
    answer: "Daily limits start at $2,500 for verified accounts. Monthly limits can go up to $50,000 based on your verification level.",
  },
];
