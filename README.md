# JobApplicationTracker

JobApplicationTracker is a Google Apps Script project designed to automate and manage the tracking of job applications using Gmail and either GeminiAPI, DeepSeekAPI or OpenAiAPI (or a mix of 2). This script filters job-related emails and extracts crucial information, such as job titles, company names, application statuses, and more, and inputs them into a Google Sheets document.

## Features

### Automated Email Parsing
- Uses Gmail API to search for job-related emails based on a customizable query.
- Filters emails for relevance using a two-step process with Gemini's language models.

### Intelligent Email Classification
- The script first uses a smaller model (8B parameters) to determine if an email is relevant based on its subject.
- If the email is relevant, a larger model processes the body to extract key job information.

### Detailed Data Extraction
- The script extracts job status, title, company, location, and any status updates.
- Additionally, it logs the date of the email and provides a link to the original email thread.

### Google Sheets Integration
- All extracted information is organized and stored in a Google Sheets document for easy tracking and management.

---

## Setup Guide

### Prerequisites
- **Google Apps Script**: Ensure you have access to Google Apps Script linked with your Gmail and Google Sheets.
- **Gmail API**: Enable Gmail API access for your Google account.
- **GeminiAPI Access**: Obtain a GeminiAPI key and enable access to the required models.

### Installation Steps
1. **Clone or Download the Repository**
   - Clone this repository or download the source files to your local system.

2. **Set Up the Google Apps Script**
   - Open Google Apps Script in your browser.
   - Create a new project and paste the code from `code.gs` and `functions.gs` into separate script files.

3. **Configure Script Properties**
   - Set your `GOOGLE_API_KEY` in the script properties to authenticate API requests.

4. **Google Sheets Setup**
   - Create a new Google Sheets document.
   - Note the URL of your Google Sheets document and update it in the `input_to_sheet` function within `functions.gs`.

5. **Run the Script**
   - Authorize the script to access your Gmail and Google Sheets. 
   - Execute the `getGmailMessages` function to start the job application tracking process.

## How It Works

### Email Search and Filtering
- The script performs a Gmail search using a custom query, targeting job-related emails.
- Each email is processed, starting from the oldest, to ensure chronological tracking.

### Relevance Check
- The subject and a snippet of the body are passed to a smaller Gemini model to decide if the email should be analyzed further.
- If deemed relevant, the full email body is sent to a larger Gemini model for detailed data extraction.

### Data Extraction and Storage
- Extracted data is formatted and written to the "Job Applications" sheet in the connected Google Sheets document.
- The script keeps track of API tokens used and logs any skipped or unsuccessful attempts.

## Customization
- **Search Queries**: Modify the `searchQuery` variable in `code.gs` to fit your job application email patterns.
- **Sheet Configuration**: Ensure your Google Sheets structure matches the script's expected format.
- **Prompt and Payload**: Similarly, there are prompts in the functions.gs file, you can customize them to get extra or other information. 


## Screenshots
- Example of Gmail email search and filtering.
- Extracted data in Google Sheets.
- Detailed job application tracking.

## Future Enhancements
- **Enhanced Email Parsing**: Improve model prompts for better accuracy.
- **Dashboard Integration**: Develop a dashboard for visualizing application progress.
- **Automated Alerts**: Add notifications for critical updates or reminders.

## Contributing

Contributions are welcome! Feel free to fork the repository and create a pull request. Please ensure your changes are well-documented and tested.
 
## License
This project is open-sourced under the MIT License.

## Support
For any issues or feature requests, please open an issue on GitHub.

## Author
Developed by Prayag Purohit.
