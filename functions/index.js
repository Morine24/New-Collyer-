const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.createFirstAdmin = functions.auth.user().onCreate(async (user) => {
  const listUsersResult = await admin.auth().listUsers(1);
  if (listUsersResult.users.length === 1) {
    await admin.auth().setCustomUserClaims(user.uid, { role: "admin" });
    return { message: `Successfully made ${user.email} an admin.` };
  }
  return null;
});

exports.createUser = functions.https.onCall(async (data, context) => {
  if (context.auth.token.role !== 'admin') {
    return { error: 'Only admins can create new users.' };
  }

  const { email, role } = data; // Keep these for creating the user in auth
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: 'password',
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role: role, mustChangePassword: true });

    return { message: `Successfully created new user: ${email}` };
  } catch (error) {
    return { error: error.message };
  }
});

exports.removeMustChangePasswordClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    return { error: 'Authentication required.' };
  }

  const uid = context.auth.uid;
  try {
    const user = await admin.auth().getUser(uid);
    const claims = user.customClaims || {};
    delete claims.mustChangePassword;
    await admin.auth().setCustomUserClaims(uid, claims);
    return { message: 'Successfully updated password change status.' };
  } catch (error) {
    return { error: error.message };
  }
});