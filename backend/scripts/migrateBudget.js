const mongoose = require('mongoose');
const SeekerPost = require('../models/SeekerPost');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sohojogi';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrateBudgetData = async () => {
  try {
    console.log('🚀 Starting budget migration...');
    
    // First, log some stats
    const totalPosts = await SeekerPost.countDocuments();
    console.log(`📊 Total posts in database: ${totalPosts}`);
    
    // Find all posts that need migration
    const posts = await SeekerPost.find({
      $or: [
        { 'budget.min': 0, 'budget.max': 0 },
        { budget: { $exists: false } },
        { minRate: { $exists: true } },
        { maxRate: { $exists: true } }
      ]
    });

    console.log(`🔍 Found ${posts.length} posts that might need migration`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      try {
        // Check if migration is needed
        const needsMigration = 
          (post.minRate > 0 || post.maxRate > 0) && 
          (!post.budget || post.budget.min === 0 && post.budget.max === 0);
        
        if (needsMigration) {
          // Log before and after values
          console.log(`\n📝 Migrating post ${post._id}:`);
          console.log(`   Old: minRate=${post.minRate}, maxRate=${post.maxRate}`);
          
          // Create or update budget object
          post.budget = {
            min: post.minRate || 0,
            max: post.maxRate || 0,
            currency: 'BDT'
          };
          
          // Mark old fields for removal
          post.minRate = undefined;
          post.maxRate = undefined;
          
          // Save the changes
          await post.save({ validateBeforeSave: false });
          updatedCount++;
          
          console.log(`   New: budget.min=${post.budget.min}, budget.max=${post.budget.max}`);
          console.log(`✅ Migrated: ${post.budget.min}-${post.budget.max} → budget object`);
        } else {
          console.log(`⚠️ Skipped post ${post._id}: No valid minRate/maxRate found or already migrated`);
          skippedCount++;
        }
      } catch (err) {
        console.error(`❌ Error migrating post ${post._id}:`, err.message);
        errorCount++;
      }
    }

    // Final summary
    console.log('\n✅ Migration complete!');
    console.log(`   Updated: ${updatedCount} posts`);
    console.log(`   Skipped: ${skippedCount} posts`);
    console.log(`   Errors:  ${errorCount} posts`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal migration error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🔌 Connected to MongoDB');  
  migrateBudgetData();
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n👋 Migration interrupted by user');
  await mongoose.connection.close();
  process.exit(0);
});
