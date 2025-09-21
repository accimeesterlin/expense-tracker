import { Resend } from "resend";
import { SendMailClient } from "zeptomail";

// Initialize email service based on available configuration
let emailService: "resend" | "zeptomail" | "none" = "none";
let resend: Resend | null = null;
let zeptoClient: SendMailClient | null = null;

type EmailServiceResult =
  | { success: true; data: any }
  | { success: false; error: Error };

function patchZeptoClient(client: SendMailClient) {
  const zeptoAny = client as any;
  const originalToJSON =
    typeof zeptoAny.toJSON === "function" ? zeptoAny.toJSON.bind(client) : null;

  zeptoAny.toJSON = (resp: any) => {
    try {
      if (resp && typeof resp.json === "function") {
        return resp.json();
      }

      if (resp && typeof resp.text === "function") {
        return resp.text().then((text: string) => {
          if (!text) {
            return {};
          }
          try {
            return JSON.parse(text);
          } catch {
            return { message: text };
          }
        });
      }

      if (originalToJSON && resp && typeof resp.json === "function") {
        return originalToJSON(resp);
      }

      if (resp && typeof resp === "object") {
        return Promise.resolve(resp);
      }

      return Promise.reject(
        new Error(
          "ZeptoMail SDK received an unexpected response that could not be parsed."
        )
      );
    } catch (error) {
      return Promise.reject(error);
    }
  };
}

function normalizeZeptoBaseUrl(rawBase: string) {
  const trimmed = rawBase.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const withoutTrailing = withProtocol.replace(/\/+$/, "");
  return `${withoutTrailing}/`;
}

function normalizeZeptoError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.message.includes("resp.json is not a function")) {
      return new Error(
        "ZeptoMail SDK could not parse the response. This usually indicates an unexpected error body—check your ZeptoMail configuration or network connectivity."
      );
    }
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  if (error && typeof error === "object") {
    const plainMessage = (error as any)?.message;
    if (typeof plainMessage === "string") {
      return new Error(plainMessage);
    }
    const zeptoError = (error as any)?.error;
    if (zeptoError?.code === "TM_4001") {
      const detailMessage = zeptoError?.details?.[0]?.message;
      const guidance =
        'ZeptoMail returned TM_4001 (Access Denied). Double-check that the API token includes the "Zoho-enczapikey" prefix, belongs to the correct region, and that your from-address/domain is verified.';
      return new Error(
        `${guidance}${detailMessage ? ` Details: ${detailMessage}` : ""}`
      );
    }
    try {
      return new Error(`ZeptoMail SDK error: ${JSON.stringify(error)}`);
    } catch {
      // fall through
    }
  }

  return new Error("Unknown ZeptoMail SDK error");
}

async function sendViaZeptoMailSDK(
  emailData: any
): Promise<EmailServiceResult> {
  if (!zeptoClient) {
    return {
      success: false,
      error: new Error("ZeptoMail client is not initialized"),
    };
  }

  try {
    const response = await zeptoClient.sendMail(emailData);
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: normalizeZeptoError(error) };
  }
}

if (process.env.RESEND_API_KEY) {
  emailService = "resend";
  resend = new Resend(process.env.RESEND_API_KEY);
} else if (process.env.ZEPTOMAIL_API_KEY) {
  emailService = "zeptomail";
  try {
    const rawKey = process.env.ZEPTOMAIL_API_KEY.trim();
    const token = rawKey.toLowerCase().startsWith("zoho-enczapikey")
      ? rawKey
      : `Zoho-enczapikey ${rawKey}`;

    const configuredBase =
      process.env.ZEPTOMAIL_API_BASE_URL || "api.zeptomail.com/";
    const url = normalizeZeptoBaseUrl(configuredBase);

    console.log("ZeptoMail API Base URL:", url);

    zeptoClient = new SendMailClient({
      url,
      token,
    });
    patchZeptoClient(zeptoClient);
  } catch (error) {
    console.error("Failed to initialize ZeptoMail client:", error);
    emailService = "none";
    zeptoClient = null;
  }
}

interface TeamInviteEmailParams {
  to: string;
  inviterName: string;
  companyName: string;
  inviteToken: string;
  role: string;
}

interface PasswordResetEmailParams {
  to: string;
  resetToken: string;
  userName?: string;
}

export async function sendTeamInviteEmail({
  to,
  inviterName,
  companyName,
  inviteToken,
  role,
}: TeamInviteEmailParams) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/team/invite?token=${inviteToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #006BFF 0%, #0056CC 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">ExpenseTracker</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Team Invitation</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #0B3558; margin-top: 0;">You're invited to join ${companyName}!</h2>
        
        <p style="color: #476788; line-height: 1.6;">
          Hi there,
        </p>
        
        <p style="color: #476788; line-height: 1.6;">
          <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> as a <strong>${role}</strong> on ExpenseTracker.
        </p>
        
        <p style="color: #476788; line-height: 1.6;">
          ExpenseTracker helps teams track expenses, manage budgets, and collaborate on financial management. You'll be able to:
        </p>
        
        <ul style="color: #476788; line-height: 1.6;">
          <li>Track and categorize expenses</li>
          <li>Collaborate with your team</li>
          <li>View company financial insights</li>
          <li>Manage budgets and goals</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="background: #006BFF; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #A6BBD1; font-size: 14px; text-align: center; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <span style="word-break: break-all;">${inviteUrl}</span>
        </p>
        
        <p style="color: #A6BBD1; font-size: 12px; text-align: center; margin-top: 20px;">
          This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  try {
    if (emailService === "resend" && resend) {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: [to],
        subject: `You've been invited to join ${companyName} on ExpenseTracker`,
        html: htmlContent,
      });

      if (error) {
        console.error("Error sending team invite email via Resend:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } else if (emailService === "zeptomail") {
      const emailData = {
        from: {
          address: process.env.ZEPTOMAIL_FROM_EMAIL || "noreply@yourdomain.com",
          name: "ExpenseTracker",
        },
        to: [
          {
            email_address: {
              address: to,
              name: "",
            },
          },
        ],
        subject: `You've been invited to join ${companyName} on ExpenseTracker`,
        htmlbody: htmlContent,
      };

      const zeptoResult = await sendViaZeptoMailSDK(emailData);

      if (!zeptoResult.success) {
        throw zeptoResult.error;
      }

      return zeptoResult;
    } else {
      // Fallback: Log the email instead of sending
      console.log("Email service not configured. Email would be sent to:", to);
      console.log(
        "Subject:",
        `You've been invited to join ${companyName} on ExpenseTracker`
      );
      console.log("Invite URL:", inviteUrl);
      return {
        success: true,
        data: {
          message: "Email logged (no email service configured)",
          inviteUrl,
        },
      };
    }
  } catch (error: unknown) {
    console.error("Error sending team invite email:", error);

    // Handle different types of errors
    const errorObj = error as any;
    if (errorObj?.error?.code === "TM_4001") {
      console.error("ZeptoMail Access Denied - Check:");
      console.error("1. API key is correct and has send permissions");
      console.error("2. From email domain is verified in ZeptoMail");
      console.error("3. Account has sufficient credits");
      console.error("From email used:", process.env.ZEPTOMAIL_FROM_EMAIL);
    }

    return { success: false, error: errorObj };
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #006BFF 0%, #0056CC 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Welcome to ExpenseTracker!</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #0B3558; margin-top: 0;">Hi ${name},</h2>
        
        <p style="color: #476788; line-height: 1.6;">
          Welcome to ExpenseTracker! We're excited to help you and your team manage expenses more effectively.
        </p>
        
        <p style="color: #476788; line-height: 1.6;">
          You can now start tracking expenses, managing budgets, and collaborating with your team.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}" style="background: #006BFF; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
            Get Started
          </a>
        </div>
      </div>
    </div>
  `;

  try {
    if (emailService === "resend" && resend) {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: [to],
        subject: "Welcome to ExpenseTracker!",
        html: htmlContent,
      });

      if (error) {
        console.error("Error sending welcome email via Resend:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } else if (emailService === "zeptomail") {
      const emailData = {
        from: {
          address: process.env.ZEPTOMAIL_FROM_EMAIL || "noreply@yourdomain.com",
          name: "ExpenseTracker",
        },
        to: [
          {
            email_address: {
              address: to,
              name: name,
            },
          },
        ],
        subject: "Welcome to ExpenseTracker!",
        htmlbody: htmlContent,
      };

      const zeptoResult = await sendViaZeptoMailSDK(emailData);

      if (!zeptoResult.success) {
        throw zeptoResult.error;
      }

      return zeptoResult;
    } else {
      // Fallback: Log the email instead of sending
      console.log(
        "Welcome email service not configured. Email would be sent to:",
        to
      );
      console.log("Subject: Welcome to ExpenseTracker!");
      return {
        success: true,
        data: {
          message: "Welcome email logged (no email service configured)",
        },
      };
    }
  } catch (error: unknown) {
    console.error("Error sending welcome email:", error);

    // Handle different types of errors
    const errorObj = error as any;
    if (errorObj?.error?.code === "TM_4001") {
      console.error("ZeptoMail Access Denied - Check:");
      console.error("1. API key is correct and has send permissions");
      console.error("2. From email domain is verified in ZeptoMail");
      console.error("3. Account has sufficient credits");
      console.error("From email used:", process.env.ZEPTOMAIL_FROM_EMAIL);
    }

    return { success: false, error: errorObj };
  }
}

export async function sendPasswordResetEmail({
  to,
  resetToken,
  userName,
}: PasswordResetEmailParams) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #006BFF 0%, #0056CC 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">ExpenseTracker</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #0B3558; margin-top: 0;">Reset Your Password</h2>
        
        <p style="color: #476788; line-height: 1.6;">
          ${userName ? `Hi ${userName},` : 'Hi there,'}
        </p>
        
        <p style="color: #476788; line-height: 1.6;">
          We received a request to reset your password for your ExpenseTracker account. If you made this request, click the button below to reset your password.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #006BFF; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #A6BBD1; font-size: 14px; text-align: center; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <span style="word-break: break-all;">${resetUrl}</span>
        </p>
        
        <p style="color: #A6BBD1; font-size: 12px; text-align: center; margin-top: 20px;">
          This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        
        <p style="color: #A6BBD1; font-size: 12px; text-align: center; margin-top: 10px;">
          For security reasons, this link can only be used once.
        </p>
      </div>
    </div>
  `;

  try {
    if (emailService === "resend" && resend) {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: [to],
        subject: "Reset Your ExpenseTracker Password",
        html: htmlContent,
      });

      if (error) {
        console.error("Error sending password reset email via Resend:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } else if (emailService === "zeptomail") {
      const emailData = {
        from: {
          address: process.env.ZEPTOMAIL_FROM_EMAIL || "noreply@yourdomain.com",
          name: "ExpenseTracker",
        },
        to: [
          {
            email_address: {
              address: to,
              name: userName || "",
            },
          },
        ],
        subject: "Reset Your ExpenseTracker Password",
        htmlbody: htmlContent,
      };

      const zeptoResult = await sendViaZeptoMailSDK(emailData);

      if (!zeptoResult.success) {
        throw zeptoResult.error;
      }

      return zeptoResult;
    } else {
      // Fallback: Log the email instead of sending
      console.log("Password reset email service not configured. Email would be sent to:", to);
      console.log("Subject: Reset Your ExpenseTracker Password");
      console.log("Reset URL:", resetUrl);
      return {
        success: true,
        data: {
          message: "Password reset email logged (no email service configured)",
          resetUrl,
        },
      };
    }
  } catch (error: unknown) {
    console.error("Error sending password reset email:", error);

    // Handle different types of errors
    const errorObj = error as any;
    if (errorObj?.error?.code === "TM_4001") {
      console.error("ZeptoMail Access Denied - Check:");
      console.error("1. API key is correct and has send permissions");
      console.error("2. From email domain is verified in ZeptoMail");
      console.error("3. Account has sufficient credits");
      console.error("From email used:", process.env.ZEPTOMAIL_FROM_EMAIL);
    }

    return { success: false, error: errorObj };
  }
}
