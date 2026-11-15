// GSTIN: 2-digit state code + 10-char PAN + entity number + "Z" + check character.
// The check character is a mod-36 checksum over the first 14 characters.

const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Valid GST state / UT codes (01–38 plus 97 Other Territory and 99 Centre Jurisdiction). */
const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
  "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya",
  "18": "Assam", "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
  "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "28": "Andhra Pradesh (old)",
  "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh", "97": "Other Territory", "99": "Centre Jurisdiction",
};

export function gstinCheckChar(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = CHARSET.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARSET[(36 - (sum % 36)) % 36];
}

export type GstinResult =
  | { valid: true; gstin: string; state: string; stateCode: string }
  | { valid: false; gstin: string; reason: string };

export function validateGstin(input: string): GstinResult {
  const gstin = input.replace(/\s+/g, "").toUpperCase();
  if (gstin.length !== 15) {
    return { valid: false, gstin, reason: `GSTIN must be 15 characters, got ${gstin.length}` };
  }
  if (!GSTIN_REGEX.test(gstin)) {
    return { valid: false, gstin, reason: "Does not match the GSTIN pattern (state code + PAN + entity + Z + check)" };
  }
  const stateCode = gstin.slice(0, 2);
  const state = STATE_CODES[stateCode];
  if (!state) {
    return { valid: false, gstin, reason: `Unknown state code ${stateCode}` };
  }
  const expected = gstinCheckChar(gstin.slice(0, 14));
  if (gstin[14] !== expected) {
    return {
      valid: false,
      gstin,
      reason: `Checksum failed: last character is ${gstin[14]}, expected ${expected}. Likely a misread or typo.`,
    };
  }
  return { valid: true, gstin, state, stateCode };
}
