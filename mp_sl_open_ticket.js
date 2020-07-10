/**
 * Module Description
 * 
 * NSVersion    Date                Author         
 * 3.00         2020-07-06 16:40:00 Raphael
 *
 * Description: A ticketing system for the Customer Service.
 * 
 * @Last Modified by:   raphaelchalicarnemailplus
 * @Last Modified time: 2020-07-10 14:41:00
 *
 */

var baseURL = 'https://1048144.app.netsuite.com';
if (nlapiGetContext().getEnvironment() == "SANDBOX") {
    baseURL = 'https://1048144-sb3.app.netsuite.com';
}
var userRole = parseInt(nlapiGetContext().getRole());

function openTicket(request, response) {
    if (request.getMethod() == "GET") {
        var ticket_id = null;
        var customer_id = null;
        var selector_id = null;
        var selector_number = '';
        var selector_type = 'barcode_number';
        var date_created = '';
        var status_value = null;
        var status = '';
        var customer_name = '';
        var daytodayphone = '';
        var daytodayemail = '';
        var accountsphone = '';
        var accountsemail = '';
        var zee_id = null;
        var franchisee_name = '';
        var zee_main_contact_name = '';
        var zee_email = '';
        var zee_main_contact_phone = '';
        var maap_bank_account_number = null;
        var maap_parent_bank_account_number = null;
        var selected_invoice_method_id = null;
        var accounts_cc_email = '';
        var mpex_po_number = '';
        var customer_po_number = '';
        var selected_invoice_cycle_id = null;
        var list_toll_issues = '';
        var list_resolved_toll_issues = '';
        var list_mp_ticket_issues = '';
        var list_resolved_mp_ticket_issues = '';
        var list_invoice_issues = '';
        var list_resolved_invoice_issues = '';
        var comment = '';

        // Load params
        var params = request.getParameter('custparam_params');
        var param_selector_type = request.getParameter('param_selector_type');
        if (!isNullorEmpty(param_selector_type)) {
            selector_type = param_selector_type;
        }

        if (!isNullorEmpty(params)) {
            params = JSON.parse(params);

            // Coming from the ticket_contact page or the edit_ticket page
            if (!isNullorEmpty(params.selector_number) && !isNullorEmpty(params.selector_type)) {
                selector_number = params.selector_number;
                selector_type = params.selector_type;

                //Coming from the ticket_contact page
                if (!isNullorEmpty(params.custid)) {
                    customer_id = params.custid;
                }
                nlapiLogExecution('DEBUG', 'customer_id after ticket_contact_page : ', customer_id);

                // Coming from the edit_ticket page
                if (!isNullorEmpty(params.ticket_id)) {
                    ticket_id = parseInt(params.ticket_id);

                    // Load ticket data
                    var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
                    date_created = ticketRecord.getFieldValue('created');
                    status_value = ticketRecord.getFieldValue('custrecord_ticket_status');
                    status = ticketRecord.getFieldText('custrecord_ticket_status');
                    customer_id = ticketRecord.getFieldValue('custrecord_customer1');
                    nlapiLogExecution('DEBUG', 'customer_id after edit_ticket page : ', customer_id);
                    customer_name = ticketRecord.getFieldText('custrecord_customer1');

                    if (!isNullorEmpty(customer_id)) {
                        var customerRecord = nlapiLoadRecord('customer', customer_id);
                        daytodayphone = customerRecord.getFieldValue('phone');
                        daytodayemail = customerRecord.getFieldValue('custentity_email_service');
                    }

                    if (!isNullorEmpty(zee_id)) {
                        zee_id = ticketRecord.getFieldValue('custrecord_zee');
                        franchisee_name = ticketRecord.getFieldText('custrecord_zee');
                        var zeeRecord = nlapiLoadRecord('partner', zee_id);
                        zee_main_contact_name = zeeRecord.getFieldValue('custentity3');
                        zee_email = zeeRecord.getFieldValue('email');
                        zee_main_contact_phone = zeeRecord.getFieldValue('custentity2');
                    }

                    switch (selector_type) {
                        case 'barcode_number':
                            selector_id = ticketRecord.getFieldValue('custrecord_barcode_number');

                            list_toll_issues = ticketRecord.getFieldValues('custrecord_toll_issues');
                            list_toll_issues = java2jsArray(list_toll_issues);

                            list_resolved_toll_issues = ticketRecord.getFieldValues('custrecord_resolved_toll_issues');
                            list_resolved_toll_issues = java2jsArray(list_resolved_toll_issues);

                            break;

                        case 'invoice_number':
                            selector_id = ticketRecord.getFieldValue('custrecord_invoice_number');

                            accountsphone = customerRecord.getFieldValue('altphone');
                            accountsemail = customerRecord.getFieldValue('email');

                            maap_bank_account_number = customerRecord.getFieldValue('custentity_maap_bankacctno');
                            maap_parent_bank_account_number = customerRecord.getFieldValue('custentity_maap_bankacctno_parent');

                            selected_invoice_method_id = customerRecord.getFieldValue('custentity_invoice_method');
                            accounts_cc_email = customerRecord.getFieldValue('custentity_accounts_cc_email');
                            mpex_po_number = customerRecord.getFieldValue('custentity_mpex_po');
                            customer_po_number = customerRecord.getFieldValue('custentity11');
                            selected_invoice_cycle_id = customerRecord.getFieldValue('custentity_mpex_invoicing_cycle');

                            list_invoice_issues = ticketRecord.getFieldValues('custrecord_invoice_issues');
                            list_invoice_issues = java2jsArray(list_invoice_issues);

                            list_resolved_invoice_issues = ticketRecord.getFieldValues('custrecord_resolved_invoice_issues');
                            list_resolved_invoice_issues = java2jsArray(list_resolved_invoice_issues);
                            break;
                    }

                    list_mp_ticket_issues = ticketRecord.getFieldValues('custrecord_mp_ticket_issue');
                    list_mp_ticket_issues = java2jsArray(list_mp_ticket_issues);

                    list_resolved_mp_ticket_issues = ticketRecord.getFieldValues('custrecord_resolved_mp_ticket_issue');
                    list_resolved_mp_ticket_issues = java2jsArray(list_resolved_mp_ticket_issues);

                    comment = ticketRecord.getFieldValue('custrecord_comment');
                }
            }
        }

        if (!isNullorEmpty(ticket_id)) {
            var form = nlapiCreateForm('Edit Ticket - MPSD' + ticket_id);
        } else {
            var form = nlapiCreateForm('Open New Ticket');
        }

        // Load jQuery
        var inlineHtml = '<script src="https://code.jquery.com/jquery-1.12.4.min.js" integrity="sha384-nvAa0+6Qg9clwYCGGPpDQLVpLNn0fRaROjHqs13t4Ggj3Ez50XnGQqc/r8MhnRDZ" crossorigin="anonymous"></script>';

        // Load Bootstrap
        inlineHtml += '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous">';
        inlineHtml += '<script src="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js" integrity="sha384-aJ21OjlMXNL5UyIl/XNwTMqvzeRMZH2w8c5cRVpzpU8Y5bApTppSuUkhZXN0VxHd" crossorigin="anonymous"></script>';

        // Load DataTables
        inlineHtml += '<link rel="stylesheet" type="text/css" href="//cdn.datatables.net/1.10.21/css/jquery.dataTables.min.css">';
        inlineHtml += '<script type="text/javascript" charset="utf8" src="//cdn.datatables.net/1.10.21/js/jquery.dataTables.min.js"></script>';

        // Load Summernote css/js
        inlineHtml += '<link href="https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.9/summernote.css" rel="stylesheet">';
        inlineHtml += '<script src="https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.9/summernote.js"></script>';

        // Load bootstrap-select
        inlineHtml += '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-select@1.13.14/dist/css/bootstrap-select.min.css">';
        inlineHtml += '<script src="https://cdn.jsdelivr.net/npm/bootstrap-select@1.13.14/dist/js/bootstrap-select.min.js"></script>';

        // Load Netsuite stylesheet and script
        inlineHtml += '<link rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/>';
        inlineHtml += '<script src="https://1048144.app.netsuite.com/core/media/media.nl?id=2060797&c=1048144&h=ef2cda20731d146b5e98&_xt=.js"></script>';
        inlineHtml += '<link type="text/css" rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css">';
        inlineHtml += '<style>.mandatory{color:red;}</style>';

        // Define alert window.
        inlineHtml += '<div class="container" style="margin-top:14px;" hidden><div id="alert" class="alert alert-danger fade in"></div></div>';

        // Define information window.
        inlineHtml += '<div class="container" hidden><p id="info" class="alert alert-info"></p></div>';

        inlineHtml += selectorSection(ticket_id, selector_number, selector_type);
        if (!isNullorEmpty(ticket_id)) {
            inlineHtml += ticketSection(date_created, status);
        }
        if (isNullorEmpty(ticket_id) || (!isNullorEmpty(ticket_id) && !isNullorEmpty(customer_id))) {
            inlineHtml += customerSection(customer_name);
            inlineHtml += daytodayContactSection(selector_type, daytodayphone, daytodayemail);
            inlineHtml += accountsContactSection(selector_type, accountsphone, accountsemail);
            inlineHtml += maapBankAccountSection(maap_bank_account_number, maap_parent_bank_account_number, selector_type);
        }
        if (isNullorEmpty(ticket_id) || (!isNullorEmpty(ticket_id) && !isNullorEmpty(zee_id))) {
            inlineHtml += franchiseeMainContactSection(franchisee_name, zee_main_contact_name, zee_email, zee_main_contact_phone);
        }

        if (isNullorEmpty(ticket_id) || (!isNullorEmpty(ticket_id) && !isNullorEmpty(customer_id))) {
            inlineHtml += otherInvoiceFieldsSection(selected_invoice_method_id, accounts_cc_email, mpex_po_number, customer_po_number, selected_invoice_cycle_id, selector_type);
            inlineHtml += mpexContactSection();
            inlineHtml += openInvoicesSection(selector_type);
            inlineHtml += sendEmailSection(ticket_id, status_value);
        }

        inlineHtml += issuesHeader();
        inlineHtml += tollIssuesSection(list_toll_issues, list_resolved_toll_issues, status_value, selector_type);
        inlineHtml += mpTicketIssuesSection(list_mp_ticket_issues, list_resolved_mp_ticket_issues, status_value, selector_type);
        inlineHtml += invoiceIssuesSection(list_invoice_issues, list_resolved_invoice_issues, status_value, selector_type);
        inlineHtml += usernoteSection(selector_type, status_value);
        inlineHtml += commentSection(comment, selector_type, status_value);
        inlineHtml += ownerSection();
        inlineHtml += dataTablePreview();
        inlineHtml += closeReopenSubmitTicketButton(ticket_id, status_value);


        form.addField('preview_table', 'inlinehtml', '').setLayoutType('outsidebelow', 'startrow').setLayoutType('midrow').setDefaultValue(inlineHtml);
        form.addField('custpage_selector_number', 'text', 'Selector Number').setDisplayType('hidden').setDefaultValue(selector_number);
        form.addField('custpage_selector_type', 'text', 'Selector Type').setDisplayType('hidden').setDefaultValue(selector_type);
        if (!isNullorEmpty(ticket_id)) {
            form.addField('custpage_ticket_id', 'text', 'Ticket ID').setDisplayType('hidden').setDefaultValue(ticket_id);
        } else {
            form.addField('custpage_ticket_id', 'text', 'Ticket ID').setDisplayType('hidden');
        }
        form.addField('custpage_selector_id', 'text', 'Selector ID').setDisplayType('hidden').setDefaultValue(selector_id);
        form.addField('custpage_selector_issue', 'text', 'Barcode issue').setDisplayType('hidden').setDefaultValue('F');
        form.addField('custpage_customer_id', 'text', 'Customer ID').setDisplayType('hidden').setDefaultValue(customer_id);
        form.addField('custpage_zee_id', 'text', 'Franchisee ID').setDisplayType('hidden').setDefaultValue(zee_id);
        form.addField('custpage_ticket_status_value', 'text', 'Status Value').setDisplayType('hidden').setDefaultValue(status_value);
        form.addField('custpage_created_ticket', 'text', 'Created Ticket').setDisplayType('hidden').setDefaultValue('F');
        if (!isNullorEmpty(ticket_id)) {
            form.addSubmitButton('Update Ticket');
        } else {
            form.addSubmitButton('Open Ticket');
        }
        if (status_value != 3) {
            form.addButton('custpage_escalate', 'Escalate', 'onEscalate()');
        }
        form.addButton('custpage_cancel', 'Cancel', 'onCancel()');
        form.setScript('customscript_cl_open_ticket');
        response.writePage(form);
    } else {
        var created_ticket = request.getParameter('custpage_created_ticket');
        if (created_ticket == 'T') {
            var ticket_id = request.getParameter('custpage_ticket_id');
            var selector_number = request.getParameter('custpage_selector_number');
            var selector_type = request.getParameter('custpage_selector_type');
            custparam_params = {
                ticket_id: parseInt(ticket_id),
                selector_number: selector_number,
                selector_type: selector_type
            }
            custparam_params = JSON.stringify(custparam_params);
            var params2 = { custparam_params: custparam_params };
            // If the ticket was just created, the user is redirected to the "Edit Ticket" page
            nlapiSetRedirectURL('SUITELET', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket', null, params2);
        } else {
            // If the ticket was updated, the user is redirected to the "View MP Tickets" page
            nlapiSetRedirectURL('SUITELET', 'customscript_sl_edit_ticket', 'customdeploy_sl_edit_ticket', null, null);
        }
    }
}

/**
 * The "Barcode number" OR "Invoice Number" input field.
 * If there is a TICKET ID, we are in the "Edit Ticket", so we display the Ticket ID field and the selector field is disabled.
 * @param   {Number}    ticket_id
 * @param   {String}    selector_number
 * @param   {String}    selector_type
 * @return  {String}    inlineQty
 */
function selectorSection(ticket_id, selector_number, selector_type) {
    if (isNullorEmpty(selector_number)) { selector_number = ''; }

    // Ticket details header
    var inlineQty = '<div class="form-group container tickets_details_header_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 heading2">';
    inlineQty += '<h4><span class="label label-default col-xs-12">TICKET DETAILS</span></h4>';
    inlineQty += '</div></div></div>';

    inlineQty += '<div class="form-group container selector_section">';
    inlineQty += '<div class="row">';

    if (!isNullorEmpty(ticket_id)) {
        // Ticket ID field
        inlineQty += '<div class="col-xs-6 ticket_id">';
        inlineQty += '<div class="input-group">';
        inlineQty += '<span class="input-group-addon" id="ticket_id_text">TICKET ID</span>';
        inlineQty += '<input id="ticket_id" value="MPSD' + ticket_id + '" class="form-control ticket_id" disabled />';
        inlineQty += '</div></div>';

        // Selector Number field
        inlineQty += '<div class="col-xs-6 selector_number">';
        inlineQty += '<div class="input-group">';
        switch (selector_type) {
            case 'barcode_number':
                inlineQty += '<span class="input-group-addon" id="selector_text">BARCODE NUMBER</span>';
                break;
            case 'invoice_number':
                inlineQty += '<span class="input-group-addon" id="selector_text">INVOICE NUMBER</span>';
                break;
        }
        inlineQty += '<input id="selector_value" value="' + selector_number + '" class="form-control selector_value" disabled>';
        inlineQty += '</div></div></div></div>';

    } else {
        inlineQty += '<div class="col-xs-12 selector_number">';
        inlineQty += '<div class="input-group">';
        switch (selector_type) {
            case 'barcode_number':
                inlineQty += '<span class="input-group-addon" id="selector_text">BARCODE NUMBER</span>';
                break;
            case 'invoice_number':
                inlineQty += '<span class="input-group-addon" id="selector_text">INVOICE NUMBER</span>';
                break;
        }
        inlineQty += '<div class="input-group-btn">';
        inlineQty += '<button tabindex="-1" data-toggle="dropdown" class="btn btn-default dropdown-toggle" type="button">';
        inlineQty += '<span class="caret"></span>';
        inlineQty += '<span class="sr-only">Toggle Dropdown</span>';
        inlineQty += '</button>';
        inlineQty += '<ul class="dropdown-menu hide" style="list-style:none;margin: 2px 0 0;">';
        inlineQty += '<li><a href="#">BARCODE NUMBER</a></li>';
        inlineQty += '<li><a href="#">INVOICE NUMBER</a></li>';
        inlineQty += '</ul>';
        inlineQty += '</div>';
        switch (selector_type) {
            case 'barcode_number':
                inlineQty += '<input id="selector_value" class="form-control selector_value" placeholder="MPEN123456">';
                break;
            case 'invoice_number':
                inlineQty += '<input id="selector_value" class="form-control selector_value" placeholder="INV123456">';
                break;
        }
        inlineQty += '</div></div></div></div>';
    }

    return inlineQty;
}

/**
 * The informations regarding the ticket being edited.
 * @param   {String}    date_created
 * @param   {String}    status
 * @return  {String}    inlineQty
 */
function ticketSection(date_created, status) {
    if (isNullorEmpty(date_created)) { date_created = ''; }
    if (isNullorEmpty(status)) { status = ''; }

    var inlineQty = '<div class="form-group container created_status_section">';
    inlineQty += '<div class="row">';

    // Date created field
    inlineQty += '<div class="col-xs-6 date_created">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="date_created_text">DATE CREATED</span>';
    inlineQty += '<input id="date_created" value="' + date_created + '" class="form-control date_created" disabled />';
    inlineQty += '</div></div>';

    // Status field
    inlineQty += '<div class="col-xs-6 status">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="status_text">STATUS</span>';
    inlineQty += '<input id="status" value="' + status + '" class="form-control status" disabled />';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * The Customer name field.
 * The customer name field should be automatically filled based on the Selector number value.
 * @param   {String}    customer_name
 * @return  {String}    inlineQty
 */
function customerSection(customer_name) {
    if (isNullorEmpty(customer_name)) { customer_name = ''; }

    // Customer Section
    var inlineQty = '<div class="form-group container customer_section">';
    inlineQty += '<div class="row">';
    // Customer name field
    inlineQty += '<div class="col-xs-12 customer_name">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="customer_name_text">CUSTOMER NAME</span>';
    inlineQty += '<input id="customer_name" value="' + customer_name + '" class="form-control customer_name" disabled>';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * The day to day phone and email fields of the customer.
 * These fields should be automatically filled based on the Selector number value.
 * @param   {String}    selector_type
 * @param   {String}    daytodayphone
 * @param   {String}    daytodayemail
 * @return  {String}    inlineQty
 */
function daytodayContactSection(selector_type, daytodayphone, daytodayemail) {
    if (isNullorEmpty(daytodayphone)) { daytodayphone = ''; }
    if (isNullorEmpty(daytodayemail)) { daytodayemail = ''; }

    var disabled = 'disabled';
    if ((isFinanceRole(userRole)) && selector_type == 'invoice_number') {
        disabled = '';
    }

    var inlineQty = '<div class="form-group container daytodaycontact_section">';
    inlineQty += '<div class="row">';

    // Day to day email field
    inlineQty += '<div class="col-xs-6 daytodayemail_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="daytodayemail_text">DAY-TO-DAY EMAIL</span>';
    inlineQty += '<input id="daytodayemail" type="email" value="' + daytodayemail + '" class="form-control daytodayemail" ' + disabled + ' />';
    inlineQty += '</div></div>';

    // Day to day phone field
    inlineQty += '<div class="col-xs-6 daytodayphone_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="daytodayphone_text">DAY-TO-DAY PHONE</span>';
    inlineQty += '<input id="daytodayphone" type="tel" value="' + daytodayphone + '" class="form-control daytodayphone" ' + disabled + ' />';
    inlineQty += '<div class="input-group-btn"><button type="button" class="btn btn-success" id="call_daytoday_phone"><span class="glyphicon glyphicon-earphone"></span></button></div>';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * The accounts phone and email fields of the customer.
 * These fields should be automatically filled based on the Invoice number value.
 * @param   {String}    selector_type
 * @param   {String}    accountsphone
 * @param   {String}    accountsemail
 * @return  {String}    inlineQty
 */
function accountsContactSection(selector_type, accountsphone, accountsemail) {
    if (isNullorEmpty(accountsphone)) { accountsphone = ''; }
    if (isNullorEmpty(accountsemail)) { accountsemail = ''; }

    if (selector_type == 'invoice_number') {
        var inlineQty = '<div class="form-group container accountscontact_section">';

        if (isFinanceRole(userRole)) {
            var disabled = '';
        } else {
            var disabled = 'disabled';
        }

    } else {
        var inlineQty = '<div class="form-group container accountscontact_section hide">';
        var disabled = 'disabled';
    }
    inlineQty += '<div class="row">';

    // Accounts email field
    inlineQty += '<div class="col-xs-6 accountsemail_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="accountsemail_text">ACCOUNTS EMAIL</span>';
    inlineQty += '<input id="accountsemail" type="email" value="' + accountsemail + '" class="form-control accountsemail" ' + disabled + ' />';
    inlineQty += '</div></div>';

    // Accounts phone field
    inlineQty += '<div class="col-xs-6 accountsphone_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="accountsphone_text">ACCOUNTS PHONE</span>';
    inlineQty += '<input id="accountsphone" type="tel" value="' + accountsphone + '" class="form-control accountsphone" ' + disabled + ' />';
    inlineQty += '<div class="input-group-btn"><button type="button" class="btn btn-success" id="call_accounts_phone"><span class="glyphicon glyphicon-earphone"></span></button></div>';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * 
 * @param   {Number} maap_bank_account_number 
 * @param   {Number} maap_parent_bank_account_number 
 * @param   {String} selector_type
 * @returns {String} inlineQty
 */
function maapBankAccountSection(maap_bank_account_number, maap_parent_bank_account_number, selector_type) {

    switch (selector_type) {
        case 'barcode_number':
            var inlineQty = '<div class="form-group container accounts_number_section hide">';
            break;

        case 'invoice_number':
            var inlineQty = '<div class="form-group container accounts_number_section">';
            break;
    }

    inlineQty += '<div class="row">';
    // MAAP Bank Account # field
    inlineQty += '<div class="col-xs-6 account_number_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="account_number_text">MAAP BANK ACCOUNT #</span>';
    inlineQty += '<input id="account_number" type="number" value="' + maap_bank_account_number + '" class="form-control account_number" disabled />';
    inlineQty += '</div></div>';

    // MAAP Parent Bank Account # field
    inlineQty += '<div class="col-xs-6 parent_account_number_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="parent_account_number_text">MAAP PARENT BANK ACCOUNT #</span>';
    inlineQty += '<input id="parent_account_number" type="number" value="' + maap_parent_bank_account_number + '" class="form-control parent_account_number" disabled />';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}


/**
 * The Franchisee name, and its main contact name and phone number fields.
 * These fields should be automatically filled based on the Selector number value.
 * @param   {String}    franchisee_name
 * @param   {String}    zee_main_contact_name
 * @param   {String}    zee_email
 * @param   {String}    zee_main_contact_phone
 * @return  {String}    inlineQty
 */
function franchiseeMainContactSection(franchisee_name, zee_main_contact_name, zee_email, zee_main_contact_phone) {
    if (isNullorEmpty(franchisee_name)) { franchisee_name = ''; }
    if (isNullorEmpty(zee_main_contact_name)) { zee_main_contact_name = ''; }
    if (isNullorEmpty(zee_email)) { zee_email = ''; }
    if (isNullorEmpty(zee_main_contact_phone)) { zee_main_contact_phone = ''; }

    var inlineQty = '<div class="form-group container zee_main_contact_section">';
    inlineQty += '<div class="row">';

    // Franchisee name field
    inlineQty += '<div class="col-xs-6 franchisee_name">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="franchisee_name_text">FRANCHISEE NAME</span>';
    inlineQty += '<input id="franchisee_name" value="' + franchisee_name + '" class="form-control franchisee_name" disabled>';
    inlineQty += '</div></div>';

    // Franchisee main contact name field
    inlineQty += '<div class="col-xs-6 zee_main_contact_name">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="zee_main_contact_name_text">MAIN CONTACT</span>';
    inlineQty += '<input id="zee_main_contact_name" value="' + zee_main_contact_name + '" class="form-control zee_main_contact_name" disabled>';
    inlineQty += '</div></div></div></div>';

    // Franchisee contact details
    inlineQty += '<div class="form-group container zee_main_contact_section">';
    inlineQty += '<div class="row">';

    // Franchisee email field
    inlineQty += '<div class="col-xs-6 zee_email">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="zee_email_text">FRANCHISEE EMAIL</span>';
    inlineQty += '<input id="zee_email" type="email" value="' + zee_email + '" class="form-control accountsemail" disabled />';
    inlineQty += '</div></div>';
    // Franchisee main contact phone field
    inlineQty += '<div class="col-xs-6 zee_main_contact_phone">'
    inlineQty += '<div class="input-group">'
    inlineQty += '<span class="input-group-addon" id="zee_main_contact_phone_text">FRANCHISEE PHONE</span>';
    inlineQty += '<input id="zee_main_contact_phone" type="tel" value="' + zee_main_contact_phone + '" class="form-control zee_main_contact_phone" disabled />';
    inlineQty += '<div class="input-group-btn"><button type="button" class="btn btn-success" id="call_zee_main_contact_phone"><span class="glyphicon glyphicon-earphone"></span></button>';
    inlineQty += '</div>';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * These fields should be displayed only for an Invoice ticket, and be edited only by the finance team.
 * - Invoice Method field
 * - Accounts cc email field
 * - MPEX PO # field
 * - Customer PO # field
 * - MPEX Invoicing Cycle field
 * @param   {Number} selected_invoice_method_id 
 * @param   {String} accounts_cc_email 
 * @param   {String} mpex_po_number 
 * @param   {String} customer_po_number 
 * @param   {Number} selected_invoice_cycle_id 
 * @param   {String} selector_type 
 * @return  {String} inlineQty
 */
function otherInvoiceFieldsSection(selected_invoice_method_id, accounts_cc_email, mpex_po_number, customer_po_number, selected_invoice_cycle_id, selector_type) {
    if (isNullorEmpty(accounts_cc_email)) { accounts_cc_email = '' }
    if (isNullorEmpty(mpex_po_number)) { mpex_po_number = '' }
    if (isNullorEmpty(customer_po_number)) { customer_po_number = '' }

    var invoice_method_columns = new Array();
    invoice_method_columns[0] = new nlobjSearchColumn('name');
    invoice_method_columns[1] = new nlobjSearchColumn('internalId');
    var invoiceMethodResultSet = nlapiSearchRecord('customlist_invoice_method', null, null, invoice_method_columns);

    switch (selector_type) {
        case 'barcode_number':
            var inlineQty = '<div class="form-group container invoice_method_accounts_cc_email_section hide">';
            var disabled = 'disabled';
            break;

        case 'invoice_number':
            var inlineQty = '<div class="form-group container invoice_method_accounts_cc_email_section">';
            if (isFinanceRole(userRole)) {
                var disabled = '';
            } else {
                var disabled = 'disabled';
            }
            break;
    }

    inlineQty += '<div class="row">';

    // Invoice Method field
    inlineQty += '<div class="col-xs-6 invoice_method_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="invoice_method_text">INVOICE METHOD</span>';
    inlineQty += '<select id="invoice_method" class="form-control" ' + disabled + '>';
    inlineQty += '<option></option>';

    invoiceMethodResultSet.forEach(function (invoiceMethodResult) {
        var invoice_method_name = invoiceMethodResult.getValue('name');
        var invoice_method_id = invoiceMethodResult.getValue('internalId');

        if (invoice_method_id == selected_invoice_method_id) {
            inlineQty += '<option value="' + invoice_method_id + '" selected>' + invoice_method_name + '</option>';
        } else {
            inlineQty += '<option value="' + invoice_method_id + '">' + invoice_method_name + '</option>';
        }
    });
    inlineQty += '</select>';
    inlineQty += '</div></div>';

    // Accounts cc email field -->
    inlineQty += '<div class="col-xs-6 accounts_cc_email_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="accounts_cc_email_text">ACCOUNTS CC EMAIL</span>';
    inlineQty += '<input id="accounts_cc_email" type="email" value="' + accounts_cc_email + '" class="form-control accounts_cc_email"  ' + disabled + '/>';
    inlineQty += '</div></div></div></div>';

    switch (selector_type) {
        case 'barcode_number':
            inlineQty += '<div class="form-group container mpex_customer_po_number_section hide">';
            break;

        case 'invoice_number':
            inlineQty += '<div class="form-group container mpex_customer_po_number_section">';
            break;
    }
    inlineQty += '<div class="row">';
    // MPEX PO #
    inlineQty += '<div class="col-xs-6 mpex_po_number_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="mpex_po_number_text">MPEX PO #</span>';
    inlineQty += '<input id="mpex_po_number" value="' + mpex_po_number + '" class="form-control mpex_po_number"  ' + disabled + '/>';
    inlineQty += '</div></div>';
    // Customer PO #
    inlineQty += '<div class="col-xs-6 customer_po_number_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="customer_po_number_text">CUSTOMER PO #</span>';
    inlineQty += '<input id="customer_po_number" value="' + customer_po_number + '" class="form-control customer_po_number"  ' + disabled + '/>';
    inlineQty += '</div></div></div></div>';

    // MPEX Invoicing Cycle
    var invoice_cycle_columns = new Array();
    invoice_cycle_columns[0] = new nlobjSearchColumn('name');
    invoice_cycle_columns[1] = new nlobjSearchColumn('internalId');
    var invoiceCycleResultSet = nlapiSearchRecord('customlist_invoicing_cyle', null, null, invoice_cycle_columns);

    switch (selector_type) {
        case 'barcode_number':
            inlineQty += '<div class="form-group container mpex_invoicing_cycle_section hide">';
            break;

        case 'invoice_number':
            inlineQty += '<div class="form-group container mpex_invoicing_cycle_section">';
            break;
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 mpex_invoicing_cycle_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="mpex_invoicing_cycle_text">MPEX INVOICING CYCLE</span>';
    inlineQty += '<select id="mpex_invoicing_cycle" class="form-control mpex_invoicing_cycle" ' + disabled + '>';
    inlineQty += '<option></option>';

    invoiceCycleResultSet.forEach(function (invoiceCycleResult) {
        var invoice_cycle_name = invoiceCycleResult.getValue('name');
        var invoice_cycle_id = invoiceCycleResult.getValue('internalId');

        if (invoice_cycle_id == selected_invoice_cycle_id) {
            inlineQty += '<option value="' + invoice_cycle_id + '" selected>' + invoice_cycle_name + '</option>';
        } else {
            inlineQty += '<option value="' + invoice_cycle_id + '">' + invoice_cycle_name + '</option>';
        }
    });
    inlineQty += '</select>';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * The customer contact details section.
 * Possibility for the user to add / edit the contacts.
 * @return  {String}    inlineQty
 */
function mpexContactSection() {

    // Contact details header
    var inlineQty = '<div class="form-group container mpex_contact_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 heading2">';
    inlineQty += '<h4><span class="label label-default col-xs-12">CONTACT DETAILS</span></h4>';
    inlineQty += '</div>';
    inlineQty += '</div></div>';

    // Contact table
    inlineQty += '<div class="form-group container contacts_section" style="font-size: small;">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 contacts_div">';
    // Since the table is not displayed correctly when added through suitelet, 
    // It is added with jQuery in the pageInit() function in the client script 'mp_cl_open_ticket.js'.
    inlineQty += '</div>';
    inlineQty += '</div>';
    inlineQty += '</div>';

    // Add/edit contacts button
    inlineQty += '<div class="form-group container reviewcontacts_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-4 col-xs-offset-4 reviewcontacts">';
    inlineQty += '<input type="button" value="ADD/EDIT CONTACTS" class="form-control btn btn-primary" id="reviewcontacts" />';
    inlineQty += '</div></div></div>';

    return inlineQty;
};

/**
 * A Datatable displaying the open invoices of the customer
 * @param {String} selector_type
 * @return  {String}    inlineQty 
 */
function openInvoicesSection(selector_type) {
    // Open invoices header
    switch (selector_type) {
        case 'barcode_number':
            var inlineQty = '<div class="form-group container open_invoices open_invoices_section hide">';
            break;

        case 'invoice_number':
            var inlineQty = '<div class="form-group container open_invoices open_invoices_section">';
            break;
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 heading2">';
    inlineQty += '<h4><span class="label label-default col-xs-12">OPEN INVOICES</span></h4>';
    inlineQty += '</div></div></div>';

    // Open Invoices Datatable
    switch (selector_type) {
        case 'barcode_number':
            inlineQty += '<div class="form-group container open_invoices open_invoices_table hide">';
            break;

        case 'invoice_number':
            inlineQty += '<div class="form-group container open_invoices open_invoices_table">';
            break;
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12" id="open_invoice_dt_div">';
    // It is inserted as inline html in the script mp_cl_open_ticket
    inlineQty += '</div></div></div>';

    return inlineQty;
}

/**
 * The "Send Email" section.
 * Possibility for the user to send an email to the customer, based on selected templates.
 * @param   {Number}    ticket_id 
 * @param   {Number}    status_value
 * @returns {String}    inlineQty
 */
function sendEmailSection(ticket_id, status_value) {
    if (isNullorEmpty(ticket_id) || status_value == 3) {
        // The section is hidden here rather than in the openTicket function,
        // because we use the section to send an acknoledgement email when a ticket is opened.
        var inlineQty = '<div id="send_email_container" class="send_email hide">';
    } else {
        var inlineQty = '<div id="send_email_container" class="send_email">';
    }
    inlineQty += '<div class="form-group container send_email header_section">';

    // Send email header
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 heading2">';
    inlineQty += '<h4><span class="label label-default col-xs-12">SEND EMAILS</span></h4>';
    inlineQty += '</div></div></div>';

    // Row addressees
    inlineQty += '<div class="form-group container send_email adressees_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-6 to_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">TO<span class="mandatory">*</span></span>';
    inlineQty += '<select id="send_to" class="form-control ">';
    // Options added in the createContactsRows() function, in the client script.
    inlineQty += '</select>';
    inlineQty += '</div></div>';
    inlineQty += '<div class="col-xs-6 cc_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">CC </span>';
    inlineQty += '<input id="send_cc" class="form-control " />';
    inlineQty += '</div></div></div></div>';

    // Row Template
    inlineQty += '<div class="form-group container send_email template_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 template_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">TEMPLATE<span class="mandatory">*</span></span>';
    inlineQty += '<select id="template" class="form-control">';
    inlineQty += '<option></option>';

    // Load the template options
    var templatesSearch = nlapiLoadSearch('customrecord_camp_comm_template', 'customsearch_cctemplate_mp_ticket');
    var templatesSearchResults = templatesSearch.runSearch();
    templatesSearchResults.forEachResult(function (templatesSearchResult) {
        // var tempId = templatesSearchResult.getValue('internalid');
        var tempId = templatesSearchResult.getId();
        var tempName = templatesSearchResult.getValue('name');
        inlineQty += '<option value="' + tempId + '">' + tempName + '</option>';
        return true;
    });

    inlineQty += '</select>';
    inlineQty += '</div></div></div></div>';

    // Row Subject
    inlineQty += '<div class="form-group container send_email subject_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 subject_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">SUBJECT<span class="mandatory">*</span></span>';
    inlineQty += '<input id="subject" class="form-control" />';
    inlineQty += '</div></div></div></div>';

    // Row Body
    inlineQty += '<div class="form-group container send_email body_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 body_section">';
    inlineQty += '<div id="email_body"></div>';
    inlineQty += '</div></div></div>';

    // SEND EMAIL button
    inlineQty += '<div class="form-group container send_email button_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-4 col-xs-offset-4 send_email_btn">';
    inlineQty += '<input type="button" value="SEND EMAIL" class="form-control btn btn-primary" id="send_email" />';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
};

/**
 * @return  {String}    inlineQty
 */
function issuesHeader() {
    var inlineQty = '<div class="form-group container toll_issues_header_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 heading1">';
    inlineQty += '<h4><span class="form-group label label-default col-xs-12">ISSUES</span></h4>';
    inlineQty += '</div></div></div>';
    return inlineQty;
}

/**
 * The multiselect TOLL issues dropdown
 * @param   {Array}     list_toll_issues
 * @param   {Array}     list_resolved_toll_issues
 * @param   {Number}    status_value
 * @param   {String}    selector_type
 * @return  {String}    inlineQty
 */
function tollIssuesSection(list_toll_issues, list_resolved_toll_issues, status_value, selector_type) {
    // TOLL Issues
    var has_toll_issues = (!isNullorEmpty(list_toll_issues));
    var toll_issues_columns = new Array();
    toll_issues_columns[0] = new nlobjSearchColumn('name');
    toll_issues_columns[1] = new nlobjSearchColumn('internalId');
    var tollIssuesResultSet = nlapiSearchRecord('customlist_cust_prod_stock_toll_issues', null, null, toll_issues_columns);

    if (status_value == 3 || selector_type != 'barcode_number') {
        var inlineQty = '<div class="form-group container toll_issues_section hide">';
    } else {
        var inlineQty = '<div class="form-group container toll_issues_section">';
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 toll_issues">';
    inlineQty += '<div class="input-group"><span class="input-group-addon" id="toll_issues_text">TOLL ISSUES<span class="mandatory">*</span></span>';
    inlineQty += '<select multiple id="toll_issues" class="form-control toll_issues selectpicker" size="' + tollIssuesResultSet.length + '">';

    tollIssuesResultSet.forEach(function (tollIssueResult) {
        var issue_name = tollIssueResult.getValue('name');
        var issue_id = tollIssueResult.getValue('internalId');
        var selected = false;
        if (has_toll_issues) {
            selected = (list_toll_issues.indexOf(issue_id) !== -1);
        }

        if (selected) {
            inlineQty += '<option value="' + issue_id + '" selected>' + issue_name + '</option>';
        } else {
            inlineQty += '<option value="' + issue_id + '">' + issue_name + '</option>';
        }
    });

    inlineQty += '</select>';
    inlineQty += '</div></div></div></div>';

    // Resolved TOLL Issues
    nlapiLogExecution('DEBUG', 'list_resolved_toll_issues : ', list_resolved_toll_issues);
    var has_resolved_toll_issues = (!isNullorEmpty(list_resolved_toll_issues));
    if (has_resolved_toll_issues) {
        var text_resolved_toll_issues = '';
        tollIssuesResultSet.forEach(function (tollIssueResult) {
            var issue_name = tollIssueResult.getValue('name');
            var issue_id = tollIssueResult.getValue('internalId');
            if (list_resolved_toll_issues.indexOf(issue_id) !== -1) {
                text_resolved_toll_issues += issue_name + '\n';
            }
        });
        nlapiLogExecution('DEBUG', 'text_resolved_toll_issues : ', text_resolved_toll_issues);
        inlineQty += '<div class="form-group container resolved_toll_issues_section">';
        inlineQty += '<div class="row">';
        inlineQty += '<div class="col-xs-12 resolved_toll_issues">';
        inlineQty += '<div class="input-group">';
        inlineQty += '<span class="input-group-addon" id="resolved_toll_issues_text">RESOLVED TOLL ISSUES</span>';
        inlineQty += '<textarea id="resolved_toll_issues" class="form-control resolved_toll_issues" rows="' + list_resolved_toll_issues.length + '" disabled>' + text_resolved_toll_issues.trim() + '</textarea>';
        inlineQty += '</div></div></div>';
    }

    return inlineQty;
};

/**
 * The multiselect MP Ticket issues dropdown
 * @param   {Array}     list_mp_ticket_issues
 * @param   {Array}     list_resolved_mp_ticket_issues
 * @param   {Number}    status_value
 * @param   {String}    selector_type
 * @return  {String}    inlineQty
 */
function mpTicketIssuesSection(list_mp_ticket_issues, list_resolved_mp_ticket_issues, status_value, selector_type) {
    // MP Ticket Issues
    var has_mp_ticket_issues = !isNullorEmpty(list_mp_ticket_issues);
    nlapiLogExecution('DEBUG', 'has_mp_ticket_issues : ', has_mp_ticket_issues);

    if (has_mp_ticket_issues && (status_value != 3)) {
        var inlineQty = '<div class="form-group container mp_issues_section">';
    } else {
        var inlineQty = '<div class="form-group container mp_issues_section hide">';
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 mp_issues">';

    var mp_ticket_issues_columns = new Array();
    mp_ticket_issues_columns[0] = new nlobjSearchColumn('name');
    mp_ticket_issues_columns[1] = new nlobjSearchColumn('internalId');
    var mpTicketIssuesResultSet = nlapiSearchRecord('customlist_mp_ticket_issues', null, null, mp_ticket_issues_columns);

    inlineQty += '<div class="input-group">'
    inlineQty += '<span class="input-group-addon" id="mp_issues_text">MP ISSUES<span class="mandatory hide">*</span></span>';
    inlineQty += '<select multiple id="mp_issues" class="form-control mp_issues selectpicker" size="' + mpTicketIssuesResultSet.length + '">';

    mpTicketIssuesResultSet.forEach(function (mpTicketIssueResult) {
        var mp_issue_name = mpTicketIssueResult.getValue('name');
        var mp_issue_id = mpTicketIssueResult.getValue('internalId');
        var selected = false;
        if (has_mp_ticket_issues) {
            selected = (list_mp_ticket_issues.indexOf(mp_issue_id) !== -1);
        }

        if (selector_type == 'barcode_number' || (selector_type == 'invoice_number' && mp_issue_id == 4)) {
            if (selected) {
                inlineQty += '<option value="' + mp_issue_id + '" selected>' + mp_issue_name + '</option>';
            } else {
                inlineQty += '<option value="' + mp_issue_id + '">' + mp_issue_name + '</option>';
            }
        }

    });

    inlineQty += '</select>';
    inlineQty += '</div></div></div></div>';

    // Resolved MP Ticket Issues
    var has_resolved_mp_ticket_issues = !isNullorEmpty(list_resolved_mp_ticket_issues);
    if (has_resolved_mp_ticket_issues) {
        var text_resolved_mp_ticket_issues = '';
        mpTicketIssuesResultSet.forEach(function (mpTicketIssueResult) {
            var mp_issue_name = mpTicketIssueResult.getValue('name');
            var mp_issue_id = mpTicketIssueResult.getValue('internalId');
            if (list_resolved_mp_ticket_issues.indexOf(mp_issue_id) !== -1) {
                text_resolved_mp_ticket_issues += mp_issue_name + '\n';
            }
        });
        inlineQty += '<div class="form-group container resolved_mp_issues_section">';
        inlineQty += '<div class="row">';
        inlineQty += '<div class="col-xs-12 resolved_mp_issues">';
        inlineQty += '<div class="input-group">';
        inlineQty += '<span class="input-group-addon" id="resolved_mp_issues_text">RESOLVED MP ISSUES</span>';
        inlineQty += '<textarea id="resolved_mp_issues" class="form-control resolved_mp_issues" rows="' + list_resolved_mp_ticket_issues.length + '" disabled>' + text_resolved_mp_ticket_issues.trim() + '</textarea>';
        inlineQty += '</div></div></div></div>';
    }

    return inlineQty;
}

/**
 * The multiselect Invoice issues dropdown
 * @param   {Array}     list_invoice_issues
 * @param   {Array}     list_resolved_invoice_issues
 * @param   {Number}    status_value
 * @param   {String}    selector_type
 * @return  {String}    inlineQty
 */
function invoiceIssuesSection(list_invoice_issues, list_resolved_invoice_issues, status_value, selector_type) {
    var has_invoice_issues = (!isNullorEmpty(list_invoice_issues));
    var invoice_issues_columns = new Array();
    invoice_issues_columns[0] = new nlobjSearchColumn('name');      // Might need to be changed
    invoice_issues_columns[1] = new nlobjSearchColumn('internalId');// Might need to be changed
    var invoiceIssuesResultSet = nlapiSearchRecord('customlist_invoice_issues', null, null, invoice_issues_columns);

    if (status_value == 3 || selector_type != 'invoice_number') {
        var inlineQty = '<div class="form-group container invoice_issues_section hide">';
    } else {
        var inlineQty = '<div class="form-group container invoice_issues_section">';
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 invoice_issues">';
    inlineQty += '<div class="input-group"><span class="input-group-addon" id="invoice_issues_text">INVOICE ISSUES<span class="mandatory">*</span></span>';
    inlineQty += '<select multiple id="invoice_issues" class="form-control invoice_issues selectpicker" size="' + invoiceIssuesResultSet.length + '">';

    invoiceIssuesResultSet.forEach(function (invoiceIssueResult) {
        var issue_name = invoiceIssueResult.getValue('name');       // Might need to be changed
        var issue_id = invoiceIssueResult.getValue('internalId');   // Might need to be changed
        var selected = false;
        if (has_invoice_issues) {
            selected = (list_invoice_issues.indexOf(issue_id) !== -1);
        }

        if (selected) {
            inlineQty += '<option value="' + issue_id + '" selected>' + issue_name + '</option>';
        } else {
            inlineQty += '<option value="' + issue_id + '">' + issue_name + '</option>';
        }
    });

    inlineQty += '</select>';
    inlineQty += '</div></div></div></div>';

    // Resolved invoice Issues
    nlapiLogExecution('DEBUG', 'list_resolved_invoice_issues : ', list_resolved_invoice_issues);
    var has_resolved_invoice_issues = (!isNullorEmpty(list_resolved_invoice_issues));
    if (has_resolved_invoice_issues) {
        var text_resolved_invoice_issues = '';
        invoiceIssuesResultSet.forEach(function (invoiceIssueResult) {
            var issue_name = invoiceIssueResult.getValue('name');       // Might need to be changed
            var issue_id = invoiceIssueResult.getValue('internalId');   // Might need to be changed
            if (list_resolved_invoice_issues.indexOf(issue_id) !== -1) {
                text_resolved_invoice_issues += issue_name + '\n';
            }
        });
        nlapiLogExecution('DEBUG', 'text_resolved_invoice_issues : ', text_resolved_invoice_issues);
        inlineQty += '<div class="form-group container resolved_invoice_issues_section">';
        inlineQty += '<div class="row">';
        inlineQty += '<div class="col-xs-12 resolved_invoice_issues">';
        inlineQty += '<div class="input-group">';
        inlineQty += '<span class="input-group-addon" id="resolved_invoice_issues_text">RESOLVED INVOICE ISSUES</span>';
        inlineQty += '<textarea id="resolved_invoice_issues" class="form-control resolved_invoice_issues" rows="' + list_resolved_invoice_issues.length + '" disabled>' + text_resolved_invoice_issues.trim() + '</textarea>';
        inlineQty += '</div></div></div></div>';
    }

    return inlineQty;
}

/**
 * @param   {String}    selector_type
 * @param   {Number}    status_value
 * @return  {String}    inlineQty
 */
function usernoteSection(selector_type, status_value) {
    var usernote_titles_columns = new Array();
    usernote_titles_columns[0] = new nlobjSearchColumn('name');
    usernote_titles_columns[1] = new nlobjSearchColumn('internalId');
    var usernoteTitlesResultSet = nlapiSearchRecord('customlist_user_note_title', null, null, usernote_titles_columns);

    // Row Title
    if (selector_type == 'invoice_number') {
        var inlineQty = '<div class="form-group container user_note user_note_title_section">';
    } else {
        var inlineQty = '<div class="form-group container user_note user_note_title_section hide">';
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 user_note_title_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">TITLE<span class="mandatory">*</span></span>';
    inlineQty += '<select id="user_note_title" class="form-control">';

    usernoteTitlesResultSet.forEach(function (usernoteTitleResult) {
        var title_name = usernoteTitleResult.getValue('name');
        var title_id = usernoteTitleResult.getValue('internalId');

        if (title_id == 3) {
            inlineQty += '<option value="' + title_id + '" selected>' + title_name + '</option>';
        } else {
            inlineQty += '<option value="' + title_id + '">' + title_name + '</option>';
        }
    });
    inlineQty += '</select>';
    inlineQty += '</div></div></div></div>';

    // Row User Note Textarea
    if (selector_type == 'invoice_number') {
        inlineQty += '<div class="form-group container user_note user_note_textarea_section">';
    } else {
        inlineQty += '<div class="form-group container user_note user_note_textarea_section hide">';
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 user_note_textarea">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="user_note_textarea_text">USER NOTE<span class="mandatory hide">*</span></span>';
    if (status_value != 3) {
        inlineQty += '<textarea id="user_note_textarea" class="form-control user_note_textarea" rows="3"></textarea>';
    } else {
        inlineQty += '<textarea id="user_note_textarea" class="form-control user_note_textarea" rows="3" readonly></textarea>';
    }
    inlineQty += '</div></div></div></div>';

    // User Note table
    if (selector_type == 'invoice_number') {
        inlineQty += '<div class="form-group container user_note user_note_section" style="font-size: small;">';
    } else {
        inlineQty += '<div class="form-group container user_note user_note_section hide" style="font-size: small;">';
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 user_note_div">';
    // Since the table is not displayed correctly when added through suitelet, 
    // It is added with jQuery in the pageInit() function in the client script 'mp_cl_open_ticket.js'.
    inlineQty += '</div>';
    inlineQty += '</div>';
    inlineQty += '</div>';

    return inlineQty;
}

/**
 * The free-from text area for comments.
 * @param   {String}    comment
 * @param   {String}    selector_type
 * @param   {Number}    status_value
 * @return  {String}    inlineQty
 */
function commentSection(comment, selector_type, status_value) {
    if (isNullorEmpty(comment)) { comment = ''; } else { comment += '\n'; }

    switch (selector_type) {
        case 'barcode_number':
            var inlineQty = '<div class="form-group container comment_section">';
            break;
        case 'invoice_number':
            var inlineQty = '<div class="form-group container comment_section hide">';
            break;

    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 comment">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="comment_text">COMMENT<span class="mandatory hide">*</span></span>';
    if (status_value != 3) {
        inlineQty += '<textarea id="comment" class="form-control comment" rows="3">' + comment + '</textarea>';
    } else {
        inlineQty += '<textarea id="comment" class="form-control comment" rows="3" readonly>' + comment + '</textarea>';
    }
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * Based on the selected MP Issue, an Owner is allocated to the ticket.
 * IT issues have priority over the other issues.
 * Populated with selectOwner() in the pageInit function on the client script.
 * @return  {String}    inlineQty
 */
function ownerSection() {
    var inlineQty = '<div class="form-group container owner_section hide">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 owner">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="owner_text">OWNER</span>';
    inlineQty += '<textarea id="owner" class="form-control owner" rows="1" data-email="" disabled></textarea>';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * The table that will display the differents tickets linked to the customer.
 * @return  {String}    inlineQty
 */
function dataTablePreview() {
    var inlineQty = '<div class="form-group container tickets_datatable_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 heading2">';
    inlineQty += '<h4><span class="label label-default col-xs-12">PREVIOUS TICKETS</span></h4>';
    inlineQty += '</div></div></div>';
    inlineQty += '<style>table#tickets-preview {font-size: 12px;text-align: center;border: none;}.dataTables_wrapper {font-size: 14px;}table#tickets-preview th{text-align: center;}</style>';
    inlineQty += '<table cellpadding="15" id="tickets-preview" class="table table-responsive table-striped customer tablesorter" cellspacing="0" style="width: 100%;">';
    inlineQty += '<thead style="color: white;background-color: #607799;">';
    inlineQty += '<tr class="text-center">';
    inlineQty += '</tr>';
    inlineQty += '</thead>';

    inlineQty += '<tbody id="result_tickets"></tbody>';

    inlineQty += '</table>';
    return inlineQty;
}

/**
 * The inline HTML for the close ticket button or the reopen button, 
 * and the submitter button at the bottom of the page.
 * @param   {Number}    ticket_id
 * @param   {Number}    status_value
 * @return  {String}    inlineQty
 */
function closeReopenSubmitTicketButton(ticket_id, status_value) {
    var inlineQty = '<div class="form-group container close_reopen_submit_ticket_section">';
    inlineQty += '<div class="row">';

    if (status_value != 3) {
        if (!isNullorEmpty(ticket_id)) {
            inlineQty += '<div class="col-xs-4 close_ticket">';
            inlineQty += '<input type="button" value="CLOSE TICKET" class="form-control btn btn-danger" id="close_ticket" onclick="closeTicket()"/>';
            inlineQty += '</div>';
        }

        inlineQty += '<div class="col-xs-4 submitter">';
        inlineQty += '<input type="button" value="" class="form-control btn btn-primary" id="submit_ticket" />';
        inlineQty += '</div>';

        inlineQty += '<div class="col-xs-4 escalate">';
        inlineQty += '<input type="button" value="ESCALATE" class="form-control btn btn-default" id="escalate" onclick="onEscalate()"/>';
        inlineQty += '</div>';

    } else {
        inlineQty += '<div class="col-xs-4 col-xs-offset-2 reopen_ticket">';
        inlineQty += '<input type="button" value="REOPEN TICKET" class="form-control btn btn-primary" id="reopen_ticket" />';
        inlineQty += '</div>';
    }
    inlineQty += '<div class="col-xs-4 cancel">';
    inlineQty += '<input type="button" value="CANCEL" class="form-control btn btn-default" id="cancel" onclick="onCancel()"/>';
    inlineQty += '</div>';

    inlineQty += '</div></div>';

    return inlineQty;
}

/**
 * The output of .getFieldValues is a java String Array.
 * We want to convert it to a javaScript Array in order to read its values.
 * @param   {Ljava.lang.String}     javaArray
 * @return  {Array}                 jsArray
 */
function java2jsArray(javaArray) {
    var jsArray = new Array;
    if (!isNullorEmpty(javaArray)) {
        javaArray.forEach(function (javaValue) {
            var jsValue = javaValue.toString();
            jsArray.push(jsValue);
        })
    }
    return jsArray;
}

/**
 * Whether the user is from the finance team, or a Data Systems Co-ordinator 
 * @param   {Number} userRole
 * @returns {Boolean}
 */
function isFinanceRole(userRole) {
    // 1001, 1031 and 1023 are finance roles
    // 1032 is the Data Systems Co-ordinator role (to be deleted in prod)
    return ((userRole == 1001 || userRole == 1031 || userRole == 1023) || (userRole == 1032));
}