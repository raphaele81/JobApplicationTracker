function trackJobApplication() {


  // Search query for emails to track - 
  //const searchQuery = 'Application -{Linkedin Indeed catchafire} after:2024/5/5 before:2025/5/6';
  //const searchQuery = 'Job application -{hirist.tech, indeed, linkedin, glassdoor} after:2024/08/01'
  //const searchQuery = "from:rbc@myworkday.com" 
  //const searchQuery = "-label:nonJD in:inbox after:2025/04/01 before:2025/05/01"
  const searchQuery = "-label:nonJD in:inbox after:2026/06/24"

  // target spreadsheet URL
  const spreadsheetUrl = "https://docs.google.com/spreadsheets/d/14NW2dPPBKsc5VoSponMJvgFXgmPIQi8nr_yi4YiUHnY/edit?gid=0#gid=0";
  const speadsheetTab = "Applications"

  // model name and model to use for checking if email is related to a job application - can be done with a simple model
  const modelNameSubject = "google"
  const aiModelBSubject = "gemini-3.1-flash-lite"

  //const aiModelBSubject = "gemini-2.5-flash"

  
  //const modelName = "openai"
  //const aiModel = "gpt-5.4-mini"
  //const modelName = "deepseek"
  //const aiModel = "deepseek-chat"
   //const aiModel = "gemini-3.5-flash"
  //const aiModel = "gemini-3.1-flash-lite" 

  //More advanced model to process the email body and classify information
  const modelNameBody = "google"
  const aiModelBody = "gemini-3.1-flash-lite"
  

  getGmailMessages(searchQuery, modelNameSubject, aiModelBSubject, modelNameBody, aiModelBody, spreadsheetUrl, speadsheetTab)


}



