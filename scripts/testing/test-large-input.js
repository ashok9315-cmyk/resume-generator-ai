// Test with large resume input
const fs = require('fs');

const testLargeResume = async () => {
  console.log("Testing with large resume input...");
  
  const largeResumeText = fs.readFileSync('test-large-resume.txt', 'utf8');
  
  console.log("Large resume text length:", largeResumeText.length, "characters");
  
  try {
    const startTime = Date.now();
    // Test direct Lambda Function URL instead of API route
    const resumeFunctionUrl = process.env.RESUME_FUNCTION_URL || 'https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/';
    const response = await fetch(resumeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: largeResumeText,
        template: "modern"
      }),
    });

    const duration = Date.now() - startTime;
    console.log("Frontend API call duration:", duration, "ms");
    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return;
    }

    const result = await response.json();
    console.log("Success:", result.success);
    console.log("Request ID:", result.requestId);
    console.log("Lambda processing time:", result.data?.processingTime, "ms");
    console.log("Generated resume length:", result.data?.formatted?.length || 0, "characters");
    
    // Calculate expansion ratio
    const expansionRatio = (result.data?.formatted?.length || 0) / largeResumeText.length;
    console.log("Content expansion ratio:", expansionRatio.toFixed(2) + "x");
    
    console.log("✅ Large resume generation test passed!");
    
    // Save the result for inspection
    if (result.data?.formatted) {
      fs.writeFileSync('generated-large-resume.html', result.data.formatted);
      console.log("📄 Generated resume saved to 'generated-large-resume.html'");
    }
  } catch (error) {
    console.error("❌ Large resume test failed:", error.message);
  }
};

// Run test
testLargeResume();