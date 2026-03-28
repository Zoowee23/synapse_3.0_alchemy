/**
 * MongoDB Schema Definitions (for reference / Mongoose usage)
 * Collections: predictions, users
 */

// predictions collection
const predictionSchema = {
  user_id:      String,       // user identifier
  prediction:   String,       // e.g. "plastic"
  confidence:   Number,       // 0.0 - 1.0
  top3: [{
    label:      String,
    confidence: Number,
  }],
  recyclable:   Boolean,
  carbon_saved: Number,       // kg CO2
  timestamp:    Date,
}

// users collection (optional, for auth)
const userSchema = {
  user_id:       String,
  email:         String,
  total_scans:   Number,
  carbon_saved:  Number,
  badges:        [String],
  created_at:    Date,
}

// Indexes to create:
// db.predictions.createIndex({ user_id: 1, timestamp: -1 })
// db.predictions.createIndex({ timestamp: -1 })

module.exports = { predictionSchema, userSchema }
