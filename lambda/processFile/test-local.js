const { handler } = require('./dist/handler');

// Mock API Gateway event for processFile
const mockEvent = {
  requestContext: {
    requestId: 'test-request-id'
  },
  path: '/process-file',
  body: JSON.stringify({
    s3Key: 'test-file.pdf',
    fileType: 'application/pdf',
    requestId: 'test-123'
  })
};

async function testProcessFile() {
  console.log('🧪 Testing ProcessFile Lambda...');
  console.log('Input:', JSON.stringify(mockEvent, null, 2));
  
  try {
    const result = await handler(mockEvent);
    console.log('✅ ProcessFile Result:');
    console.log('Status Code:', result.statusCode);
    console.log('Headers:', result.headers);
    console.log('Body:', JSON.parse(result.body));
  } catch (error) {
    console.error('❌ ProcessFile Error:', error);
  }
}

testProcessFile();