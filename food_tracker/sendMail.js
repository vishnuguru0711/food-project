const nodemailer = require("nodemailer");

async function main() {
  // Create a transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL (for 465)
    auth: {
      user: "sarathisenthil17@gmail.com", // Your Gmail address
      pass: "ffnb oedg fbhx dbwe", // The App Password you generated
    },
  });

  // Set up the email data
  let mailOptions = {
    from: '"You" <sarathisenthil17@gmail.com>', // Sender address
    to: "sabari132005@gmail.com", // List of recipients
    subject: "Hello ✔", // Subject line
    html: `<b>Hello world?</b>`, // HTML body
  };

  // Send the email
  let info = await transporter.sendMail(mailOptions);

  console.log("Message sent: %s", info.messageId);
}

// Call the main function and handle any errors
main().catch(console.error);
