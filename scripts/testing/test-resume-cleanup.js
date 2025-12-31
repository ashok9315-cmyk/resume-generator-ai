// Test resume generation to check if analysis text is removed
const testResumeCleanup = async () => {
  console.log("Testing resume generation with cleanup...");
  
  const resumeText = `John Doe
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
    const startTime = Date.now();
    // Test direct Lambda Function URL instead of API route
    const resumeFunctionUrl = process.env.RESUME_FUNCTION_URL || 'https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/';
    const response = await fetch(resumeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: resumeText,
        template: "modern"
      }),
    });

    const duration = Date.now() - startTime;
    console.log("API call duration:", duration, "ms");
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
    
    if (result.data?.formatted) {
      const resume = result.data.formatted;
      
      // Check for analysis patterns
      const analysisPatterns = [
        /This resume effectively:/i,
        /✅/,
        /The resume/i,
        /Analysis:/i,
        /Summary:/i,
      ];
      
      let hasAnalysis = false;
      for (const pattern of analysisPatterns) {
        if (pattern.test(resume)) {
          console.log("❌ Found analysis pattern:", pattern.toString());
          hasAnalysis = true;
        }
      }
      
      if (!hasAnalysis) {
        console.log("✅ No analysis text found in resume!");
      }
      
      // Check if it ends properly with </html>
      if (resume.trim().endsWith('</html>')) {
        console.log("✅ Resume ends properly with </html>");
      } else {
        console.log("❌ Resume does not end with </html>");
        console.log("Last 200 characters:", resume.slice(-200));
      }
      
      // Save the result for inspection
      const fs = require('fs');
      fs.writeFileSync('test-resume-cleaned.html', resume);
      console.log("📄 Resume saved to 'test-resume-cleaned.html'");
      
      console.log("First 300 characters:");
      console.log(resume.substring(0, 300) + "...");
      
      console.log("\nLast 300 characters:");
      console.log("..." + resume.slice(-300));
    }
    
    console.log("✅ Resume cleanup test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

// Run test
testResumeCleanup();