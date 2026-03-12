import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
    }
}

export async function POST(request: Request) {
    try {
        const { userId, orderId, status } = await request.json();

        if (!userId || !orderId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get user's FCM token from Firestore
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        const userData = userDoc.data();
        const fcmToken = userData?.fcmToken;

        if (!fcmToken) {
            console.log(`No FCM token found for user ${userId}`);
            return NextResponse.json({ success: false, message: 'No FCM token found' }, { status: 404 });
        }

        const message = {
            notification: {
                title: 'Order Status Update',
                body: `Your order #${orderId.substring(0, 8)} status has been updated to ${status}.`,
            },
            token: fcmToken,
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);

        return NextResponse.json({ success: true, response });
    } catch (error: any) {
        console.error('Error sending notification:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
