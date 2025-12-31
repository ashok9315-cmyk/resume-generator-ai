// Test direct Lambda Function URL calls
const testResumeGeneration = async () => {
  console.log("Testing direct resume generation...");
  
  const testText = `John Doe
Software Engineer
john.doe@email.com
(555) 123-4567

EXPERIENCE
Software Developer at Tech Corp (2020-2023)
- Developed web applications using React and Node.js
- Collaborated with cross-functional teams
- Implemented automated testing procedures

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2016-2020)

SKILLS
- JavaScript, Python, Java
- React, Node.js, Express
- Git, Docker, AWS`;

  try {
    // Test direct Lambda Function URL instead of API route
    const resumeFunctionUrl = process.env.RESUME_FUNCTION_URL || 'https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/';
    const response = await fetch(resumeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: testText,
        template: "modern"
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return;
    }

    const result = await response.json();
    console.log("Success:", result.success);
    console.log("Request ID:", result.requestId);
    console.log("Processing time:", result.data?.processingTime, "ms");
    console.log("Generated resume length:", result.data?.formatted?.length || 0, "characters");
    
    if (result.data?.formatted) {
      console.log("First 200 characters of generated resume:");
      console.log(result.data.formatted.substring(0, 200) + "...");
    }
  } catch (error) {
    console.error("Test failed:", error.message);
  }
};

const testCoverLetterGeneration = async () => {
  console.log("\nTesting direct cover letter generation...");
  
  const resumeText = `John Doe
Software Engineer
john.doe@email.com
(555) 123-4567

EXPERIENCE
Software Developer at Tech Corp (2020-2023)
- Developed web applications using React and Node.js
- Collaborated with cross-functional teams
- Implemented automated testing procedures`;

  const jobDescription = `We are looking for a Senior Software Engineer to join our team.
Requirements:
- 3+ years of experience in web development
- Proficiency in React and Node.js
- Experience with cloud platforms (AWS preferred)
- Strong problem-solving skills`;

  try {
    // Test direct Lambda Function URL instead of API route
    const coverLetterFunctionUrl = process.env.COVER_LETTER_FUNCTION_URL || 'https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/';
    const response = await fetch(coverLetterFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobDescription,
        resumeText,
        tone: "professional",
        length: "medium"
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return;
    }

    const result = await response.json();
    console.log("Success:", result.success);
    console.log("Request ID:", result.requestId);
    console.log("Processing time:", result.data?.processingTime, "ms");
    console.log("Generated cover letter length:", result.data?.refined?.length || 0, "characters");
    
    if (result.data?.refined) {
      console.log("First 200 characters of generated cover letter:");
      console.log(result.data.refined.substring(0, 200) + "...");
    }
  } catch (error) {
    console.error("Test failed:", error.message);
  }
};

// Run tests
(async () => {
  await testResumeGeneration();
  await testCoverLetterGeneration();
})();