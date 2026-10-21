import { MongoClient, Db } from 'mongodb';

// Uses process.env.MONGODB_URI from .env file
let activeUri = process.env.MONGODB_URI || '';
const options = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

function initClient(uriString: string) {
  if (!uriString || !uriString.trim()) {
    client = null;
    clientPromise = null;
    return;
  }
  try {
    client = new MongoClient(uriString, options);
    clientPromise = client.connect();
  } catch (e) {
    console.warn('[MongoDB] Init error:', e);
    client = null;
    clientPromise = null;
  }
}

if (activeUri) {
  initClient(activeUri);
}

export async function getMongoDb(): Promise<Db | null> {
  if (!clientPromise) return null;
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db();
  } catch (err) {
    console.warn('[MongoDB] Connection attempt failed:', err);
    return null;
  }
}

export async function testAndSetMongoUri(newUri: string): Promise<{ success: boolean; error?: string }> {
  if (!newUri || !newUri.trim()) {
    activeUri = '';
    client = null;
    clientPromise = null;
    return { success: true };
  }
  try {
    const testClient = new MongoClient(newUri, options);
    await testClient.connect();
    await testClient.db().command({ ping: 1 });
    // Success! Update active connection
    activeUri = newUri;
    client = testClient;
    clientPromise = Promise.resolve(testClient);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to connect to MongoDB URI' };
  }
}

export function getActiveMongoUri(): string {
  return activeUri;
}

export function isMongoConfigured(): boolean {
  return Boolean(activeUri && activeUri.trim().length > 0);
}
