const MongoClient = require('mongodb').MongoClient;
const XLSX = require('xlsx');

// MongoDB connection string (replace with your actual connection string)
const uri = "mongodb+srv://srirampurushothaman2004:RQoSZKpPv92O9BwG@foodtracker.pzyvj.mongodb.net/foodtrackerDB";

// MongoDB database and collection name
const dbName = "foodtrackerDB";
const collectionName = "donations";

// Excel file output path
const outputFilePath = "output.xlsx";

// Function to export MongoDB data to Excel
async function exportMongoDataToExcel() {
  // Connect to MongoDB
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Fetch data from MongoDB
    const data = await collection.find({}).toArray();

    // Convert data to worksheet and create a new Excel workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Write the Excel file
    XLSX.writeFile(wb, outputFilePath);

    console.log(`Data exported to Excel file at: ${outputFilePath}`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

// Run the function
exportMongoDataToExcel();