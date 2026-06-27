/**
 *  get all properties to be able to call AI api based on given model information
 */
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

/**
 *  Generate Prompt and call AI API to check whether an email is relevant to a job application
 */
function queryAIforJobApplicationSubject(subjectplusbodysnip, aiConf) {


  const prompt = `Read the attached email and decide whether it relates to one of MY job applications — e.g. an application confirmation, a recruiter reply, an interview invitation/scheduling, a rejection, or an offer. Generic job alerts, newsletters, surveys, account verification, OTP, password setup /reset, platform registration or marketing emails are NOT job-related.
  return response as a json object
  {
    "is_job_related":   1 if it is related to one of my job applications. 0 if it is not.
  }

  No explanation. No extra text.
  Email subject and body snippet: ${subjectplusbodysnip}*`;



  const jsonResponse = callAI(aiConf, prompt)
  return jsonResponse.is_job_related;

}

/**
 *  Generate Prompt and call AI API to retreive job application updates from an email subject and body
 */
function queryAIforJobApplicationBody(subjectplusbody, aiConf) {


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
  DO NOT INCLUDE ANY SYNTAX HIGHLIGHTING OR CODE BLOCK FORMATTING or backquote characters. Here is the email: ${subjectplusbody}`;

  //Logger.log(prompt);
  // Make the API call and handle the response
  const response = callAI(aiConf, prompt);
  return response.job_info[0]

}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are zero-based
  const year = date.getFullYear();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

/**
 *  Generate Prompt and call AI API for checking whether a JD matches a resume
 */
function queryAIforJobMatching(aiConf, resumeText, body) {

  const prompt = `
        Resume of candidate:
        ---
        ${resumeText}
        ---

        Email text:
        ---
        ${body}
        ---
        
        Analyze this email. Extract any job listings mentioned. For each listing, evaluate if it is a match for the candidate's skills, tech stack, and background. Only output listings that are a good or strong match (match_score of 70 or higher). Make sure to exclude listings that requires chinese speaking skills (either mandarin or cantonese)
      `;

  const systemInstruction =
    "You are an expert recruiter and career coach. Your task is to analyze a job alert email against " +
    "a candidate's resume and extract job listings that match. " +
    "You must return a single valid JSON object strictly adhering to the following structure:\n\n" +
    "{\n" +
    "  \"jobs\": [\n" +
    "    {\n" +
    "      \"company\": \"Company Name (string)\",\n" +
    "      \"position\": \"Job Title/Position (string)\",\n" +
    "      \"jd_link\": \"The exact direct URL to apply or view the job found in the email (string)\",\n" +
    "      \"salary_range\": \"Salary details if mentioned, otherwise leave as empty string (string)\",\n" +
    "      \"location\": \"Location of the job, otherwise leave as empty string (string)\",\n" +
    "      \"match_reason\": \"A 1-2 sentence explanation of why this job is a good fit for the resume (string)\",\n" +
    "      \"match_score\": \"An integer from 0 to 100 on how well the job requirements match the resume (integer)\"\n" +
    "    }\n" +
    "  ]\n" +
    "}\n\n" +
    "Rules:\n" +
    "1. Only include jobs that meet or exceed a match_score of 70.\n" +
    "2. Do not write any explanatory text outside of the JSON block.\n" +
    "3. Try to extract the direct tracking or referral URL ('jd_link') accurately from the email content."


  return response = callAI(aiConf, prompt, systemInstruction);

}

/**
 * Generic AI integration function
 * Automatically handles routing, JSON-mode enforcement, rate-limiting, 
 * and normalizes responses across Google Gemini, OpenAI, and DeepSeek.
 * 
 * @param {Object} config - Configuration object containing credentials, endpoints, and model info
 * @param {string} prompt - The primary user prompt
 * @param {string} [systemInstruction] - Optional system personality instruction
 * @returns {Object|string} Automatically parsed JSON object or plain-text string
 */
function callAI(config, prompt, systemInstruction) {
  let payload = null;
  let options = null;
  let url = config.endpoint;
  const systemMessage = systemInstruction || "You are a helpful career coach.";

  // Define the payload and options based on the model 
  // Google
  if (config.modelName == "google") {
    payload = {
      "contents": [
        {
          "parts": [
            { "text": prompt }
          ]
        }
      ],
      "systemInstruction": {
        "parts": [
          { "text": systemMessage }
        ]
      },
      "generationConfig": {
        "temperature": 0.2,
        "responseMimeType": "application/json" // Enforces structured JSON output
      },
    };

    options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      "muteHttpExceptions": true
    };

    url = config.endpoint + config.aiModel + ":generateContent?key=" + encodeURIComponent(config.apiKey);

    // DeepSeek
  } else if (config.modelName == "deepseek") {
    payload = {
      "model": config.aiModel,
      "messages": [
        { "role": "system", "content": systemMessage },
        { "role": "user", "content": prompt }
      ],
      "temperature": 0.2,
      "response_format": { "type": "json_object" } // Enforces structured JSON output
    };

    options = {
      'method': 'post',
      'contentType': 'application/json',
      'headers': { 'Authorization': 'Bearer ' + config.apiKey },
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };

    // OpenAI
  } else if (config.modelName == "openai") {
    payload = {
      "model": config.aiModel,
      "messages": [
        { "role": "system", "content": systemMessage },
        { "role": "user", "content": prompt }
      ],
      "temperature": 0.2,
      "response_format": { "type": "json_object" } // Enforces structured JSON output
    };

    options = {
      'method': 'post',
      'contentType': 'application/json',
      'headers': { 'Authorization': 'Bearer ' + config.apiKey },
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
  }

  // Execute the call with backoff-based retry mechanism
  let retries = 5;
  let delay = 1100; // Start with a 1.1-second delay

  while (retries > 0) {
    let response = UrlFetchApp.fetch(url, options);
    let code = response.getResponseCode();

    if (code == 200) {
      const responseData = JSON.parse(response.getContentText());
      let textContent = "";

      // Normalize extraction based on provider structures
      if (config.modelName == "google") {
        if (responseData.candidates && responseData.candidates[0].content && responseData.candidates[0].content.parts[0]) {
          textContent = responseData.candidates[0].content.parts[0].text;
        }
      } else if (config.modelName == "openai" || config.modelName == "deepseek") {
        if (responseData.choices && responseData.choices[0].message) {
          textContent = responseData.choices[0].message.content;
        }
      }

      // Parse text into a structured JSON object if possible, otherwise return plain text
      try {
        return JSON.parse(textContent);
      } catch (e) {
        return textContent;
      }

    } else if (code === 429) {
      console.warn(`Rate limited (429). Waiting ${delay}ms before retrying...`);
      Utilities.sleep(delay);
      delay *= 2; // Exponential backoff
      retries--;
    } else {
      Logger.log("Error: " + response.getContentText());
      throw new Error(`API Error ${code}: ${response.getContentText()}`);
    }
  }
  throw new Error("Maximum retries reached. Please slow down your requests.");
}
