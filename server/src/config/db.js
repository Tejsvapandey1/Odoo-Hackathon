import mongoose from 'mongoose';

export async function connectDB(uri) {
  const conn = await mongoose.connect(uri);
  console.log(`✓ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export async function closeDB() {
  await mongoose.connection.close();
}
