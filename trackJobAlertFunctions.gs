/**
 * Main function to process incoming job alert emails
 */
function processJobAlerts(aiConf) {

  // Open the spreadsheet using its URL
  const ss = SpreadsheetApp.openByUrl(SPREAD_SHEET_URL);
  const trackerSheet = ss.getSheetByName(TRACKER_SHEET_NAME);

  if (!trackerSheet) {
    Logger.log(`Error: Tracker tab named "${TRACKER_SHEET_NAME}" was not found. Please verify the name.`);
    return;
  }

  // Ensure matches sheet exists, or create it with identical headers
  const matchesSheet = getOrCreateMatchesSheet(ss, trackerSheet);

  // Verify headers are correct
  const headers = trackerSheet.getRange(1, 1, 1, trackerSheet.getLastColumn()).getValues()[0];
  const matchKeyIdx = headers.indexOf("Match Key");
  const jdLinkIdx = headers.indexOf("JD Link");

  if (matchKeyIdx === -1 || jdLinkIdx === -1) {
    Logger.log("Error: 'Match Key' or 'JD Link' column not found in your tracker sheet. Please verify headers.");
    return;
  }

  // Retrieve current resume
  let resumeText;
  try {
    resumeText = getResumeText(RESUME_DOC_URL);
  } catch (err) {
    Logger.log("Failed to load resume: " + err.message);
    return;
  }

  // Extract existing entries from BOTH sheets to prevent duplicates
  const existing = buildDeduplicationSets(trackerSheet, matchesSheet, matchKeyIdx, jdLinkIdx);

  // Search Gmail for unread alerts with the specified label
  const threads = searchGmail(GMAIL_SEARCH_QUERY_JD);

  let newJobsAdded = 0;

  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();
    const threadId = thread.getId();

    for (let j = 0; j < messages.length; j++) {
      const message = messages[j];
      const sender = message.getFrom();
      const subject = message.getSubject();
      const body = getCleanedEmailBody(message.getBody())

      // Determine the job portal source
      let source = "Unknown";
      if (/linkedin/i.test(sender) || /linkedin/i.test(subject)) source = "LinkedIn";
      else if (/jobsdb/i.test(sender) || /jobsdb/i.test(subject)) source = "JobsDB";
      else if (/michaelpage/i.test(sender) || /michaelpage/i.test(subject)) source = "Michael Page";
      else if (/efinancialcareers/i.test(sender) || /efinancialcareers/i.test(subject)) source = "eFinancialCareers";

      Logger.log(`Processing email from: ${sender} | Source: ${source}`);

      const response = queryAIforJobMatching(aiConf, resumeText, body);

      if (response && response.jobs && response.jobs.length > 0) {
        for (let k = 0; k < response.jobs.length; k++) {
          const job = response.jobs[k];
          const company = job.company || "Unknown Company";
          const position = job.position || "Unknown Position";
          const jdLink = (job.jd_link || "").trim();
          const salaryRange = job.salary_range || "";
          const location = job.location || "";
          const matchScore = job.match_score || 0;
          const matchReason = `[Score: ${matchScore}/100] ${job.match_reason || ""}`;

          const matchKey = `${company} | ${position}`.replace(/\s+/g, ' ').trim();
          const normalizedLink = jdLink.toLowerCase();

          // Deduplication: Check if we have already tracked this Match Key or URL in either sheet
          if (existing.keys.has(matchKey) || (normalizedLink && existing.links.has(normalizedLink))) {
            Logger.log(`Skipping duplicate (already exists in Tracker or Matches): ${company} - ${position}`);
            continue;
          }

          const today = new Date();
          const formattedDate = Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyy-MM-dd");
          const emailLink = `https://mail.google.com/mail/u/0/#all/${threadId}`;

          // Match headers order: Thread ID, Match Key, Date, Company, Position, Status, Modified Date, Email Link, JD Link, Sender, Source, Location, Next Step Date, Salary Range, Notes
          const rowData = [
            threadId,
            matchKey,
            formattedDate,
            company,
            position,
            "Matched",          // Status
            formattedDate,      // Modified Date
            emailLink,
            jdLink,
            sender,
            source,
            location,
            "",                 // Next Step Date
            salaryRange,
            matchReason         // Notes
          ];

          matchesSheet.appendRow(rowData);

          // Update temp sets to prevent duplicates inside the current batch run
          existing.keys.add(matchKey);
          if (normalizedLink) existing.links.add(normalizedLink);
          newJobsAdded++;
        }
      }
    }
  }

  Logger.log(`Job processing finished. Added ${newJobsAdded} matching jobs to the tab "${MATCHES_SHEET_NAME}".`);
}




/**
 * Ensures the target sheet exists; creates it and copies headers if missing
 */
function getOrCreateMatchesSheet(ss, trackerSheet) {
  let matchesSheet = ss.getSheetByName(MATCHES_SHEET_NAME);
  if (!matchesSheet) {
    matchesSheet = ss.insertSheet(MATCHES_SHEET_NAME);
    const headers = trackerSheet.getRange(1, 1, 1, trackerSheet.getLastColumn()).getValues()[0];
    matchesSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    Logger.log(`Created new tab "${MATCHES_SHEET_NAME}" with matching headers.`);
  }
  return matchesSheet;
}

/**
 * Pulls existing Job Keys and JD Links from both Tracker and Matches tabs
 */
function buildDeduplicationSets(trackerSheet, matchesSheet, matchKeyIdx, jdLinkIdx) {
  const existingKeys = new Set();
  const existingLinks = new Set();

  addEntriesFromSheet(trackerSheet, matchKeyIdx, jdLinkIdx, existingKeys, existingLinks);
  addEntriesFromSheet(matchesSheet, matchKeyIdx, jdLinkIdx, existingKeys, existingLinks);

  return { keys: existingKeys, links: existingLinks };
}

/**
 * Helper to parse a single sheet and add values to the sets
 */
function addEntriesFromSheet(sheet, matchKeyIdx, jdLinkIdx, keysSet, linksSet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  for (let i = 0; i < data.length; i++) {
    const key = data[i][matchKeyIdx];
    const link = data[i][jdLinkIdx];
    if (key) keysSet.add(key.toString().trim());
    if (link) linksSet.add(link.toString().trim().toLowerCase());
  }
}


/**
 * Gets plain text of the resume from Google Docs using read-only Drive API export
 * This entirely avoids requesting edit permissions for Google Documents.
 */
function getResumeText(docUrl) {
  const match = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error("Invalid Google Doc URL format.");
  }
  const docId = match[1];
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

  const options = {
    method: "get",
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(exportUrl, options);
  if (response.getResponseCode() !== 200) {
    throw new Error(`Failed to retrieve resume text. HTTP Status: ${response.getResponseCode()}`);
  }
  return response.getContentText();
}


