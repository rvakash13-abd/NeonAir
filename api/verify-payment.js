import crypto from 'node:crypto';
import { adminAuth, adminDb } from '../lib/firebaseAdmin.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, idToken } = request.body || {};

  if (!secret || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !idToken) {
    return response.status(400).json({ error: 'Payment verification data is incomplete.' });
  }

  // 1. Verify Razorpay signature (unchanged)
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature.length !== razorpay_signature.length) {
    return response.status(400).json({ verified: false, error: 'Payment signature is invalid.' });
  }
  const validSignature = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(razorpay_signature, 'utf8')
  );
  if (!validSignature) {
    return response.status(400).json({ verified: false, error: 'Payment signature is invalid.' });
  }

  // 2. Verify the Firebase ID token to get the REAL uid (can't be spoofed by client)
  let uid;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (e) {
    return response.status(401).json({ verified: false, error: 'Invalid session.' });
  }

  // 3. Write subscribed:true server-side, bypassing Firestore rules (Admin SDK)
  try {
    await adminDb.collection('profiles').doc(uid).set({ subscribed: true }, { merge: true });
  } catch (e) {
    console.error('Failed to update subscription status:', e);
    return response.status(500).json({ verified: true, error: 'Payment verified but failed to update account.' });
  }

  return response.status(200).json({ verified: true });
}