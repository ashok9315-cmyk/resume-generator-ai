const { handler } = require('./dist/handler');

// Mock API Gateway event for generateCoverLetter
const mockEvent = {
  requestContext: {
    requestId: 'test-request-id'
  },
  path: '/generate-cover-letter',
  body: JSON.stringify({
    jobDescription: `Software Engineer Position
We are looking for a skilled Software Engineer to join our team.

Requirements:
- 3+ years of experience with JavaScript and React
- Experience with Node.js and cloud platforms
- Strong problem-solving skills
- Bachelor's degree in Computer Science or related field

Responsibilities:
- Develop and maintain web applications
- Collaborate with cross-functional teams
- Write clean, maintainable code
- Participate in code reviews`,
    resumeText: `John Doe
Software Engineer

EXPERIENCE
Senior Software Engineer | Tech Company | 2020-2023
• Developed web applications using React and Node.js
• Led team of 5 developers
• Improved performance by 40%

EDUCATION
Bachelor of Computer Science | University | 2018

SKILLS
JavaScript, React, Node.js, Python, AWS`,
    tone: 'professional',
    length: 'medium'
  })
};

async function testGenerateCoverLetter() {
  console.log('🧪 Testing GenerateCoverLetter Lambda...');
  const body = JSON.parse(mockEvent.body);
  console.log('Job description length:', body.jobDescription.length);
  console.log('Resume text length:', body.resumeText.length);
  
  try {
    const result = await handler(mockEvent);
    console.log('✅ GenerateCoverLetter Result:');
    console.log('Status Code:', result.statusCode);
    console.log('Headers:', result.headers);
    
    const responseBody = JSON.parse(result.body);
    if (responseBody.success) {
      console.log('Generated cover letter length:', responseBody.data.refined.length);
      console.log('First 200 chars:', responseBody.data.refined.substring(0, 200) + '...');
    } else {
      console.log('Error:', responseBody.error);
    }
  } catch (error) {
    console.error('❌ GenerateCoverLetter Error:', error);
  }
}

testGenerateCoverLetter();