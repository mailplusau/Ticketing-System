/**
 * Module Description
 * 
 * NSVersion    Date                Author         
 * 1.00         2021-24-01 12:47:00 Ravija Maheshwari
 *
 * Description: A scheduled script to send out email reminders at regular intervals for open, customer number associated tickets. 
 * This script runs on weekdays, from 9-5 pm only
 * 
 * @Last Modified by: Ravija Maheshwari
 * @Last Modified time:  2021-02-18 20:00
 */

var ctx = nlapiGetContext();
var index_in_callback = 0;
var userId = ctx.getUser();


var url = "https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=974&deploy=1&compid=1048144&";

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

    // if(currentHours < 9 || currentHours > 16){
    //     //Current time is not between 9am - 5pm, early return
    //     nlapiLogExecution('DEBUG', 'Early returning' , currentHours);
    //     return false;
    // }

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
            //No update since past 12 hours case
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
                    var email_type = "no-update";
                    sendEmailReminder(ticketResult.getId(), selector_number, selector_type, email_type);

                    var now = new Date();  
                    ticketRecord.setFieldValue('custrecord_no_update_email_time', now);
                    nlapiSubmitRecord(ticketRecord);
                }
            }

            if(isNullorEmpty(lastEmailReminderSentTime)) {
                //No reminder email sent yet
                var todayVsCreated = compareDates(today, createdTime);
                var createdTimeHours = getNumberHours(ticketResult.getValue('created'));
    
                if ( (todayVsCreated == 1) || (todayVsCreated == 0 && Math.abs(createdTimeHours - today.getHours()) >= 2) ) {
                    //Update lastEmailSent time on ticket record. Using a new Date() object because Netsuite automatiically converts dates into Sydney timezone before storing into fields
                    var ticketRecord  = nlapiLoadRecord('customrecord_mp_ticket', ticketResult.getId());

                    //Send first reminder email
                    nlapiLogExecution('DEBUG', 'Sending email todayVsCreated', '');
                    var selector_number = ticketRecord.getFieldValue('altname');
                    var selector_type = "customer_issue";
                    var email_type = "no-reminder";
                    sendEmailReminder(ticketResult.getId(), selector_number, selector_type, email_type);

                    var now = new Date();  
                    ticketRecord.setFieldValue('custrecord_last_reminder_email_time', now);
                    nlapiSubmitRecord(ticketRecord);
                }
            }else{
                var todayVsLastemail = compareDates(today, lastEmailReminderSentTime);
                var lastEmailReminderSentTimeHours = getNumberHours(ticketResult.getValue('custrecord_last_reminder_email_time'));
                
                if( (todayVsLastemail == 1) ||( todayVsLastemail == 0 && Math.abs(today.getHours() - lastEmailReminderSentTimeHours) >= 2)){
                    var ticketRecord  = nlapiLoadRecord('customrecord_mp_ticket', ticketResult.getId());

                    //2 hours passed since last reminder email. Resend email
                    nlapiLogExecution('DEBUG', 'Sending email todayVsLastEmail', '');
                    var selector_number = ticketRecord.getFieldValue('altname');
                    var selector_type = "customer_issue";
                    var email_type = "no-reminder";
                    sendEmailReminder(ticketResult.getId(), selector_number, selector_type, email_type);

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

/**
 * Function to send the reminder email to the owner email ids.
 * Since this is a customer based ticket, the owner will be Gab.
 * @param {*} ticket_id 
 * @param {*} selector_number 
 * @param {*} selector_type 
 */
function sendEmailReminder(ticket_id, selector_number, selector_type, emailType){

    // Load up ticket record
    var ticket_record = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
    var owner_ids = ticket_record.getFieldValue('custrecord_owner').replace(/\u200B/g, ' ');
    owner_ids = ticket_record.getFieldValue('custrecord_owner').split(' ');

    //Bug fix required - for multiple owners
    var send_to = [];

    // Get owner emails ids 
    for(var i = 0; i < owner_ids.length; i++){
        nlapiLogExecution('DEBUG', 'Current owner', owner_ids[i]);
        var active_employee_search = nlapiLoadSearch('employee', 'customsearch_active_employees');
        var new_filter = [];
        new_filter[new_filter.length] = new nlobjSearchFilter('internalid', null, 'anyof', parseInt(owner_ids[i]));
        active_employee_search.addFilters(new_filter);
        var employee = active_employee_search.runSearch().getResults(0,1)[0];
        nlapiLogExecution('DEBUG', 'Employee[i]', employee);
        if(!isNullorEmpty(employee)) {
            send_to.push(employee.getValue('email'));
        }
    }

    nlapiLogExecution('DEBUG', 'send_to', send_to);
    nlapiLogExecution('DEBUG', 'Sending Email', ticket_id);

    var custparam_params = new Object();
    custparam_params['ticket_id'] = parseInt(ticket_id);
    custparam_params['selector_number'] = selector_number;
    custparam_params['selector_type'] = selector_type;

    //Edit ticket page URL
    var ticket_url = url + "&custparam_params=" + encodeURIComponent(JSON.stringify(custparam_params));

    var subject;
    var emailHtml = '<a href="' + ticket_url + ' ">Open</a> Customer Ticket - MPSD'+ ticket_id +'<br>';
    // emailHtml += 'send_to '+ send_to  +' <br>';

    if(emailType == "no-reminder"){
        subject = 'Reminder - OPEN Customer Associated Ticket';  
        emailHtml += 'Next reminder time: '+ getNextReminderTime() +' <br>';
    }else{
        //emailType == "no-update"
        subject = '12 hour Reminder - OPEN Customer Associated Ticket'; 
    }
   
    nlapiLogExecution('DEBUG', 'Next reminder time', getNextReminderTime());

    nlapiSendEmail(112209, send_to, subject, emailHtml, "ravija.maheshwari@mailplus.com.au"); //112209 is Mailplus team
}

/**
 * Function to get the next email reminder time.
 * Adds +2 hours to the current date.
 */
function getNextReminderTime(){
    var today = new Date(); 

    //Adding 19 hours to PST will give Australia/ Sydney timezone
    today.setHours(today.getHours() + 19);  
    var currentHours = today.getHours();
    nlapiLogExecution('DEBUG', 'currentHours + 2', currentHours + 2);
    if(currentHours + 2 > 16 ){
        //Current hours + 2 hours is past 5. next reminder will be sent the next day at 9 am
        today.setDate(today.getDate() + 1);
        today.setHours(9);
        today.setMinutes(0);
        today.setSeconds(0);
    }
    else if(currentHours  + 2 < 9){
        //Current hours + 2 hours is before 9 am. Edge case but this is unlikely to happen since script does not run outside 9-5
        today.setHours(9);
        today.setMinutes(0);
        today.setSeconds(0);
    }
    else{
        // Set next reminder time to today + 2 hours
        today.setHours(today.getHours() + 2);
    }

    return today;
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