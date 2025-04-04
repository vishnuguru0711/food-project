const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const http = require('http');
const WebSocket = require('ws');

// Import models using relative paths
const Donation = require('./models/Donation'); // Path unchanged
const DailyNeed = require('./models/dailyneeds'); // Path unchanged

// Initialize Express App
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://srirampurushothaman2004:RQoSZKpPv92O9BwG@foodtracker.pzyvj.mongodb.net/foodtrackerDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Function to send email
async function sendEmail(to, subject, html) {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "sarathisenthil17@gmail.com",
      pass: "ffnb oedg fbhx dbwe", // Use your generated app password
    },
  });

  let mailOptions = {
    from: '"Food Donation" <sarathisenthil17@gmail.com>',
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
}

// Send confirmation email
async function sendConfirmationEmail(email, donorName, pickupTime, foodType, donationId) {
  const confirmLink = `http://localhost:5001/api/donations/confirm/${donationId}`;
  const rejectLink = `http://localhost:5001/api/donations/reject/${donationId}`;

  const html = `<b>${donorName}!</b><p>You have donated ${foodType} scheduled for pickup on ${new Date(pickupTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.</p>
           <p>Please <a href="${confirmLink}">confirm</a> or <a href="${rejectLink}">reject</a> this donation.</p>`;
  
  await sendEmail(email, "Donation Confirmation", html);
}

// Function to send delivery status email
async function sendDeliveryStatusEmail(email, donorName, donationId) {
  const deliveredLink = `http://localhost:5001/api/donations/deliver/${donationId}`;
  const notDeliveredLink = `http://localhost:5001/api/donations/not-deliver/${donationId}`;

  const html = `<b>${donorName}!</b><p>Was the food donation delivered?</p>
           <p>Please <a href="${deliveredLink}">confirm delivery</a> or <a href="${notDeliveredLink}">mark as not delivered</a>.</p>`;
  
  await sendEmail(email, "Delivery Status", html);
}

// Email validation function
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Route to fetch all donations
app.get('/api/donations', async (req, res) => {
  try {
    const donations = await Donation.find();
    if (!donations || donations.length === 0) {
      return res.status(404).json({ message: 'No donations found' });
    }
    res.json(donations);
  } catch (err) {
    console.error('Error fetching donations:', err);
    res.status(500).json({ message: err.message });
  }
});

// Route to handle donation submission
app.post('/api/donations', async (req, res) => {
  try {
    const { donorName, email, foodType, quantity, pickupTime, address, orphanageEmail } = req.body;

    // Validate required fields and email format
    if (!donorName || !email || !foodType || !quantity || !pickupTime || !address || !orphanageEmail || !validateEmail(email)) {
      return res.status(400).json({ message: 'All fields are required and must be valid' });
    }

    const donation = new Donation({
      donorName,
      email,
      foodType,
      quantity,
      pickupTime: new Date(pickupTime),
      address,
      orphanageEmail,
      status: 'Pending' // Default status
    });
    await donation.save();

    // Send confirmation email to the orphanage
    await sendConfirmationEmail(orphanageEmail, donorName, pickupTime, foodType, donation._id);

    // Schedule delivery status email after the pickup time
    const pickupDateTime = new Date(pickupTime);
    const delay = pickupDateTime.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(async () => {
        await sendDeliveryStatusEmail(orphanageEmail, donorName, donation._id);
      }, delay);
    }

    console.log(`Donation successful from ${donation.donorName}. Pickup scheduled for ${pickupDateTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
    
    res.status(201).json({ message: 'Donation successful', id: donation._id });
  } catch (err) {
    console.error('Error saving donation:', err);
    res.status(500).json({ message: err.message });
  }
});

// Route to confirm the donation
app.get('/api/donations/confirm/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDonation = await Donation.findByIdAndUpdate(id, { status: 'Confirmed' }, { new: true });

    if (!updatedDonation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Notify donor about confirmation
    await sendEmail(updatedDonation.email, "Donation Confirmed", `<b>Your donation has been confirmed.</b>`);
    
    res.send('Donation confirmed successfully.');
  } catch (err) {
    console.error('Error confirming donation:', err);
    res.status(500).json({ message: err.message });
  }
});

// Route to reject the donation
app.get('/api/donations/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDonation = await Donation.findByIdAndUpdate(id, { status: 'Rejected' }, { new: true });

    if (!updatedDonation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Notify donor about rejection
    await sendEmail(updatedDonation.email, "Donation Rejected", `<b>Your donation has been rejected.</b>`);
    
    res.send('Donation rejected successfully.');
  } catch (err) {
    console.error('Error rejecting donation:', err);
    res.status(500).json({ message: err.message });
  }
});

// Route to handle daily needs submission
app.post('/api/dailyneeds', async (req, res) => {
  try {
    const { foodItem, quantity, orphanage, email } = req.body;

    // Validate required fields
    if (!foodItem || !quantity || !orphanage || !email || !validateEmail(email)) {
      return res.status(400).json({ message: 'All fields are required and must be valid' });
    }

    const dailyNeed = new DailyNeed({
      foodItem,
      quantity,
      orphanage,
      email, // Store email as well
    });

    await dailyNeed.save();
    res.status(201).json(dailyNeed);
  } catch (err) {
    console.error('Error adding daily need:', err);
    res.status(500).json({ message: err.message });
  }
});

// Route to fetch daily needs
app.get('/api/dailyneeds', async (req, res) => {
  try {
    const dailyNeeds = await DailyNeed.find();
    if (!dailyNeeds || dailyNeeds.length === 0) {
      return res.status(404).json({ message: 'No daily needs found' });
    }
    res.json(dailyNeeds);
  } catch (err) {
    console.error('Error fetching daily needs:', err);
    res.status(500).json({ message: err.message });
  }
});

// Route to update donation status manually (for testing or admin purposes)
app.post('/api/donations/status', async (req, res) => {
  const { donationId, status } = req.body;

  try {
    const updatedDonation = await Donation.findByIdAndUpdate(donationId, { status }, { new: true });

    if (!updatedDonation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.json({ message: 'Status updated successfully', donation: updatedDonation });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ message: err.message });
  }
});

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('A user connected via WebSocket');

  ws.on('message', (message) => {
    console.log('Received message:', message);
    ws.send(`Server received: ${message}`);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Schedule a cron job to run every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily cron job to check donations...');
  // Your cron logic here
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});