document.addEventListener("DOMContentLoaded", async () => {
  const donationTableBody = document.querySelector("#donationTable tbody");

  try {
      const response = await fetch("http://localhost:5001/api/donations"); // Adjust the URL as needed
      const donations = await response.json();

      donations.forEach(donation => {
          const row = document.createElement("tr");
          row.innerHTML = `
              <td>${donation._id}</td>
              <td>${donation.donorName}</td>
              <td>${donation.email}</td>
              <td>${donation.foodType}</td>
              <td>${donation.quantity}</td>
              <td>${new Date(donation.pickupTime).toLocaleString()}</td>
              <td>${donation.address}</td>
              <td>${new Date(donation.createdAt).toLocaleDateString()}</td>
              <td>${donation.status}</td> <!-- Display Status -->
          `;
          donationTableBody.appendChild(row);
      });
  } catch (err) {
      console.error("Error fetching donations:", err);
  }
});