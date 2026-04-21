const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const router = express.Router();

// M-Pesa configuration
const MPESA_BASE_URL = 'https://sandbox.safaricom.co.ke'; // Use sandbox for testing
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY;
const SHORTCODE = process.env.MPESA_SHORTCODE;

// Get M-Pesa access token
const getAccessToken = async () => {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa access token:', error);
    throw new Error('Failed to get M-Pesa access token');
  }
};

// Initiate M-Pesa payment
router.post('/mpesa_payment', [
  body('phone').isLength({ min: 10 }).withMessage('Valid phone number required'),
  body('amount').isFloat({ min: 1 }).withMessage('Valid amount required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg
      });
    }

    const { phone, amount } = req.body;
    const user = JSON.parse(req.headers.user || '{}');

    if (!user.email) {
      return res.status(400).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    
    // Generate password
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    // Prepare STK push request
    const stkPushData = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: `${process.env.MPESA_CALLBACK_URL}/api/mpesa-callback`,
      AccountReference: 'Glimmer Payment',
      TransactionDesc: 'Payment for Glimmer product'
    };

    // Make STK push request
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Save payment record
    const [paymentResult] = await pool.execute(
      'INSERT INTO payments (checkout_request_id, user_email, amount, phone_number, status) VALUES (?, ?, ?, ?, ?)',
      [response.data.CheckoutRequestID, user.email, amount, phone, 'PENDING']
    );

    res.json({
      status: 'success',
      CheckoutRequestID: response.data.CheckoutRequestID,
      MerchantRequestID: response.data.MerchantRequestID,
      CustomerMessage: response.data.CustomerMessage
    });

  } catch (error) {
    console.error('M-Pesa payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Payment initiation failed. Please try again.'
    });
  }
});

// Check payment status
router.get('/check_payment/:checkoutRequestID', async (req, res) => {
  try {
    const { checkoutRequestID } = req.params;

    // Get payment record
    const [payments] = await pool.execute(
      'SELECT * FROM payments WHERE checkout_request_id = ?',
      [checkoutRequestID]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    const payment = payments[0];

    // If payment is still pending, check with M-Pesa
    if (payment.status === 'PENDING') {
      try {
        const accessToken = await getAccessToken();
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

        const queryData = {
          BusinessShortCode: SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestID
        };

        const response = await axios.post(
          `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
          queryData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const result = response.data;

        // Update payment status based on response
        let newStatus = 'PENDING';
        let reason = null;

        if (result.ResultCode === '0') {
          newStatus = 'COMPLETED';
        } else if (result.ResultCode === '1032') {
          newStatus = 'FAILED';
          reason = 'Transaction cancelled by user';
        } else if (result.ResultCode === '1037') {
          newStatus = 'FAILED';
          reason = 'Insufficient funds';
        } else {
          newStatus = 'FAILED';
          reason = result.ResultDesc || 'Transaction failed';
        }

        // Update database
        await pool.execute(
          'UPDATE payments SET status = ?, reason = ? WHERE checkout_request_id = ?',
          [newStatus, reason, checkoutRequestID]
        );

        res.json({
          status: newStatus.toLowerCase(),
          reason: reason
        });

      } catch (mpesaError) {
        console.error('M-Pesa query error:', mpesaError);
        res.json({
          status: 'pending',
          reason: 'Still processing...'
        });
      }
    } else {
      // Return cached status
      res.json({
        status: payment.status.toLowerCase(),
        reason: payment.reason
      });
    }

  } catch (error) {
    console.error('Check payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check payment status'
    });
  }
});

// M-Pesa callback endpoint
router.post('/mpesa-callback', async (req, res) => {
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;
    
    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    let status = 'FAILED';
    let reason = ResultDesc;

    if (ResultCode === '0') {
      status = 'COMPLETED';
      reason = null;
    }

    // Update payment status
    await pool.execute(
      'UPDATE payments SET status = ?, reason = ? WHERE checkout_request_id = ?',
      [status, reason, CheckoutRequestID]
    );

    res.json({ status: 'success' });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ status: 'error' });
  }
});

module.exports = router;
