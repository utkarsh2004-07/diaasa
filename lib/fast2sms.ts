export async function sendOTPViaWhatsApp(phone: string, otp: string): Promise<boolean> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error("FAST2SMS_API_KEY not configured");

  try {
    const response = await fetch("https://www.fast2sms.com/dev/whatsapp", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_number: "8450987174",
        message_id: "20818",
        template_id: "995984402820489",
        language: "en",
        variables: otp,
        variables_values: otp,
        numbers: phone,
      }),
    });

    const data = await response.json();
    console.log("WhatsApp OTP response:", JSON.stringify(data));
    return data.return === true;
  } catch (error) {
    console.error("WhatsApp OTP error:", error);
    return false;
  }
}
