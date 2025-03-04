import { createTransport } from "nodemailer"

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export async function POST(request) {
  try {
    const { email, otp } = await request.json()

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #0066cc; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error sending email:", error)
    return Response.json({ error: "Failed to send verification email" }, { status: 500 })
  }
}

