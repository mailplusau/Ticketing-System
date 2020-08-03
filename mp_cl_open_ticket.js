/**
 * Module Description
 * 
 * NSVersion    Date                Author         
 * 3.00         2020-07-06 16:40:00 Raphael
 *
 * Description: A ticketing system for the Customer Service.
 * 
 * @Last Modified by:   raphaelchalicarnemailplus
 * @Last Modified time: 2020-07-13 16:23:00
 *
 */

var baseURL = 'https://1048144.app.netsuite.com';
if (nlapiGetContext().getEnvironment() == "SANDBOX") {
    baseURL = 'https://1048144-sb3.app.netsuite.com';
}

var ctx = nlapiGetContext();
var userRole = parseInt(ctx.getRole());
var userName = ctx.getName();

function pageInit() {
    var selector_number = nlapiGetFieldValue('custpage_selector_number');
    var selector_type = nlapiGetFieldValue('custpage_selector_type');
    var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
    var status_value = nlapiGetFieldValue('custpage_ticket_status_value');

    // The inline html of the <table> tag is not correctly displayed inside div.col-xs-12.contacts_div when added with Suitelet.
    // Hence, the html code is added using jQuery when the page loads.
    var inline_html_contact_table = '<table cellpadding="15" id="contacts" class="table table-responsive table-striped contacts tablesorter" cellspacing="0" style="width: 100%;border: 0"><thead style="color: white;background-color: #607799;"><tr><th style="vertical-align: middle;text-align: center;" id="col_name"><b>NAME</b></th><th style="vertical-align: middle;text-align: center;" id="col_phone"><b>PHONE</b></th><th style="vertical-align: middle;text-align: center;" id="col_email"><b>EMAIL</b></th><th style="vertical-align: middle;text-align: center;" id="col_role"><b>ROLE</b></th></tr></thead><tbody></tbody></table>';
    $('div.col-xs-12.contacts_div').html(inline_html_contact_table);

    // Like the contacts table, the html code of the usernote table is added using jQuery when the page loads.
    var inline_html_usernote_table = '<table cellpadding="15" id="user_note" class="table table-responsive table-striped contacts tablesorter" cellspacing="0" style="width: 100%;border: 0"><thead style="color: white;background-color: #607799;"><tr><th style="vertical-align: middle;text-align: center;" id="usernote_title"><b>TITLE</b></th><th style="vertical-align: middle;text-align: center;" id="usernote_name"><b>NAME</b></th><th style="vertical-align: middle;text-align: center;" id="usernote_date"><b>DATE</b></th><th style="vertical-align: middle;text-align: center;" id="usernote_comment"><b>USER NOTE</b></th></tr></thead><tbody></tbody></table>';
    $('div.col-xs-12.user_note_div').html(inline_html_usernote_table);

    if (selector_type == 'invoice_number' && !isNullorEmpty(ticket_id)) {
        var inline_html_credit_memo_table = htmlCreditMemoTable(status_value);
        $('div.col-xs-12.credit_memo_div').html(inline_html_credit_memo_table);

        var inline_html_usage_report_table = htmlUsageReportTable(status_value);
        $('div.col-xs-12.usage_report_div').html(inline_html_usage_report_table);
    }

    // The value of the submitter button at the bottom of the page is directly linked to the value of the button at the top.
    var submit_btn_val = $('#submitter').val().toUpperCase();
    $('#submit_ticket').val(submit_btn_val);

    if (!isNullorEmpty(selector_number)) {
        console.log('!isNullorEmpty(selector_number) : ', !isNullorEmpty(selector_number));
        // If we updated the contacts, we have the parameter 'custpage_selector_number' and no parameter for 'custpage_ticket_id'.
        if (isNullorEmpty(ticket_id)) {
            console.log('isNullorEmpty(ticket_id) : ', isNullorEmpty(ticket_id));
            $('#selector_value').val(selector_number);
            displayCustomerInfo();
            // If we come from the edit_ticket page, we have the parameters 'custpage_selector_number' and' custpage_ticket_id'.
        } else {
            console.log('isNullorEmpty(ticket_id) : ', isNullorEmpty(ticket_id));
            createContactsRows();
            // If the ticket status is "Open, the acknoledgement template shall be selected.
            if (status_value == 1) {
                $('#template option:selected').attr('selected', false);
                $('#template option[value="66"]').attr('selected', true); // Select the acknoledgement template
                loadTemplate();
            }

            if (selector_type == 'invoice_number') {
                updateInvoicesDatatable();
                createCreditMemoRows(status_value);
                createUsageReportRows(status_value);
                createUsernoteRows(ticket_id);
            }

            selectOwner();
            setReminderDate();
            hideCloseTicketButton();
            updateTicketsDatatable();
        }
    }
    updateButtonsWidth();

    $('.input-group-btn button').click(function (e) {
        $(e.currentTarget).next('ul').toggleClass('hide');
        $(e.currentTarget).next('ul').toggleClass('show');
    });

    $('.dropdown-menu li a').click(function (e) {
        e.preventDefault();
        setupSelectorInput($(this).text());
        var selector_type = $('#selector_text').text().toLowerCase().split(' ').join('_');
        nlapiSetFieldValue('custpage_selector_type', selector_type);

        updateTicketsDatatableHeaders(selector_type);

        switch (selector_type) {
            case 'barcode_number':
                $('#daytodayemail').attr('disabled', true);
                $('#daytodayphone').attr('disabled', true);
                $('#accountsemail').attr('disabled', true);
                $('#accountsphone').attr('disabled', true);

                $('.accountscontact_section').addClass('hide');
                $('.accounts_number_section').addClass('hide');
                $('.invoice_method_accounts_cc_email_section').addClass('hide');
                $('.mpex_customer_po_number_section').addClass('hide');
                $('.terms_section').addClass('hide');
                $('.mpex_invoicing_cycle_section').addClass('hide');

                $('.toll_issues_section').removeClass('hide');
                $('.resolved_toll_issues_section').removeClass('hide');

                $('.open_invoices').addClass('hide');

                $('.invoice_issues_section').addClass('hide');
                $('.resolved_invoice_issues_section').addClass('hide');

                $('.user_note').addClass('hide');
                $('.comment_section').removeClass('hide');
                break;

            case 'invoice_number':
                if (isFinanceRole(userRole)) {
                    $('#daytodayemail').attr('disabled', false);
                    $('#daytodayphone').attr('disabled', false);
                    $('#accountsemail').attr('disabled', false);
                    $('#accountsphone').attr('disabled', false);

                    $('#invoice_method').attr('disabled', false);
                    $('#accounts_cc_email').attr('disabled', false);
                    $('#mpex_po_number').attr('disabled', false);
                    $('#customer_po_number').attr('disabled', false);
                    $('#mpex_invoicing_cycle').attr('disabled', false);
                }

                $('.accountscontact_section').removeClass('hide');
                $('.accounts_number_section').removeClass('hide');
                $('.invoice_method_accounts_cc_email_section').removeClass('hide');
                $('.mpex_customer_po_number_section').removeClass('hide');
                $('.terms_section').removeClass('hide');
                $('.mpex_invoicing_cycle_section').removeClass('hide');

                $('.open_invoices').removeClass('hide');

                $('.toll_issues_section').addClass('hide');
                $('.resolved_toll_issues_section').addClass('hide');

                $('.invoice_issues_section').removeClass('hide');
                $('.resolved_invoice_issues_section').removeClass('hide');

                $('.user_note').removeClass('hide');
                $('.comment_section').addClass('hide');
                break;
        }
        $(this).closest("ul").toggleClass('hide');
        $(this).closest("ul").toggleClass('show');
    });

    $('#selector_value').change(function () { displayCustomerInfo() });

    $('#reviewcontacts').click(function () { addEditContact() });

    $('#invoices_dropdown').change(function () {
        var invoice_status_filter = $(this, 'option:selected').val();
        if (invoice_status_filter == 'open') {
            var invoice_section_header = 'OPEN INVOICES';
        } else if (invoice_status_filter == 'paidInFull') {
            var invoice_section_header = 'PAID INVOICES';
        }
        $('.open_invoices_header div div h4 span').text(invoice_section_header);
        updateInvoicesDatatable();
    });

    $('#credit_memo tbody td[headers="credit_memo_action"] button, #usage_report tbody td[headers="usage_report_action"] button').click(function () {
        $(this).toggleClass('btn-success');
        $(this).toggleClass('btn-danger');

        $(this).toggleClass('glyphicon-minus');
        $(this).toggleClass('glyphicon-plus');

        // Tooltip seems to set the 'title' attribute to 'data-original-title'.
        // The only way to have tooltip take into account the change of title is to modifiy the attribute 'data-original-title'.
        // Using the jQuery method 'data()' doesn't work.
        if ($(this).attr('data-original-title') == 'Attach to email') {
            $(this).attr('data-original-title', 'Remove from email');
        } else {
            $(this).attr('data-original-title', 'Attach to email');
        }
        $('[data-toggle="tooltip"]').tooltip();
    });

    $('#template').change(function () { loadTemplate() });

    $('#send_email').click(function () { sendEmail() });

    $('#toll_issues, #invoice_issues').on('change', function () { hideCloseTicketButton() });

    $('#mp_issues').change(function () {
        selectOwner();
        hideCloseTicketButton();
    });

    $('#reopen_ticket').click(function () { reopenTicket() });

    $('#submit_ticket').click(function () {
        $('#submitter').trigger('click');
    });

    // Prevent the ticket to be submitted on enter.
    $('input, textarea').keydown(function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            return false;
        }
    });

    // Add a newline at the end of the comment textarea when enter is pressed
    // This will not create the newline where the cursor is in the text
    $('textarea#comment').keydown(function (e) {
        if (e.keyCode == 13) {
            var comment = $(this).val();
            comment += '\n';
            $(this).val(comment);
            return false;
        }
    });
}

var ticketsDataSet = [];
var invoicesDataSet = [];
$(document).ready(function () {
    $('#email_body').summernote();

    $('#owner, #toll_issues, #mp_issues, #invoice_issues').selectpicker();

    $('#tickets-preview').DataTable({
        data: ticketsDataSet,
        columns: [
            { title: "ID" },
            { title: "Date created" },
            { title: "Date closed" },
            { title: "Barcode Number" },
            { title: "Status" },
            { title: "TOLL Issues" },
            { title: "Resolved TOLL Issues" },
            { title: "Comment" }
        ]
    });

    var invoice_datatable_inline_html = '<style>';
    invoice_datatable_inline_html += 'table#invoices-preview {font-size: 12px;text-align: center;border: none;}';
    invoice_datatable_inline_html += '.dataTables_wrapper {font-size: 14px;}';
    invoice_datatable_inline_html += 'table#invoices-preview th {text-align: center;}';
    invoice_datatable_inline_html += 'table#invoices-preview thead input {width: 100%;}';
    invoice_datatable_inline_html += '</style>';
    invoice_datatable_inline_html += '<table cellpadding="15" id="invoices-preview" class="table table-responsive table-striped customer tablesorter" cellspacing="0" style="width: 100%;">';
    invoice_datatable_inline_html += '<thead style="color: white;background-color: #607799;">';
    invoice_datatable_inline_html += '</thead>';
    invoice_datatable_inline_html += '<tbody id="result_invoices"></tbody>';
    invoice_datatable_inline_html += '</table>';
    $('#open_invoice_dt_div').html(invoice_datatable_inline_html);

    var invoice_table = $('#invoices-preview').DataTable({
        data: invoicesDataSet,
        columns: [
            {
                title: "Invoice Date",
                type: "date"
            },
            { title: "Invoice #" },
            { title: "Status" },
            { title: "Invoice Type" },
            {
                title: "Amount Due",
                type: "num-fmt"
            },
            {
                title: "Total Amount",
                type: "num-fmt"
            }
        ]
    });

    $('#invoices-preview thead tr').addClass('text-center');

    // Adapted from https://datatables.net/extensions/fixedheader/examples/options/columnFiltering.html
    // Adds a row to the table head row, and adds search filters to each column.
    $('#invoices-preview thead tr').clone(true).appendTo('#invoices-preview thead');
    $('#invoices-preview thead tr:eq(1) th').each(function (i) {
        var title = $(this).text();
        $(this).html('<input type="text" placeholder="Search ' + title + '" />');

        $('input', this).on('keyup change', function () {
            if (invoice_table.column(i).search() !== this.value) {
                invoice_table
                    .column(i)
                    .search(this.value)
                    .draw();
            }
        });
    });
});

/**
 * Loads the Customer Product Stock record ID, the customer ID and the franchisee ID
 * from the filled fields.
 * Creates a ticket record with the informations linked to the barcode.
 * @returns {Boolean} Whether the function has completed correctly.
 */
function saveRecord() {
    var status_value = nlapiGetFieldValue('custpage_ticket_status_value');
    var selector_issue = nlapiGetFieldValue('custpage_selector_issue');
    var selector_type = nlapiGetFieldValue('custpage_selector_type');

    if (status_value != 3) {
        // Check that a TOLL Issue or an Invoice Issue has been selected.
        switch (selector_type) {
            case 'barcode_number':
                var toll_issues_length = $('#toll_issues option:selected').length;
                if (toll_issues_length == 0) {
                    showAlert('Please select a TOLL Issue<br>');
                    return false;
                }
                break;

            case 'invoice_number':
                var invoice_issues_length = $('#invoice_issues option:selected').length;
                if (invoice_issues_length == 0) {
                    showAlert('Please select an Invoice Issue<br>');
                    return false;
                }
                break;
        }

        var owner_length = $('#owner option:selected').length;
        if (owner_length == 0) {
            showAlert('Please select an Owner<br>');
            return false;
        }

        if (selector_issue == 'T') {
            // There is an issue with the barcode
            // The owner should be contacted.
            if (validateIssueFields(selector_type)) {
                var selector_number = $('#selector_value').val();
                var customer_name = $('#customer_name').val();
                var comment = $('#comment').val();
                var selected_title = $('#user_note_title option:selected').text();
                var usernote_textarea = $('#user_note_textarea').val();
                var date = new Date;

                var email_subject = 'MP Ticket issue - ' + selector_number;
                var email_body = '';
                email_body += 'Environment : ' + nlapiGetContext().getEnvironment() + '\n';
                email_body += 'Date & Time : ' + formatDate(date) + '\n';
                switch (selector_type) {
                    case 'barcode_number':
                        email_body += 'Barcode Number : ' + selector_number + '\n';
                        break;

                    case 'invoice_number':
                        email_body += 'Invoice Number : ' + selector_number + '\n';
                        break;
                }
                email_body += 'Customer Name : ' + customer_name + '\n';

                switch (selector_type) {
                    case 'barcode_number':
                        email_body += 'TOLL Issues : ';
                        $('#toll_issues option:selected').each(function () {
                            email_body += $(this).text() + '\n';
                        });

                        email_body += 'MP Issues : ';
                        $('#mp_issues option:selected').each(function () {
                            email_body += $(this).text() + '\n';
                        });
                        break;

                    case 'invoice_number':
                        email_body += 'Invoice Issues : ';
                        $('#invoice_issues option:selected').each(function () {
                            email_body += $(this).text() + '\n';
                        });
                        break;
                }

                if (selector_type == 'invoice_number') {
                    if (!isNullorEmpty(comment.trim())) {
                        comment += '\n';
                    }
                    var usernote = '[' + selected_title + '] - ' + usernote_textarea;
                    comment += usernote;
                }

                email_body += 'Comment : ' + comment;

                var to = [];
                $('#owner option:selected').each(function () {
                    to.push($(this).data('email'));
                });
                var cc = [] //CC email addresses
                nlapiSendEmail(112209, to, email_subject, email_body, cc) // 112209 is from MailPlus Team
            } else {
                return false;
            }
        }

        var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
        if (isNullorEmpty(ticket_id)) {
            var ticketRecord = nlapiCreateRecord('customrecord_mp_ticket');
            nlapiSetFieldValue('custpage_created_ticket', 'T');
            ticketRecord.setFieldValue('custrecord_email_sent', 'F');
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
        var selector_number = $('#selector_value').val();
        nlapiSetFieldValue('custpage_selector_number', selector_number);
        var selector_id = nlapiGetFieldValue('custpage_selector_id');

        ticketRecord = setTicketStatus(ticketRecord);
        ticketRecord = setCreator(ticketRecord);
        ticketRecord.setFieldValue('altname', selector_number);

        switch (selector_type) {
            case 'barcode_number':
                ticketRecord.setFieldValue('custrecord_barcode_number', selector_id);
                break;

            case 'invoice_number':
                ticketRecord.setFieldValue('custrecord_invoice_number', selector_id);

                var customer_id = nlapiGetFieldValue('custpage_customer_id');
                ticketRecord.setFieldValue('custrecord_customer1', customer_id);

                var zee_id = nlapiGetFieldValue('custpage_zee_id');
                ticketRecord.setFieldValue('custrecord_zee', zee_id);

                if (isFinanceRole(userRole)) {

                    var daytodayemail = $('#daytodayemail').val();
                    var daytodayphone = $('#daytodayphone').val();
                    var accountsemail = $('#accountsemail').val();
                    var accountsphone = $('#accountsphone').val();
                    var selected_invoice_method_id = $('#invoice_method option:selected').val();
                    var accounts_cc_email = $('#accounts_cc_email').val();
                    var mpex_po_number = $('#mpex_po_number').val();
                    var customer_po_number = $('#customer_po_number').val();
                    var customer_terms = $('#customers_terms').val();
                    var selected_invoice_cycle_id = $('#mpex_invoicing_cycle option:selected').val();

                    var customerRecord = nlapiLoadRecord('customer', customer_id);
                    customerRecord.setFieldValue('custentity_email_service', daytodayemail);
                    customerRecord.setFieldValue('phone', daytodayphone);
                    customerRecord.setFieldValue('email', accountsemail);
                    customerRecord.setFieldValue('altphone', accountsphone);
                    customerRecord.setFieldValue('custentity_invoice_method', selected_invoice_method_id);
                    customerRecord.setFieldValue('custentity_accounts_cc_email', accounts_cc_email);
                    customerRecord.setFieldValue('custentity_mpex_po', mpex_po_number);
                    customerRecord.setFieldValue('custentity11', customer_po_number);
                    customerRecord.setFieldValue('custentity_finance_terms', customer_terms);
                    customerRecord.setFieldValue('custentity_mpex_invoicing_cycle', selected_invoice_cycle_id);
                    nlapiSubmitRecord(customerRecord);
                }
                break;
        }

        ticketRecord = updateIssues(ticketRecord);

        // Save Reminder date
        var reminder_date = $('#reminder').val();
        if (!isNullorEmpty(reminder_date)) {
            reminder_date = new Date(reminder_date);
            reminder_date = nlapiDateToString(reminder_date);
            ticketRecord.setFieldValue('custrecord_reminder', reminder_date);
        }

        // Save Owner list
        var owner_list = [];
        $('#owner option:selected').each(function () {
            owner_list.push($(this).val());
        });
        ticketRecord.setFieldValues('custrecord_owner', owner_list);

        // Save Comment
        switch (selector_type) {
            case 'barcode_number':
                var comment = $('#comment').val();
                break;

            case 'invoice_number':
                var comment = ticketRecord.getFieldValue('custrecord_comment');
                if (isNullorEmpty(comment)) { comment = '' };
                var selected_title = $('#user_note_title option:selected').text();
                var usernote_textarea = $('#user_note_textarea').val();
                var date = new Date;
                var dnow = nlapiDateToString(date, 'datetimetz');
                if (!isNullorEmpty(usernote_textarea)) {
                    if (!isNullorEmpty(comment)) {
                        comment += '\n';
                    }
                    var usernote = '[' + selected_title + '] - [' + userName + '] - [' + dnow + '] - ' + usernote_textarea;
                    comment += usernote;
                }
                break;
        }
        ticketRecord.setFieldValue('custrecord_comment', comment);
        var ticket_id = nlapiSubmitRecord(ticketRecord, true);
        nlapiSetFieldValue('custpage_ticket_id', ticket_id);

        if (!isNullorEmpty(selector_id) && (selector_type == 'barcode_number')) {
            try {
                var barcodeRecord = nlapiLoadRecord('customrecord_customer_product_stock', selector_id);
                barcodeRecord.setFieldValue('custrecord_mp_ticket', ticket_id);
                barcodeRecord.setFieldValues('custrecord_cust_prod_stock_toll_issues', list_toll_issues);
                nlapiSubmitRecord(barcodeRecord, true);

            } catch (error) {
                if (error instanceof nlobjError) {
                    if (error.getCode() == "SSS_MISSING_REQD_ARGUMENT") {
                        console.log('Error to load the barcode record with barcode_id : ' + selector_id);
                    }
                }
            }
        }
        return true;
    } else {
        reopenTicket();
        return false;
    }
}

/**
 * Triggered when a customer calls for an issue with a barcode that is not his.
 * Reorganize the shown sections.
 */
function onEscalate() {
    nlapiSetFieldValue('custpage_selector_issue', 'T');
    $('#submitter').val('Escalate to Owner');
    $('#submit_ticket').val('ESCALATE TO OWNER');
    // Hide the "Escalate" button
    $('#tbl_custpage_escalate').closest('td').hide();
    $('#tbl_custpage_escalate').closest('td').prev().hide();
    $('.escalate').addClass('hide');
    updateButtonsWidth();

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

    // Show the "MP Issues" field and the "Owner" text area
    $('.mp_issues_section').removeClass('hide');
    selectOwner();

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
 * @param   {String} selector_type
 * @returns {Boolean}
 */
function validateIssueFields(selector_type) {
    var alertMessage = '';
    var return_value = true;

    var toll_issues_length = $('#toll_issues option:selected').length;
    var mp_issues_length = $('#mp_issues option:selected').length;
    var invoice_issues_length = $('#invoice_issues option:selected').length;
    var comment = $('#comment').val();
    var usernote = $('#user_note_textarea').val();

    switch (selector_type) {
        case 'barcode_number':
            if (toll_issues_length == 0) {
                alertMessage += 'Please select a TOLL Issue<br>';
                return_value = false;
            }

            if (isNullorEmpty(comment)) {
                alertMessage += 'Please type a comment<br>';
                return_value = false;
            }
            break;

        case 'invoice_number':
            if (invoice_issues_length == 0) {
                alertMessage += 'Please select an Invoice Issue<br>';
                return_value = false;
            }

            if (isNullorEmpty(usernote)) {
                alertMessage += 'Please type a User Note<br>';
                return_value = false;
            }
            break;
    }

    if (mp_issues_length == 0) {
        alertMessage += 'Please select an MP Issue<br>';
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
 * Redirect to the "View MP Tickets" page without saving any changes.
 */
function onCancel() {
    var status_value = nlapiGetFieldValue('custpage_ticket_status_value');
    if (status_value == 3) {
        var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_edit_closed_ticket', 'customdeploy_sl_edit_closed_ticket');
    } else {
        var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_edit_ticket', 'customdeploy_sl_edit_ticket');
    }
    window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
}

/**
 * - Check that all the mandatory barcode fields have been filled, and that the customer record exists.
 * If not, calls the showAlert function.
 * - If the barcode record exists but there is an MP Ticket issue with the record,
 * the onEscalate function is called.
 * @return  {Boolean}    Whether or not all the input has been filled.
 */
function validate() {
    // selector_number is either the invoice number or the barcode number.
    var selector_number = $('#selector_value').val().trim().toUpperCase();
    $('#selector_value').val(selector_number);
    var selector_type = $('#selector_text').text().toLowerCase().split(' ').join('_');

    var alertMessage = '';
    var return_value = true;
    var keep_selector_number = false;

    if (isNullorEmpty(selector_number)) {
        switch (selector_type) {
            case 'invoice_number':
                alertMessage += 'Please enter the Invoice Number<br>';
                break;

            case 'barcode_number':
                alertMessage += 'Please enter the Barcode Number<br>';
                break;
        }
        return_value = false;
    }
    if ((return_value == true) && (!checkSelectorFormat(selector_number, selector_type))) {
        switch (selector_type) {
            case 'invoice_number':
                alertMessage += 'The Invoice Number format is incorrect<br>';
                break;

            case 'barcode_number':
                alertMessage += 'The Barcode Number format is incorrect<br>';
                break;
        }
        return_value = false;
    }

    // If a ticket already exists for the barcode number, the user is redirected to the "Edit Ticket" page.
    if ((return_value == true) && (ticketLinkedToSelector(selector_number))) {
        var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
        var params = {
            ticket_id: parseInt(ticket_id),
            selector_number: selector_number,
            selector_type: selector_type
        };
        params = JSON.stringify(params);
        var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket') + '&custparam_params=' + params;
        window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
    }

    switch (selector_type) {
        case 'invoice_number':
            var activeInvoiceResults = getSelectorRecords(selector_number, selector_type);
            if ((return_value == true) && (isNullorEmpty(activeInvoiceResults))) {
                alertMessage += 'No invoice record exists for the invoice number ' + selector_number + '<br>';

                keep_selector_number = true;
                $('.customer_section').addClass('hide');
                clearFields();
                nlapiSetFieldValue('custpage_selector_id', '');
                return_value = false;
            }
            break;

        case 'barcode_number':
            var activeBarcodeResults = getSelectorRecords(selector_number, selector_type);
            if ((return_value == true) && (isNullorEmpty(activeBarcodeResults))) {
                alertMessage += 'No active barcode record exists for the barcode number ' + selector_number + '<br>';

                $('#mp_issues option[value="1"]').prop('selected', true);
                $('#mp_issues option[value="2"]').prop('selected', true);
                $('#mp_issues option[value="3"]').prop('selected', true);
                keep_selector_number = true;
                $('.customer_section').addClass('hide');
                clearFields();
                nlapiSetFieldValue('custpage_selector_id', '');
                onEscalate();
                return_value = false;
            }

            if ((return_value == true) && (!zeeLinkedToBarcode(activeBarcodeResults))) {
                alertMessage += 'No franchisee is associated to the barcode ' + selector_number + '<br>';

                $('#mp_issues option[value="1"]').prop('selected', true);
                $('#mp_issues option[value="3"]').prop('selected', true);
                keep_selector_number = true;
                $('.customer_section').addClass('hide');
                clearFields();
                onEscalate();
                return_value = false;
            }

            if ((return_value == true) && (!customerLinkedToBarcode(activeBarcodeResults))) {
                alertMessage += 'No customer is associated to the barcode ' + selector_number + '<br>';

                $('#mp_issues option[value="1"]').prop('selected', true);
                keep_selector_number = true;
                $('.customer_section').addClass('hide');
                clearFields();
                onEscalate();
                return_value = false;
            }
            break;
    }


    if (return_value == false) {
        if (!keep_selector_number) {
            var last_correct_selector_number = nlapiGetFieldValue('custpage_selector_number');
            $('#selector_value').val(last_correct_selector_number);
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
 * Check that if the selector is a barcode number, it starts with 'MPE', 
 * followed by either 'B', 'C', 'D', 'F', 'N' or 'T',
 * and then finishes by 6 digits.
 * 
 * If it's an invoice, it should start with 'INV' and then finishes by 6 digits.
 * @param   {String} selector_number
 * @param   {String} selector_type
 * @returns {Boolean}
 */
function checkSelectorFormat(selector_number, selector_type) {
    switch (selector_type) {
        case 'barcode_number':
            var barcodeFormat = /^MPE[BCDFNT]\d{6}$/;
            return barcodeFormat.test(selector_number);
        case 'invoice_number':
            var invoiceFormat = /^INV\d{6}$/;
            return invoiceFormat.test(selector_number);
    }
}

/**
 * Searches for an opened ticket linked to this selector number.
 * The barcode record might not exist, but the ticket associated to the selector number can.
 * @param {String} selector_number
 * @returns {Boolean}
 */
function ticketLinkedToSelector(selector_number) {
    var activeTicketFilterExpression = [["name", "is", selector_number], 'AND', ["isinactive", "is", 'F']];
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
 * Searches for the active barcodes records with the name `barcode_number`,
 * or for the active invoice records with the name `invoice_number`,
 * There is normally only one such record.
 * @param   {String}                selector_number
 * @param   {String}                selector_type
 * @returns {nlobjSearchResult[]}   An array of nlobjSearchResult objects corresponding to the searched records.
 */
function getSelectorRecords(selector_number, selector_type) {
    switch (selector_type) {
        case 'barcode_number':
            var filterExpression = [["name", "is", selector_number], 'AND', ["isinactive", "is", 'F']];
            var activeBarcodeColumns = new Array();
            activeBarcodeColumns[0] = new nlobjSearchColumn('custrecord_cust_prod_stock_customer', null, null);
            activeBarcodeColumns[1] = new nlobjSearchColumn('custrecord_cust_prod_stock_zee', null, null);
            activeBarcodeColumns[2] = new nlobjSearchColumn('custrecord_cust_prod_stock_toll_issues', null, null);
            activeBarcodeColumns[3] = new nlobjSearchColumn('custrecord_mp_ticket', null, null);
            var activeSelectorResults = nlapiSearchRecord('customrecord_customer_product_stock', null, filterExpression, activeBarcodeColumns);
            break;

        case 'invoice_number':
            var filterExpression = [["tranid", "is", selector_number]];
            var invoiceColumns = new Array();
            invoiceColumns[0] = new nlobjSearchColumn('entity', null, null);
            invoiceColumns[1] = new nlobjSearchColumn('partner', null, null);
            var activeSelectorResults = nlapiSearchRecord('invoice', null, filterExpression, invoiceColumns);
            break;
    }

    if (!isNullorEmpty(activeSelectorResults)) {
        var activeSelectorResult = activeSelectorResults[0];
        var selector_id = activeSelectorResult.getId();
        nlapiSetFieldValue('custpage_selector_id', selector_id);
    }

    return activeSelectorResults;
}

/**
 * Verifies that the barcode record is associated to a customer
 * @param   {nlobjSearchResult[]}   activeBarcodeResults    Result of getSelectorRecords(selector_number, selector_type)
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
 * @param   {nlobjSearchResult[]}   activeBarcodeResults    Result of getSelectorRecords(selector_number, selector_type)
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
 * Displays the informations linked to a selector record.
 * @returns {Boolean}   Whether the function worked well or not.
 */
function displayCustomerInfo() {
    if (validate()) {
        var selector_number = $('#selector_value').val().trim().toUpperCase();
        nlapiSetFieldValue('custpage_selector_number', selector_number);
        var selector_type = nlapiGetFieldValue('custpage_selector_type');

        var activeSelectorResults = getSelectorRecords(selector_number, selector_type);
        var activeSelectorResult = activeSelectorResults[0];

        var selector_id = activeSelectorResult.getId();
        console.log('selector_id : ', selector_id);
        console.log('activeSelectorResult : ', activeSelectorResult);
        nlapiSetFieldValue('custpage_selector_id', selector_id);

        switch (selector_type) {
            case 'barcode_number':
                var customer_name = activeSelectorResult.getText('custrecord_cust_prod_stock_customer');
                var customer_id = activeSelectorResult.getValue('custrecord_cust_prod_stock_customer');

                var zee_name = activeSelectorResult.getText('custrecord_cust_prod_stock_zee');
                var zee_id = activeSelectorResult.getValue('custrecord_cust_prod_stock_zee');
                break;

            case 'invoice_number':
                var customer_name = activeSelectorResult.getText('entity');
                var customer_id = activeSelectorResult.getValue('entity');

                var zee_name = activeSelectorResult.getText('partner');
                var zee_id = activeSelectorResult.getValue('partner');
                break;
        }
        nlapiSetFieldValue('custpage_customer_id', customer_id);
        $('#customer_name').val(customer_name);
        nlapiSetFieldValue('custpage_zee_id', zee_id);
        $('#franchisee_name').val(zee_name);

        // Load customer record
        try {
            var customerRecord = nlapiLoadRecord('customer', customer_id);
            var daytodayphone = customerRecord.getFieldValue('phone');
            var daytodayemail = customerRecord.getFieldValue('custentity_email_service');
            if (selector_type == 'invoice_number') {
                var accountsphone = customerRecord.getFieldValue('altphone');
                var accountsemail = customerRecord.getFieldValue('email');
                var maap_bank_account_number = customerRecord.getFieldValue('custentity_maap_bankacctno');
                var maap_parent_bank_account_number = customerRecord.getFieldValue('custentity_maap_bankacctno_parent');

                var selected_invoice_method_id = customerRecord.getFieldValue('custentity_invoice_method');
                var accounts_cc_email = customerRecord.getFieldValue('custentity_accounts_cc_email');
                var mpex_po_number = customerRecord.getFieldValue('custentity_mpex_po');
                var customer_po_number = customerRecord.getFieldValue('custentity11');
                var mpex_invoicing_cycle = customerRecord.getFieldValue('custentity_mpex_invoicing_cycle');
            }

            // Load Franchisee record
            var zeeRecord = nlapiLoadRecord('partner', zee_id);
            var zee_main_contact_name = zeeRecord.getFieldValue('custentity3');
            var zee_email = zeeRecord.getFieldValue('email');
            var zee_main_contact_phone = zeeRecord.getFieldValue('custentity2');

            $('#daytodayphone').val(daytodayphone);
            $('#daytodayemail').val(daytodayemail);
            if (selector_type == 'invoice_number') {
                $('#accountsphone').val(accountsphone);
                $('#accountsemail').val(accountsemail);
                $('#account_number').val(maap_bank_account_number);
                $('#parent_account_number').val(maap_parent_bank_account_number);

                // Unselect Invoice all method options fields
                $('#invoice_method option:selected').each(function () {
                    $(this).attr('selected', false);
                });
                // Select the right invoice method option
                $('#invoice_method option[value=' + selected_invoice_method_id + ']').prop('selected', true);

                $('#accounts_cc_email').val(accounts_cc_email);
                $('#mpex_po_number').val(mpex_po_number);
                $('#customer_po_number').val(customer_po_number);
                $('#mpex_invoicing_cycle').val(mpex_invoicing_cycle);
            }

            $('#zee_main_contact_name').val(zee_main_contact_name);
            $('#zee_email').val(zee_email);
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

        switch (selector_type) {
            case 'barcode_number':
                // TOLL Issues
                // Unselect all TOLL Issues fields
                $('#toll_issues option:selected').each(function () {
                    $(this).attr('selected', false);
                });
                // Select the corresponding TOLL issues
                var toll_issues = activeSelectorResult.getValue('custrecord_cust_prod_stock_toll_issues');
                if (!isNullorEmpty(toll_issues)) {
                    toll_issues = toll_issues.split(',');
                    toll_issues.forEach(function (toll_value) {
                        $('#toll_issues option[value=' + toll_value + ']').prop('selected', true);
                    });
                }
                break;

            case 'invoice_number':
                // Invoice Issues
                // If the ticket is not opened yet, there are no Invoice Issues yet.

                updateInvoicesDatatable();
                break;
        }

        // Display the tickets linked to the customer in the datatable
        updateTicketsDatatable();

        setReminderDate();

        return true;
    }
}

/**
 * Displays the invoices linked to the customer into a datatable.
 * @returns {Boolean}   Whether the function worked well or not.
 */
function updateInvoicesDatatable() {

    var customer_id = nlapiGetFieldValue('custpage_customer_id');
    var invoice_status_filter = $('#invoices_dropdown option:selected').val();
    var invoicesSearchResults = loadInvoicesSearch(customer_id, invoice_status_filter);

    $('#result_invoices').empty();
    var invoicesDataSet = [];

    if (isNullorEmpty(invoicesSearchResults)) {
        if (isNullorEmpty(customer_id)) {
            $('#info').text('No customer is associated to this invoice.');
            $('#info').parent().show();
            return true;
        } else {
            try {
                var customerRecord = nlapiLoadRecord('customer', customer_id, null);
                var customer_name = customerRecord.getFieldValue('altname');
                $('#info').text('No open invoice exists for the customer ' + customer_name);
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

    invoicesSearchResults.forEachResult(function (invoiceResult) {
        var status = invoiceResult.getValue('statusref');
        if (status == invoice_status_filter) {

            var invoice_date = invoiceResult.getValue('trandate');
            invoice_date = invoice_date.split(' ')[0];
            invoice_date = dateCreated2DateSelectedFormat(invoice_date);
            var re = /Invoice #([\w]+)/;
            var invoice_number = invoiceResult.getValue('invoicenum');
            invoice_number = invoice_number.replace(re, '$1');
            var status_text = invoiceResult.getText('statusref');
            var invoice_type = invoiceResult.getText('custbody_inv_type');
            var amount_due = invoiceResult.getValue('amountremaining');
            var total_amount = invoiceResult.getValue('total');

            amount_due = financial(amount_due);
            total_amount = financial(total_amount);

            console.log('invoiceResult : ', invoiceResult);
            invoicesDataSet.push([invoice_date, invoice_number, status_text, invoice_type, amount_due, total_amount]);
        }
        return true;

    });


    // Update datatable rows.
    var datatable = $('#invoices-preview').dataTable().api();
    datatable.clear();
    datatable.rows.add(invoicesDataSet);
    datatable.draw();

    return true;
}

/**
 * Update the headers of the tickets preview datatable, depending on the selector_type.
 * @param   {String}    selector_type
 */
function updateTicketsDatatableHeaders(selector_type) {

    var table = $('#tickets-preview').DataTable();
    var header_cells = table.columns([3, 5, 6]).header().to$();
    switch (selector_type) {
        case 'barcode_number':
            $.each(header_cells, function (index) {
                switch (index) {
                    case 0:
                        $(this).text('Barcode Number');
                        break;
                    case 1:
                        $(this).text('TOLL Issues');
                        break;
                    case 2:
                        $(this).text('Resolved TOLL Issues');
                        break;

                    default:
                        break;
                }
            });
            break;

        case 'invoice_number':
            $.each(header_cells, function (index) {
                switch (index) {
                    case 0:
                        $(this).text('Invoice Number');
                        break;
                    case 1:
                        $(this).text('Invoice Issues');
                        break;
                    case 2:
                        $(this).text('Resolved Invoice Issues');
                        break;

                    default:
                        break;
                }
            });
            break;
    }
}

/**
 * Displays the tickets linked to the customer into a datatable.
 * @returns {Boolean}   Whether the function worked well or not.
 */
function updateTicketsDatatable() {
    var customer_id = nlapiGetFieldValue('custpage_customer_id');
    var selector_type = nlapiGetFieldValue('custpage_selector_type');
    var ticketSearchResults = loadTicketsSearch(customer_id);

    updateTicketsDatatableHeaders(selector_type);

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
        switch (selector_type) {
            case 'barcode_number':
                var ticket_id = ticketResult.getValue('name');
                var date_created = ticketResult.getValue('created');
                var date_closed = ticketResult.getValue('custrecord_date_closed');
                var barcode_number = ticketResult.getText('custrecord_barcode_number');
                var status = ticketResult.getText('custrecord_ticket_status');
                var toll_issues = ticketResult.getText('custrecord_toll_issues');
                toll_issues = toll_issues.split(',').join('<br>');
                var resolved_toll_issues = ticketResult.getText('custrecord_resolved_toll_issues');
                resolved_toll_issues = resolved_toll_issues.split(',').join('<br>');
                var comment = ticketResult.getValue('custrecord_comment');

                ticketsDataSet.push([ticket_id, date_created, date_closed, barcode_number, status, toll_issues, resolved_toll_issues, comment]);

                break;

            case 'invoice_number':
                var ticket_id = ticketResult.getValue('name');
                var date_created = ticketResult.getValue('created');
                var date_closed = ticketResult.getValue('custrecord_date_closed');
                var re = /Invoice #([\w]+)/;
                var invoice_number = ticketResult.getText('custrecord_invoice_number');
                invoice_number = invoice_number.replace(re, '$1');
                var status = ticketResult.getText('custrecord_ticket_status');
                var invoice_issues = ticketResult.getText('custrecord_invoice_issues');
                invoice_issues = invoice_issues.split(',').join('<br>');
                var resolved_invoice_issues = ticketResult.getText('custrecord_resolved_invoice_issues');
                resolved_invoice_issues = resolved_invoice_issues.split(',').join('<br>');
                var comment = ticketResult.getValue('custrecord_comment');
                comment = comment.split('\n').join('<br>');

                ticketsDataSet.push([ticket_id, date_created, date_closed, invoice_number, status, invoice_issues, resolved_invoice_issues, comment]);

                break;
        }

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
 * Load the result set of the invoices records linked to the customer.
 * @param   {String}                customer_id
 * @param   {String}                invoice_status
 * @return  {nlobjSearchResultSet}  invoicesResultSet
 */
function loadInvoicesSearch(customer_id, invoice_status) {
    if (!isNullorEmpty(customer_id)) {
        var invoicesSearch = nlapiLoadSearch('invoice', 'customsearch_mp_ticket_invoices_datatabl');
        var invoicesFilterExpression = invoicesSearch.getFilterExpression();
        invoicesFilterExpression.push('AND', ['entity', 'is', customer_id]);

        if (invoice_status == 'open') {
            invoicesFilterExpression.push('AND', ["status", "anyof", "CustInvc:A"]); // Open Invoices
        } else if (invoice_status == 'paidInFull') {
            invoicesFilterExpression.push('AND', ["status", "anyof", "CustInvc:B"]); // Paid in Full

            var today_date = new Date();
            var today_day = today_date.getDate();
            var today_month = today_date.getMonth();
            var today_year = today_date.getFullYear();
            var date_3_months_ago = new Date(Date.UTC(today_year, today_month - 3, today_day));
            var date_3_months_ago_string = nlapiDateToString(date_3_months_ago, 'date');
            invoicesFilterExpression.push('AND', ["trandate", "after", date_3_months_ago_string]);
        }
        console.log('invoicesFilterExpression : ', invoicesFilterExpression);
        invoicesSearch.setFilterExpression(invoicesFilterExpression);
        invoicesResultSet = invoicesSearch.runSearch();
    }
    return invoicesResultSet;
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
        ticketsColumns[4] = new nlobjSearchColumn('custrecord_invoice_number', null, null);
        ticketsColumns[5] = new nlobjSearchColumn('custrecord_ticket_status', null, null);
        ticketsColumns[6] = new nlobjSearchColumn('custrecord_toll_issues', null, null);
        ticketsColumns[7] = new nlobjSearchColumn('custrecord_resolved_toll_issues', null, null);
        ticketsColumns[8] = new nlobjSearchColumn('custrecord_invoice_issues', null, null);
        ticketsColumns[9] = new nlobjSearchColumn('custrecord_resolved_invoice_issues', null, null);
        ticketsColumns[10] = new nlobjSearchColumn('custrecord_comment', null, null);

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
        var selector_number = nlapiGetFieldValue('custpage_selector_number');
        var selector_type = nlapiGetFieldValue('custpage_selector_type');
        var params = {
            custid: parseInt(customer_id),
            selector_number: selector_number,
            selector_type: selector_type,
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
    // var to_option_html = '<option></option>';
    var to_option_html = '';

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

    // Add the franchisee contact details in the dropdown list
    var contact_id = '0';
    var zee_name = $('#zee_main_contact_name').val();
    var zee_email = $('#zee_email').val();
    to_option_html += '<option value="' + contact_id + '" data-firstname="' + zee_name + '" data-email="' + zee_email + '">' + zee_name + ' - ' + zee_email + '</option>';

    $('#contacts tbody').html(inline_contacts_table_html);
    $('#send_to').html(to_option_html);
}

/**
 * Populates the Usernote table by adding the usernotes at each row.
 */
function createUsernoteRows(ticket_id) {

    // Used for the UserNote Table.
    var inline_usernote_table_html = '';

    ticket_id = parseInt(ticket_id);
    var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
    var comment = ticketRecord.getFieldValue('custrecord_comment');
    if (!isNullorEmpty(comment)) {
        var comments = comment.split('\n');
        var re = /\[([\w\W\s]+)\]/;
        comments.forEach(function (value, index, comments_array) {
            // Iterate the array from the last element to the first, in order to display the most recent usernote on top.
            var nb_usernotes = comments_array.length;
            var usernote = comments_array[nb_usernotes - index - 1];

            var usernote_array = usernote.split(' - ');
            var usernote_title = usernote_array[0].replace(re, '$1');
            var usernote_name = usernote_array[1].replace(re, '$1');
            var usernote_date = usernote_array[2].replace(re, '$1');
            var usernote_text = usernote_array[3];

            inline_usernote_table_html += '<tr class="text-center">';
            inline_usernote_table_html += '<td headers="col_usernote_title">' + usernote_title + '</td>';
            inline_usernote_table_html += '<td headers="col_usernote_name">' + usernote_name + '</td>';
            inline_usernote_table_html += '<td headers="col_usernote_date">' + usernote_date + '</td>';
            inline_usernote_table_html += '<td headers="col_usernote_comment">' + usernote_text + '</td>';
            inline_usernote_table_html += '</tr>';
        });
    }

    $('#user_note tbody').html(inline_usernote_table_html);

}

/**
 * Based on the selected MP Issue, an Owner is allocated to the ticket.
 * IT issues have priority over the other issues.
 */
function selectOwner() {

    var owner_list = $('#owner option:selected').map(function () { return $(this).val() });
    owner_list = $.makeArray(owner_list);

    var list_mp_ticket_issues = $('#mp_issues option:selected').map(function () { return $(this).val() });
    list_mp_ticket_issues = $.makeArray(list_mp_ticket_issues);

    if (list_mp_ticket_issues.length != 0) {
        var it_issue = false;
        var other_issue = '0';
        list_mp_ticket_issues.forEach(function (mp_ticket_issue_value) {
            if (mp_ticket_issue_value < 5) {
                it_issue = true;
            } else {
                other_issue = mp_ticket_issue_value;
            }
        });


        if (it_issue) {
            // IT Issue
            owner_list = owner_list.concat(['409635', '696992']); // Select Ankith Ravindran and Raine Giderson.
        } else if (other_issue != '0') {
            switch (other_issue) {
                case '5': // Operational Issue
                    owner_list.push('25537'); // Select Michael McDaid.
                    break;
                case '6': // Finance Issue
                    owner_list.push('280700'); // Select Vira Nathania.
                    break;
                case '7': // Customer Service Issue
                    owner_list.push('386344'); // Select Jessica Roberts.
                    break;
            }
        }
    }
    $('#owner').selectpicker('val', owner_list);
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

    var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
    ticket_id = parseInt(ticket_id);
    var selector_number = nlapiGetFieldValue('custpage_selector_number');
    var subject = 'MailPlus [MPSD' + ticket_id + '] - ' + template_subject + ' - ' + selector_number;

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
        var to = [$('#send_to option:selected').data("email")];

        // CC Field
        var cc_values = $('#send_cc').val().split(',');
        var cc = [];
        cc_values.forEach(function (email_address) {
            cc.push(email_address.trim());
            return true;
        });
        if (isNullorEmpty(cc)) {
            cc = null;
        }

        // BCC Field
        var bcc_values = $('#send_bcc').val().split(',');
        var bcc = [];
        bcc_values.forEach(function (email_address) {
            bcc.push(email_address.trim());
            return true;
        });
        if (isNullorEmpty(bcc)) {
            bcc = null;
        }

        // Attach message to Customer / Franchisee record
        var emailAttach = new Object();
        var receiver_contact_id = $('#send_to option:selected').val();
        var entity_type = (receiver_contact_id === "0") ? 'partner' : 'customer';
        if (entity_type == 'partner') {
            var zee_id = nlapiGetFieldValue('custpage_zee_id');
            emailAttach['partner'] = zee_id;
            console.log('emailAttach : ', emailAttach);
        } else if (entity_type == 'customer') {
            var customer_id = nlapiGetFieldValue('custpage_customer_id');
            emailAttach['entity'] = customer_id;
        }

        // Look for credit memos attached.
        var attachments_credit_memo_ids = [];
        $('#credit_memo tbody td[headers="credit_memo_action"] button').each(function () {
            if ($(this).hasClass('btn-danger')) {
                attachments_credit_memo_ids.push($(this).data('cm-id'));
            }
        });
        // Look for usage reports attached.
        var attachments_usage_report_ids = [];
        $('#usage_report tbody td[headers="usage_report_action"] button').each(function () {
            if ($(this).hasClass('btn-danger')) {
                attachments_usage_report_ids.push($(this).data('ur-id'));
            }
        });
        console.log('attachments_usage_report_ids : ', attachments_usage_report_ids);

        var email_subject = $('#subject').val();
        var email_body = $('#email_body').summernote('code');

        var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
        ticket_id = parseInt(ticket_id);

        if ((!isNullorEmpty(attachments_credit_memo_ids)) || (!isNullorEmpty(attachments_usage_report_ids))) {
            // Send email using the response part of this suitelet script.
            var params_email = {
                recipient: to,
                subject: email_subject,
                body: encodeURIComponent(email_body),
                cc: cc,
                bcc: bcc,
                records: emailAttach,
                attachments_credit_memo_ids: attachments_credit_memo_ids,
                attachments_usage_report_ids: attachments_usage_report_ids
            };

            params_email = JSON.stringify(params_email);
            nlapiSetFieldValue('custpage_param_email', params_email);

            setRecordStatusToInProgress(ticket_id);

            // Trigger the submit function.
            $('#submitter').trigger('click');
        } else {
            // If there are no attachments, it's faster to directly use nlapiSendEmail() from the client script.
            nlapiSendEmail(112209, to, email_subject, email_body, cc, bcc, emailAttach) // 112209 is from MailPlus Team

            var selector_number = nlapiGetFieldValue('custpage_selector_number');
            var selector_type = nlapiGetFieldValue('custpage_selector_type');

            setRecordStatusToInProgress(ticket_id);

            // Reload the page
            var params = {
                ticket_id: parseInt(ticket_id),
                selector_number: selector_number,
                selector_type: selector_type
            };
            params = JSON.stringify(params);
            var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket') + '&custparam_params=' + params;
            window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
        }
    } else {
        return false;
    }
}

/**
* Set record status to 'In Progress'.
* @param {Number} ticket_id 
*/
function setRecordStatusToInProgress(ticket_id) {
    try {
        var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
        var status_value = ticketRecord.getFieldValue('customrecord_mp_ticket');
        if (isNullorEmpty(status_value) || status_value == 1) {
            ticketRecord.setFieldValue('custrecord_ticket_status', 2);
            ticketRecord.setFieldValue('custrecord_email_sent', 'T');
            nlapiSubmitRecord(ticketRecord, true);
        }
    } catch (error) {
        if (error instanceof nlobjError) {
            if (error.getCode() == "SSS_MISSING_REQD_ARGUMENT") {
                console.log('Error to Set record status to In Progress with ticket_id : ' + ticket_id);
            }
        }
    }
}

/**
 * Triggered by any changes on the TOLL Issues, Invoice Issues or MP Ticket Issues fields.
 * Display the button 'CLOSE TICKET' only when there are no selected issues.
 */
function hideCloseTicketButton() {
    // Check that there are no selected issues.

    var selector_type = nlapiGetFieldValue('custpage_selector_type');

    var toll_issues_length = $('#toll_issues option:selected').length;
    var invoice_issues_length = $('#invoice_issues option:selected').length;
    var mp_issues_length = $('#mp_issues option:selected').length;

    switch (selector_type) {
        case 'barcode_number':
            if ((toll_issues_length == 0) && (mp_issues_length == 0)) {
                $('.close_ticket').removeClass('hide');
            } else {
                $('.close_ticket').addClass('hide');
            }
            break;

        case 'invoice_number':
            if ((invoice_issues_length == 0) && (mp_issues_length == 0)) {
                $('.close_ticket').removeClass('hide');
            } else {
                $('.close_ticket').addClass('hide');
            }
            break;
    }

    updateButtonsWidth();
}

/**
 * Triggered by a click on the button 'CLOSE TICKET' ('#close_ticket')
 * Set the ticket record as inactive.
 * Set the date of closure, and the status as "Closed".
 */
function closeTicket() {
    if (confirm("Are you sure you want to close this ticket?\n\nThis action cannot be undone.")) {
        var date = new Date;
        var dnow = nlapiDateToString(date, 'datetimetz');

        var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
        ticket_id = parseInt(ticket_id);
        var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
        ticketRecord.setFieldValue('isinactive', 'T');
        ticketRecord.setFieldValue('custrecord_date_closed', dnow);
        ticketRecord.setFieldValue('custrecord_ticket_status', 3);
        ticketRecord.setFieldValue('custrecord_reminder', '');

        // Save issues and resolved issues
        ticketRecord = updateIssues(ticketRecord);

        nlapiSubmitRecord(ticketRecord, true);

        // Redirect to the "View MP Tickets" page
        var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_edit_ticket', 'customdeploy_sl_edit_ticket');
        window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
    }
}

/**
 * Set the status of the ticket based on the MP ticket Values.
 * @param   {nlobjRecord} ticketRecord
 * @returns {nlobjRecord} ticketRecord 
 */
function setTicketStatus(ticketRecord) {
    var current_status = ticketRecord.getFieldValue('custrecord_ticket_status');

    var list_mp_ticket_issues = new Array;
    $('#mp_issues option:selected').each(function () {
        list_mp_ticket_issues.push($(this).val());
    });

    if (isNullorEmpty(current_status)) {
        ticketRecord.setFieldValue('custrecord_ticket_status', 1);
    } else if (list_mp_ticket_issues.length != 0) {

        var it_issue = false;
        var other_issue = '0';
        list_mp_ticket_issues.forEach(function (mp_ticket_issue_value) {
            if (mp_ticket_issue_value < 5) {
                it_issue = true;
            } else {
                other_issue = mp_ticket_issue_value;
            }
        });

        if (it_issue) {
            ticketRecord.setFieldValue('custrecord_ticket_status', 4);
        } else if (other_issue != '0') {
            switch (other_issue) {
                case '5': // Operational Issue
                    ticketRecord.setFieldValue('custrecord_ticket_status', 5);
                    break;
                case '6': // Finance Issue
                    ticketRecord.setFieldValue('custrecord_ticket_status', 6);
                    break;
                case '7': // Customer Service Issue
                    ticketRecord.setFieldValue('custrecord_ticket_status', 2);
                    break;
            }
        }
    } else {
        // If there are no more MP Ticket issues, 
        if (current_status >= 4) {
            var email_sent = ticketRecord.getFieldValue('custrecord_email_sent');
            if (email_sent == 'T') {
                //If an email has ever been sent to the customer, the status is updated to 'In progress - Customer service'
                ticketRecord.setFieldValue('custrecord_ticket_status', 2);
            } else {
                // If no email has ever been sent to the customer, the status is updated to 'Open'
                ticketRecord.setFieldValue('custrecord_ticket_status', 1);
            }

        }
    }
    return ticketRecord;
}

/**
 * Set the creator of the ticket if there is none.
 * @param   {nlobjRecord} ticketRecord
 * @returns {nlobjRecord} ticketRecord
 */
function setCreator(ticketRecord) {
    var creator_id = ticketRecord.getFieldValue('custrecord_creator');

    if (isNullorEmpty(creator_id)) {
        var user_id = parseInt(ctx.getUser());
        ticketRecord.setFieldValue('custrecord_creator', user_id);
    }

    return ticketRecord;
}

/**
 * If we work with a barcode ticket, the TOLL Issues and MP Ticket Issues are added to the record.
 * If we work with an invoice ticket, the Invoice Issues are added to the record.
 * If issues have been deleted from any of these fields, they are saved in the resolved fields.
 * @param   {nlobjRecord} ticketRecord
 * @returns {nlobjRecord} ticketRecord
 */
function updateIssues(ticketRecord) {
    var ticket_id = nlapiGetFieldValue('custpage_ticket_id');

    var selector_type = nlapiGetFieldValue('custpage_selector_type');
    switch (selector_type) {
        case 'barcode_number':
            // Save TOLL Issues
            var list_toll_issues = new Array;
            $('#toll_issues option:selected').each(function () {
                list_toll_issues.push($(this).val());
            });
            // Save resolved TOLL Issues
            if (!isNullorEmpty(ticket_id)) {
                var old_list_toll_issues = ticketRecord.getFieldValues('custrecord_toll_issues');

                if (!isNullorEmpty(old_list_toll_issues)) {
                    if (typeof (old_list_toll_issues) == "string") {
                        old_list_toll_issues = [old_list_toll_issues];
                    }

                    var list_resolved_toll_issues = ticketRecord.getFieldValues('custrecord_resolved_toll_issues');
                    if (isNullorEmpty(list_resolved_toll_issues)) {
                        list_resolved_toll_issues = new Array;
                    } else if (typeof (list_resolved_toll_issues) == "string") {
                        list_resolved_toll_issues = [list_resolved_toll_issues];
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

            break;

        case 'invoice_number':
            // Save Invoice Issues
            var list_invoice_issues = new Array;
            $('#invoice_issues option:selected').each(function () {
                list_invoice_issues.push($(this).val());
            });
            // Save resolved INVOICE Issues
            if (!isNullorEmpty(ticket_id)) {
                var old_list_invoice_issues = ticketRecord.getFieldValues('custrecord_invoice_issues');

                if (!isNullorEmpty(old_list_invoice_issues)) {
                    if (typeof (old_list_invoice_issues) == "string") {
                        old_list_invoice_issues = [old_list_invoice_issues];
                    }

                    var list_resolved_invoice_issues = ticketRecord.getFieldValues('custrecord_resolved_invoice_issues');
                    if (isNullorEmpty(list_resolved_invoice_issues)) {
                        list_resolved_invoice_issues = new Array;
                    } else if (typeof (list_resolved_invoice_issues) == "string") {
                        list_resolved_invoice_issues = [list_resolved_invoice_issues];
                    }

                    old_list_invoice_issues.forEach(function (old_invoice_issue) {
                        // If an invoice issue of the old list is not in the new list,
                        // it means that the issue was resolved.
                        if (list_invoice_issues.indexOf(old_invoice_issue) == -1) {
                            list_resolved_invoice_issues.push(old_invoice_issue);
                        }
                    });
                    ticketRecord.setFieldValues('custrecord_resolved_invoice_issues', list_resolved_invoice_issues);
                }
            }
            ticketRecord.setFieldValues('custrecord_invoice_issues', list_invoice_issues);
            break;
    }

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
    var selector_number = nlapiGetFieldValue('custpage_selector_number');
    var selector_type = nlapiGetFieldValue('custpage_selector_type');
    var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
    ticketRecord.setFieldValue('isinactive', 'F');
    ticketRecord.setFieldValue('custrecord_date_closed', '');
    ticketRecord.setFieldValue('custrecord_ticket_status', 1);

    // Save Reminder date
    setReminderDate();
    var reminder_date = $('#reminder').val();
    if (!isNullorEmpty(reminder_date)) {
        reminder_date = new Date(reminder_date);
        reminder_date = nlapiDateToString(reminder_date);
        ticketRecord.setFieldValue('custrecord_reminder', reminder_date);
    }

    // Set new Creator and new Owner
    var userId = nlapiGetContext().getUser().toString();
    ticketRecord.setFieldValue('custrecord_creator', userId);
    ticketRecord.setFieldValue('custrecord_owner', [userId]);

    nlapiSubmitRecord(ticketRecord, true);

    // Reload the page
    var params = {
        ticket_id: parseInt(ticket_id),
        selector_number: selector_number,
        selector_type: selector_type
    };
    params = JSON.stringify(params);
    var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket') + '&custparam_params=' + params;
    window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
}

/**
 * Lookup for the Credit Memo associated to an invoice.
 * @returns {nlobjSearchResult[]} creditMemoResults
 */
function searchCreditMemo() {
    var selector_type = nlapiGetFieldValue('custpage_selector_type');
    if (selector_type == 'invoice_number') {
        var selector_id = nlapiGetFieldValue('custpage_selector_id');
        var creditMemoResults = nlapiSearchRecord(
            'creditmemo',
            null,
            [
                new nlobjSearchFilter('mainline', null, 'is', 'T'),
                new nlobjSearchFilter('createdfrom', null, 'is', selector_id)
            ],
            [
                new nlobjSearchColumn('tranid', null, 'group'),
                new nlobjSearchColumn('trandate', null, 'group'),
                new nlobjSearchColumn('entity', null, 'group'),
                new nlobjSearchColumn('createdfrom', null, 'group'),
                new nlobjSearchColumn('internalid', null, 'group')
            ]
        );
        return creditMemoResults;
    } else {
        return null;
    }
}

/**
 * searchCreditMemo() searches for Credit Memos linked to the current invoice.
 * If there are results, they are displayed in the table '#credit_memo'.
 * Otherwise, the section containing the table is hidden.
 * @param {Number} status_value
 */
function createCreditMemoRows(status_value) {
    var inline_credit_memo_table_html = '';
    var compid = (nlapiGetContext().getEnvironment() == "SANDBOX") ? '1048144_SB3' : '1048144';

    var creditMemoResults = searchCreditMemo();
    if (!isNullorEmpty(creditMemoResults)) {
        $('.credit_memo').removeClass('hide');

        creditMemoResults.forEach(function (creditMemoResult) {
            var credit_memo_number = creditMemoResult.getValue('tranid', null, 'group');
            var credit_memo_date = creditMemoResult.getValue('trandate', null, 'group');

            var credit_memo_customer_name = creditMemoResult.getText('entity', null, 'group');
            var credit_memo_customer_id = creditMemoResult.getValue('entity', null, 'group');
            var credit_memo_customer_link = baseURL + '/app/common/entity/custjob.nl?id=' + credit_memo_customer_id;

            var credit_memo_created_from_id = creditMemoResult.getValue('createdfrom', null, 'group');
            var credit_memo_created_from = creditMemoResult.getText('createdfrom', null, 'group');
            var invoice_link = baseURL + '/app/accounting/transactions/custinvc.nl?id=' + credit_memo_created_from_id + '&compid=' + compid + '&cf=116&whence=';

            var credit_memo_id = creditMemoResult.getText('internalid', null, 'group');
            var credit_memo_link = baseURL + '/app/accounting/transactions/custcred.nl?id=' + credit_memo_id + '&whence=';
            var credit_memo_url = baseURL + '/app/accounting/print/hotprint.nl?regular=T&sethotprinter=T&formnumber=106&trantype=custcred&id=' + credit_memo_id + '&label=Credit+Memo&printtype=transaction';
            var credit_memo_action_button = '<button class="btn btn-success edit_class glyphicon glyphicon-plus" type="button" data-toggle="tooltip" data-placement="right" data-cm-id="' + credit_memo_id + '" data-cm-url="' + credit_memo_url + '" title="Attach to email"></button>';

            inline_credit_memo_table_html += '<tr class="text-center">';
            inline_credit_memo_table_html += '<td headers="credit_memo_number"><a href="' + credit_memo_link + '">' + credit_memo_number + '</a></td>';
            inline_credit_memo_table_html += '<td headers="credit_memo_date">' + credit_memo_date + '</td>';
            inline_credit_memo_table_html += '<td headers="credit_memo_customer"><a href="' + credit_memo_customer_link + '">' + credit_memo_customer_name + '</td>';
            inline_credit_memo_table_html += '<td headers="credit_memo_invoice_number"><a href="' + invoice_link + '">' + credit_memo_created_from + '</td>';
            if (status_value != 3) {
                inline_credit_memo_table_html += '<td headers="credit_memo_action">' + credit_memo_action_button + '</td>';
            }
            inline_credit_memo_table_html += '</tr>';
        });
    } else {
        $('.credit_memo').addClass('hide');
    }
    $('#credit_memo tbody').html(inline_credit_memo_table_html);
    // Each time the table is redrawn, we trigger tooltip for the new cells.
    $('[data-toggle="tooltip"]').tooltip();
}

/**
 * In the suitelet script, if the ticket record concerns an invoice,
 * the associated usage reports id are saved.
 * The files are loaded and their filenames and url are saved into the array of objects 'usage_report_array'.
 * This array is parsed and if the ids are not null, a row is added to the '#usage_report' table.
 * Otherwise, the section containing the table is hidden.
 * @param {Number} status_value
 */
function createUsageReportRows(status_value) {
    var inline_usage_report_table_html = '';

    var usage_report_array = nlapiGetFieldValue('custpage_usage_report_array');
    usage_report_array = JSON.parse(usage_report_array);
    console.log('usage_report_array : ', usage_report_array);

    if (!isNullorEmpty(usage_report_array)) {
        usage_report_array.forEach(function (usage_report_obj) {
            var usage_report_id = usage_report_obj.id;

            if (!isNullorEmpty(usage_report_id)) {
                var usage_report_filename = usage_report_obj.name;
                var usage_report_link = usage_report_obj.url;
                var usage_report_action_button = '<button class="btn btn-success edit_class glyphicon glyphicon-plus" type="button" data-toggle="tooltip" data-placement="right" data-ur-id="' + usage_report_id + '" title="Attach to email"></button>';

                inline_usage_report_table_html += '<tr class="text-center">';
                inline_usage_report_table_html += '<td headers="usage_report_filename"><a href="' + usage_report_link + '">' + usage_report_filename + '</a></td>';
                if (status_value != 3) {
                    inline_usage_report_table_html += '<td headers="usage_report_action">' + usage_report_action_button + '</td>';
                }
                inline_usage_report_table_html += '</tr>';
            }
        });
    } else {
        $('.usage_report').addClass('hide');
    }
    $('#usage_report tbody').html(inline_usage_report_table_html);
    // Each time the table is redrawn, we trigger tooltip for the new cells.
    $('[data-toggle="tooltip"]').tooltip();
}

/**
 * Depending on the number of buttons at the end of the page, their width and offset should change.
 * If there are 2 buttons, they have a width of 4 cols and an offset of 2 cols.
 * If there are 3 buttons, they have a width of 4 cols.
 * If there are 4 buttons, they have a width of 3 cols.
 */
function updateButtonsWidth() {
    var nb_buttons = $('.close_reopen_submit_ticket_section .row div:not(.hide)').length;
    $('.close_reopen_submit_ticket_section .row div').removeClass('col-xs-offset-2');
    switch (nb_buttons) {
        case 2:
            $('.close_reopen_submit_ticket_section .row div').addClass('col-xs-4');
            $('.close_reopen_submit_ticket_section .row div').removeClass('col-xs-3');
            $('.close_reopen_submit_ticket_section .row div:not(.hide)').eq(0).addClass('col-xs-offset-2');
            break;
        case 3:
            $('.close_reopen_submit_ticket_section .row div').addClass('col-xs-4');
            $('.close_reopen_submit_ticket_section .row div').removeClass('col-xs-3');
            break;
        case 4:
            $('.close_reopen_submit_ticket_section .row div').removeClass('col-xs-4');
            $('.close_reopen_submit_ticket_section .row div').addClass('col-xs-3');
            break;
    }
}

/**
 * Converts the selector field into either "Invoice number" or "Barcode number".
 * @param   {String} selector_name
 */
function setupSelectorInput(selector_name) {
    $('#selector_text').text(selector_name);
    switch (selector_name) {
        case 'INVOICE NUMBER':
            $('#selector_value').attr('placeholder', 'INV123456');
            break;

        case 'BARCODE NUMBER':
            $('#selector_value').attr('placeholder', 'MPEN123456');
            break;
    }
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

/**
 * Converts the date string in the "invoice_date" table to the format of "date_selected".
 * @param   {String}    invoice_date    ex: '4/6/2020'
 * @returns {String}    date            ex: '2020-06-04'
 */
function dateCreated2DateSelectedFormat(invoice_date) {
    // date_created = '4/6/2020'
    var date_array = invoice_date.split('/');
    // date_array = ["4", "6", "2020"]
    var year = date_array[2];
    var month = date_array[1];
    if (month < 10) {
        month = '0' + month;
    }
    var day = date_array[0];
    if (day < 10) {
        day = '0' + day;
    }
    return year + '-' + month + '-' + day;
}

/**
 * Calculates the reminder date based on the current date and the selector_type.
 */
function setReminderDate() {
    var ticket_id = nlapiGetFieldValue('custpage_ticket_id');
    var status_value = nlapiGetFieldValue('custpage_ticket_status_value');

    if (isNullorEmpty(ticket_id) || status_value == 3) {
        var selector_type = nlapiGetFieldValue('custpage_selector_type');

        var today = new Date;
        var today_day_in_month = today.getDate();
        var today_day_in_week = today.getDay();
        var today_month = today.getMonth();
        var today_year = today.getFullYear();

        switch (selector_type) {
            case 'barcode_number':
                var addNbDays = 1;
                if (today_day_in_week == 5) {
                    addNbDays += 2;
                }
                break;

            case 'invoice_number':
                var addNbDays = 3;
                if (today_day_in_week == 3 || today_day_in_week == 4 || today_day_in_week == 5) {
                    addNbDays += 2;
                }
                break;
        }

        var reminder_date = new Date(Date.UTC(today_year, today_month, today_day_in_month + addNbDays));
        reminder_date = reminder_date.toISOString().split('T')[0];
    } else {
        ticket_id = parseInt(ticket_id);
        var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
        var ticket_reminder_date = ticketRecord.getFieldValue('custrecord_reminder');
        var reminder_date = '';

        if (!isNullorEmpty(ticket_reminder_date)) {
            ticket_reminder_date = nlapiStringToDate(ticket_reminder_date);
            var reminder_date_day_in_month = ticket_reminder_date.getDate();
            var reminder_date_month = ticket_reminder_date.getMonth();
            var reminder_date_year = ticket_reminder_date.getFullYear();
            reminder_date = new Date(Date.UTC(reminder_date_year, reminder_date_month, reminder_date_day_in_month));
            reminder_date = reminder_date.toISOString().split('T')[0];
        }
    }
    $('#reminder').val(reminder_date);
}

/**
 * Creates the inline HTML of the Credit Memo table, 
 * with a button for the attachments if the ticket is not closed.
 * @param   {Number} status_value
 * @returns {String} inline_html_credit_memo_table
 */
function htmlCreditMemoTable(status_value) {
    var inline_html_credit_memo_table = '<table cellpadding="15" id="credit_memo" class="table table-responsive table-striped contacts tablesorter" cellspacing="0" style="width: 100%;border: 0">';
    inline_html_credit_memo_table += '<thead style="color: white;background-color: #607799;">';
    inline_html_credit_memo_table += '<tr>';
    inline_html_credit_memo_table += '<th style="vertical-align: middle;text-align: center;" id="credit_memo_number">';
    inline_html_credit_memo_table += '<b>CREDIT #</b>';
    inline_html_credit_memo_table += '</th>';
    inline_html_credit_memo_table += '<th style="vertical-align: middle;text-align: center;" id="credit_memo_date">';
    inline_html_credit_memo_table += '<b>DATE</b>';
    inline_html_credit_memo_table += '</th>';
    inline_html_credit_memo_table += '<th style="vertical-align: middle;text-align: center;" id="credit_memo_customer">';
    inline_html_credit_memo_table += '<b>CUSTOMER</b>';
    inline_html_credit_memo_table += '</th>';
    inline_html_credit_memo_table += '<th style="vertical-align: middle;text-align: center;" id="credit_memo_invoice_number">';
    inline_html_credit_memo_table += '<b>CREATED FROM</b>';
    inline_html_credit_memo_table += '</th>';
    if (status_value != 3) {
        inline_html_credit_memo_table += '<th style="vertical-align: middle;text-align: center;" id="credit_memo_action">';
        inline_html_credit_memo_table += '<b>ATTACH TO EMAIL</b>';
        inline_html_credit_memo_table += '</th>';
    }
    inline_html_credit_memo_table += '</tr>';
    inline_html_credit_memo_table += '</thead>';
    inline_html_credit_memo_table += '<tbody></tbody>';
    inline_html_credit_memo_table += '</table>';

    return inline_html_credit_memo_table;
}

function htmlUsageReportTable(status_value) {
    var inline_html_usage_report_table = '<table cellpadding="15" id="usage_report" class="table table-responsive table-striped contacts tablesorter" cellspacing="0" style="width: 100%;border: 0"><thead style="color: white;background-color: #607799;">';
    inline_html_usage_report_table += '<tr>';
    inline_html_usage_report_table += '<th style="vertical-align: middle;text-align: center;" id="usage_report_filename">';
    inline_html_usage_report_table += '<b>FILE NAME</b>';
    inline_html_usage_report_table += '</th>';
    if (status_value != 3) {
        inline_html_usage_report_table += '<th style="vertical-align: middle;text-align: center;" id="usage_report_action">';
        inline_html_usage_report_table += '<b>ATTACH TO EMAIL</b>';
        inline_html_usage_report_table += '</th>';
    }
    inline_html_usage_report_table += '</tr>';
    inline_html_usage_report_table += '</thead>';
    inline_html_usage_report_table += '<tbody></tbody>';
    inline_html_usage_report_table += '</table>';

}

/**
 * @param   {Number} x
 * @returns {String} The same number, formatted in Australian dollars.
 */
function financial(x) {
    if (typeof (x) === 'string') {
        x = parseFloat(x);
    }
    if (isNullorEmpty(x)) {
        return "$0.00";
    } else {
        return x.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
    }
}

/**
 * Whether the user is from the finance team, 
 * or a Data Systems Co-ordinator, MailPlus Administration or Administrator user.
 * @param   {Number} userRole
 * @returns {Boolean}
 */
function isFinanceRole(userRole) {
    // 1001, 1031 and 1023 are finance roles
    // 1032 is the Data Systems Co-ordinator role (to be deleted in prod)
    // 1006 is the Mail Plus Administration role.
    // 3 is the Administrator role.
    return ((userRole == 1001 || userRole == 1031 || userRole == 1023) || ((userRole == 1032) || (userRole == 1006) || (userRole == 3)));
}