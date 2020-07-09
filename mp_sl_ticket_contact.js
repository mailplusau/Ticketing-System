/**
 * Module Description
 * 
 * NSVersion    Date                Author         
 * 2.00         2020-06-25 09:51:00 Raphael
 *
 * Description: A page to add or edit the contacts linked to the selected customer.
 * 
 * @Last Modified by:   raphaelchalicarnemailplus
 * @Last Modified time: 2020-06-25 09:51:00
 *
 */

var baseURL = 'https://1048144.app.netsuite.com';
if (nlapiGetContext().getEnvironment() == "SANDBOX") {
    baseURL = 'https://1048144-sb3.app.netsuite.com';
}

function editContactDetails(request, response) {
    if (request.getMethod() == "GET") {

        // Load params
        var params = request.getParameter('params');
        params = JSON.parse(params);

        var customerRecord = nlapiLoadRecord('customer', params.custid);

        var form = nlapiCreateForm('Contact Review: <a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + params.custid + '">' + customerRecord.getFieldValue('entityid') + '</a> ' + customerRecord.getFieldValue('companyname'));
        // var form = nlapiCreateForm('TITLE');

        // Load jQuery
        var inlineHtml = '<script src="https://code.jquery.com/jquery-1.12.4.min.js" integrity="sha384-nvAa0+6Qg9clwYCGGPpDQLVpLNn0fRaROjHqs13t4Ggj3Ez50XnGQqc/r8MhnRDZ" crossorigin="anonymous"></script>';

        // Load Tooltip
        inlineHtml += '<script src="https://unpkg.com/@popperjs/core@2"></script>';

        // Load Bootstrap
        inlineHtml += '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous">';
        inlineHtml += '<script src="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js" integrity="sha384-aJ21OjlMXNL5UyIl/XNwTMqvzeRMZH2w8c5cRVpzpU8Y5bApTppSuUkhZXN0VxHd" crossorigin="anonymous"></script>';

        // Load Netsuite stylesheet and script
        inlineHtml += '<link rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/>';
        inlineHtml += '<script src="https://1048144.app.netsuite.com/core/media/media.nl?id=2060797&c=1048144&h=ef2cda20731d146b5e98&_xt=.js"></script>';
        inlineHtml += '<link type="text/css" rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css">';
        inlineHtml += '<style>.mandatory{color:red;}</style>';

        // Define alert window.
        inlineHtml += '<div class="container" style="margin-top:14px;" hidden><div id="alert" class="alert alert-danger fade in"></div></div>';

        inlineHtml += createNewContactSection();
        inlineHtml += contactsTable();

        form.addField('preview_table', 'inlinehtml', '').setLayoutType('outsidebelow', 'startrow').setLayoutType('midrow').setDefaultValue(inlineHtml);
        params = JSON.stringify(params);
        form.addField('custpage_params', 'text', 'Customer ID').setDisplayType('hidden').setDefaultValue(params);
        form.addField('custpage_contact_id', 'integer', 'Contact ID').setDisplayType('hidden');
        form.addField('custpage_row_id', 'integer', 'Row ID').setDisplayType('hidden');
        form.addSubmitButton('Submit');
        form.setScript('customscript_cl_ticket_contact');
        response.writePage(form);
    } else {
        var params = request.getParameter('custpage_params');
        custparam_params = JSON.parse(params);
        var script_id = custparam_params.id;
        var deploy_id = custparam_params.deploy;
        custparam_params = JSON.stringify(custparam_params);
        var params2 = { custparam_params: custparam_params };
        nlapiSetRedirectURL('SUITELET', script_id, deploy_id, null, params2);
    }
}

/**
 * The input fields to enter informations regarding the new contact.
 * @return  {String}    inlineQty
 */
function createNewContactSection() {
    var inlineQty = '<div id="edit_contact_section" class="hide">';
    // Name Row
    inlineQty += '<div class="form-group container row_title">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-2 salutation_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">MR. / MRS.</span>';
    inlineQty += '<input type="text" id="salutation" class="form-control" />';
    inlineQty += '</div>';
    inlineQty += '</div>';
    inlineQty += '<div class="col-xs-5 first_name_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">FIRST NAME</span>';
    inlineQty += '<input type="text" id="first_name" class="form-control" />';
    inlineQty += '</div>';
    inlineQty += '</div>';
    inlineQty += '<div class="col-xs-5 last_name_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">LAST NAME</span>';
    inlineQty += '<input type="text" id="last_name" class="form-control" />';
    inlineQty += '</div></div></div></div>';

    // Phone email row
    inlineQty += '<div class="form-group container row_details">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-7 email_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">EMAIL</span>';
    inlineQty += '<input type="email" id="email" class="form-control" />';
    inlineQty += '</div>';
    inlineQty += '</div>';
    inlineQty += '<div class="col-xs-5 phone_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">PHONE</span>';
    inlineQty += '<input type="tel" id="phone" class="form-control" />';
    inlineQty += '<div class="input-group-btn">';
    inlineQty += '<button type="button" class="btn btn-success" id="call_daytoday_phone">';
    inlineQty += '<span class="glyphicon glyphicon-earphone"></span>';
    inlineQty += '</button>';
    inlineQty += '</div>';
    inlineQty += '</div></div></div></div>';

    // Role row
    inlineQty += '<div class="form-group container row_category">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 role_section">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon">ROLE</span>';
    inlineQty += '<select class="form-control" id="role">';

    var contact_role_list = [
        { "value": "", "text": "" },
        { "value": "-20", "text": "Alternate Contact" },
        { "value": "-40", "text": "Consultant" },
        { "value": "-30", "text": "Decision Maker" },
        { "value": "-50", "text": "Order Creator" },
        { "value": "-10", "text": "Primary Contact" },
        { "value": "1", "text": "Accounts Payable" },
        { "value": "6", "text": "MPEX Contact" },
        { "value": "5", "text": "Product Contact" },
        { "value": "7", "text": "Shopify Contact" }
    ];
    contact_role_list.forEach(function (contact_role) {
        inlineQty += '<option value="' + contact_role.value + '">' + contact_role.text + '</option>';
    });

    inlineQty += '</select>';
    inlineQty += '</div></div></div></div>';

    // Buttons row
    inlineQty += '<div class="form-group container row_button">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="add_contact_section col-xs-3">';
    inlineQty += '<input type="button" value="ADD / EDIT" class="form-control btn btn-primary" id="add_edit_contact">';
    inlineQty += '</div>';
    inlineQty += '<div class="clear_section col-xs-3">';
    inlineQty += '<input type="button" value="CANCEL" class="form-control btn btn-default" id="clear">';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * The table displaying the contacts linked to the current customer.
 * @return  {String}    inlineQty
 */
function contactsTable() {
    var inlineQty = '<div id="display_contact_section">';
    // Create new contact button
    inlineQty += '<div class="form-group container row_button">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="create_new_contact_section col-xs-3">';
    inlineQty += '<input type="button" value="CREATE CONTACT" class="form-control btn btn-primary" id="create_new_contact" />';
    inlineQty += '</div></div></div>';

    // Contacts section
    inlineQty += '<div class="form-group container contacts_section" style="font-size: small;">';
    inlineQty += '<div class="row">';
    inlineQty += '<div class="col-xs-12 contacts_div">';
    // Since the table is not displayed correctly when added through suitelet, 
    // It is added with jQuery in the pageInit() function in the client script 'mp_cl_ticket_contact.js'.
    inlineQty += '</div>';
    inlineQty += '</div>';
    inlineQty += '</div>';

    inlineQty += '</div>';

    return inlineQty;
}