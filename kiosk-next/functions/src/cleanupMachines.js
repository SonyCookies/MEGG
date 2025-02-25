const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Run every 5 minutes
exports.cleanupUncompletedMachines = functions.runWith({
  timeoutSeconds: 60,
  memory: '256MB'
}).pubsub.schedule('every 12 hours').onRun(async (context) => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Query for machines that are older than 5 minutes and have no PIN
    const snapshot = await db
      .collection('machines')
      .where('createdAt', '<=', fiveMinutesAgo.toISOString())
      .where('pin', '==', null)
      .get();

    if (snapshot.empty) {
      console.log('No machines to clean up');
      return null;
    }

    // Delete machines in batches
    const batch = db.batch();
    const deletedMachineIds = [];

    snapshot.docs.forEach((doc) => {
      deletedMachineIds.push(doc.id);
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Log the cleanup
    await db.collection('logs').add({
      action: "machine_cleanup",
      status: "success",
      details: `Cleaned up ${deletedMachineIds.length} incomplete machines`,
      machineIds: deletedMachineIds,
      timestamp: now.toISOString()
    });

    console.log(`Successfully cleaned up ${deletedMachineIds.length} machines`);
    return null;
  } catch (error) {
    console.error('Error cleaning up machines:', error);
    
    // Log the error
    await db.collection('logs').add({
      action: "machine_cleanup",
      status: "error",
      details: "Failed to clean up machines",
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return null;
  }
});