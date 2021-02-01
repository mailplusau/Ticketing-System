/**
 * Module Description
 * 
 * NSVersion    Date                Author         
 * 1.00         2021-24-01 12:47:00 Ravija Maheshwari
 *
 * Description: A scheduled script to send out email reminders at regular intervals for open, customer number associated tickets
 * 
 * @Last Modified by: Ravija Maheshwari
 * @Last Modified time: 2021-02-01
 */

var ctx = nlapiGetContext();
var index_in_callback = 0;
var userId = ctx.getUser();

//Change to prod link
var url = "https://1048144-sb3.app.netsuite.com/app/site/hosting/scriptlet.nl?script=974&deploy=1&compid=1048144_SB3";

if (nlapiGetContext().getEnvironment() == "SANDBOX") {
    var url = "https://1048144-sb3.app.netsuite.com/app/site/hosting/scriptlet.nl?script=974&deploy=1&compid=1048144_SB3";
}

function sendEmail(){
    var main_index = parseInt(ctx.getSetting('SCRIPT', 'custscript_main_index'));
    if(isNullorEmpty(main_index) || isNaN(main_index)) main_index = 0;
    var today = new Date(); 

    //Adding 19 hours to PST will give Australia/ Sydney timezone
    today.setHours(today.getHours() + 19);  
    var currentHours = today.getHours();

    if(currentHours < 9 || currentHours > 16){
        //Current time is not between 9am - 5pm, early return
        nlapiLogExecution('DEBUG', 'Early returning' , currentHours);
        return false;
    }

    // Search for all open, customer associated tickets
    var customerAssociatedTickets = nlapiLoadSearch('customrecord_mp_ticket','customsearch_open_customer_tickets').runSearch();
    var customerAssociatedTicketsResult = customerAssociatedTickets.getResults(main_index, main_index + 1000);

    customerAssociatedTicketsResult.forEach(function(ticketResult, index) {
        index_in_callback = index;

        // If the limit of governance units is almost reached, 
        // or if the last element of the customerAssociatedTicketsResult is reached,
        // the script is rescheduled and the results will be iterated from this element.
        var usage_loopstart_cust = ctx.getRemainingUsage();
        if (usage_loopstart_cust < 200 || index == 999) {
            nlapiLogExecution('DEBUG', 'usage_loopstart_cust', usage_loopstart_cust);
            nlapiLogExecution('DEBUG', 'index', index);
            nlapiLogExecution('DEBUG', 'main_index + index', main_index + index);

            var params = {
                custscript_main_index: main_index + index
            };

            reschedule = nlapiScheduleScript(ctx.getScriptId(), ctx.getDeploymentId(), params)
            nlapiLogExecution('AUDIT', 'Reschedule Return', reschedule);
            if (reschedule == false) {
                return false;
            }
        } else {
            var noUpdateEmailTime = nlapiStringToDate(ticketResult.getValue('custrecord_no_update_email_time'));
            var lastEmailReminderSentTime = nlapiStringToDate(ticketResult.getValue('custrecord_last_reminder_email_time'));
            var createdTime = nlapiStringToDate(ticketResult.getValue('created'));

            if(isNullorEmpty(noUpdateEmailTime)){
                // 12 hours since customer ticket was opened
                var todayVsCreated = compareDates(today, createdTime);
                var createdTimeHours = getNumberHours(ticketResult.getValue('created'));
                if ( (todayVsCreated == 1) || (todayVsCreated == 0 && Math.abs(createdTimeHours - today.getHours()) >= 12) ) {
                    var ticketRecord  = nlapiLoadRecord('customrecord_mp_ticket', ticketResult.getId());

                    nlapiLogExecution('DEBUG', 'Sending 12 hr reminder email', ticketResult.getId());
                    var selector_number = ticketRecord.getFieldValue('altname');
                    var selector_type = "customer_issue";
                    sendEmailReminder(ticketResult.getId(), selector_number, selector_type, ['ankith.ravindran@mailplus.com.au', "gabrielle.bathman@mailplus.com.au"]);

                    var now = new Date();  
                    ticketRecord.setFieldValue('custrecord_no_update_email_time', now);
                    nlapiSubmitRecord(ticketRecord);
                }
            }

            if(isNullorEmpty(lastEmailReminderSentTime)) {
                //No email sent yet
                var todayVsCreated = compareDates(today, createdTime);
                var createdTimeHours = getNumberHours(ticketResult.getValue('created'));
                // nlapiLogExecution('DEBUG', 'todayVsCreated', todayVsCreated);
                if ( (todayVsCreated == 1) || (todayVsCreated == 0 && Math.abs(createdTimeHours - today.getHours()) >= 2) ) {
                    //Update lastEmailSent time on ticket record. Using a new Date() object because Netsuite automatiically converts dates into Sydney timezone before storing into fields
                    var ticketRecord  = nlapiLoadRecord('customrecord_mp_ticket', ticketResult.getId());

                    //Send first reminder email
                    nlapiLogExecution('DEBUG', 'Sending email todayVsCreated', '');
                    var selector_number = ticketRecord.getFieldValue('altname');
                    var selector_type = "customer_issue";
                    sendEmailReminder(ticketResult.getId(), selector_number, selector_type, ["gabrielle.bathman@mailplus.com.au"]);

                    var now = new Date();  
                    ticketRecord.setFieldValue('custrecord_last_reminder_email_time', now);
                    nlapiSubmitRecord(ticketRecord);
                }
            }else{
                var todayVsLastemail = compareDates(today, lastEmailReminderSentTime);
                var lastEmailReminderSentTimeHours = getNumberHours(ticketResult.getValue('custrecord_last_reminder_email_time'));
                // nlapiLogExecution('DEBUG', 'lastEmailReminderSentTime', lastEmailReminderSentTime)
                // nlapiLogExecution('DEBUG', 'todayVsLastEmail', todayVsLastemail);
                // nlapiLogExecution('DEBUG', 'Today Hours', today.getHours());
                // nlapiLogExecution('DEBUG', 'lastEmailRemidnerSent  Hours', lastEmailReminderSentTimeHours);
                
                if( (todayVsLastemail == 1) ||( todayVsLastemail == 0 && Math.abs(today.getHours() - lastEmailReminderSentTimeHours) >= 2)){
                    var ticketRecord  = nlapiLoadRecord('customrecord_mp_ticket', ticketResult.getId());

                    //2 hours passed since last reminder email. Resend email
                    nlapiLogExecution('DEBUG', 'Sending email todayVsLastEmail', '');
                    var selector_number = ticketRecord.getFieldValue('altname');
                    var selector_type = "customer_issue";
                    sendEmailReminder(ticketResult.getId(), selector_number, selector_type, ["gabrielle.bathman@mailplus.com.au"]);

                    //Update lastEmailSent time on ticket record.  Using a new Date() object because Netsuite automatiically converts dates into Sydney timezone before storing into fields
                    var now = new Date(); 
                    ticketRecord.setFieldValue('custrecord_last_reminder_email_time', now);
                    nlapiSubmitRecord(ticketRecord);
                }
            }
        }
    });

    var will_reschedule = (index_in_callback < 999) ? false : true;
    if (will_reschedule) {
        // If the script will be rescheduled, we look for the element 999 of the loop to see if it is empty or not.
        var nextCustomerTicketsResult = customerAssociatedTickets.getResults(main_index + index_in_callback, main_index + index_in_callback + 1);
    } else {
        // If the script will not be rescheduled, we make sure we didn't miss any results in the search.
        var nextCustomerTicketsResult = customerAssociatedTickets.getResults(main_index + index_in_callback + 1, main_index + index_in_callback + 2);
    }
}

function sendEmailReminder(ticket_id, selector_number, selector_type, contactEmails){
    var custparam_params = new Object();
    custparam_params['ticket_id'] = parseInt(ticket_id);
    custparam_params['selector_number'] = selector_number;
    custparam_params['selector_type'] = selector_type;

    var ticket_url = url + "&custparam_params=" + JSON.stringify(custparam_params);

    nlapiLogExecution('DEBUG', 'Sending Email', ticket_id);
    // var contactEmails = ['ravija.maheshwari@mailplus.com.au']; //Ankith.Ravindran@mailplus.com.au , gabrielle.bathman@mailplus.com.au, raine.giderson@mailplus.com.au
    var subject = 'Reminder - Customer Associated Ticket';
    var emailHtml = '<a href=" ' + ticket_url + ' ">Customer Ticket - '+ ticket_id +'</a>';

    nlapiSendEmail(112209, contactEmails, subject, emailHtml); //112209 is Mailplus team
}

/**
 * Function to compare to Netsuite Dates
 * Returns 1 if date1 occurs before date2 (only considering the year, month and date)
 * Returns -1 if date2 occurs before date1
 * Returns 0 if both the dates are on the same day
 * @param {*} date1 
 * @param {*} date2 
 */
function compareDates(date1, date2){
    if(date1.getYear() > date2.getYear()){
        return 1;
    }else if(date2.getYear() < date1.getYear()){
        return -1;
    }else{
        //Years are equal
        if(date1.getMonth() > date2.getMonth()){
            return 1;
        }else if(date2.getMonth() < date1.getMonth()){
            return -1;
        }else {
            if(date1.getDate() > date2.getDate()){
                return 1;
            }else if(date2.getDate() < date1.getDate()){
                return -1;
            }else{
                return 0;
            }
        }
    }
}

/**
 * 
 * @param {*} date "1/2/2021 4:24:58 PM"
 */
function getNumberHours(date){
    var parts = date.split(' ');
    var time = parts[1].split(':');
    var hh = parseInt(time[0]);
    var ampm = parts[2];

    var hours = 0;

    switch(ampm){
        case "AM":
            if(hh == 12) {
                hours = 0;
            }else{
                hours = hh;
            }
            break;
        case "PM":
            if(hh < 12) {
                hours = hh + 12;
            }
            break;
    }
    return hours;
}

/**
 * Format a date object to the string 'dd/mm/yyyy hh:mm [am/pm]'
 * @param   {Date}      date
 * @returns {String}    date_string
 */
function formatDate(date) {

    function addZero(number) {
        if (number < 10) {
            return '0' + number.toString();
        } else {
            return number.toString();
        }
    }

    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var hours = date.getHours();
    if (hours < 12) {
        var period = 'am';
        if (hours == 0) {
            hours = '12';
        }
    } else {
        var period = 'pm';
        if (hours > 12) {
            hours -= 12;
        }
    }
    var minutes = date.getMinutes();

    day = addZero(day);
    month = addZero(month);
    hours = addZero(hours);
    minutes = addZero(minutes);

    return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ' ' + period;
}