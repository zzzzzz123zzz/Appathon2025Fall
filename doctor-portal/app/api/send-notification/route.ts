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
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    let result: any = null;
    try {
      result = await response.json();
    } catch (parseError: any) {
      console.error('Error parsing Expo push response:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid response from Expo push service' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const errorMessage =
        result?.errors?.[0]?.message ||
        result?.data?.message ||
        response.statusText ||
        'Failed to send push notification';

      console.error('Expo push notification HTTP error:', {
        status: response.status,
        result,
      });

      return NextResponse.json(
        { success: false, error: errorMessage, details: result },
        { status: response.status }
      );
    }

    const expoErrors = Array.isArray(result?.errors) ? result.errors : [];
    if (expoErrors.length > 0) {
      console.error('Expo push notification errors:', expoErrors);
      return NextResponse.json(
        {
          success: false,
          error: expoErrors[0]?.message || 'Expo push notification error',
          details: expoErrors,
        },
        { status: 400 }
      );
    }

    const dataArray = Array.isArray(result?.data) ? result.data : [result?.data];
    const failedTicket = dataArray.find(
      (ticket: any) => ticket?.status === 'error'
    );

    if (failedTicket) {
      console.error('Expo push notification ticket error:', failedTicket);
      return NextResponse.json(
        {
          success: false,
          error: failedTicket?.message || 'Expo push notification error',
          details: failedTicket,
        },
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
