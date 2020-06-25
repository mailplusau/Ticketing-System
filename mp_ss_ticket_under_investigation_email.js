
var ctx = nlapiGetContext();
/*
var usageThreshold = 50;
var adhocInvDeploy = 'customdeploy1';
var prevInvDeploy = null;
*/

function sendUnderInvestigationEmail() {
    var param_selected_ticket_id = JSON.parse(ctx.getSetting('SCRIPT', 'custscript_selected_ticket_id'));

    nlapiLogExecution('DEBUG', 'param_selected_ticket_id', param_selected_ticket_id);

    var template_id = 67;
    var under_investigation_template_record = nlapiLoadRecord('customrecord_camp_comm_template', template_id);
    var template_subject = under_investigation_template_record.getFieldValue('custrecord_camp_comm_subject');
    var url = 'https://1048144.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=395&deploy=1&compid=1048144&h=6d4293eecb3cb3f4353e&rectype=customer&template=';
    if (nlapiGetContext().getEnvironment() == "SANDBOX") {
        var url = 'https://1048144-sb3.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=395&deploy=1&compid=1048144_SB3&h=9c35dc467fbdfafcfeaa&rectype=customer&template=';
    }
    var sales_rep = encodeURIComponent(nlapiGetContext().getName());
    var userid = encodeURIComponent(nlapiGetContext().getUser());

    param_selected_ticket_id.forEach(function (ticket_id) {
        var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
        var barcode_number = ticketRecord.getFieldText('custrecord_barcode_number');
        var customer_id = ticketRecord.getFieldValue('custrecord_customer1');
        contactsResultSet = loadContactsList(customer_id);
        contactsResultSet.forEachResult(function (contactResult) {
            var contact_role_value = contactResult.getValue('contactrole');
            if (contact_role_value == 6) {
                var first_name = contactResult.getValue('firstname');
                var dear = encodeURIComponent(first_name);
                var contact_id = contactResult.getValue('internalid');

                url += template_id + '&recid=' + customer_id + '&salesrep=' + sales_rep + '&dear=' + dear + '&contactid=' + contact_id + '&userid=' + userid;
                urlCall = nlapiRequestURL(url);
                var emailHtml = urlCall.getBody();

                var contact_email = contactResult.getValue('email');
                var subject = 'MailPlus [MPSD' + ticket_id + '] - ' + template_subject + ' - ' + barcode_number;

                nlapiSendEmail(112209, [contact_email], subject, emailHtml, null) // 112209 is from MailPlus Team
            }
            return true;
        });
    })
}

/**
 * Loads the result set of all the contacts linked to a Customer.
 * @param   {Number}                customer_id
 * @returns {nlobjSearchResultSet}  contactsResultSet
 */
function loadContactsList(customer_id) {
    var contactsResultSet = [];
    if (!isNullorEmpty(customer_id)) {
        var contactsSearch = nlapiLoadSearch('contact', 'customsearch_salesp_contacts');
        var contactsFilterExpression = [['company', 'is', customer_id], 'AND', ['isinactive', 'is', 'F']];
        contactsSearch.setFilterExpression(contactsFilterExpression);
        contactsResultSet = contactsSearch.runSearch();
    }
    return contactsResultSet;
}
