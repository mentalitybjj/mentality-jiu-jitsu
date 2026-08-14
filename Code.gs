/**
 * MENTALITY JIU JITSU — form receiver
 * Receives submissions from the website and appends them to this spreadsheet.
 *
 * SETUP
 *  1. Create a Google Sheet. Extensions -> Apps Script. Paste this file in,
 *     replacing anything already there. Save.
 *  2. Deploy -> New deployment -> type "Web app".
 *       Execute as:      Me
 *       Who has access:  Anyone        <-- must be "Anyone", NOT
 *                                          "Anyone with a Google account".
 *                                          Site visitors are not signed in.
 *  3. Authorise when prompted. Google will warn the app is unverified —
 *     that is expected for your own script. Advanced -> Go to (project).
 *  4. Copy the Web app URL (ends in /exec) and paste it into ENDPOINT
 *     near the bottom of index.html.
 *
 * IMPORTANT: after any edit here, run Deploy -> Manage deployments ->
 * pencil icon -> Version: New version -> Deploy. Saving alone does not
 * update the live URL.
 */

// Optional. Leave "" to email nothing. Multiple addresses: "a@x.com,b@y.com"
var NOTIFY_EMAIL = "";

// Optional. Leave "" to use the spreadsheet this script is bound to.
var SPREADSHEET_ID = "";

var TABS = {
  'trial-booking': {
    name: 'Trial bookings',
    headers: ['Received', 'Program', 'Class', 'Day', 'Time', 'First name',
              'Last name', 'Mobile', 'Email', 'Experience', 'Marketing consent', 'Page']
  },
  'guide-download': {
    name: 'Guide downloads',
    headers: ['Received', 'First name', 'Email', 'Page']
  }
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Serialise appends so two people submitting at once cannot collide.
    lock.waitLock(20000);

    if (!e || !e.postData || !e.postData.contents) {
      return reply({ ok: false, error: 'Empty request' });
    }

    var data = JSON.parse(e.postData.contents);

    // Honeypot: the form has a hidden "company" field no human ever fills in.
    // Bots fill every field. Accept silently so they do not retry.
    if (data.company) return reply({ ok: true });

    var spec = TABS[data.type];
    if (!spec) return reply({ ok: false, error: 'Unknown submission type' });

    var sheet = getSheet(spec);
    var now = new Date();
    var row;

    if (data.type === 'trial-booking') {
      if (!data.firstName || !data.email) {
        return reply({ ok: false, error: 'Missing required fields' });
      }
      row = [now, data.program, data.className, data.classDay, data.classTime,
             data.firstName, data.lastName, asText(data.mobile), data.email,
             data.experience, data.marketingConsent, data.page];
    } else {
      if (!data.email) return reply({ ok: false, error: 'Missing email' });
      row = [now, data.firstName, data.email, data.page];
    }

    sheet.appendRow(row.map(function (v) { return v === undefined ? '' : v; }));
    notify(data);
    return reply({ ok: true });

  } catch (err) {
    // Surface the failure to the site so it shows an error instead of a
    // false "You're booked in".
    return reply({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

/** Lets you confirm the deployment is live by opening the /exec URL. */
function doGet() {
  return reply({ ok: true, status: 'Mentality form receiver is running' });
}

function getSheet(spec) {
  var ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(spec.name);
  if (!sheet) {
    sheet = ss.insertSheet(spec.name);
    sheet.appendRow(spec.headers);
    sheet.getRange(1, 1, 1, spec.headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1)
         .setNumberFormat('yyyy-mm-dd hh:mm');
  }
  return sheet;
}

/** Keeps 04xx numbers from being mangled into 4xx by Sheets. */
function asText(v) {
  return v ? "'" + String(v).trim() : '';
}

function notify(data) {
  if (!NOTIFY_EMAIL) return;
  try {
    var subject, body;
    if (data.type === 'trial-booking') {
      subject = 'New trial booking — ' + data.firstName + ' ' + (data.lastName || '');
      body = [
        'Program:    ' + data.program,
        'Class:      ' + data.className,
        'When:       ' + data.classDay + ', ' + data.classTime,
        '',
        'Name:       ' + data.firstName + ' ' + (data.lastName || ''),
        'Mobile:     ' + data.mobile,
        'Email:      ' + data.email,
        'Experience: ' + data.experience,
        'Marketing:  ' + data.marketingConsent
      ].join('\n');
    } else {
      subject = 'Guide download — ' + data.firstName;
      body = 'Name:  ' + data.firstName + '\nEmail: ' + data.email;
    }
    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  } catch (ignored) {
    // Never let a mail failure lose the row that was already written.
  }
}

function reply(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
