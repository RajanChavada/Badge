/**
 * testTalkingPoints.ts
 * 
 * Dummy test file to demonstrate expected data structures and formats.
 * This file contains mock user and company data for reference.
 * 
 * NOTE: For actual testing, use testTalkingPointsAction.ts (recommended) or testTalkingPointsWithDB.ts
 */

// Mock user profile with dummy resume data
const mockUserProfile = {
    _id: "user_001",
    email: "student@university.edu",
    name: "Alex Johnson",
    resumeText: `
        Alex Johnson
        Senior Software Engineer with 3 years of experience
        
        SKILLS:
        - JavaScript, TypeScript, React, Node.js
        - Python, Data Science, Machine Learning
        - AWS, Docker, Kubernetes
        - GraphQL, REST APIs, Database Design
        
        EXPERIENCE:
        - Senior Software Engineer at TechCorp (2022-2024)
          Developed scalable web applications using React and Node.js
          Led team of 5 engineers on cloud migration project
        
        - Junior Developer at StartupXYZ (2021-2022)
          Built REST APIs and worked with AWS infrastructure
          Improved system performance by 40%
        
        EDUCATION:
        - B.S. Computer Science, State University (2021)
        
        INTERESTS: AI/ML, Cloud Computing, Web Development
    `,
    identity: {
        skills: [
            "JavaScript",
            "TypeScript",
            "React",
            "Node.js",
            "Python",
            "Data Science",
            "Machine Learning",
            "AWS",
            "Docker",
            "GraphQL"
        ],
        experience: "3 years of software engineering",
        industries: ["Technology", "SaaS", "Cloud Computing"],
        currentEmploymentStatus: "Employed",
        yearsOfExperience: 3,
        roles: ["Software Engineer", "Developer"]
    }
};

// Mock company booths with dummy data
const mockCompanyBooths = [
    {
        id: "booth_google",
        name: "Google",
        companyName: "Google",
        description: "Search & Cloud Solutions",
        focus: ["AI/ML", "Cloud Computing", "Web Development", "Data Science"],
        products: ["Google Cloud", "TensorFlow", "Firebase", "Bard"],
        hiringRoles: ["Software Engineer", "ML Engineer", "Cloud Architect"],
        industryKeywords: ["AI", "Search", "Ads", "Cloud"]
    },
    {
        id: "booth_shopify",
        name: "Shopify",
        companyName: "Shopify",
        description: "E-Commerce Platform",
        focus: ["E-Commerce", "Web Development", "Payments", "APIs"],
        products: ["Shopify Platform", "Shop App", "Hydrogen", "Remix"],
        hiringRoles: ["Full Stack Developer", "Platform Engineer", "DevOps Engineer"],
        industryKeywords: ["E-Commerce", "Retail", "Payments"]
    },
    {
        id: "booth_amplitude",
        name: "Amplitude",
        companyName: "Amplitude",
        description: "Analytics & Data Platform",
        focus: ["Analytics", "Data Science", "Product Management", "Data Engineering"],
        products: ["Amplitude Analytics", "Experiment Platform", "CDP"],
        hiringRoles: ["Data Engineer", "Analytics Engineer", "Product Manager"],
        industryKeywords: ["Analytics", "Data", "Product", "Insights"]
    },
    {
        id: "booth_foresters",
        name: "Foresters Financial",
        companyName: "Foresters Financial",
        description: "Financial Services & Insurance",
        focus: ["Finance", "Insurance", "Actuarial Science", "Risk Management"],
        products: ["Insurance Products", "Financial Planning", "Digital Tools"],
        hiringRoles: ["Actuarial Analyst", "Data Scientist", "Full Stack Developer"],
        industryKeywords: ["Finance", "Insurance", "Risk", "Actuarial"]
    }
];

// Test function to demonstrate talking points generation
async function testTalkingPointsGeneration() {
    console.log("🎯 DUMMY TEST: Talking Points Generation\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    console.log("📋 USER PROFILE:");
    console.log(`  Name: ${mockUserProfile.name}`);
    console.log(`  Email: ${mockUserProfile.email}`);
    console.log(`  Skills: ${mockUserProfile.identity.skills.join(", ")}`);
    console.log(`  Experience: ${mockUserProfile.identity.experience}`);
    console.log(`  Industries: ${mockUserProfile.identity.industries.join(", ")}\n`);
    
    console.log("🏢 COMPANY BOOTHS:\n");
    mockCompanyBooths.forEach((booth) => {
        console.log(`  ${booth.name}`);
        console.log(`    Focus: ${booth.focus.join(", ")}`);
        console.log(`    Hiring: ${booth.hiringRoles.join(", ")}`);
        console.log("");
    });
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    console.log("💡 EXPECTED TALKING POINTS FORMAT:\n");
    console.log("For each company, generate 3 personalized talking points:");
    console.log("  1. Connection point based on user's skills/experience");
    console.log("  2. Question about their products/technologies");
    console.log("  3. Interest-based statement about career opportunities\n");
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    console.log("📊 EXAMPLE OUTPUT (What we expect):\n");
    
    mockCompanyBooths.forEach((booth) => {
        const skillOverlap = booth.focus.filter(f => 
            mockUserProfile.identity.skills.some(s => 
                s.toLowerCase().includes(f.toLowerCase()) || 
                f.toLowerCase().includes(s.toLowerCase())
            )
        );
        
        console.log(`✨ ${booth.name} - Talking Points:`);
        console.log(`  1. "I see you focus on ${booth.focus[0]} and ${booth.focus[1]}. I have experience with ${skillOverlap.length > 0 ? skillOverlap.join(' and ') : 'similar technologies'}, which aligns well with your work."`);
        console.log(`  2. "Can you tell me more about how ${booth.products[0]} integrates with ${booth.focus[0]}?"`);
        console.log(`  3. "I'm very interested in roles like ${booth.hiringRoles[0]}. What does career growth look like for engineers in that track?"`);
        console.log("");
    });
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("✅ Test setup complete! Ready to integrate with actual talkingPoints.ts functions\n");
}

// Run the test
testTalkingPointsGeneration();

// Export for use in other test files if needed
export { mockUserProfile, mockCompanyBooths, testTalkingPointsGeneration };
