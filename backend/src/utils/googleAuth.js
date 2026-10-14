import { OAuth2Client } from "google-auth-library";
import ErrorHandler from "./ErrorHandler.js";

const client = new OAuth2Client();

// Verifies a Google Identity Services ID token: Google's signature, this
// app's client ID as the audience, the issuer and the expiry. The address is
// returned only when Google has verified that the person owns it.
export const verifyGoogleCredential = async (credential) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new ErrorHandler("Google sign-in is not configured", 503);
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ErrorHandler("Google sign-in could not be verified", 401);
  }

  if (!payload?.email || payload.email_verified !== true) {
    throw new ErrorHandler(
      "Your Google account's email address is not verified",
      401
    );
  }

  return {
    email: payload.email.trim().toLowerCase(),
    name: payload.name?.trim() || payload.email.split("@")[0],
  };
};
