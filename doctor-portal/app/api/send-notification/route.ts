import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pushToken, title, body: messageBody, data } = body;

    if (!pushToken) {
      return NextResponse.json(
        { success: false, error: 'Push token is required' },
        { status: 400 }
      );
    }

    // Send push notification using Expo Push Notification service
    const message = {
      to: pushToken,
      sound: 'default',
      title: title || 'Message from your doctor',
      body: messageBody || 'You have a new message',
      data: data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.status === 'error') {
      console.error('Expo push notification error:', result.data);
      return NextResponse.json(
        { success: false, error: result.data.message },
        { status: 400 }
      );
    }

    console.log('✅ Push notification sent successfully:', result);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
