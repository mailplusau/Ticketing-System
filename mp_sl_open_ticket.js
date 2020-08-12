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
var userId = ctx.getUser();
var userRole = parseInt(ctx.getRole());

function openTicket(request, response) {
    if (request.getMethod() == "GET") {
        var ticket_id = null;
        var customer_id = null;
        var selector_id = null;
        var selector_number = '';
        var selector_type = 'barcode_number';
        var date_created = '';
        var creator_name = '';
        var creator_id = null;
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
        var zee_abn = '';
        var date_stock_used = '';
        var time_stock_used = '';
        var final_delivery_text = '';
        var selected_enquiry_status_id = null;
        var attachments_hyperlink = '';
        var maap_bank_account_number = null;
        var maap_parent_bank_account_number = null;
        var selected_invoice_method_id = null;
        var accounts_cc_email = '';
        var mpex_po_number = '';
        var customer_po_number = '';
        var terms = null;
        var customer_terms = '';
        var account_manager = {};
        var selected_invoice_cycle_id = null;
        var usage_report_id_1 = '';
        var usage_report_id_2 = '';
        var usage_report_id_3 = '';
        var usage_report_id_4 = '';
        var usage_report_array = [];
        var list_toll_issues = '';
        var list_resolved_toll_issues = '';
        var list_mp_ticket_issues = '';
        var list_resolved_mp_ticket_issues = '';
        var list_invoice_issues = '';
        var list_resolved_invoice_issues = '';
        var owner_list = '';
        var comment = '';
        var params_email = {
            recipient: '',
            subject: '',
            body: '',
            cc: '',
            bcc: '',
            records: {},
            attachments_credit_memo_ids: [],
            attachments_usage_report_ids: [],
            attachments_invoice_ids: []
        };

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
                    creator_name = ticketRecord.getFieldText('custrecord_creator');
                    creator_id = ticketRecord.getFieldValue('custrecord_creator');
                    status_value = ticketRecord.getFieldValue('custrecord_ticket_status');
                    status = ticketRecord.getFieldText('custrecord_ticket_status');
                    customer_id = ticketRecord.getFieldValue('custrecord_customer1');
                    nlapiLogExecution('DEBUG', 'customer_id after edit_ticket page : ', customer_id);
                    customer_name = ticketRecord.getFieldText('custrecord_customer1');
                    zee_id = ticketRecord.getFieldValue('custrecord_zee');
                    selected_enquiry_status_id = ticketRecord.getFieldValue('custrecord_enquiry_status');
                    attachments_hyperlink = ticketRecord.getFieldValue('custrecord_mp_ticket_attachments');

                    if (!isNullorEmpty(customer_id)) {
                        var customerRecord = nlapiLoadRecord('customer', customer_id);
                        daytodayphone = customerRecord.getFieldValue('phone');
                        daytodayemail = customerRecord.getFieldValue('custentity_email_service');
                        terms = customerRecord.getFieldValue('terms');
                        customer_terms = customerRecord.getFieldValue('custentity_finance_terms');

                        // Account manager
                        var accountManagerSearch = nlapiLoadSearch('customer', 'customsearch3413');
                        var newFilters = [];
                        newFilters[newFilters.length] = new nlobjSearchFilter('internalid', null, 'anyof', customer_id);
                        accountManagerSearch.addFilters(newFilters);
                        var accountManagerResultSet = accountManagerSearch.runSearch();
                        var accountManagerResult = accountManagerResultSet.getResults(0, 1);
                        accountManagerResult = accountManagerResult[0];

                        if (!isNullorEmpty(accountManagerResult)) {
                            var account_manager_value = accountManagerResult.getValue("custrecord_sales_assigned", "CUSTRECORD_SALES_CUSTOMER", null);
                            var account_manager_text = accountManagerResult.getText("custrecord_sales_assigned", "CUSTRECORD_SALES_CUSTOMER", null);
                            if (!isNullorEmpty(account_manager_value)) {
                                var account_manager_email = nlapiLookupField('employee', account_manager_value, 'email');

                                account_manager = {
                                    name: account_manager_text,
                                    email: account_manager_email
                                };
                            }
                        }

                        // The Franchisee informations are imported from the customer record if possible.
                        zee_id = customerRecord.getFieldValue('partner');
                    }

                    if (!isNullorEmpty(zee_id)) {
                        var zeeRecord = nlapiLoadRecord('partner', zee_id);
                        franchisee_name = zeeRecord.getFieldValue('companyname');
                        zee_main_contact_name = zeeRecord.getFieldValue('custentity3');
                        zee_email = zeeRecord.getFieldValue('email');
                        zee_main_contact_phone = zeeRecord.getFieldValue('custentity2');
                        zee_abn = zeeRecord.getFieldValue('custentity_abn_franchiserecord');
                    } else {
                        franchisee_name = ticketRecord.getFieldText('custrecord_zee');
                    }

                    switch (selector_type) {
                        case 'barcode_number':
                            selector_id = ticketRecord.getFieldValue('custrecord_barcode_number');
                            var stock_used = nlapiLookupField('customrecord_customer_product_stock', selector_id, ['custrecord_cust_date_stock_used', 'custrecord_cust_time_stock_used']);
                            date_stock_used = stock_used.custrecord_cust_date_stock_used;
                            time_stock_used = stock_used.custrecord_cust_time_stock_used;
                            final_delivery_text = nlapiLookupField('customrecord_customer_product_stock', selector_id, 'custrecord_cust_prod_stock_final_del', true);

                            list_toll_issues = ticketRecord.getFieldValues('custrecord_toll_issues');
                            list_toll_issues = java2jsArray(list_toll_issues);

                            list_resolved_toll_issues = ticketRecord.getFieldValues('custrecord_resolved_toll_issues');
                            list_resolved_toll_issues = java2jsArray(list_resolved_toll_issues);

                            break;

                        case 'invoice_number':
                            selector_id = ticketRecord.getFieldValue('custrecord_invoice_number');
                            var invoiceRecord = nlapiLoadRecord('invoice', selector_id);

                            accountsphone = customerRecord.getFieldValue('altphone');
                            accountsemail = customerRecord.getFieldValue('email');

                            maap_bank_account_number = customerRecord.getFieldValue('custentity_maap_bankacctno');
                            maap_parent_bank_account_number = customerRecord.getFieldValue('custentity_maap_bankacctno_parent');

                            selected_invoice_method_id = customerRecord.getFieldValue('custentity_invoice_method');
                            accounts_cc_email = customerRecord.getFieldValue('custentity_accounts_cc_email');
                            mpex_po_number = customerRecord.getFieldValue('custentity_mpex_po');
                            customer_po_number = customerRecord.getFieldValue('custentity11');
                            selected_invoice_cycle_id = customerRecord.getFieldValue('custentity_mpex_invoicing_cycle');

                            usage_report_id_1 = invoiceRecord.getFieldValue('custbody_mpex_usage_report');
                            usage_report_id_2 = invoiceRecord.getFieldValue('custbody_mpex_usage_report_2');
                            usage_report_id_3 = invoiceRecord.getFieldValue('custbody_mpex_usage_report_3');
                            usage_report_id_4 = invoiceRecord.getFieldValue('custbody_mpex_usage_report_4');
                            var usage_report_id_array = [usage_report_id_1, usage_report_id_2, usage_report_id_3, usage_report_id_4];

                            usage_report_id_array.forEach(function (usage_report_id) {
                                if (!isNullorEmpty(usage_report_id)) {
                                    var usage_report_file = nlapiLoadFile(usage_report_id);
                                    usage_report_name = usage_report_file.getName();
                                    usage_report_link = usage_report_file.getURL();

                                    usage_report_array.push({
                                        id: usage_report_id,
                                        name: usage_report_name,
                                        url: usage_report_link
                                    });
                                }
                            });

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

                    owner_list = ticketRecord.getFieldValues('custrecord_owner');
                    owner_list = java2jsArray(owner_list);

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

        // Load Tooltip
        inlineHtml += '<script src="https://unpkg.com/@popperjs/core@2"></script>';

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

        inlineHtml += selectorSection(ticket_id, selector_number, selector_id, selector_type);
        if (!isNullorEmpty(ticket_id)) {
            inlineHtml += ticketSection(date_created, creator_id, creator_name, status);
        }
        if (isNullorEmpty(ticket_id) || (!isNullorEmpty(ticket_id) && !isNullorEmpty(customer_id))) {
            inlineHtml += customerSection(customer_name);
            inlineHtml += daytodayContactSection(daytodayphone, daytodayemail, status_value, selector_type);
            inlineHtml += accountsContactSection(accountsphone, accountsemail, status_value, selector_type);
            inlineHtml += maapBankAccountSection(maap_bank_account_number, maap_parent_bank_account_number, selector_type);
        }
        if (isNullorEmpty(ticket_id) || (!isNullorEmpty(ticket_id) && !isNullorEmpty(zee_id))) {
            inlineHtml += franchiseeMainContactSection(franchisee_name, zee_main_contact_name, zee_email, zee_main_contact_phone, zee_abn);
        }
        inlineHtml += mpexStockUsedSection(selector_type, date_stock_used, time_stock_used);
        inlineHtml += finalDeliveryEnquirySection(status_value, selector_type, final_delivery_text, selected_enquiry_status_id);
        inlineHtml += attachmentsSection(attachments_hyperlink, status_value);

        if (isNullorEmpty(ticket_id) || (!isNullorEmpty(ticket_id) && !isNullorEmpty(customer_id))) {
            inlineHtml += otherInvoiceFieldsSection(selected_invoice_method_id, accounts_cc_email, mpex_po_number, customer_po_number, selected_invoice_cycle_id, terms, customer_terms, status_value, selector_type);
            inlineHtml += mpexContactSection();
            inlineHtml += openInvoicesSection(ticket_id, selector_type);
            if (!isNullorEmpty(ticket_id) && !isNullorEmpty(customer_id)) {
                inlineHtml += creditMemoSection(selector_type);
                inlineHtml += usageReportSection(selector_type);
            }
            inlineHtml += sendEmailSection(ticket_id, status_value, account_manager);
        }

        inlineHtml += issuesHeader();
        inlineHtml += reminderSection(status_value);
        inlineHtml += ownerSection(ticket_id, owner_list, status_value);
        inlineHtml += tollIssuesSection(list_toll_issues, list_resolved_toll_issues, status_value, selector_type);
        inlineHtml += mpTicketIssuesSection(list_mp_ticket_issues, list_resolved_mp_ticket_issues, status_value, selector_type);
        inlineHtml += invoiceIssuesSection(list_invoice_issues, list_resolved_invoice_issues, status_value, selector_type);
        inlineHtml += usernoteSection(selector_type, status_value);
        inlineHtml += commentSection(comment, selector_type, status_value);
        inlineHtml += dataTablePreview();
        inlineHtml += closeReopenSubmitTicketButton(ticket_id, status_value);


        form.addField('preview_table', 'inlinehtml', '').setLayoutType('outsidebelow', 'startrow').setLayoutType('midrow').setDefaultValue(inlineHtml);
        form.addField('custpage_open_new_ticket', 'text', 'Open New Ticket').setDisplayType('hidden').setDefaultValue('F');
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
        form.addField('custpage_usage_report_array', 'text', 'Usage Reports').setDisplayType('hidden').setDefaultValue(JSON.stringify(usage_report_array));
        form.addField('custpage_param_email', 'text', 'Email parameters').setDisplayType('hidden').setDefaultValue(JSON.stringify(params_email));

        if (!isNullorEmpty(ticket_id)) {
            if (isTicketNotClosed(status_value)) {
                form.addSubmitButton('Update Ticket');
            } else {
                form.addSubmitButton('Reopen Ticket');
            }
        } else {
            form.addSubmitButton('Open Ticket');
            form.addButton('custpage_openandnew', 'Open & New Ticket', 'openAndNew()');
        }
        if (isTicketNotClosed(status_value)) {
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

            var open_new_ticket = request.getParameter('custpage_open_new_ticket');
            if (open_new_ticket == 'T') {
                // If the ticket was just created, and the user clicked on 'Open & New Ticket',
                // The user is redirected to a new "Open Ticket" page.
                nlapiSetRedirectURL('SUITELET', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket', null, params2);
            } else {
                custparam_params = {
                    ticket_id: parseInt(ticket_id),
                    selector_number: selector_number,
                    selector_type: selector_type
                }
                custparam_params = JSON.stringify(custparam_params);
                var params2 = { custparam_params: custparam_params };
                // If the ticket was just created, the user is redirected to the "Edit Ticket" page
                nlapiSetRedirectURL('SUITELET', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket', null, params2);
            }

        } else {
            var params_email = request.getParameter('custpage_param_email');
            params_email = JSON.parse(params_email);
            var to = params_email.recipient;
            var email_subject = params_email.subject;
            var email_body = decodeURIComponent(params_email.body);
            var cc = null;
            var bcc = null
            var emailAttach = null;
            var attachments_credit_memo_ids = null;
            var attachments_usage_report_ids = null;
            var attachments_invoice_ids = null;

            if (!isNullorEmpty(params_email.cc)) {
                cc = params_email.cc;
            }
            if (!isNullorEmpty(params_email.bcc)) {
                bcc = params_email.bcc;
            }
            if (!isNullorEmpty(params_email.records)) {
                emailAttach = params_email.records;
            }

            var attachement_files = [];
            if (!isNullorEmpty(params_email.attachments_credit_memo_ids)) {
                attachments_credit_memo_ids = params_email.attachments_credit_memo_ids;
                attachments_credit_memo_ids.forEach(function (record_id) {
                    attachement_files.push(nlapiPrintRecord('TRANSACTION', record_id, 'PDF', null));
                });
            }
            if (!isNullorEmpty(params_email.attachments_usage_report_ids)) {
                attachments_usage_report_ids = params_email.attachments_usage_report_ids;
                attachments_usage_report_ids.forEach(function (record_id) {
                    attachement_files.push(nlapiLoadFile(record_id));
                });
            }
            if (!isNullorEmpty(params_email.attachments_invoice_ids)) {
                attachments_invoice_ids = params_email.attachments_invoice_ids;
                attachments_invoice_ids.forEach(function (invoice_id) {
                    attachement_files.push(nlapiPrintRecord('TRANSACTION', invoice_id, 'PDF', null));
                });
            }

            // If the parameter is non null, it means that the "SEND EMAIL" button was clicked.
            if (!isNullorEmpty(attachement_files)) {
                try {
                    nlapiSendEmail(userId, to, email_subject, email_body, cc, bcc, emailAttach, attachement_files) // 112209 is from MailPlus Team
                } catch (error) {
                    if (error instanceof nlobjError) {
                        return error.getCode();
                    }
                }
            }

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
 * @param   {Number}    selector_id
 * @param   {String}    selector_type
 * @param   {Number}    status_value
 * @return  {String}    inlineQty
 */
function selectorSection(ticket_id, selector_number, selector_id, selector_type, status_value) {
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
        if (selector_type == 'invoice_number') {
            // Open Invoice record
            inlineQty += '<div class="input-group-btn">';
            inlineQty += '<button id="open_inv" type="button" class="btn btn-default link_inv" data-inv-id="' + selector_id + '" data-toggle="tooltip" data-placement="top" title="Open Invoice">';
            inlineQty += '<span class="glyphicon glyphicon-link"></span>';
            inlineQty += '</button>';
            inlineQty += '</div>';

            // Attach Invoice to email
            if (isTicketNotClosed(status_value)) {
                inlineQty += '<div class="input-group-btn"><button id="add_inv" type="button" class="btn btn-success add_inv" data-inv-id="' + selector_id + '" data-toggle="tooltip" data-placement="right" title="Attach to email">';
                inlineQty += '<span class="glyphicon glyphicon-plus"></span>';
                inlineQty += '</button></div>';
            }
        }
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
 * @param   {Number}    creator_id
 * @param   {String}    creator_name
 * @param   {String}    status
 * @return  {String}    inlineQty
 */
function ticketSection(date_created, creator_id, creator_name, status) {
    if (isNullorEmpty(date_created)) { date_created = ''; }
    if (isNullorEmpty(creator_name)) { creator_name = ''; }
    if (isNullorEmpty(status)) { status = ''; }

    var inlineQty = '<div class="form-group container created_status_section">';
    inlineQty += '<div class="row">';

    // Date created field
    inlineQty += '<div class="col-xs-6 date_created">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="date_created_text">DATE CREATED</span>';
    inlineQty += '<input id="date_created" value="' + date_created + '" class="form-control date_created" disabled />';
    inlineQty += '</div></div>';

    // Creator field
    inlineQty += '<div class="col-xs-6 creator">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="creator_text">CREATOR</span>';
    inlineQty += '<input id="creator" value="' + creator_name + '" data-creator-id="' + creator_id + '" class="form-control creator" disabled />';
    inlineQty += '</div></div></div></div>';

    // Status Section
    inlineQty += '<div class="form-group container status_section">';
    inlineQty += '<div class="row">';
    // Status field
    inlineQty += '<div class="col-xs-12 status">';
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

 * @param   {String}    daytodayphone
 * @param   {String}    daytodayemail
 * @param   {Number}    status_value
 * @param   {String}    selector_type
 * @return  {String}    inlineQty
 */
function daytodayContactSection(daytodayphone, daytodayemail, status_value, selector_type) {
    if (isNullorEmpty(daytodayphone)) { daytodayphone = ''; }
    if (isNullorEmpty(daytodayemail)) { daytodayemail = ''; }

    var disabled = 'disabled';
    if ((isFinanceRole(userRole)) && isTicketNotClosed(status_value) && selector_type == 'invoice_number') {
        disabled = '';
    }

    var inlineQty = '<div class="form-group container daytodaycontact_section">';
    inlineQty += '<div class="row">';

    // Day to day email field
    inlineQty += '<div class="col-xs-6 daytodayemail_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="daytodayemail_text">DAY-TO-DAY EMAIL</span>';
    inlineQty += '<input id="daytodayemail" type="email" value="' + daytodayemail + '" class="form-control daytodayemail" ' + disabled + ' />';
    inlineQty += '<div class="input-group-btn">';
    inlineQty += '<button type="button" class="btn btn-success add_as_recipient" data-email="' + daytodayemail + '" data-contact-id="" data-firstname="" data-toggle="tooltip" data-placement="right" title="Add as recipient">';
    inlineQty += '<span class="glyphicon glyphicon-envelope"></span>';
    inlineQty += '</button>';
    inlineQty += '</div>';
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
 * @param   {String}    accountsphone
 * @param   {String}    accountsemail
 * @param   {Number}    status_value
 * @param   {String}    selector_type
 * @return  {String}    inlineQty
 */
function accountsContactSection(accountsphone, accountsemail, status_value, selector_type) {
    if (isNullorEmpty(accountsphone)) { accountsphone = ''; }
    if (isNullorEmpty(accountsemail)) { accountsemail = ''; }

    if (selector_type == 'invoice_number') {
        var inlineQty = '<div class="form-group container accountscontact_section">';

        if (isFinanceRole(userRole) && isTicketNotClosed(status_value)) {
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
    inlineQty += '<div class="input-group-btn">';
    inlineQty += '<button type="button" class="btn btn-success add_as_recipient" data-email="' + accountsemail + '" data-contact-id="" data-firstname="" data-toggle="tooltip" data-placement="right" title="Add as recipient">';
    inlineQty += '<span class="glyphicon glyphicon-envelope"></span>';
    inlineQty += '</button>';
    inlineQty += '</div>';
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
 * @param   {String}    zee_abn
 * @return  {String}    inlineQty
 */
function franchiseeMainContactSection(franchisee_name, zee_main_contact_name, zee_email, zee_main_contact_phone, zee_abn) {
    if (isNullorEmpty(franchisee_name)) { franchisee_name = ''; }
    if (isNullorEmpty(zee_main_contact_name)) { zee_main_contact_name = ''; }
    if (isNullorEmpty(zee_email)) { zee_email = ''; }
    if (isNullorEmpty(zee_main_contact_phone)) { zee_main_contact_phone = ''; }
    if (isNullorEmpty(zee_abn)) { zee_abn = ''; }

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
    inlineQty += '<div class="col-xs-12 zee_email">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="zee_email_text">FRANCHISEE EMAIL</span>';
    inlineQty += '<input id="zee_email" type="email" value="' + zee_email + '" class="form-control accountsemail" disabled />';
    inlineQty += '<div class="input-group-btn">';
    var zee_contact_id = '0';
    inlineQty += '<button type="button" class="btn btn-success add_as_recipient" data-email="' + zee_email + '" data-contact-id="' + zee_contact_id + '" data-firstname="' + franchisee_name + '" data-toggle="tooltip" data-placement="right" title="Add as recipient">';
    inlineQty += '<span class="glyphicon glyphicon-envelope"></span>';
    inlineQty += '</button>';
    inlineQty += '</div>';
    inlineQty += '</div></div></div></div>';

    // Franchisee phone and ABN details
    inlineQty += '<div class="form-group container zee_main_contact_section">';
    inlineQty += '<div class="row">';
    // Franchisee main contact phone field
    inlineQty += '<div class="col-xs-6 zee_main_contact_phone">'
    inlineQty += '<div class="input-group">'
    inlineQty += '<span class="input-group-addon" id="zee_main_contact_phone_text">FRANCHISEE PHONE</span>';
    inlineQty += '<input id="zee_main_contact_phone" type="tel" value="' + zee_main_contact_phone + '" class="form-control zee_main_contact_phone" disabled />';
    inlineQty += '<div class="input-group-btn"><button type="button" class="btn btn-success" id="call_zee_main_contact_phone"><span class="glyphicon glyphicon-earphone"></span></button>';
    inlineQty += '</div>';
    inlineQty += '</div></div>';

    // Franchisee ABN number
    inlineQty += '<div class="col-xs-6 zee_abn">'
    inlineQty += '<div class="input-group">'
    inlineQty += '<span class="input-group-addon" id="zee_abn_text">FRANCHISEE ABN</span>'
    inlineQty += '<input id="zee_abn" class="form-control zee_abn" value="' + zee_abn + '" disabled>'
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * The MPEX Date and Time Stock used fields.
 * Visible only for the barcode records.
 * @param   {String} selector_type 
 * @param   {String} date_stock_used 
 * @param   {String} time_stock_used
 * @return  {String} inlineQty
 */
function mpexStockUsedSection(selector_type, date_stock_used, time_stock_used) {
    if (isNullorEmpty(date_stock_used)) { date_stock_used = '' }
    if (isNullorEmpty(time_stock_used)) { time_stock_used = '' }

    var hide_class = (selector_type == 'barcode_number') ? '' : 'hide';

    // MPEX Stock Used Section
    var inlineQty = '<div class="form-group container mpex_stock_used_section ' + hide_class + '">';
    inlineQty += '<div class="row">';
    // Date Stock Used
    inlineQty += ' <div class="col-xs-6 date_stock_used">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="date_stock_used_text">DATE STOCK USED</span>';
    inlineQty += '<input id="date_stock_used" class="form-control date_stock_used" value="' + date_stock_used + '" disabled>';
    inlineQty += '</div></div>';
    // Time Stock Used
    inlineQty += '<div class="col-xs-6 time_stock_used">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="time_stock_used_text">TIME STOCK USED</span>';
    inlineQty += '<input id="time_stock_used" class="form-control time_stock_used" value="' + time_stock_used + '" disabled>';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * The MPEX Final Delivery field is visible only for the barcode records.
 * The Enquiry Status field is not disabled only for the ticket that have not yet been opened.
 * @param   {Number} status_value
 * @param   {String} selector_type 
 * @param   {String} final_delivery_text 
 * @param   {Number} selected_enquiry_status_id
 * @return  {String} inlineQty
 */
function finalDeliveryEnquirySection(status_value, selector_type, final_delivery_text, selected_enquiry_status_id) {
    if (isNullorEmpty(final_delivery_text)) { final_delivery_text = '' }
    if (isNullorEmpty(selected_enquiry_status_id)) { selected_enquiry_status_id = '' }

    var barcode_hide_class = (selector_type == 'barcode_number') ? '' : 'hide';
    var nb_col_enquiry_section = (selector_type == 'barcode_number') ? '6' : '12';
    var enquiry_disabled = (isTicketNotClosed(status_value)) ? '' : 'disabled';

    // Final Delivery + Enquiry Status Section
    var inlineQty = '<div class="form-group container final_delivery_enquiry_status_section">';
    inlineQty += '<div class="row">';
    // Final Delivery
    inlineQty += '<div class="col-xs-6 final_delivery ' + barcode_hide_class + '">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="final_delivery_text">FINAL DELIVERY</span>';
    inlineQty += '<input id="final_delivery" class="form-control final_delivery" value="' + final_delivery_text + '" disabled>';
    inlineQty += '</div></div>';

    // Enquiry Status
    var enquiry_status_columns = new Array();
    enquiry_status_columns[0] = new nlobjSearchColumn('name');
    enquiry_status_columns[1] = new nlobjSearchColumn('internalId');
    var enquiryStatusResultSet = nlapiSearchRecord('customlist_mp_ticket_enquiry', null, null, enquiry_status_columns);

    inlineQty += '<div class="col-xs-' + nb_col_enquiry_section + ' enquiry_status_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="enquiry_status_text">ENQUIRY STATUS</span>';
    inlineQty += '<select id="enquiry_status" class="form-control enquiry_status" ' + enquiry_disabled + '>';
    inlineQty += '<option></option>';

    enquiryStatusResultSet.forEach(function (enquiryStatusResult) {
        var enquiry_status_name = enquiryStatusResult.getValue('name');
        var enquiry_status_id = enquiryStatusResult.getValue('internalId');

        if (enquiry_status_id == selected_enquiry_status_id) {
            inlineQty += '<option value="' + enquiry_status_id + '" selected>' + enquiry_status_name + '</option>';
        } else {
            inlineQty += '<option value="' + enquiry_status_id + '">' + enquiry_status_name + '</option>';
        }
    });
    inlineQty += '</select>';
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
 * @param   {Number} terms
 * @param   {String} customer_terms
 * @param   {Number} status_value
 * @param   {String} selector_type 
 * @return  {String} inlineQty
 */
function otherInvoiceFieldsSection(selected_invoice_method_id, accounts_cc_email, mpex_po_number, customer_po_number, selected_invoice_cycle_id, terms, customer_terms, status_value, selector_type) {
    if (isNullorEmpty(accounts_cc_email)) { accounts_cc_email = '' }
    if (isNullorEmpty(mpex_po_number)) { mpex_po_number = '' }
    if (isNullorEmpty(customer_po_number)) { customer_po_number = '' }
    if (isNullorEmpty(customer_terms)) { customer_terms = '' }

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
            if (isFinanceRole(userRole) && isTicketNotClosed(status_value)) {
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
    inlineQty += '<div class="input-group-btn">';
    inlineQty += '<button type="button" class="btn btn-success add_as_recipient" data-email="' + accounts_cc_email + '" data-contact-id="" data-firstname="" data-toggle="tooltip" data-placement="right" title="Add as recipient">';
    inlineQty += '<span class="glyphicon glyphicon-envelope"></span>';
    inlineQty += '</button>';
    inlineQty += '</div>';
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

    // Terms fields
    switch (selector_type) {
        case 'barcode_number':
            inlineQty += '<div class="form-group container terms_section hide">';
            break;

        case 'invoice_number':
            inlineQty += '<div class="form-group container terms_section">';
            break;
    }
    inlineQty += '<div class="row">';
    // Terms
    inlineQty += '<div class="col-xs-6 terms_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="terms_text">TERMS</span>';
    // Find the text related to the terms value.
    var terms_options = [{ "value": "", "text": "" }, { "value": "5", "text": "1% 10 Net 30" }, { "value": "6", "text": "2% 10 Net 30" }, { "value": "4", "text": "Due on receipt" }, { "value": "1", "text": "Net 15 Days" }, { "value": "2", "text": "Net 30 Days" }, { "value": "8", "text": "Net 45 Days" }, { "value": "3", "text": "Net 60 Days" }, { "value": "7", "text": "Net 7 Days" }, { "value": "9", "text": "Net 90 Days" }];
    var terms_option = findObjectByKey(terms_options, "value", terms);
    var terms_text = isNullorEmpty(terms_option) ? '' : terms_option.text;
    inlineQty += '<input id="terms" class="form-control terms" value="' + terms_text + '" disabled/>';
    inlineQty += '</div></div>';

    // Customer's terms
    inlineQty += '<div class="col-xs-6 customers_terms_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="customers_terms_text">' + "CUSTOMER'S TERMS</span>";
    inlineQty += '<input id="customers_terms" class="form-control customers_terms" value="' + customer_terms + '" ' + disabled + '/>';
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
 * The Attachments field (an editable hyperlink)
 * @param   {String}    attachments_hyperlink 
 * @param   {Number}    status_value
 * @returns {String}    inlineQty
 */
function attachmentsSection(attachments_hyperlink, status_value) {
    if (isNullorEmpty(attachments_hyperlink)) { attachments_hyperlink = '' }

    var disabled = (isTicketNotClosed(status_value)) ? '' : 'disabled';

    var inlineQty = '<div class="form-group container attachments_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 attachments_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="attachments_text">ATTACHMENTS</span>'
    inlineQty += '<input id="attachments" class="form-control attachments" type="url" value="' + attachments_hyperlink + '" ' + disabled + '/>';
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
 * @param   {Number}    ticket_id
 * @param   {String}    selector_type
 * @return  {String}    inlineQty 
 */
function openInvoicesSection(ticket_id, selector_type) {
    if (isNullorEmpty(ticket_id)) { ticket_id = '' }

    var hide_class_section = (isNullorEmpty(ticket_id) || selector_type != 'invoice_number') ? 'hide' : '';

    // Open invoices header
    var inlineQty = '<div class="form-group container open_invoices open_invoices_header ' + hide_class_section + '">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 heading2">';
    inlineQty += '<h4><span class="label label-default col-xs-12">OPEN INVOICES</span></h4>';
    inlineQty += '</div></div></div>';

    // Open invoices dropdown field
    inlineQty += '<div class="form-group container open_invoices invoices_dropdown ' + hide_class_section + '">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 invoices_dropdown_div">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="invoices_dropdown_text">INVOICE STATUS</span>';
    inlineQty += '<select id="invoices_dropdown" class="form-control">';
    inlineQty += '<option value="open" selected>Open</option>';
    inlineQty += '<option value="paidInFull">Paid In Full (last 3 months)</option>';
    inlineQty += '</select>';
    inlineQty += '</div></div></div></div>';

    // Open Invoices Datatable
    inlineQty += '<div class="form-group container open_invoices open_invoices_table ' + hide_class_section + '">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12" id="open_invoice_dt_div">';
    // It is inserted as inline html in the script mp_cl_open_ticket
    inlineQty += '</div></div></div>';

    return inlineQty;
}

/**
 * The Credit Memo Section.
 * Displays a table of the credit memos linked to the invoice.
 * Possibility to attach the credit memo PDF to the email.
 * @param   {String}    selector_type
 * @return  {String}    inlineQty
 */
function creditMemoSection(selector_type) {
    var inlineQty = '';
    if (selector_type == 'invoice_number') {
        // Credit Memo Header
        inlineQty += '<div class="form-group container credit_memo credit_memo_header">';
        inlineQty += '<div class="row">';
        inlineQty += '<div class="col-xs-12 heading2">';
        inlineQty += '<h4><span class="label label-default col-xs-12">CREDIT MEMO</span></h4>';
        inlineQty += '</div></div></div>';
        // Credit Memo table
        inlineQty += '<div class="form-group container credit_memo credit_memo_section" style="font-size: small;">';
        inlineQty += '<div class="row">';
        inlineQty += '<div class="col-xs-12 credit_memo_div">';
        // Since the table is not displayed correctly when added through suitelet, 
        // It is added with jQuery in the pageInit() function in the client script 'mp_cl_open_ticket.js'.
        inlineQty += '</div></div></div>';
    }

    return inlineQty;
}

function usageReportSection(selector_type) {
    var inlineQty = '';
    if (selector_type == 'invoice_number') {
        // Usage Report Header
        inlineQty += '<div class="form-group container usage_report usage_report_header">';
        inlineQty += '<div class="row">';
        inlineQty += '<div class="col-xs-12 heading2">';
        inlineQty += '<h4><span class="label label-default col-xs-12">USAGE REPORT</span></h4>';
        inlineQty += '</div></div></div>';
        // Usage Report table
        inlineQty += '<div class="form-group container usage_report usage_report_section" style="font-size: small;">';
        inlineQty += '<div class="row">';
        inlineQty += '<div class="col-xs-12 usage_report_div">';
        // Since the table is not displayed correctly when added through suitelet, 
        // It is added with jQuery in the pageInit() function in the client script 'mp_cl_open_ticket.js'.
        inlineQty += '</div></div></div>';
    }

    return inlineQty;
}

/**
 * The "Send Email" section.
 * Possibility for the user to send an email to the customer, based on selected templates.
 * @param   {Number}    ticket_id 
 * @param   {Number}    status_value
 * @param   {Object}    account_manager
 * @returns {String}    inlineQty
 */
function sendEmailSection(ticket_id, status_value, account_manager) {

    if (isNullorEmpty(ticket_id) || !isTicketNotClosed(status_value)) {
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
    inlineQty += '<div class="col-xs-12 to_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">TO<span class="mandatory">*</span></span>';
    inlineQty += '<input id="send_to" class="form-control" data-contact-id="" data-firstname=""/>';
    inlineQty += '</div></div></div></div>';

    // Row ccs addresses
    inlineQty += '<div class="form-group container send_email cc_adressees_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-6 cc_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">CC</span>';
    inlineQty += '<input id="send_cc" class="form-control"/>';
    inlineQty += '</div></div>';
    inlineQty += '<div class="col-xs-6 bcc_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">BCC</span>';
    inlineQty += '<input id="send_bcc" class="form-control"/>';
    inlineQty += '</div></div></div></div>';


    // Row account manager
    if (isNullorEmpty(account_manager.name)) { account_manager.name = '' }
    if (isNullorEmpty(account_manager.email)) { account_manager.email = '' }

    if (!isNullorEmpty(account_manager.email)) {

        inlineQty += '<div class="form-group container send_email acc_manager_section">';
        inlineQty += '<div class="row">';
        inlineQty += '<div class="col-xs-10 acc_manager_name_section">';
        inlineQty += '<div class="input-group">';
        inlineQty += '<span class="input-group-addon">ACCOUNT MANAGER</span>';
        inlineQty += '<input id="acc_manager" class="form-control" data-email="' + account_manager.email + '" value="' + account_manager.name + ' - ' + account_manager.email + '" disabled/>';
        inlineQty += '</div></div>';
        inlineQty += '<div class="col-xs-2 acc_manager_button_section">';
        inlineQty += '<button id="acc_manager_button" type="button" class="btn btn-success btn-block">ADD TO CC</button>';
        inlineQty += '</div></div></div>';
    }

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
 * @param   {Number}    status_value
 * @return  {String}    inlineQty
 */
function reminderSection(status_value) {
    var hide_class = (!isTicketNotClosed(status_value)) ? 'hide' : '';

    var inlineQty = '<div class="form-group container reminder_section ' + hide_class + '">';
    inlineQty += '<div class="row">';
    // Reminder field
    inlineQty += '<div class="col-xs-12 reminder">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="reminder_text">REMINDER</span>';
    inlineQty += '<input id="reminder" class="form-control reminder" type="date" />';
    inlineQty += '</div></div></div></div>';
    return inlineQty;
}

/**
 * Based on the selected MP Issue, an Owner is allocated to the ticket.
 * IT issues have priority over the other issues.
 * Populated with selectOwner() in the pageInit function on the client script.
 * @param   {Number}    ticket_id
 * @param   {Array}     owner_list
 * @param   {Number}    status_value
 * @return  {String}    inlineQty
 */
function ownerSection(ticket_id, owner_list, status_value) {
    if (isNullorEmpty(ticket_id)) {
        // If ticket_id is null, owner_list as well.
        // In that case, only the creator of the ticket is pre-selected as the owner.
        var userId = nlapiGetContext().getUser().toString();
        owner_list = [userId];
    }

    var disabled = (!isTicketNotClosed(status_value)) ? 'disabled' : '';

    var inlineQty = '<div class="form-group container owner_section">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 owner">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="owner_text">OWNER<span class="mandatory">*</span></span>';
    inlineQty += '<select multiple id="owner" class="form-control owner" ' + disabled + '>';

    var employeeSearch = nlapiLoadSearch('employee', 'customsearch_active_employees');
    var employeeResultSet = employeeSearch.runSearch();
    employeeResultSet.forEachResult(function (employeeResult) {
        var employee_id = employeeResult.getId();
        var employee_firstname = employeeResult.getValue('firstname');
        var employee_lastname = employeeResult.getValue('lastname');
        var employee_email = employeeResult.getValue('email');

        if (owner_list.indexOf(employee_id) != -1) {
            inlineQty += '<option value="' + employee_id + '" data-email="' + employee_email + '" selected>' + employee_firstname + ' ' + employee_lastname + '</option>';
        } else {
            inlineQty += '<option value="' + employee_id + '" data-email="' + employee_email + '">' + employee_firstname + ' ' + employee_lastname + '</option>';
        }
        return true;
    });

    inlineQty += '</select>';
    inlineQty += '</div></div></div></div>';

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

    if (!isTicketNotClosed(status_value) || selector_type != 'barcode_number') {
        var inlineQty = '<div class="form-group container toll_issues_section hide">';
    } else {
        var inlineQty = '<div class="form-group container toll_issues_section">';
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 toll_issues">';
    inlineQty += '<div class="input-group"><span class="input-group-addon" id="toll_issues_text">TOLL ISSUES<span class="mandatory">*</span></span>';
    inlineQty += '<select multiple id="toll_issues" class="form-control toll_issues" size="' + tollIssuesResultSet.length + '">';

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
        inlineQty += '</div></div></div></div>';
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
    var disabled_mp_issue_field = (isTicketNotClosed(status_value)) ? '' : 'disabled';
    nlapiLogExecution('DEBUG', 'has_mp_ticket_issues : ', has_mp_ticket_issues);

    if (has_mp_ticket_issues && status_value != 3) {
        // The MP Ticket issue section is displayed if the status is 'Closed - Unallocated' (status_value == 8)
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
    inlineQty += '<select multiple id="mp_issues" class="form-control mp_issues" size="' + mpTicketIssuesResultSet.length + '" ' + disabled_mp_issue_field + '>';

    mpTicketIssuesResultSet.forEach(function (mpTicketIssueResult) {
        var mp_issue_name = mpTicketIssueResult.getValue('name');
        var mp_issue_id = mpTicketIssueResult.getValue('internalId');
        var selected = false;
        if (has_mp_ticket_issues) {
            selected = (list_mp_ticket_issues.indexOf(mp_issue_id) !== -1);
        }

        var show_option = (selector_type == 'barcode_number' || (selector_type == 'invoice_number' && mp_issue_id == 4));
        var selected_option = (selected) ? 'selected' : '';

        if (show_option) {
            inlineQty += '<option value="' + mp_issue_id + '" ' + selected_option + '> ' + mp_issue_name + '</option > ';
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

    if (!isTicketNotClosed(status_value) || selector_type != 'invoice_number') {
        var inlineQty = '<div class="form-group container invoice_issues_section hide">';
    } else {
        var inlineQty = '<div class="form-group container invoice_issues_section">';
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 invoice_issues">';
    inlineQty += '<div class="input-group"><span class="input-group-addon" id="invoice_issues_text">INVOICE ISSUES<span class="mandatory">*</span></span>';
    inlineQty += '<select multiple id="invoice_issues" class="form-control invoice_issues">';

    invoiceIssuesResultSet.forEach(function (invoiceIssueResult) {
        var issue_name = invoiceIssueResult.getValue('name');       // Might need to be changed
        var issue_id = invoiceIssueResult.getValue('internalId');   // Might need to be changed
        var selected = false;
        if (has_invoice_issues) {
            selected = (list_invoice_issues.indexOf(issue_id) != -1);
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
    if (selector_type == 'invoice_number' && isTicketNotClosed(status_value)) {
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
    if (selector_type == 'invoice_number' && isTicketNotClosed(status_value)) {
        inlineQty += '<div class="form-group container user_note user_note_textarea_section">';
    } else {
        inlineQty += '<div class="form-group container user_note user_note_textarea_section hide">';
    }
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 user_note_textarea">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="user_note_textarea_text">USER NOTE<span class="mandatory hide">*</span></span>';
    inlineQty += '<textarea id="user_note_textarea" class="form-control user_note_textarea" rows="3"></textarea>';
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
    if (isTicketNotClosed(status_value)) {
        inlineQty += '<textarea id="comment" class="form-control comment" rows="3">' + comment + '</textarea>';
    } else {
        inlineQty += '<textarea id="comment" class="form-control comment" rows="3" readonly>' + comment + '</textarea>';
    }
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

    if (isTicketNotClosed(status_value)) {
        if (!isNullorEmpty(ticket_id)) {
            inlineQty += '<div class="col-xs-4 close_ticket">';
            inlineQty += '<input type="button" value="CLOSE TICKET" class="form-control btn btn-danger" id="close_ticket" onclick="closeTicket()"/>';
            inlineQty += '</div>';
            if (userId == 409635 || userId == 696992 || userId == 766498) {
                inlineQty += '<div class="col-xs-4 close_unallocated_ticket hide">';
                inlineQty += '<input type="button" value="CLOSE UNALLOCATED TICKET" class="form-control btn btn-danger" id="close_unallocated_ticket" onclick="closeUnallocatedTicket()" />';
                inlineQty += '</div>';
            }
        }

        inlineQty += '<div class="col-xs-4 submitter">';
        inlineQty += '<input type="button" value="" class="form-control btn btn-primary" id="submit_ticket" />';
        inlineQty += '</div>';

        if (isNullorEmpty(ticket_id)) {
            inlineQty += '<div class="col-xs-3 open_and_new_ticket_btn">';
            inlineQty += '<input type="button" value="OPEN AND NEW TICKET" class="form-control btn btn-primary" id="open_and_new_ticket_btn" />';
            inlineQty += '</div>';
        }

        inlineQty += '<div class="col-xs-3 escalate">';
        inlineQty += '<input type="button" value="ESCALATE" class="form-control btn btn-default" id="escalate" onclick="onEscalate()"/>';
        inlineQty += '</div>';

    } else {
        inlineQty += '<div class="col-xs-3 col-xs-offset-2 reopen_ticket">';
        inlineQty += '<input type="button" value="REOPEN TICKET" class="form-control btn btn-primary" id="reopen_ticket" />';
        inlineQty += '</div>';
    }
    inlineQty += '<div class="col-xs-3 cancel">';
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
 * Parse the objects in an array, and returns an object based on the value of one of its keys.
 * With ES6, this function would simply be `array.find(obj => obj[key] == value)`
 * @param   {Array}     array 
 * @param   {String}    key 
 * @param   {*}         value
 * @returns {Object}
 */
function findObjectByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
}

/**
 * Returns whether a ticket is closed or not based on its status value.
 * @param   {Number}    status_value
 * @returns {Boolean}   is_ticket_closed
 */
function isTicketNotClosed(status_value) {
    var is_ticket_not_closed = ((status_value != 3) && (status_value != 8)) ? true : false;
    return is_ticket_not_closed;
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