// server.js
import express from "express";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();


const app = express();
app.use(cors());
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD, // Use your App Password if 2FA is enabled
  },
});


// Endpoint to send OTP email
app.post("/send-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).send("Missing email or OTP");
  }

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: "Waste2worth : Your OTP for Waste Collection Confirmation",
    text: `Your OTP is: ${otp}. Please use this code to confirm your action.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).send("OTP sent successfully");
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).send("Error sending OTP");
  }
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => console.log(`OTP API server running on port ${PORT}`));
