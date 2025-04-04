const mongoose = require('mongoose');

// Function to generate a 4-character alphanumeric ID
const generateDonationId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Define the schema for a donation
const donationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => generateDonationId(),  // Use the custom ID generator as a function
  },
  donorName: { type: String, required: true },
  contact: { type: String,  },
  foodType: { type: String, required: true },
  email: { type: String, required: true },
  quantity: { type: Number, required: true },
  pickupTime: { type: Date, required: true },
  address: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Pending', 'Delivered', 'Rejected', 'Distributed'], 
    default: 'Pending'  // Default status is set to "Pending"
  }
});

// Create and export the Donation model
module.exports = mongoose.model('Donation', donationSchema);