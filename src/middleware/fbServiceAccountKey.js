module.exports = {
  type: 'service_account',
  project_id: 'recipe-app-f83d1',
  private_key_id: 'e7a797ecea986589331b8230faba092e253c449c',
  private_key: `-----BEGIN PRIVATE KEY-----${process.env.FIREBASE_KEY}-----END PRIVATE KEY-----\n`.replace(/\\n/g, '\n'),
  client_email: 'firebase-adminsdk-9puzh@recipe-app-f83d1.iam.gserviceaccount.com',
  client_id: '111216365156556197751',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-9puzh%40recipe-app-f83d1.iam.gserviceaccount.com',
};
