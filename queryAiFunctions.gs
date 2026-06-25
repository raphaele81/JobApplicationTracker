function getAIConfiguration(modelName, aiModel) {
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Normalize the input to match your property keys
  const prefix = modelName.toUpperCase(); 
  
  return {
    endpoint: scriptProperties.getProperty(`${prefix}_ENDPOINT`),
    apiKey: scriptProperties.getProperty(`${prefix}_API_KEY`),
    modelName: modelName,
    aiModel: aiModel
  };
}


function queryAIforsubject(subjectplusbodysnip, aiConf) {

  
  const prompt = `Read the attached email and decide whether it relates to one of MY job applications — e.g. an application confirmation, a recruiter reply, an interview invitation/scheduling, a rejection, or an offer. Generic job alerts, newsletters, surveys, account verification, OTP, password setup /reset, platform registration or marketing emails are NOT job-related.
  1 if it is related to one of my job applications.
  0 if it is not.
  No explanation. No extra text.
  Email subject and body snippet: ${subjectplusbodysnip}*`;


  const obj = callAI(aiConf, prompt)
  
  if (
    obj.candidates &&
    obj.candidates.length > 0 &&
    obj.candidates[0].content.parts.length > 0
  ) {
    return obj.candidates[0].content.parts[0].text;
  } else {
        console.warn("No response.");
      }
  } 


function queryAIforBody(subjectplusbody, aiConf) {


  // Create the prompt
  const prompt = `from this email related to one of my job applications extract:
  - Company: Extract the actual hiring company. You MUST ignore applicant tracking systems, job boards, and recruitment agencies (e.g., Greenhouse, Lever, Workday, LinkedIn, JobsDB, eFinancialCareers, Bamboohr). Look for phrases like "applying to [Company]" or "your application with [Company]".
  - Position: The cleaned job title (e.g., "Senior Software Engineer"). If it is an internship, include the term (e.g., "Software Engineering Intern - Summer 2024").
  - Status: Determine the current stage of the application based on the email context. Use strictly ONE of the following: "Applied", "Application Viewed", "Action Required" (e.g., online assessment), "Interview Scheduled", "Interview Requested", "Rejected", "Offer", "Withdrawn", or "Unknown".
  - JD Link: The direct URL to the job posting or description. Must be a valid URL. If none is found, return null.
  - Source: The platform the application came through (e.g., LinkedIn, JobsDB, eFinancialCareers, Company Site). Base this on the sender domain or links in the email. Use "Other" if unclear.
  - Location: The job location (City, Country) or "Remote". Return null if not mentioned.
  - Next Step Date: If the email proposes an interview date, confirmation date, or assessment deadline, extract it in YYYY-MM-DD format. Return null if no dates are mentioned.
  - Salary Range: Any compensation or salary expectations mentioned. Return null if not mentioned.
  - Notes: A concise, one-line summary of the email's primary purpose (e.g., "Confirmation of application receipt", "Recruiter John Doe requesting a phone screen", "Passed to hiring manager").
     
  You MUST provide your response in the following JSON format for confirmation of application emails "status" :
  {
    "job_info": [
      {
        "company": "",
        "position": "",
        "status": "",
        "jdLink": "",
        "source": "",
        "location": "",
        "nextStepDate": "",
        "salaryRange": "",
        "notes": ""
      }
    ]
  }
  DO NOT INCLUDE ANY SYNTAX HIGHLIGHTING OR CODE BLOCK FORMATTING. Here is the email: ${subjectplusbody}`;

  // Make the API call and handle the response
  const jsonResponse = callAI(aiConf, prompt)
  const jobInfo = JSON.parse(jsonResponse.candidates[0].content.parts[0].text).job_info[0];
  const totalTokenCount = jsonResponse.usageMetadata.totalTokenCount;
  
  return {"jobInfo": jobInfo, "totalTokenCount" : totalTokenCount} 
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are zero-based
  const year = date.getFullYear();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}


function callAI(config, prompt) {

  let payload = null;
  let options = null;
  let url = config.endpoint;

  // Define the payload  and options based on the model 
  //Google
  if(config.modelName == "google"){
    payload = {
      "contents": [
        {
          "parts": [
            {
              "text": prompt
            },
          ]
        }
      ], 
      "generationConfig":  {
        "temperature": 0.2,
      },
    };

    options = {
      'method' : 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      "muteHttpExceptions": true // Useful for debugging API errors
    };
  
    url = config.endpoint + config.aiModel + ":generateContent?key=" + encodeURIComponent(config.apiKey);
  
  //DeepSeek
  } else if (config.modelName == "deepseek"){
    payload = {
    "model": "${config.aiModel}",
    "messages": [
      { "role": "system", "content": "You are a helpful career coach" },
      { "role": "user", "content": prompt }
    ],
    "temperature": 0.2
    };

    options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': { 'Authorization': 'Bearer ' + config.apiKey },
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
    };
  //OpenAI
  } else if (config.modelName == "openai"){
    payload = {
    "model": "${config.aiModel}", 
    "messages": [
      { "role": "system", "content": "You are a helpful career coach." },
      { "role": "user", "content": prompt }
    ],
    "temperature": 0.2
    };

    options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': { 'Authorization': 'Bearer ' + config.apiKey },
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
    };
  } 


  // Execute the call

  // retry mechanism to limit reaching API quota
  let retries = 5;
  let delay = 1100; // Start with 1.5 second delay
  while (retries > 0){

    let response = UrlFetchApp.fetch(url, options);
    let code = response.getResponseCode();

    if (code == 200){
      return JSON.parse(response.getContentText());
    } else if (code === 429) {
      console.warn(`Rate limited (429). Waiting ${delay}ms before retrying...`);
      Utilities.sleep(delay);
      delay *= 2; // Double the wait time for the next attempt
      retries--;
    } else {
      Logger.log("Error: " + response.getContentText());
      throw new Error(`API Error ${code}: ${response.getContentText()}`);
    }
  }
  throw new Error("Maximum retries reached. Please slow down your requests.");

}
