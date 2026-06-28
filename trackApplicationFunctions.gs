/**
 * parse the emails for application relevance
 */
function processJobApplicationUpdates(aiConfSubject, aiConfBody) {
  const threads = searchGmail(GMAIL_SEARCH_QUERY_JOB_APPLICATION);

  // Loop through the threads, starting from the oldest thread
  for (let i = threads.length - 1; i >= 0; i--) {
    const messages = threads[i].getMessages();

    // Loop through the messages within each thread, starting from the oldest message
    for (let j = messages.length - 1; j >= 0; j--) {
      const message = messages[j];

      // Extract details from the email
      const date = message.getDate();
      const plainBody = message.getPlainBody(); // Using plain text body for checking the relevance
      const subjectplusbodysnip = message.getSubject() + " " + plainBody.substring(0, 100)



      const is_relevant = queryAIforJobApplicationSubject(subjectplusbodysnip, aiConfSubject);
      if (
        is_relevant == 1
      ) {
        try {
          const body = getCleanedEmailBody(message.getBody()); // Using sanitised html body for better accuracy while checking the application info
          const subjectplusbody = "subject: " + message.getSubject() + " body: " + body;
          var jobInfo = queryAIforJobApplicationBody(subjectplusbody, aiConfBody)
        } catch (parseError) {
          Logger.log(`Error querying  ${aiConfBody}` + parseError);
        }
        // Check if 'joninfo' exists and has elements

        if (jobInfo) {
          try {
            //email info
            const emailLink = message.getThread().getPermalink(); // Get the permalink to the thread
            const threadID = message.getThread().getId(); // Get the thread ID
            const sender = message.getFrom();
            const modifiedDate = formatDate(new Date());

            //job info extract
            const company = jobInfo.company;
            const position = jobInfo.position;
            const status = jobInfo.status;
            const jdLink = jobInfo.jdLink;
            const source = jobInfo.source;
            const location = jobInfo.location;
            const nextStepDate = jobInfo.nextStepDate;
            const salaryRange = jobInfo.salaryRange;
            const notes = jobInfo.notes;

            const matchKey = company + " | " + position;

            // Format the date
            const formattedDate = formatDate(date);

            // Call the function to input data into the sheet
            inputApplicationUpdatetoSheet(threadID, matchKey, date, company, position, status, modifiedDate, emailLink, jdLink, sender, source, location, nextStepDate, salaryRange, notes);
            Logger.log("input 1 email to the sheet");
          } catch (parseError) {
            Logger.log("Error parsing job info: " + parseError);
          }
        } else {
          Logger.log("No valid content found in the response.");
        }
      }
      else {
        Logger.log("Skipped: " + subjectplusbodysnip.substring(0, 60))
        continue
      }
    }
  }
}

function searchGmail(searchQuery) {
  const threads = GmailApp.search(searchQuery, 0, 20); // Process up to 20 threads per run to prevent timeout limits
  if (threads.length === 0) {
    Logger.log(`No new email found for the search ${searchQuery}.`);
  }
  return threads;

}

function inputApplicationUpdatetoSheet(threadID, matchKey, date, company, position, status, modifiedDate, emailLink, jdLink, sender, source, location, nextStepDate, salaryRange, notes) {
  // Open the spreadsheet using its URL
  const spreadsheet = SpreadsheetApp.openByUrl(SPREAD_SHEET_URL);

  // Access the "Job Applications" sheet
  let sheet = spreadsheet.getSheetByName(TRACKER_SHEET_NAME);

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

/**
 * email body sanitizer
 */
function getCleanedEmailBody(htmlContent) {
  // 1. Remove style and script tags entirely
  let clean = htmlContent.replace(/<(style|script|head|footer|nav|svg)[^>]*>[\s\S]*?<\/\1>/gi, '');

  // 2. Remove common UI noise (tracking images, social links)
  clean = clean.replace(/<img[^>]*>/gi, '');

  // 3. Keep semantic structure but lose deep nesting
  // You might want to use a library like 'html-to-text' in Node.js 
  // with specific options to keep tables or formatting.

  return clean;
}

