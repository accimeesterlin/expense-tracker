const { MongoClient } = require("mongodb");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/expense-tracker";

async function setupDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db();
    console.log("Connected to MongoDB successfully!");

    // Create collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (!collectionNames.includes("companies")) {
      await db.createCollection("companies");
      console.log("Created companies collection");
    }

    if (!collectionNames.includes("expenses")) {
      await db.createCollection("expenses");
      console.log("Created expenses collection");
    }

    // Create indexes
    const companiesCollection = db.collection("companies");
    await companiesCollection.createIndex({ name: "text", industry: "text" });
    console.log("Created text indexes on companies collection");

    const expensesCollection = db.collection("expenses");
    await expensesCollection.createIndex({ company: 1, category: 1 });
    await expensesCollection.createIndex({ company: 1, expenseType: 1 });
    await expensesCollection.createIndex({ company: 1, nextBillingDate: 1 });
    await expensesCollection.createIndex({ company: 1, isActive: 1 });
    console.log("Created indexes on expenses collection");

    console.log("Database setup completed - no sample data inserted");
    console.log(
      "Users will need to sign up and create their own companies and expenses"
    );

    console.log("Database setup completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Create a .env.local file with your environment variables");
    console.log("2. Start your Next.js app: npm run dev");
    console.log("3. Open http://localhost:3000 in your browser");
    console.log("4. Sign up for a new account to get started");
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    await client.close();
  }
}

setupDatabase();
