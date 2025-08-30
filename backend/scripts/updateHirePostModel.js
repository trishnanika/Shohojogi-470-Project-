const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/service_marketplace', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateHires() {
  try {
    const db = mongoose.connection.db;
    
    console.log('Starting hire records update...');
    
    // Update all existing hire records to have postModel field
    const result = await db.collection('hires').updateMany(
      { postModel: { $exists: false } },
      { $set: { postModel: 'ProviderPost' } }
    );
    
    console.log('Updated', result.modifiedCount, 'hire records with postModel');
    
    // Verify the update
    const totalHires = await db.collection('hires').countDocuments();
    const hiresWithPostModel = await db.collection('hires').countDocuments({ postModel: { $exists: true } });
    
    console.log('Total hire records:', totalHires);
    console.log('Hires with postModel:', hiresWithPostModel);
    
    // Show sample hire record
    const sampleHire = await db.collection('hires').findOne();
    console.log('Sample hire after update:', JSON.stringify(sampleHire, null, 2));
    
    console.log('Update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating hire records:', error);
    process.exit(1);
  }
}

updateHires();
