# JobApplicationTracker
JobApplicationTracker is a Google Apps Script project that automates the end-to-end management of job applications. It monitors your Gmail, uses advanced AI (Gemini, OpenAI, or DeepSeek) to parse job-related emails, and syncs the data into Google Sheets. It also features a smart job-matching engine that filters job alerts against your resume to prevent duplicate applications.

## Key Features 

### Feature 1 - Job Application Tracking
- Automated Parsing: Uses Gmail API to search for and scan relevant job-related emails.
- Two-Step AI Classification: Uses a lightweight model to filter relevance, followed by a more robust model to extract granular details (Company, Position, Status, etc.).
- Sheets Sync: Automatically logs data, email dates, and source links into a structured spreadsheet.


### Feature 2 - Job Alert and Resume matching
- Intelligent Filtering: Extracts job descriptions from alerts and matches them against your uploaded resume.
- Duplicate Detection: Automatically compares incoming opportunities against your existing tracker to ensure you don't apply to the same company/position twice.
  
---

## Setup Guide

### Prerequisites
- **Google Account**: Access to Google Apps Script, Gmail, and Google Sheets.
- **API Credentials**: At least one active API key (Gemini, OpenAI, or DeepSeek) with enabled access to your chosen models.
- **Resume**: Have a resume in your google documents


### Installation Steps
1. **Respository Setup**: Clone this repository or download the source files to your local system.
2. **Apps Script Initialisation**
   - Open Google Apps Script in your browser.
   - Create a new project and paste the code from `code.gs`, `queryAiFunctions.gs`, `trackApplicationFunctions.gs` and `trackJobAlertFunctions.gs` into separate script files.
  
3. **API Configuration**
   - Open your Project Settings and add your API keys/endpoints as Script Properties (e.g., GOOGLE_API_KEY, OPENAI_API_KEY, DEEPSEEK_ENDPOINT).
  
4. **Google Sheets Setup**
   - Create a spreadsheet with two tabs: one for Applications and one for Job Alerts.
  
5. **Global configuration **
   - Edit the top section of code.gs to define your spreadsheet URLs, resume link, and AI model preferences.

6. **Authorization & Execution**
   - Run the script once to trigger the OAuth authorization prompt for Gmail and Sheets.
   - Execute the `trackJobApplicationUpdates` function to start the job application tracking process.
   - Execute the `trackJobAlerts` function to start the Job alert matching process.


## Screenshots
- Example of Gmail email search and filtering.
- Extracted data in Google Sheets.
- Detailed job application tracking.

## Future Enhancements
- **Competitor & Keyword Insight Dashboard**: Use the collected data to make your the search smarter, not just faster. Create a "Trends" tab in your Google Sheet that uses a simple script to visualize your data. This would help  decide if resume needs to be tweaked  or new tool/skills need to be learnt (e.g., if you see "Python" appearing in 90% of roles you want, but your resume doesn't feature it prominently).
- **Automated Tailored Cover Letter Generator**:  When the script identifies a high-match job, trigger a new AI function that drafts a personalized cover letter. This would save you the 20–30 minutes typically spent personalizing letters, ensuring you can apply faster without sacrificing the quality of your application.
- **"Follow-up" Alert & Outreach Automation**: Add a status tracking feature that flags applications that have been "In Progress" for more than 7–10 days without an update. This would keep your pipeline moving and helps you stay top-of-mind with recruiters.

## Contributing
Contributions are welcome! Please fork this repository and submit a pull request with well-documented changes.

## License
This project is open-sourced under the MIT License.

## Support
For any issues or feature requests, please open an issue on GitHub.

## Author
Developed by Raphaele Motte (Forked from an initial project by Prayag Purohit).
