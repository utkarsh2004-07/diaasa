interface SMSResponse {
  return: boolean;
  request_id: string;
  message: string[];
}

export async function sendOTPViaSMS(phone: string, otp: string): Promise<boolean> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error("FAST2SMS_API_KEY not configured");

  const message = `Your OTP for Diaasa Store is ${otp}. Valid for 5 minutes. Do not share with anyone.`;

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message,
        language: "english",
        flash: 0,
        numbers: phone,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Fast2SMS error:", err.replace(/[\r\n]/g, " "));
      return false;
    }

    const data: SMSResponse = await response.json();
    return data.return === true;
  } catch (error) {
    console.error("Fast2SMS exception:", error);
    return false;
  }
}

// DLT template-based route (for registered templates)
export async function sendOTPViaDLT(phone: string, otp: string): Promise<boolean> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error("FAST2SMS_API_KEY not configured");

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "dlt",
        sender_id: process.env.FAST2SMS_SENDER_ID || "LUXEST",
        message: process.env.FAST2SMS_MESSAGE_TEMPLATE?.replace("{otp}", otp),
        variables_values: otp,
        flash: 0,
        numbers: phone,
      }),
    });

    const data = await response.json();
    return data.return === true;
  } catch (error) {
    console.error("Fast2SMS DLT error:", error);
    return false;
  }
}
