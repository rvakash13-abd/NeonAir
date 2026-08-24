import crypto from 'node:crypto';

export default function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.body || {};
  if (!secret || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return response.status(400).json({ error: 'Payment verification data is incomplete.' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  if (expectedSignature.length !== razorpay_signature.length) {
    return response.status(400).json({ verified: false, error: 'Payment signature is invalid.' });
  }
  const valid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(razorpay_signature, 'utf8')
  );

  if (!valid) {
    return response.status(400).json({ verified: false, error: 'Payment signature is invalid.' });
  }

  return response.status(200).json({ verified: true });
}
