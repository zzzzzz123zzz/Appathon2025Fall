import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pushToken, pushTokens, title, body: messageBody, data } = body;

    console.log('🔔 Notification Request Received:');
    console.log('  - Push Token (primary):', pushToken);
    console.log('  - Push Tokens (all devices):', pushTokens?.length || 0);
    console.log('  - Title:', title);
    console.log('  - Message:', messageBody);
    console.log('  - Patient ID:', data?.patientId);
    console.log('  - Doctor ID:', data?.doctorId);

    // Determine which tokens to send to
    let tokensToSend: string[] = [];

    if (pushTokens && Array.isArray(pushTokens) && pushTokens.length > 0) {
      // Send to all devices
      tokensToSend = pushTokens.map((device: any) => device.token).filter(Boolean);
      console.log(`📱 Sending to ${tokensToSend.length} devices`);
    } else if (pushToken) {
      // Fallback to single token for backward compatibility
      tokensToSend = [pushToken];
      console.log('📱 Sending to single device (legacy mode)');
    } else {
      console.error('❌ No push tokens provided!');
      return NextResponse.json(
        { success: false, error: 'Push token is required' },
        { status: 400 }
      );
    }

    // Create messages for all devices
    const messages = tokensToSend.map(token => ({
      to: token,
      sound: 'default',
      title: title || 'Message from your doctor',
      body: messageBody || 'You have a new message',
      data: data || {},
    }));

    console.log('📤 Preparing to send to Expo Push Service:');
    console.log(`  - Total devices: ${messages.length}`);
    console.log(`  - Tokens:`, tokensToSend);
    console.log(`  - Messages:`, JSON.stringify(messages, null, 2));

    // Send all messages in one request (Expo supports batch sending)
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages), // Expo accepts array of message objects
    });

    console.log('📥 Expo Response Status:', response.status, response.statusText);

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

    console.log('✅ Push notifications sent successfully!');
    console.log(`  - Sent to ${tokensToSend.length} device(s)`);
    console.log('  - Tokens sent to:', tokensToSend);
    console.log('  - Patient ID:', data?.patientId);
    console.log('  - Expo Response:', JSON.stringify(result, null, 2));

    // Check individual ticket statuses
    if (result?.data && Array.isArray(result.data)) {
      result.data.forEach((ticket: any, index: number) => {
        console.log(`  - Device ${index + 1} (${tokensToSend[index]}):`, ticket.status || 'ok', ticket.id || '');
      });
    }

    return NextResponse.json({ success: true, result, deviceCount: tokensToSend.length });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
