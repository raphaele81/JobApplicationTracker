/**
 * JOB APPLICATIONS and JOB ALERTS TRACKING AUTOMATION & AI MATCHING
 * Reads job alerts from Gmail, matches against a Google Doc Resume,
 * and appends new matches to your spreadsheet tracking sheet.
 */

// ==================== CONFIGURATION ====================
const SPREAD_SHEET_URL = "https://docs.google.com/spreadsheets/xxxx"; // Spreadsheet url
const RESUME_DOC_URL = "https://docs.google.com/document/d/xxxx";  // Paste the URL of your Resume Google Doc

const TRACKER_SHEET_NAME = "Applications";          // Name of your active application tracker tab
const MATCHES_SHEET_NAME = "JD";            // Name of the tab where identified matching JDs should go

const GMAIL_SEARCH_QUERY_JOB_APPLICATION = "-label:nonJD in:inbox after:2026/06/25";     // Gmail search for Job Application related emails
const GMAIL_SEARCH_QUERY_JD = "label:jobAlert after:2026/06/24";            // Gmail search for Job Alter emails

const AI_SIMPLE_MODEL_PROVIDER = "google"
const AI_SIMPLE_MODEL_NAME = "gemini-3.1-flash-lite"

const AI_COMPLEX_MODEL_PROVIDER = "google"
const AI_COMPLEX_MODEL_NAME = "gemini-3.1-flash-lite"

//const modelProvider = "openai"
//const modelName = "gpt-5.4-mini"
//const modelProvider = "deepseek"
//const modelName = "deepseek-chat"
//const modelName = "gemini-3.5-flash"
//const modelName = "gemini-3.1-flash-lite" 
//const modelName = "gemini-2.5-flash"
// =======================================================


/**
 * Main function to process emails, check if they are related to job application 
 * and track key application information in tracking spreadsheet
 */
function trackJobApplicationUpdates() {

  //Get Ai Configuration
  const aiConfSubject = getAIConfiguration(AI_SIMPLE_MODEL_PROVIDER, AI_SIMPLE_MODEL_NAME);
  if (!aiConfSubject.endpoint || !aiConfSubject.apiKey) {
    throw new Error(`Configuration not found or incomplete for: ${modelNameSubject}`);
  }
  const aiConfBody = getAIConfiguration(AI_COMPLEX_MODEL_PROVIDER, AI_COMPLEX_MODEL_NAME);
  if (!aiConfBody.endpoint || !aiConfBody.apiKey) {
    throw new Error(`Configuration not found or incomplete for: ${modelNameBody}`);
  }

  //Scan email messages for Job Application related emails
  processJobApplicationUpdates(aiConfSubject, aiConfBody)

}


/**
 * Main function to process emails, check if they are related to job application 
 * and track key application information in tracking spreadsheet
 */
function trackJobAlerts() {

  //Get Ai Configuration
  const aiConfBody = getAIConfiguration(AI_COMPLEX_MODEL_PROVIDER, AI_COMPLEX_MODEL_NAME);
  if (!aiConfBody.endpoint || !aiConfBody.apiKey) {
    throw new Error(`Configuration not found or incomplete for: ${modelNameBody}`);
  }

  //Scan Job Alerts emails messages
  processJobAlerts(aiConfBody)

}
