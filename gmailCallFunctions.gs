function getGmailMessages(searchQuery, modelNameSubject, aiModelBSubject, modelNameBody, aiModelBody, spreadsheetUrl, speadsheetTab) {
  const threads = GmailApp.search(searchQuery, 0, 500); 
  let totalusedtokensinloop = 0
  // Loop through the threads, starting from the oldest thread
  for (let i = threads.length - 1; i >= 0; i--) {
    const messages = threads[i].getMessages();

    // Loop through the messages within each thread, starting from the oldest message
    for (let j = messages.length - 1; j >= 0; j--) {
      const message = messages[j];
      
      // Extract details from the email
      const date = message.getDate();
      const body = message.getPlainBody(); // Using plain text body for better compatibility
      const subjectplusbody = "subject: " + message.getSubject() + " body: " + body;
      const subjectplusbodysnip = message.getSubject() + " " + body.substring(0,100)
      
      const aiConfSubject = getAIConfiguration(modelNameSubject, aiModelBSubject);

      if (!aiConfSubject.endpoint || !aiConfSubject.apiKey) {
        throw new Error(`Configuration not found or incomplete for: ${modelNameSubject}`);
      }

      const is_relevant = queryAIforsubject(subjectplusbodysnip, aiConfSubject);
      if(
        is_relevant == 1
      ){
        try {
          const aiConfBody = getAIConfiguration(modelNameBody, aiModelBody);
          if (!aiConfBody.endpoint || !aiConfBody.apiKey) {
            throw new Error(`Configuration not found or incomplete for: ${modelNameBody}`);
          }
          var {jobInfo, totalTokenCount} = queryAIforBody(subjectplusbody, aiConfBody)
        }catch(parseError) {
          Logger.log("Error querying ${modelNameBody}: " + parseError);
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

              totalusedtokensinloop += totalTokenCount
              

              // Call the function to input data into the sheet
              input_to_sheet(spreadsheetUrl, speadsheetTab, threadID, matchKey, date, company, position,  status, modifiedDate, emailLink, jdLink, sender, source ,location, nextStepDate, salaryRange, notes);
              Logger.log("input 1 email to the sheet, " + " Total tokens used: " + totalusedtokensinloop);
        } catch (parseError) {
          Logger.log("Error parsing job info: " + parseError);
          }
      } else {
        Logger.log("No valid content found in the response.");
      }    
          }
          else{
            Logger.log("Skipped: " + subjectplusbodysnip.substring(0,60))
            continue
          } 
    }
  }
}



function input_to_sheet(spreadsheetUrl,speadsheetTab, threadID, matchKey, date, company, position,  status, modifiedDate, emailLink, jdLink, sender, source, location, nextStepDate, salaryRange, notes) {
  // Open the spreadsheet using its URL
  const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
  
  // Access the "Job Applications" sheet
  let sheet = spreadsheet.getSheetByName(speadsheetTab);

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

