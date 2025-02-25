const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.cleanupUncompletedMachines = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const snapshot = await db
        .collection('machines')
        .where('createdAt', '<=', fiveMinutesAgo.toISOString())
        .where('pin', '==', null)
        .get();

      if (snapshot.empty) {
        console.log('No machines to clean up');
        return null;
      }

      const batch = db.batch();
      const deletedMachineIds = [];

      snapshot.docs.forEach((doc) => {
        deletedMachineIds.push(doc.id);
        batch.delete(doc.ref);
      });

      await batch.commit();

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