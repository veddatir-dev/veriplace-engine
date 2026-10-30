// Connect to the 'veriplace' database
db = db.getSiblingDB('veriplace');

// Create the collection for the immutable verification ledger
db.createCollection('immutable_ledger');

// Ensure each student ID only has one locked hash entry at a time (Upsert optimization)
db.immutable_ledger.createIndex({ "student_id": 1 }, { unique: true });

print("MongoDB Immutable Ledger initialized successfully.");