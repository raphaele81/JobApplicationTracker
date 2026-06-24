function queryGeminiforsubject(subjectplusbodysnip) {
  const properties = PropertiesService.getScriptProperties().getProperties();
  const geminiApiKey = properties['GOOGLE_API_KEY'];
  
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`;
  
  const query = `Read the attached email and decide whether it relates to one of MY job applications — e.g. an application confirmation, a recruiter reply, an interview invitation/scheduling, a rejection, or an offer. Generic job alerts, newsletters, or marketing emails are NOT job-related.

  If it is related to one of my job applications, strictly return 1 (true) as an integer. If it is not, strictly return 0 (false) as an integer.

  *The subject and body snippet: ${subjectplusbodysnip}*`;

  const payload = { contents: [{ parts: [{ text: query }] }] };


  // retry mechanism to limit reaching API quota
  let retries = 5;
  let delay = 1000; // Start with 1 second delay
  while (retries > 0){

    let res = UrlFetchApp.fetch(geminiEndpoint, {
      payload: JSON.stringify(payload),
      contentType: "application/json",
      muteHttpExceptions: true
    });

    let code = res.getResponseCode();

    if (code == 200){
      const obj = JSON.parse(res.getContentText());
      if (
        obj.candidates &&
        obj.candidates.length > 0 &&
        obj.candidates[0].content.parts.length > 0
      ) {
        return obj.candidates[0].content.parts[0].text;
      } else {
        console.warn("No response.");
      }
    } else if (code === 429) {
      console.warn(`Rate limited (429). Waiting ${delay}ms before retrying...`);
      Utilities.sleep(delay);
      delay *= 2; // Double the wait time for the next attempt
      retries--;
    } else {
      throw new Error(`API Error ${code}: ${response.getContentText()}`);
    }
  }
}  

function queryGeminiforBody(subjectplusbody, date) {
  const properties = PropertiesService.getScriptProperties().getProperties();
  const geminiApiKey = properties['GOOGLE_API_KEY'];
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' + geminiApiKey;
  const temperature = 0.2;

  // Create the prompt
  const prompt = `from this email related to one of my job applications extract:
  - Company: the actual hiring company, NOT the applicant tracking system or job board (ignore names like Greenhouse, Lever, Workday, LinkedIn, JobsDB, eFinancialCareers).
  - Position: the cleaned job title.
  - Status: the current stage this email represents.
  - JD Link: the direct URL to the job posting/description on the platform (LinkedIn, JobsDB, eFinancialCareers, company careers site) if present in the email. Leave empty if there is none.
  - Source: which platform the application came through, based on the sender/links in the email. Use Other if unclear.
  - Location: the job location (city/country, or Remote) if mentioned.
  - Next Step Date: if the email proposes or confirms an interview, call, or a deadline, the relevant date (YYYY-MM-DD). Leave empty otherwise.
  - Salary Range: any compensation/salary range mentioned. Leave empty otherwise.
  - Notes: a short one-line summary of what this email is about (e.g. recruiter name, referral, key detail).
     
  You MUST provide your response in the following JSON format for confirmation of application emails "status" takes strictly three values:
  {
    "job_info": [
      {
        "company": "<company>",
        "position": "<job title/if internship - job title with term>",
        "status": "<the current stage this email represents>",
        "jdLink",
        "source",
        "location",
        "nextStepDate",
        "salaryRange",
        "notes"
      }
    ]
  }
  DO NOT INCLUDE ANY SYNTAX HIGHLIGHTING OR CODE BLOCK FORMATTING. Here is the email: ${subjectplusbody}`;

  // Construct the API payload
  const payload = {
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

  const options = { 
    'method' : 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  // Make the API call and handle the response
  const response = UrlFetchApp.fetch(endpoint, options);
  const jsonResponse = JSON.parse(response.getContentText());
  const totalTokenCount = jsonResponse.usageMetadata.totalTokenCount;
  
  const jobInfo = JSON.parse(jsonResponse.candidates[0].content.parts[0].text).job_info[0];
  return {"jobInfo": jobInfo, "totalTokenCount" : totalTokenCount} 
  
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are zero-based
  const year = date.getFullYear();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

function input_to_sheet(threadID, matchKey, date, company, position,  status, modifiedDate, emailLink, jdLink, sender, source, location, nextStepDate, salaryRange, notes) {
  // Open the spreadsheet using its URL
  const spreadsheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/WWWWWW/edit?gid=0#gid=0");
  
  // Access the "Job Applications" sheet
  let sheet = spreadsheet.getSheetByName("Applications");

  const lastRow = sheet.getLastRow();
  const nextRow = lastRow + 1;

  sheet.getRange(nextRow, 1).setValue(threadID);
  sheet.getRange(nextRow, 2).setValue(matchKey);
  sheet.getRange(nextRow, 3).setValue(date);
  sheet.getRange(nextRow, 4).setValue(company);
  sheet.getRange(nextRow, 5).setValue(position);
  sheet.getRange(nextRow, 6).setValue(status);
  sheet.getRange(nextRow, 7).setValue(modifiedDate);
  sheet.getRange(nextRow, 8).setValue(emailLink);
  sheet.getRange(nextRow, 9).setValue(jdLink);
  sheet.getRange(nextRow, 10).setValue(sender);
  sheet.getRange(nextRow, 11).setValue(source);
  sheet.getRange(nextRow, 12).setValue(location);
  sheet.getRange(nextRow, 13).setValue(nextStepDate);
  sheet.getRange(nextRow, 14).setValue(salaryRange);
  sheet.getRange(nextRow, 15).setValue(notes);

}
