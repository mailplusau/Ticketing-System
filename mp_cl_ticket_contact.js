/**
 * Module Description
 * 
 * NSVersion    Date                Author         
 * 3.00         2020-07-09 15:34:00 Raphael
 *
 * Description: A page to add or edit the contacts linked to the selected customer.
 * 
 * @Last Modified by:   Ankith
 * @Last Modified time: 2020-08-27 09:34:08
 *
 */

var baseURL = 'https://1048144.app.netsuite.com';
if (nlapiGetContext().getEnvironment() == "SANDBOX") {
    baseURL = 'https://1048144-sb3.app.netsuite.com';
}


function pageInit() {
    // The inline html of the <table> tag is not correctly displayed inside div.col-xs-10.contacts_div when added with Suitelet.
    // Hence, the html code is added using jQuery when the page loads.
    // The body is populated using the createContactsRows().
    var inline_html_contact_table = '<table cellpadding="15" id="contacts" class="table table-responsive table-striped contacts tablesorter" cellspacing="0" style="width: 100%;border: 0"><thead style="color: white;background-color: #607799;"><tr><th style="vertical-align: middle;text-align: center;" id="col_action"><b>ACTION</b></th><th style="vertical-align: middle;text-align: center;" id="col_salutation"><b>MR. / MS.</b></th><th style="vertical-align: middle;text-align: center;" id="col_first_name"><b>FIRST NAME</b></th><th style="vertical-align: middle;text-align: center;" id="col_last_name"><b>LAST NAME</b></th><th style="vertical-align: middle;text-align: center;" id="col_email"><b>EMAIL</b></th><th style="vertical-align: middle;text-align: center;" id="col_phone"><b>PHONE</b></th><th style="vertical-align: middle;text-align: center;" id="col_role"><b>ROLE</b></th><th style="vertical-align: middle;text-align: center;" id="col_is_mpex_contact"><b>MPEX CONTACT</b></th></tr></thead><tbody></tbody></table>';
    $('div.col-xs-12.contacts_div').html(inline_html_contact_table);

    // Load the contacts associated to the customer
    createContactsRows();

    // Initialize all tooltips : https://getbootstrap.com/docs/4.0/components/tooltips/
    $('[data-toggle="tooltip"]').tooltip()

    /**
     * Either edit the values of a row, or creates a new row
     */
    $('#add_edit_contact').click(function () {
        var contact_id = nlapiGetFieldValue('custpage_contact_id');
        var row_id = nlapiGetFieldValue('custpage_row_id');

        // Get values
        var salutation_val = $('#salutation').val();
        var first_name_val = $('#first_name').val();
        var last_name_val = $('#last_name').val();
        var email_val = $('#email').val();
        var phone_val = $('#phone').val();
        var role_value = $('#role option:selected').val();
        var role_text = $('#role option:selected').text();
        var row_count = $('#contacts tbody tr').length;
        var is_mpex_contact = $('#role_checkbox').prop('checked') ? 'Yes' : 'No';

        if (validate()) {
            if (isNullorEmpty(row_id)) {

                // Create new row
                var inlineQty = $('#contacts tbody').html();
                inlineQty += '<tr class="text-center">';
                inlineQty += '<td headers="col_action">';
                inlineQty += '<button class="btn btn-warning btn-sm edit_class glyphicon glyphicon-pencil" type="button" data-toggle="tooltip" data-rowid="' + row_count + '" data-contactid="' + contact_id + '" data-placement="left" title="Edit"></button>';
                inlineQty += '<button class="btn btn-danger btn-sm remove_class glyphicon glyphicon-trash" type="button" data-toggle="tooltip" data-rowid="' + row_count + '" data-contactid="' + contact_id + '" data-placement="right" title="Delete"></button>';
                inlineQty += '</td>';
                inlineQty += '<td headers="col_salutation">' + salutation_val + '</td>';
                inlineQty += '<td headers="col_first_name">' + first_name_val + '</td>';
                inlineQty += '<td headers="col_last_name">' + last_name_val + '</td>';
                inlineQty += '<td headers="col_email">' + email_val + '</td>';
                inlineQty += '<td headers="col_phone">' + phone_val + '</td>';

                inlineQty += '<td headers="col_role">';
                inlineQty += '<span class="role_value" hidden>' + role_value + '</span>';
                inlineQty += '<span class="role_text">' + role_text + '</span>';
                inlineQty += '</td>';
                inlineQty += '<td headers="col_is_mpex_contact">' + is_mpex_contact + '</td>';
                inlineQty += '</tr>';

                $('#contacts tbody').html(inlineQty);

            } else {
                var nthchild = (parseInt(row_id) + 1).toString();

                // Edit row `row_id`
                var inlineQty = '<td headers="col_action">';
                inlineQty += '<button class="btn btn-warning btn-sm edit_class glyphicon glyphicon-pencil" type="button" data-toggle="tooltip" data-rowid="' + row_id + '" data-contactid="' + contact_id + '" data-placement="left" title="Edit"></button>';
                inlineQty += '<button class="btn btn-danger btn-sm remove_class glyphicon glyphicon-trash" type="button" data-toggle="tooltip" data-rowid="' + row_id + '" data-contactid="' + contact_id + '" data-placement="right" title="Delete"></button>';
                inlineQty += '</td>';
                inlineQty += '<td headers="col_salutation">' + salutation_val + '</td>';
                inlineQty += '<td headers="col_first_name">' + first_name_val + '</td>';
                inlineQty += '<td headers="col_last_name">' + last_name_val + '</td>';
                inlineQty += '<td headers="col_email">' + email_val + '</td>';
                inlineQty += '<td headers="col_phone">' + phone_val + '</td>';

                inlineQty += '<td headers="col_role">';
                inlineQty += '<span class="role_value" hidden>' + role_value + '</span>';
                inlineQty += '<span class="role_text">' + role_text + '</span>';
                inlineQty += '</td>';
                inlineQty += '<td headers="col_is_mpex_contact">' + is_mpex_contact + '</td>';

                $('#contacts tbody tr:nth-child(' + nthchild + ')').html(inlineQty);
            }

            // Clear values
            clearNewContactFields();
        }
    });

    $('#clear').click(function () { clearNewContactFields() });

    /**
     * Hides the contacts table and shows the "New contact" form.
     */
    $('#create_new_contact').click(function () {
        $('#edit_contact_section').removeClass('hide');
        $('#display_contact_section').addClass('hide');
    })

    /**
     * The parameters 'custpage_contact_id' and 'custpage_row_id' are set so that we know which row and contact informations we are editing.
     * The values in the row are copied to the input fields.
     * The "edit contact" section is shown and the "display contact" section is hidden.
     */
    $('.edit_class').click(function () {
        var contact_id = $(this).attr('data-contactid');
        console.log('contact_id : ', contact_id);
        var row_id = $(this).attr('data-rowid');
        console.log('row_id : ', row_id);
        console.log('typeof(row_id) : ', typeof (row_id));
        var nthchild = (parseInt(row_id) + 1).toString();
        console.log('nthchild : ', nthchild);
        nlapiSetFieldValue('custpage_contact_id', contact_id);
        nlapiSetFieldValue('custpage_row_id', row_id);

        var salutation_val = $('#contacts tbody tr:nth-child(' + nthchild + ') td[headers="col_salutation"]').text();
        var first_name_val = $('#contacts tbody tr:nth-child(' + nthchild + ') td[headers="col_first_name"]').text();
        var last_name_val = $('#contacts tbody tr:nth-child(' + nthchild + ') td[headers="col_last_name"]').text();
        var email_val = $('#contacts tbody tr:nth-child(' + nthchild + ') td[headers="col_email"]').text();
        var phone_val = $('#contacts tbody tr:nth-child(' + nthchild + ') td[headers="col_phone"]').text();
        var role_value = $('#contacts tbody tr:nth-child(' + nthchild + ') td[headers="col_role"] span.role_value').text();
        var role_text = $('#contacts tbody tr:nth-child(' + nthchild + ') td[headers="col_role"] span.role_text').text();
        var is_mpex_contact = $('#contacts tbody tr:nth-child(' + nthchild + ') td[headers="col_is_mpex_contact"] span.role_text').text();

        console.log({
            'salutation_val': salutation_val,
            'first_name_val': first_name_val,
            'last_name_val': last_name_val,
            'email_val': email_val,
            'phone_val': phone_val,
            'role_value': role_value,
            'role_text': role_text
        });

        $('#salutation').val(salutation_val);
        $('#first_name').val(first_name_val);
        $('#last_name').val(last_name_val);
        $('#email').val(email_val);
        $('#phone').val(phone_val);
        $('#role option[value="' + role_value + '"]').prop('selected', true);

        switch (is_mpex_contact) {
            case 'Yes':
                $('#role_checkbox').prop('checked', true);
                break;

            case 'No':
                $('#role_checkbox').prop('checked', false);
                break;

            default:
                $('#role_checkbox').prop('checked', false);
                break;
        }

        if (role_value != 6) {
            // The role of a contact that is not an MPEX contact should not be editable.
            // $('#role').attr('disabled', true);
        } else {
            $('#role_checkbox').prop('checked', true);
            $('#role_checkbox').attr('disabled', true);
        }

        $('#edit_contact_section').removeClass('hide');
        $('#display_contact_section').addClass('hide');
    });

    /** The row is simply hidden, so that we still know which contact to delete on submit. */
    $('.remove_class').click(function () {
        if (confirm("Are you sure you want to delete this contact?\n\nThis action cannot be undone.")) {
            $(this).closest('tr').addClass('hide');
        }
    });

    /** If the role 'MPEX Contact' is selected, the checkbox '#role_checkbox' is automatically checked and disabled
     * If another role is selected, the checkbox become active again.
     */
    $('#role').change(function () {
        if ($(this).val() == 6) {
            $('#role_checkbox').prop('checked', true);
            $('#role_checkbox').attr('disabled', true);
        } else {
            $('#role_checkbox').attr('disabled', false);
        }
    })
}

/** Empties the values of the input fields of the edit contact section.
 * All the role options are unselected.
 * Sets the parameters 'custpage_contact_id' and 'custpage_row_id on empty values.
*/
function clearNewContactFields() {
    $('#edit_contact_section').addClass('hide');
    $('#display_contact_section').removeClass('hide');

    $('#salutation').val('');
    $('#first_name').val('');
    $('#last_name').val('');
    $('#email').val('');
    $('#phone').val('');
    $('#role option:selected').each(function () {
        $(this).attr('selected', false);
    });
    $('#role, #role_checkbox').attr('disabled', false);
    $('#role_checkbox').prop('checked', false);
    nlapiSetFieldValue('custpage_contact_id', '');
    nlapiSetFieldValue('custpage_row_id', '');
    $('#alert').parent().hide();
}

/**
 * Create or edit a contact record.
 * @returns {Boolean} Whether the function has completed correctly.
 */
function saveRecord() {
    var params = nlapiGetFieldValue('custpage_params');
    params = JSON.parse(params);
    var customer_id = params.custid;
    console.log('before .each()');
    $('#contacts tbody tr').each(function () {
        var contact_id = $(this).find('td[headers="col_action"] button.edit_class').attr('data-contactid');
        console.log('Current contact_id', contact_id);

        var to_delete = $(this).hasClass('hide');
        if (to_delete) {
            // The record should be inactivated only if it already existed.
            if (!isNullorEmpty(contact_id)) {
                var contactRecord = nlapiLoadRecord('contact', contact_id);
                contactRecord.setFieldValue('isinactive', 'T');
                nlapiSubmitRecord(contactRecord);
                console.log('contactRecord submitted');
            }
        } else {
            if (isNullorEmpty(contact_id)) {
                var contactRecord = nlapiCreateRecord('contact');
                console.log('contactRecord created');
            } else {
                var contactRecord = nlapiLoadRecord('contact', contact_id);
                console.log('contactRecord loaded');
            }

            // Get row values
            var salutation_val = $(this).find('td[headers="col_salutation"]').text();
            var first_name_val = $(this).find('td[headers="col_first_name"]').text();
            var last_name_val = $(this).find('td[headers="col_last_name"]').text();
            var email_val = $(this).find('td[headers="col_email"]').text();
            var phone_val = $(this).find('td[headers="col_phone"]').text();
            var role_value = $(this).find('td[headers="col_role"] span.role_value').text();
            var is_mpex_contact = $(this).find('td[headers="col_is_mpex_contact"]').text();
            console.log($(this).find('td[headers="col_is_mpex_contact"]').text())
            is_mpex_contact = (is_mpex_contact == 'Yes') ? '1' : '2';

            console.log({
                'salutation_val': salutation_val,
                'first_name_val': first_name_val,
                'last_name_val': last_name_val,
                'email_val': email_val,
                'phone_val': phone_val,
                'role_value': role_value,
                'is_mpex_contact': is_mpex_contact
            })

            // Set record values
            contactRecord.setFieldValue('salutation', salutation_val);
            contactRecord.setFieldValue('firstname', first_name_val);
            contactRecord.setFieldValue('lastname', last_name_val);
            contactRecord.setFieldValue('email', email_val);
            contactRecord.setFieldValue('phone', phone_val);
            contactRecord.setFieldValue('company', customer_id);
            contactRecord.setFieldValue('entityid', first_name_val + ' ' + last_name_val);
            contactRecord.setFieldValue('contactrole', role_value);
            contactRecord.setFieldValue('custentity_mpex_contact', is_mpex_contact);

            console.log('Values set');

            nlapiSubmitRecord(contactRecord);
            console.log('contactRecord submitted');
        }

    });

    return true;
}

/**
 * Create the Contacts table by adding contacts details at each row.
 */
function createContactsRows() {
    var contactsResultSet = loadContactsList();
    var inlineQty = '';
    var index = 0;

    contactsResultSet.forEachResult(function (contactResult) {
        var contact_id = contactResult.getId();
        var salutation = contactResult.getValue('salutation');
        var first_name = contactResult.getValue('firstname');
        var last_name = contactResult.getValue('lastname');
        var email = contactResult.getValue('email');
        var phone = contactResult.getValue('phone'); contactResult.getValue('phone');
        var role_value = contactResult.getValue('contactrole');
        var role_text = contactResult.getText('contactrole');
        var is_mpex_contact = contactResult.getValue('custentity_mpex_contact');

        switch (is_mpex_contact) {
            case '1':
                is_mpex_contact = 'Yes';
                break;

            case '2':
                is_mpex_contact = 'No'
                break;

            default:
                is_mpex_contact = '';
                break;
        }

        inlineQty += '<tr class="text-center">';
        inlineQty += '<td headers="col_action">';
        inlineQty += '<button class="btn btn-warning btn-sm edit_class glyphicon glyphicon-pencil" type="button" data-toggle="tooltip" data-rowid="' + index + '" data-contactid="' + contact_id + '" data-placement="left" title="Edit"></button>';
        inlineQty += '<button class="btn btn-danger btn-sm remove_class glyphicon glyphicon-trash" type="button" data-toggle="tooltip" data-rowid="' + index + '" data-contactid="' + contact_id + '" data-placement="right" title="Delete"></button>';
        inlineQty += '</td>';
        inlineQty += '<td headers="col_salutation">' + salutation + '</td>';
        inlineQty += '<td headers="col_first_name">' + first_name + '</td>';
        inlineQty += '<td headers="col_last_name">' + last_name + '</td>';
        inlineQty += '<td headers="col_email">' + email + '</td>';
        inlineQty += '<td headers="col_phone">' + phone + '</td>';

        inlineQty += '<td headers="col_role">'
        inlineQty += '<span class="role_value" hidden>' + role_value + '</span>';
        inlineQty += '<span class="role_text">' + role_text + '</span>';
        inlineQty += '</td>';
        inlineQty += '<td headers="col_is_mpex_contact">' + is_mpex_contact + '</td>'

        inlineQty += '</tr>';

        index += 1;

        return true;
    });

    $('#contacts tbody').html(inlineQty);
}

/**
 * Loads the result set of all the contacts linked to a Customer.
 * @returns {nlobjSearchResultSet}  contactsResultSet
 */
function loadContactsList() {
    var params = nlapiGetFieldValue('custpage_params');
    params = JSON.parse(params);
    var customer_id = params.custid;
    var contactsSearch = nlapiLoadSearch('contact', 'customsearch_salesp_contacts');
    var contactsFilterExpression = [['company', 'is', customer_id], 'AND', ['isinactive', 'is', 'F']];
    contactsSearch.setFilterExpression(contactsFilterExpression);
    var contactsResultSet = contactsSearch.runSearch();
    return contactsResultSet;
}

/**
 * Displays error messages in the alert box on top of the page.
 * @param   {String}    message The message to be displayed.
 */
function showAlert(message) {
    $('#alert').html('<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>' + message);
    $('#alert').parent().show();
}

/**
 * Check that the inputs values are non null.
 * Check that the phone number has a valid Australian format.
 * @returns {Boolean}
 */
function validate() {
    var alertMessage = '';
    var return_value = true;

    // Get values
    var salutation_val = $('#salutation').val().trim();
    var first_name_val = $('#first_name').val().trim();
    var last_name_val = $('#last_name').val().trim();
    var email_val = $('#email').val().trim();
    var phone_val = $('#phone').val().split(' ').join('');

    // Delete spaces
    $('#salutation').val(salutation_val);
    $('#first_name').val(first_name_val);
    $('#last_name').val(last_name_val);
    $('#email').val(email_val);
    $('#phone').val(phone_val);

    // Check that values are not empty.
    if ((isNullorEmpty(salutation_val))) {
        alertMessage += 'Please Select a Salutation\n';
        return_value = false;
    }
    if ((isNullorEmpty(first_name_val))) {
        alertMessage += 'Please Enter the First Name\n';
        return_value = false;
    }
    if ((isNullorEmpty(last_name_val))) {
        alertMessage += 'Please Enter the Last Name\n';
        return_value = false;
    }
    if ((isNullorEmpty(email_val))) {
        alertMessage += 'Please Enter the Email Address\n';
        return_value = false;
    }
    if ((isNullorEmpty(phone_val))) {
        alertMessage += 'Please Enter the Phone Number\n';
        return_value = false;
    }
    if (return_value) {
        var result = validatePhone(phone_val);
        if (result == false) {
            return_value = false;
        }
    } else {
        // if validatePhone is false, it will displays it's own alert message.
        showAlert(alertMessage);
    }

    return return_value;
}

/** Check that the phone input value is a valid Australian phone number.
 * Function copied from the "mp_cl_contacts_module" script.
 * @param   {String}    phone
 * @returns {Boolean}
 */
function validatePhone(phone) {
    var val = phone;
    var digits = val.replace(/[^0-9]/g, '');
    var australiaPhoneFormat = /^(\+\d{2}[ \-]{0,1}){0,1}(((\({0,1}[ \-]{0,1})0{0,1}\){0,1}[2|3|7|8]{1}\){0,1}[ \-]*(\d{4}[ \-]{0,1}\d{4}))|(1[ \-]{0,1}(300|800|900|902)[ \-]{0,1}((\d{6})|(\d{3}[ \-]{0,1}\d{3})))|(13[ \-]{0,1}([\d \-]{5})|((\({0,1}[ \-]{0,1})0{0,1}\){0,1}4{1}[\d \-]{8,10})))$/;

    //Check if all phone characters are numerals
    if (val != digits) {
        showAlert('Phone numbers should contain numbers only.\n\nPlease re-enter the phone number without spaces or special characters.');
        return false;
    } else if (digits.length != 10) {
        //Check if phone is not blank, need to contains 10 digits
        showAlert('Please enter a 10 digit phone number with area code.');
        return false;
    } else if (!(australiaPhoneFormat.test(digits))) {
        //Check if valid Australian phone numbers have been entered
        showAlert('Please enter a valid Australian phone number.\n\nNote: 13 or 12 numbers are not accepted');
        return false;
    } else if (digits.length == 10) {
        //Check if all 10 digits are the same numbers using checkDuplicate function
        if (checkDuplicate(digits)) {
            showAlert('Please enter a valid 10 digit phone number.');
            return false;
        }
    }
}

/** Check if all 10 digits are the same numbers 
 * @param   {String} digits
 * @returns {Boolean}
*/
function checkDuplicate(digits) {
    var digit01 = digits.substring(0, 1);
    var digit02 = digits.substring(1, 2);
    var digit03 = digits.substring(2, 3);
    var digit04 = digits.substring(3, 4);
    var digit05 = digits.substring(4, 5);
    var digit06 = digits.substring(5, 6);
    var digit07 = digits.substring(6, 7);
    var digit08 = digits.substring(7, 8);
    var digit09 = digits.substring(8, 9);
    var digit10 = digits.substring(9, 10);

    if (digit01 == digit02 && digit02 == digit03 && digit03 == digit04 && digit04 == digit05 && digit05 == digit06 && digit06 == digit07 && digit07 == digit08 && digit08 == digit09 && digit09 == digit10) {
        return true;
    } else {
        return false;
    }
}