const { handler } = require('./dist/handler');

// Mock API Gateway event for generateResume
const mockEvent = {
  requestContext: {
    requestId: 'test-request-id'
  },
  path: '/generate-resume',
  body: JSON.stringify({
    text: `John Doe
Software Engineer

EXPERIENCE
Senior Software Engineer | Tech Company | 2020-2023
• Developed web applications using React and Node.js
• Led team of 5 developers
• Improved performance by 40%

EDUCATION
Bachelor of Computer Science | University | 2018

SKILLS
JavaScript, React, Node.js, Python, AWS`
  })
};

async function testGenerateResume() {
  console.log('🧪 Testing GenerateResume Lambda...');
  console.log('Input text length:', JSON.parse(mockEvent.body).text.length);
  
  try {
    const result = await handler(mockEvent);
    console.log('✅ GenerateResume Result:');
    console.log('Status Code:', result.statusCode);
    console.log('Headers:', result.headers);
    
    const body = JSON.parse(result.body);
    if (body.success) {
      console.log('Generated resume length:', body.data.formatted.length);
      console.log('First 200 chars:', body.data.formatted.substring(0, 200) + '...');
    } else {
      console.log('Error:', body.error);
    }
  } catch (error) {
    console.error('❌ GenerateResume Error:', error);
  }
}

testGenerateResume();