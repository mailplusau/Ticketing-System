/**
 * Module Description
 * 
 * NSVersion    Date                Author         
 * 1.00         2020-06-03 10:47:00 Raphael
 *
 * Description: A ticketing system for the Customer Service.
 * 
 * @Last Modified by:   raphaelchalicarnemailplus
 * @Last Modified time: 2020-06-18 16:18:00
 *
 */

var baseURL = 'https://1048144.app.netsuite.com';
if (nlapiGetContext().getEnvironment() == "SANDBOX") {
    baseURL = 'https://1048144-sb3.app.netsuite.com';
}

function pageInit() {
    // The inline html of the <table> tag is not correctly displayed inside div.col-xs-12.contacts_div when added with Suitelet.
    // Hence, the html code is added using jQuery when the page loads.
    var inline_html_contact_table = '<table cellpadding="15" id="contacts" class="table table-responsive table-striped contacts tablesorter" cellspacing="0" style="width: 100%;border: 0"><thead style="color: white;background-color: #607799;"><tr><th style="vertical-align: middle;text-align: center;" id="col_name"><b>NAME</b></th><th style="vertical-align: middle;text-align: center;" id="col_phone"><b>PHONE</b></th><th style="vertical-align: middle;text-align: center;" id="col_email"><b>EMAIL</b></th><th style="vertical-align: middle;text-align: center;" id="col_role"><b>ROLE</b></th></tr></thead><tbody></tbody></table>';
    $('div.col-xs-12.contacts_div').html(inline_html_contact_table);

    var barcode_number = nlapiGetFieldValue('custpage_barcode_number');
    var ticket_id = nlapiGetFieldValue('custpage_ticket_id');

    if (!isNullorEmpty(barcode_number)) {
        console.log('!isNullorEmpty(barcode_number) : ', !isNullorEmpty(barcode_number));
        // If we updated the contacts, we have the parameter 'custpage_barcode_number' and no parameter for 'custpage_ticket_id'.
        if (isNullorEmpty(ticket_id)) {
            console.log('isNullorEmpty(ticket_id) : ', isNullorEmpty(ticket_id));
            $('#barcode_value').val(barcode_number);
            displayCustomerInfo();
            // If we come from the edit_ticket page, we have the parameters 'custpage_barcode_number' and' custpage_ticket_id'.
        } else {
            console.log('isNullorEmpty(ticket_id) : ', isNullorEmpty(ticket_id));
            createContactsRows();
            // If the ticket status is not "In Progress" or "Closed", the acknoledgement template shall be selected.
            var status_value = nlapiGetFieldValue('custpage_ticket_status_value');
            if (status_value != 2 && status_value != 3) {
                $('#template option:selected').attr('selected', false);
                $('#template option[value="66"]').attr('selected', true); // Select the acknoledgement template
                var template_id = $('#template option:selected').val();
                console.log('template_id in pageInit : ', template_id);
                loadTemplate();
            }
            updateDatatable();
        }
    }

    $('#barcode_value').blur(function () { displayCustomerInfo() });

    $('#reviewcontacts').click(function () { addEditContact() });

    $('#template').blur(function () { loadTemplate() });

    $('#send_email').click(function () { sendEmail() });

    $('#close_ticket').click(function () { closeTicket() });

    $('#reopen_ticket').click(function () { reopenTicket() });
}

var ticketsDataSet = [];
$(document).ready(function () {
    $('#email_body').summernote();

    $('#tickets-preview').DataTable({
        data: ticketsDataSet,
        columns: [
            { title: "ID" },
            { title: "Date created" },
            { title: "Date closed" },
            { title: "Barcode Number" },
            { title: "Status" },
            { title: "Comment" }
        ]
    });
});

/**
 * Loads the Customer Product Stock record ID, the customer ID and the franchisee ID
 * from the filled fields.
 * Creates a ticket record with the informations linked to the barcode.
 * @returns {Boolean} Whether the function has completed correctly.
 */
function saveRecord() {
    var barcode_issue = nlapiGetFieldValue('custpage_barcode_issue');

    // Check that a TOLL Issue has been selected.
    var toll_issues_length = $('#toll_issues option:selected').length;
    if (toll_issues_length == 0) {
        showAlert('Please select a TOLL Issue<br>');
        return false;
    }

    if (barcode_issue == 'T') {
        // There is an issue with the barcode
        // The IT service should be contacted.
        if (validateIssueFields()) {
            var barcode_number = $('#barcode_value').val();
            var customer_name = $('#customer_name').val();
            var comment = $('#comment').val();
            var date = new Date;

            var email_subject = 'MP Ticket issue - ' + barcode_number;
            var email_body = '';
            email_body += 'Environment : ' + nlapiGetContext().getEnvironment() + '\n';
            email_body += 'Date & Time : ' + formatDate(date) + '\n';
            email_body += 'Barcode Number : ' + barcode_number + '\n';
            email_body += 'Customer Name : ' + customer_name + '\n';

            email_body += 'TOLL Issues : ';
            $('#toll_issues option:selected').each(function () {
                email_body += $(this).text() + '\n';
            });

            email_body += 'MP Issues : ';
            $('#mp_issues option:selected').each(function () {
                email_body += $(this).text() + '\n';
            });

            email_body += 'Comment : ' + comment;
            /*
            var to = ['raphael.chalicarne@mailplus.com.au'] //TO email addresses
            var cc = [] //CC email addresses
            */
            var to = ['Ankith.Ravindran@mailplus.com.au', 'raine.giderson@mailplus.com.au'] //TO email addresses
            var cc = [] //CC email addresses
            nlapiSendEmail(112209, to, email_subject, email_body, cc) // 112209 is from MailPlus Team
        } else {
            return false;
        }
    }

    var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
    if (isNullorEmpty(ticket_id)) {
        var ticketRecord = nlapiCreateRecord('customrecord_mp_ticket');
    } else {
        ticket_id = parseInt(ticket_id);
        try {
            var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
        } catch (error) {
            if (error instanceof nlobjError) {
                if (error.getCode() == "SSS_MISSING_REQD_ARGUMENT") {
                    console.log('Error to load the ticket record with ticket_id : ' + ticket_id);
                }
            }
        }
    }
    var barcode_number = $('#barcode_value').val();
    nlapiSetFieldValue('custpage_barcode_number', barcode_number);
    var barcode_id = nlapiGetFieldValue('custpage_barcode_id');

    ticketRecord.setFieldValue('altname', barcode_number);
    ticketRecord.setFieldValue('custrecord_barcode_number', barcode_id);
    ticketRecord.setFieldValue('custrecord_ticket_status', '1');

    ticketRecord = updateIssues(ticketRecord);

    // Save Comment
    var comment = $('#comment').val();
    ticketRecord.setFieldValue('custrecord_comment', comment);
    var ticket_id = nlapiSubmitRecord(ticketRecord, true);
    nlapiSetFieldValue('custpage_ticket_id', ticket_id);

    if (!isNullorEmpty(barcode_id)) {
        try {
            var barcodeRecord = nlapiLoadRecord('customrecord_customer_product_stock', barcode_id);
            barcodeRecord.setFieldValue('custrecord_mp_ticket', ticket_id);
            barcodeRecord.setFieldValues('custrecord_cust_prod_stock_toll_issues', list_toll_issues);
            nlapiSubmitRecord(barcodeRecord, true);
        } catch (error) {
            if (error instanceof nlobjError) {
                if (error.getCode() == "SSS_MISSING_REQD_ARGUMENT") {
                    console.log('Error to load the barcode record with barcode_id : ' + barcode_id);
                }
            }
        }
    }

    // Send acknoledgement email
    if (isMpexContact()) { // If the MPEX Contact exists, it is automatically selected
        $('#template option:selected').attr('selected', false);
        $('#template option[value="66"]').attr('selected', true); // Select the acknoledgement template
        loadTemplate();
        console.log('selected email : ', $('#send_to option:selected').data("email"));
        sendEmail();
    } else {
        // Redirect and load ack template
        console.log('Email not sent');
    }
    return true;
}

/**
 * Triggered when a customer calls for an issue with a barcode that is not his.
 * Reorganize the shown sections.
 */
function onIncorrectAllocation() {
    nlapiSetFieldValue('custpage_barcode_issue', 'T');
    $('#submitter').val('Contact IT');
    // Hide the "Incorrect Allocation" button
    $('#tbl_custpage_incorrect_allocation').closest('td').hide();
    $('#tbl_custpage_incorrect_allocation').closest('td').prev().hide();

    // Hide the contacts fields and contact details sections
    $('.daytodaycontact_section').addClass('hide');
    $('.zee_main_contact_section').addClass('hide');
    $('.mpex_contact_section').addClass('hide');
    $('.contacts_section').addClass('hide');
    $('.reviewcontacts_section').addClass('hide');
    // Hide the send email section
    $('#send_email_container').addClass('hide');

    // Show that the Issue Customer Name, the MP Issue and the Comment are mandatory
    $('.mandatory').removeClass('hide');

    // Show the "MP Issues" field
    $('.mp_issues_section').removeClass('hide');

    // Hide the tickets datatable
    $('.tickets_datatable_section').addClass('hide');
    $('#tickets-preview_wrapper').addClass('hide');
}

/**
 * If the barcode number validation raises an error, the fields are cleared.
 * The informations linked to the previous barcode are deleted. 
 */
function clearFields() {
    $('#customer_name').val('');

    // Unselect all TOLL Issues fields
    $('#toll_issues option:selected').each(function () {
        $(this).attr('selected', false);
    });

    $('#comment').val('');
}

/**
 * Called when "Contact IT" is clicked.
 * Check that in case of an issue with a barcode, the mandatory fields are filled.
 */
function validateIssueFields() {
    var alertMessage = '';
    var return_value = true;

    var toll_issues_length = $('#toll_issues option:selected').length;
    var mp_issues_length = $('#mp_issues option:selected').length;
    var comment = $('#comment').val();

    if (toll_issues_length == 0) {
        alertMessage += 'Please select a TOLL Issue<br>';
        return_value = false;
    }
    if (mp_issues_length == 0) {
        alertMessage += 'Please select an MP Issue<br>';
        return_value = false;
    }
    if (isNullorEmpty(comment)) {
        alertMessage += 'Please type a comment<br>';
        return_value = false;
    }

    if (return_value == false) {
        showAlert(alertMessage);
    } else {
        $('#alert').parent().hide();
    }
    return return_value;
}

/**
 * - Check that all the mandatory barcode fields have been filled, and that the customer record exists.
 * If not, calls the showAlert function.
 * - If the barcode record exists but there is an MP Ticket issue with the record,
 * the onIncorrectAllocation function is called.
 * @return  {Boolean}    Whether or not all the input has been filled.
 */
function validate() {
    var barcode_number = $('#barcode_value').val().trim().toUpperCase();
    $('#barcode_value').val(barcode_number);
    var alertMessage = '';
    var return_value = true;
    var keep_barcode_number = false;

    if (isNullorEmpty(barcode_number)) {
        alertMessage += 'Please enter the Barcode Number<br>';
        return_value = false;
    }
    if ((return_value == true) && (!checkBarcodeFormat(barcode_number))) {
        alertMessage += 'The barcode number format is incorrect<br>';
        return_value = false;
    }

    // If a ticket already exists for the barcode number, the user is redirected to the "Edit Ticket" page.
    if ((return_value == true) && (ticketLinkedToBarcode(barcode_number))) {
        var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
        var params = {
            ticket_id: parseInt(ticket_id),
            barcode_number: barcode_number
        };
        params = JSON.stringify(params);
        var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket') + '&custparam_params=' + params;
        window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
    }

    var activeBarcodeResults = getBarcodeRecords(barcode_number)
    if ((return_value == true) && (isNullorEmpty(activeBarcodeResults))) {
        alertMessage += 'No active barcode record exists for the barcode number ' + barcode_number + '<br>';

        $('#mp_issues option[value="2"]').prop('selected', true);
        keep_barcode_number = true;
        clearFields();
        nlapiSetFieldValue('custpage_barcode_id', '');
        onIncorrectAllocation();
        return_value = false;
    }

    if ((return_value == true) && (!customerLinkedToBarcode(activeBarcodeResults))) {
        alertMessage += 'No customer is associated to the barcode ' + barcode_number + '<br>';

        $('#mp_issues option[value="1"]').prop('selected', true);
        keep_barcode_number = true;
        clearFields();
        onIncorrectAllocation();
        return_value = false;
    }

    if ((return_value == true) && (!zeeLinkedToBarcode(activeBarcodeResults))) {
        alertMessage += 'No franchisee is associated to the barcode ' + barcode_number + '<br>';

        $('#mp_issues option[value="3"]').prop('selected', true);
        keep_barcode_number = true;
        clearFields();
        onIncorrectAllocation();
        return_value = false;
    }

    if (return_value == false) {
        if (!keep_barcode_number) {
            var last_correct_barcode_number = nlapiGetFieldValue('custpage_barcode_number');
            $('#barcode_value').val(last_correct_barcode_number);
        }
        showAlert(alertMessage);
    } else {
        $('#alert').parent().hide();
    }

    return return_value;
}

/**
 * Displays error messages in the alert box on top of the page.
 * @param   {String}    message The message to be displayed.
 */
function showAlert(message) {
    $('#alert').html('<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>' + message);
    $('#alert').parent().show();
    $('html, body').animate({ scrollTop: 0 }, 800)
}

/**
 * Verifies that the barcode number starts with 'MPE', 
 * followed by either 'B', 'C', 'D', 'F', 'N' or 'T',
 * and then finishes by 6 digits.
 * @param   {String} barcode_number
 * @returns {Boolean}
 */
function checkBarcodeFormat(barcode_number) {
    var barcodeFormat = /^MPE[BCDFNT]\d{6}$/;
    return barcodeFormat.test(barcode_number);
}

/**
 * Searches for an opened ticket linked to this barcode number.
 * The barcode record might not exist, but the ticket associated to the barcode number can.
 * @param {String} barcode_number
 * @returns {Boolean}
 */
function ticketLinkedToBarcode(barcode_number) {
    var activeTicketFilterExpression = [["name", "is", barcode_number], 'AND', ["isinactive", "is", 'F']];
    var activeTicketsResults = nlapiSearchRecord('customrecord_mp_ticket', null, activeTicketFilterExpression, null);
    if (isNullorEmpty(activeTicketsResults)) {
        return false;
    } else {
        // If an active ticket exists for the barcode number, the ticket_id is saved.
        // The validate function then redirects the user to its "Edit Ticket" page.
        var activeTicketResult = activeTicketsResults[0];
        var ticket_id = activeTicketResult.getId();
        nlapiSetFieldValue('custpage_ticket_id', ticket_id);
        return true;
    }
}

/**
 * Searches for the active barcodes records with the name `barcode_number`.
 * There is normally only one such record.
 * @param   {String}                barcode_number
 * @returns {nlobjSearchResult[]}   An array of nlobjSearchResult objects corresponding to the searched records.
 */
function getBarcodeRecords(barcode_number) {
    var activeBarcodeFilterExpression = [["name", "is", barcode_number], 'AND', ["isinactive", "is", 'F']];
    var activeBarcodeColumns = new Array();
    activeBarcodeColumns[0] = new nlobjSearchColumn('custrecord_cust_prod_stock_customer', null, null);
    activeBarcodeColumns[1] = new nlobjSearchColumn('custrecord_cust_prod_stock_zee', null, null);
    activeBarcodeColumns[2] = new nlobjSearchColumn('custrecord_cust_prod_stock_toll_issues', null, null);
    activeBarcodeColumns[3] = new nlobjSearchColumn('custrecord_mp_ticket', null, null);
    var activeBarcodeResults = nlapiSearchRecord('customrecord_customer_product_stock', null, activeBarcodeFilterExpression, activeBarcodeColumns);

    return activeBarcodeResults;
}

/**
 * Verifies that the barcode record is associated to a customer
 * @param   {nlobjSearchResult[]}   activeBarcodeResults    Result of getBarcodeRecords(barcode_number)
 * @returns {Boolean}
 */
function customerLinkedToBarcode(activeBarcodeResults) {
    var activeBarcodeResult = activeBarcodeResults[0];
    var customer_id = activeBarcodeResult.getValue('custrecord_cust_prod_stock_customer');
    if (isNullorEmpty(customer_id)) {
        return false;
    } else {
        return true;
    }
}

/**
 * Verifies that the barcode record is associated to a franchisee
 * @param   {nlobjSearchResult[]}   activeBarcodeResults    Result of getBarcodeRecords(barcode_number)
 * @returns {Boolean}
 */
function zeeLinkedToBarcode(activeBarcodeResults) {
    var activeBarcodeResult = activeBarcodeResults[0];
    var zee_id = activeBarcodeResult.getValue('custrecord_cust_prod_stock_zee');
    if (isNullorEmpty(zee_id)) {
        return false;
    } else {
        return true;
    }
}

/**
 * Displays the informations linked to a barcode record.
 * @returns {Boolean}   Whether the function worked well or not.
 */
function displayCustomerInfo() {
    if (validate()) {
        var barcode_number = $('#barcode_value').val().trim().toUpperCase();
        nlapiSetFieldValue('custpage_barcode_number', barcode_number);
        var activeBarcodeResults = getBarcodeRecords(barcode_number);
        var activeBarcodeResult = activeBarcodeResults[0];

        var barcode_id = activeBarcodeResult.getId();
        nlapiSetFieldValue('custpage_barcode_id', barcode_id);

        var customer_name = activeBarcodeResult.getText('custrecord_cust_prod_stock_customer');
        var customer_id = activeBarcodeResult.getValue('custrecord_cust_prod_stock_customer');
        nlapiSetFieldValue('custpage_customer_id', customer_id);

        var zee_name = activeBarcodeResult.getText('custrecord_cust_prod_stock_zee');

        $('#customer_name').val(customer_name);
        $('#franchisee_name').val(zee_name);

        // Load customer record
        try {
            var customerRecord = nlapiLoadRecord('customer', customer_id);
            var daytodayphone = customerRecord.getFieldValue('phone');
            var daytodayemail = customerRecord.getFieldValue('custentity_email_service');
            var zee_main_contact_name = customerRecord.getFieldValue('custentity4');
            var zee_main_contact_phone = customerRecord.getFieldValue('custentity1');

            $('#daytodayphone').val(daytodayphone);
            $('#daytodayemail').val(daytodayemail);
            $('#zee_main_contact_name').val(zee_main_contact_name);
            $('#zee_main_contact_phone').val(zee_main_contact_phone);
        } catch (error) {
            if (error instanceof nlobjError) {
                if (error.getCode() == "SSS_MISSING_REQD_ARGUMENT") {
                    console.log('Error to load the customer record with customer_id : ' + customer_id);
                }
            }
        }

        // Contacts details
        createContactsRows();

        // TOLL Issues
        // Unselect all TOLL Issues fields
        $('#toll_issues option:selected').each(function () {
            $(this).attr('selected', false);
        });
        // Select the corresponding TOLL issues
        var toll_issues = activeBarcodeResult.getValue('custrecord_cust_prod_stock_toll_issues');
        if (!isNullorEmpty(toll_issues)) {
            toll_issues = toll_issues.split(',');
            toll_issues.forEach(function (toll_value) {
                $('#toll_issues option[value=' + toll_value + ']').prop('selected', true);
            });
        }

        // Display the tickets linked to the customer in the datatable
        updateDatatable();

        return true;
    }
}

/**
 * Displays the tickets linked to the customer into a datatable.
 * @returns {Boolean}   Whether the function worked well or not.
 */
function updateDatatable() {
    var customer_id = nlapiGetFieldValue('custpage_customer_id');
    var ticketSearchResults = loadTicketsSearch(customer_id);

    $('#result_tickets').empty();
    var ticketsDataSet = [];

    if (isNullorEmpty(ticketSearchResults)) {
        if (isNullorEmpty(customer_id)) {
            $('#info').text('No customer is associated to this ticket.');
            $('#info').parent().show();
            return true;
        } else {
            try {
                var customerRecord = nlapiLoadRecord('customer', customer_id, null);
                var customer_name = customerRecord.getFieldValue('altname');
                $('#info').text('No ticket exists for the customer ' + customer_name);
                $('#info').parent().show();
                return true;
            } catch (error) {
                if (error instanceof nlobjError) {
                    if (error.getCode() == "SSS_MISSING_REQD_ARGUMENT") {
                        console.log('Error to load the customer record with customer_id : ' + customer_id);
                    }
                }
            }
        }
    }

    ticketSearchResults.forEach(function (ticketResult) {

        var ticket_id = ticketResult.getValue('name');
        var date_created = ticketResult.getValue('created');
        var date_closed = ticketResult.getValue('custrecord_date_closed');
        var barcode_name = ticketResult.getText('custrecord_barcode_number');
        var status = ticketResult.getText('custrecord_ticket_status');
        var comment = ticketResult.getValue('custrecord_comment');

        ticketsDataSet.push([ticket_id, date_created, date_closed, barcode_name, status, comment]);

        return true;
    });

    // Update datatable rows.
    var datatable = $('#tickets-preview').dataTable().api();
    datatable.clear();
    datatable.rows.add(ticketsDataSet);
    datatable.draw();

    return true;
}

/**
 * Load the result set of the tickets records linked to the customer.
 * WARNING : This method returns only 1000 results. If we want more results, we need to use a saved search
 * @param   {String}    customer_id
 * @return  {Array}     An array of nlobjSearchResult objects, containing the different ticket records.
 */
function loadTicketsSearch(customer_id) {
    var ticketSearchResults = new Array;

    // If a ticket is opened for a barcode that is not allocated to a customer,
    // there will be no customer_id.
    if (!isNullorEmpty(customer_id)) {
        var filterExpression = new nlobjSearchFilter('custrecord_customer1', null, 'is', customer_id);

        var ticketsColumns = new Array();
        ticketsColumns[0] = new nlobjSearchColumn('name', null, null);
        ticketsColumns[1] = new nlobjSearchColumn('created', null, null);
        ticketsColumns[2] = new nlobjSearchColumn('custrecord_date_closed', null, null);
        ticketsColumns[3] = new nlobjSearchColumn('custrecord_barcode_number', null, null);
        ticketsColumns[4] = new nlobjSearchColumn('custrecord_ticket_status', null, null);
        ticketsColumns[5] = new nlobjSearchColumn('custrecord_comment', null, null);

        ticketSearchResults = nlapiSearchRecord('customrecord_mp_ticket', null, filterExpression, ticketsColumns);
    }
    return ticketSearchResults;
}

/**
 * Triggered by a click on the button 'ADD/EDIT CONTACTS' ('#reviewcontacts')
 * Open the 'ticket_contact' page with the parameters :
 * - Customer ID
 * - Barcode Number
 * - Script ID : 'customscript_sl_open_ticket'
 * - Deployment ID : 'customdeploy_sl_open_ticket'
 */
function addEditContact() {
    var customer_id = nlapiGetFieldValue('custpage_customer_id');
    if (!isNullorEmpty(customer_id)) {
        var barcode_number = nlapiGetFieldValue('custpage_barcode_number');
        var params = {
            custid: parseInt(customer_id),
            barcode_number: barcode_number,
            id: 'customscript_sl_open_ticket',
            deploy: 'customdeploy_sl_open_ticket'
        };
        params = JSON.stringify(params);
        var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_ticket_contact', 'customdeploy_sl_ticket_contact') + '&params=' + params;
        window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
    } else {
        $('#info').parent().hide();
        showAlert('No customer is associated to this ticket.');
    }
}

/**
 * Loads the result set of all the contacts linked to a Customer.
 * @returns {nlobjSearchResultSet}  contactsResultSet
 */
function loadContactsList() {
    var customer_id = nlapiGetFieldValue('custpage_customer_id');
    var contactsResultSet = [];
    // If a ticket is opened for a barcode that is not allocated to a customer,
    // there will be no customer_id.
    if (!isNullorEmpty(customer_id)) {
        var contactsSearch = nlapiLoadSearch('contact', 'customsearch_salesp_contacts');
        var contactsFilterExpression = [['company', 'is', customer_id], 'AND', ['isinactive', 'is', 'F']];
        contactsSearch.setFilterExpression(contactsFilterExpression);
        contactsResultSet = contactsSearch.runSearch();
    }
    return contactsResultSet;
}

/**
 * - Populates the Contacts table by adding contacts details at each row.
 * - If there is a ticket_id (which means we are in edit mode), 
 * adds the contact to the "To" field of the "Send Email" section.
 */
function createContactsRows() {
    var contactsResultSet = loadContactsList();

    // Used for the Contacts Table.
    var inline_contacts_table_html = '';

    // Used for the "To" field of the "Send Email" section.
    var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
    var to_option_html = '<option></option>';

    // If a ticket is opened for a barcode that is not allocated to a customer,
    // there will be no contacts.
    if (!isNullorEmpty(contactsResultSet)) {
        contactsResultSet.forEachResult(function (contactResult) {
            var contact_id = contactResult.getValue('internalid');
            var salutation = contactResult.getValue('salutation');
            var first_name = contactResult.getValue('firstname');
            var last_name = contactResult.getValue('lastname');
            var contact_name = salutation + ' ' + first_name + ' ' + last_name;
            var contact_email = contactResult.getValue('email');
            var contact_phone = contactResult.getValue('phone');
            var contact_role_value = contactResult.getValue('contactrole');
            var contact_role_text = contactResult.getText('contactrole');

            inline_contacts_table_html += '<tr class="text-center">';
            inline_contacts_table_html += '<td headers="col_name">' + contact_name + '</td>';
            inline_contacts_table_html += '<td headers="col_phone">' + contact_phone + '</td>';
            inline_contacts_table_html += '<td headers="col_email">' + contact_email + '</td>';
            inline_contacts_table_html += '<td headers="col_role">';
            inline_contacts_table_html += '<span class="role_value" hidden>' + contact_role_value + '</span>';
            inline_contacts_table_html += '<span class="role_text">' + contact_role_text + '</span>';
            inline_contacts_table_html += '</td>';
            inline_contacts_table_html += '</tr>';

            if (contact_role_value == 6) {
                // If a "MPEX Contact" already exist, it is automatically selected.
                to_option_html += '<option value="' + contact_id + '" data-firstname="' + first_name + '" data-email="' + contact_email + '" selected>' + first_name + ' ' + last_name + ' - ' + contact_email + '</option>';
            } else {
                // Otherwise, the empty option is selected.
                to_option_html += '<option value="' + contact_id + '" data-firstname="' + first_name + '" data-email="' + contact_email + '">' + first_name + ' ' + last_name + ' - ' + contact_email + '</option>';
            }

            return true;
        });
    }

    $('#contacts tbody').html(inline_contacts_table_html);
    $('#send_to').html(to_option_html);
}

/**
 * Iterates through the contacts of the customer.
 * @returns {Boolean} Whether an MPEX Contact is associated to the current contact.
 */
function isMpexContact() {
    var result_value = false;
    var contactsResultSet = loadContactsList();

    if (!isNullorEmpty(contactsResultSet)) {
        contactsResultSet.forEachResult(function (contactResult) {
            var contact_role_value = contactResult.getValue('contactrole');
            if (contact_role_value == 6) {
                result_value = true;
            }
            return true;
        });
    }
    return result_value;
}

/**
 * Function triggered when the '#template' input field is blurred.
 * Load the subject of the email and the body of the template.
 */
function loadTemplate() {
    var template_id = $('#template option:selected').val();
    console.log('template_id : ', template_id);
    try {
        var templateRecord = nlapiLoadRecord('customrecord_camp_comm_template', template_id);
        var template_subject = templateRecord.getFieldValue('custrecord_camp_comm_subject');
    } catch (error) {
        if (error instanceof nlobjError) {
            if (error.getCode() == "SSS_MISSING_REQD_ARGUMENT") {
                console.log('Error to load the template with template_id : ' + template_id);
            }
        }
    }


    var customer_id = nlapiGetFieldValue('custpage_customer_id');
    var sales_rep = encodeURIComponent(nlapiGetContext().getName());
    var first_name = $('#send_to option:selected').data("firstname");
    var dear = encodeURIComponent(first_name);
    var contact_id = encodeURIComponent($('#send_to').val());
    var userid = encodeURIComponent(nlapiGetContext().getUser());

    var url = 'https://1048144.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=395&deploy=1&compid=1048144&h=6d4293eecb3cb3f4353e&rectype=customer&template=';
    if (nlapiGetContext().getEnvironment() == "SANDBOX") {
        var url = 'https://1048144-sb3.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=395&deploy=1&compid=1048144_SB3&h=9c35dc467fbdfafcfeaa&rectype=customer&template=';
    }
    url += template_id + '&recid=' + customer_id + '&salesrep=' + sales_rep + '&dear=' + dear + '&contactid=' + contact_id + '&userid=' + userid;

    urlCall = nlapiRequestURL(url);
    var emailHtml = urlCall.getBody();
    $('#email_body').summernote('code', emailHtml);

    // Populate Subject field
    var emailSubject = '';
    emailSubject = urlCall.getHeader('Custom-Header-SubjectLine');
    if (isNullorEmpty(emailSubject)) {
        emailSubject = template_subject;
    }
    var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
    ticket_id = parseInt(ticket_id);
    var barcode_number = nlapiGetFieldValue('custpage_barcode_number');
    var subject = 'MailPlus [MPSD' + ticket_id + '] - ' + emailSubject + ' - ' + barcode_number;

    $('#subject').val(subject);
}

/**
 * Check that the fields "To", "Template" and "Subject" are non-empty.
 * @returns {Boolean}
 */
function validateEmailFields() {
    var alertMessage = '';
    var return_value = true;

    var send_to_val = $('#send_to option:selected').val();
    if (isNullorEmpty(send_to_val)) {
        return_value = false;
        alertMessage += 'Please select a recipient.<br>';
    }

    var template_val = $('#template option:selected').val();
    if (isNullorEmpty(template_val)) {
        return_value = false;
        alertMessage += 'Please select a template.<br>';
    } else {
        var subject_val = $('#subject').val();
        if (isNullorEmpty(subject_val)) {
            return_value = false;
            alertMessage += 'Please enter a subject.<br>';
        }
    }

    if (return_value == false) {
        showAlert(alertMessage);
    } else {
        $('#alert').parent().hide();
    }

    return return_value;
}


/**
 * Triggered by a click on the button 'SEND EMAIL' ('#send_email')
 * Send the selected email to the selected contact, and reloads the page.
 */
function sendEmail() {
    if (validateEmailFields()) {
        // Send Email
        /*
        var to = ['raphael.chalicarne@mailplus.com.au'];
        var cc = [];
        */
        var to = [$('#send_to option:selected').data("email")];
        var cc_values = $('#send_cc').val().split(',');
        var cc = [];
        cc_values.forEach(function (email_address) {
            cc.push(email_address.trim());
            return true;
        });
        if (isNullorEmpty(cc)) {
            cc = null;
        }

        var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
        ticket_id = parseInt(ticket_id);
        var barcode_number = nlapiGetFieldValue('custpage_barcode_number');
        var email_subject = $('#subject').val();
        var email_body = $('#email_body').summernote('code');

        nlapiSendEmail(112209, to, email_subject, email_body, cc) // 112209 is from MailPlus Team

        // Set record status to 'In Progress'.
        try {
            var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
            var status_value = ticketRecord.getFieldValue('customrecord_mp_ticket');
            if (isNullorEmpty(status_value) || status_value == 1) {
                ticketRecord.setFieldValue('custrecord_ticket_status', 2);
                nlapiSubmitRecord(ticketRecord, true);
            }
        } catch (error) {
            if (error instanceof nlobjError) {
                if (error.getCode() == "SSS_MISSING_REQD_ARGUMENT") {
                    console.log('Error to Set record status to In Progress with ticket_id : ' + ticket_id);
                }
            }
        }


        // Reload the page
        var params = {
            ticket_id: parseInt(ticket_id),
            barcode_number: barcode_number
        };
        params = JSON.stringify(params);
        var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket') + '&custparam_params=' + params;
        window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
    } else {
        return false;
    }
}

/**
 * Triggered by a click on the button 'CLOSE TICKET' ('#close_ticket')
 * Set the ticket record as inactive.
 * Set the date of closure, and the status as "Closed".
 */
function closeTicket() {
    // Check that there are no selected issues.
    var return_value = true;
    var alertMessage = '';
    var toll_issues_length = $('#toll_issues option:selected').length;
    if (toll_issues_length != 0) {
        alertMessage += 'Please unselect the TOLL Issues<br>';
        return_value = false;
    }
    var mp_issues_length = $('#mp_issues option:selected').length;
    if (mp_issues_length != 0) {
        alertMessage += 'Please unselect the MP Ticket Issues<br>';
        return_value = false;
    }
    if (!return_value) {
        showAlert(alertMessage);
        return return_value;
    }

    if (confirm("Are you sure you want to close this ticket?\n\nThis action cannot be undone.")) {
        var date = new Date;
        var dnow = nlapiDateToString(date, 'datetimetz');

        var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
        ticket_id = parseInt(ticket_id);
        var barcode_number = nlapiGetFieldValue('custpage_barcode_number');
        var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
        ticketRecord.setFieldValue('isinactive', 'T');
        ticketRecord.setFieldValue('custrecord_date_closed', dnow);
        ticketRecord.setFieldValue('custrecord_ticket_status', 3);

        // Save issues and resolved issues
        ticketRecord = updateIssues(ticketRecord);

        nlapiSubmitRecord(ticketRecord, true);

        // Reload the page
        var params = {
            ticket_id: parseInt(ticket_id),
            barcode_number: barcode_number
        };
        params = JSON.stringify(params);
        var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket') + '&custparam_params=' + params;
        window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
    }
}

/**
 * The TOLL Issues and MP Ticket Issues are added to the record.
 * If issues have been deleted from any of these fields, they are saved in the resolved fields.
 * @param   {nlobjRecord} ticketRecord
 * @returns {nlobjRecord} ticketRecord
 */
function updateIssues(ticketRecord) {
    var ticket_id = nlapiGetFieldValue('custpage_ticket_id');

    // Save TOLL Issues
    var list_toll_issues = new Array;
    $('#toll_issues option:selected').each(function () {
        list_toll_issues.push($(this).val());
    });
    // Save resolved TOLL Issues
    if (!isNullorEmpty(ticket_id)) {
        var old_list_toll_issues = ticketRecord.getFieldValues('custrecord_toll_issues');

        if (!isNullorEmpty(old_list_toll_issues)) {
            old_list_toll_issues = Array.from(old_list_toll_issues);

            var list_resolved_toll_issues = ticketRecord.getFieldValues('custrecord_resolved_toll_issues');
            if (isNullorEmpty(list_resolved_toll_issues)) {
                list_resolved_toll_issues = new Array;
            } else {
                list_resolved_toll_issues = Array.from(list_resolved_toll_issues);
            }

            old_list_toll_issues.forEach(function (old_toll_issue) {
                // If a TOLL issue of the old list is not in the new list,
                // it means that the issue was resolved.
                if (list_toll_issues.indexOf(old_toll_issue) == -1) {
                    list_resolved_toll_issues.push(old_toll_issue);
                }
            });
            ticketRecord.setFieldValues('custrecord_resolved_toll_issues', list_resolved_toll_issues);
        }
    }
    ticketRecord.setFieldValues('custrecord_toll_issues', list_toll_issues);

    // Save MP Ticket Issues
    var list_mp_ticket_issues = new Array;
    $('#mp_issues option:selected').each(function () {
        list_mp_ticket_issues.push($(this).val());
    });
    // Save resolved MP Ticket Issues
    if (!isNullorEmpty(ticket_id)) {
        var old_list_mp_ticket_issues = ticketRecord.getFieldValues('custrecord_mp_ticket_issue');

        if (!isNullorEmpty(old_list_mp_ticket_issues)) {
            old_list_mp_ticket_issues = Array.from(old_list_mp_ticket_issues);

            var list_resolved_mp_ticket_issues = ticketRecord.getFieldValues('custrecord_resolved_mp_ticket_issue');
            if (isNullorEmpty(list_resolved_mp_ticket_issues)) {
                list_resolved_mp_ticket_issues = new Array;
            } else {
                list_resolved_mp_ticket_issues = Array.from(list_resolved_mp_ticket_issues);
            }

            old_list_mp_ticket_issues.forEach(function (old_mp_ticket_issue) {
                // If a MP Ticket issue of the old list is not in the new list,
                // it means that the issue was resolved.
                if (list_mp_ticket_issues.indexOf(old_mp_ticket_issue) == -1) {
                    list_resolved_mp_ticket_issues.push(old_mp_ticket_issue);
                }
            });
            ticketRecord.setFieldValues('custrecord_resolved_mp_ticket_issue', list_resolved_mp_ticket_issues);
        }
    }
    ticketRecord.setFieldValues('custrecord_mp_ticket_issue', list_mp_ticket_issues);

    return ticketRecord;
}

/**
 * Triggered by a click on the button 'REOPEN TICKET' ('#reopen_ticket')
 * Set the ticket record as active.
 * Deletes the date of closure, 
 * Set the status as "Open".
 */
function reopenTicket() {
    var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
    ticket_id = parseInt(ticket_id);
    var barcode_number = nlapiGetFieldValue('custpage_barcode_number');
    var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
    ticketRecord.setFieldValue('isinactive', 'F');
    ticketRecord.setFieldValue('custrecord_date_closed', '');
    ticketRecord.setFieldValue('custrecord_ticket_status', 1);
    nlapiSubmitRecord(ticketRecord, true);

    // Reload the page
    var params = {
        ticket_id: parseInt(ticket_id),
        barcode_number: barcode_number
    };
    params = JSON.stringify(params);
    var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket') + '&custparam_params=' + params;
    window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
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