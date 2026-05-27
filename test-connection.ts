import { buildManualConnectionString, validateManualDbConfig } from './server/db-config';

if (validateManualDbConfig()) {
  const connStr = buildManualConnectionString();
  console.log('Connection string:', connStr);
  // Extract parts
  const match = connStr.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (match) {
    console.log('User:', match[1]);
    console.log('Host:', match[3]);
    console.log('Port:', match[4]);
    console.log('Database:', match[5]);
  }
} else {
  console.log('Manual DB config not enabled');
}
