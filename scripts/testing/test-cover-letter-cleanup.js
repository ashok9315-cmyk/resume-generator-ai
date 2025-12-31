// Test cover letter generation to check if analysis text is removed
const testCoverLetterCleanup = async () => {
  console.log("Testing cover letter generation with cleanup...");
  
  const resumeText = `Ashok S.
Senior Site Reliability Engineer
Email: ashok@email.com | Phone: (555) 123-4567
Location: San Francisco, CA

PROFESSIONAL EXPERIENCE

Senior Site Reliability Engineer | TechCorp Inc. | 2018 - Present
• Led end-to-end SRE assignments for critical production systems serving 5M+ users
• Implemented comprehensive monitoring solutions using Grafana, Prometheus, and Kibana
• Reduced incident response time by 66% through automated alerting and runbook optimization
• Developed and maintained infrastructure automation using Python, Java, and Node.js
• Managed AWS cloud infrastructure with focus on reliability and performance
• Participated in 24/7 rotational shifts for L3 support operations
• Reduced monitoring blind spots by 70% through strategic dashboard development
• Achieved 40% reduction in manual operational efforts through automation initiatives

Site Reliability Engineer | StartupXYZ | 2015 - 2018
• Maintained legacy infrastructure systems and modernization initiatives
• Built monitoring dashboards and alerting systems for production environments
• Collaborated with development teams on reliability improvements
• Implemented automated deployment pipelines and infrastructure as code

TECHNICAL SKILLS
• Programming: Python, Java, Node.js, Bash, Go
• Monitoring: Grafana, Prometheus, Kibana, DataDog, New Relic
• Cloud: AWS (EC2, S3, RDS, Lambda, CloudWatch), Azure, GCP
• Infrastructure: Docker, Kubernetes, Terraform, Ansible
• Databases: MySQL, PostgreSQL, MongoDB, Redis

EDUCATION
Bachelor of Science in Computer Engineering
University of California, Berkeley | 2011 - 2015`;

  const jobDescription = `We are seeking a Senior Site Reliability Engineer with 8-12 years of experience to join our platform engineering team.

Key Requirements:
• 8-12 years of experience in Site Reliability Engineering or DevOps
• Strong experience with observability tools (Grafana, Prometheus, Kibana)
• Development background in Java, Python, or Node.js
• AWS cloud platform expertise
• Experience with L3 support and incident management
• Willingness to participate in 24/7 rotational shifts
• Experience with legacy infrastructure and modernization
• Strong automation mindset and scripting abilities

Responsibilities:
• Lead end-to-end SRE assignments for critical systems
• Develop and maintain monitoring and alerting solutions
• Participate in on-call rotations and incident response
• Drive automation initiatives to reduce manual operations
• Collaborate with engineering teams on reliability improvements`;

  try {
    const startTime = Date.now();
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
    console.log("Generated cover letter length:", result.data?.refined?.length || 0, "characters");
    
    if (result.data?.refined) {
      const coverLetter = result.data.refined;
      
      // Check for analysis patterns
      const analysisPatterns = [
        /This cover letter effectively:/i,
        /✅/,
        /The cover letter/i,
        /Analysis:/i,
        /Summary:/i,
      ];
      
      let hasAnalysis = false;
      for (const pattern of analysisPatterns) {
        if (pattern.test(coverLetter)) {
          console.log("❌ Found analysis pattern:", pattern.toString());
          hasAnalysis = true;
        }
      }
      
      if (!hasAnalysis) {
        console.log("✅ No analysis text found in cover letter!");
      }
      
      // Check if it ends properly with </html>
      if (coverLetter.trim().endsWith('</html>')) {
        console.log("✅ Cover letter ends properly with </html>");
      } else {
        console.log("❌ Cover letter does not end with </html>");
        console.log("Last 200 characters:", coverLetter.slice(-200));
      }
      
      // Save the result for inspection
      const fs = require('fs');
      fs.writeFileSync('test-cover-letter-cleaned.html', coverLetter);
      console.log("📄 Cover letter saved to 'test-cover-letter-cleaned.html'");
      
      console.log("First 300 characters:");
      console.log(coverLetter.substring(0, 300) + "...");
      
      console.log("\nLast 300 characters:");
      console.log("..." + coverLetter.slice(-300));
    }
    
    console.log("✅ Cover letter cleanup test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

// Run test
testCoverLetterCleanup();