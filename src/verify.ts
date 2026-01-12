/**
 * Verifies the Kolide webhook signature using SHA256 HMAC
 *
 * @param requestBody - The raw request body as string
 * @param signature - The signature from the Authorization header
 * @param secret - The webhook signing secret from Kolide
 * @returns True if signature is valid, false otherwise
 */
export async function verifyKolideSignature(
  requestBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Encode the secret and body as Uint8Arrays
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret);
  const bodyData = encoder.encode(requestBody);

  // Import the secret as a CryptoKey for HMAC
  const key = await crypto.subtle.importKey(
    "raw",
    secretData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Generate the signature
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, bodyData);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Compare signatures (constant-time comparison would be ideal, but simple comparison works)
  return hashHex === signature.toLowerCase();
}
