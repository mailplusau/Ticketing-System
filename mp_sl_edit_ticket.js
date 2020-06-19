/**
 * Module Description
 * 
 * NSVersion    Date                Author         
 * 1.00         2020-06-11 16:17:00 Raphael
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

function editTickets(request, response) {
    if (request.getMethod() == "GET") {

        var form = nlapiCreateForm('View MP Tickets');

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
        // Load "FixedHeader" Datatable extension
        inlineHtml += '<link type="text/css" href="https://cdn.datatables.net/fixedheader/3.1.7/css/fixedHeader.dataTables.min.css" rel="stylesheet" />';
        inlineHtml += '<script type="text/javascript" src="https://cdn.datatables.net/fixedheader/3.1.7/js/dataTables.fixedHeader.min.js"></script>';
        // Load Netsuite stylesheet and script
        inlineHtml += '<link rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/>';
        inlineHtml += '<script src="https://1048144.app.netsuite.com/core/media/media.nl?id=2060797&c=1048144&h=ef2cda20731d146b5e98&_xt=.js"></script>';
        inlineHtml += '<link type="text/css" rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css">';
        inlineHtml += '<style>.mandatory{color:red;}</style>';

        // Define alert window.
        inlineHtml += '<div class="container" style="margin-top:14px;" hidden><div id="alert" class="alert alert-danger fade in"></div></div>';

        // Define information window.
        inlineHtml += '<div class="container" hidden><p id="info" class="alert alert-info"></p></div>';

        inlineHtml += dateCreatedSection();
        inlineHtml += dataTablePreview();

        form.addField('preview_table', 'inlinehtml', '').setLayoutType('outsidebelow', 'startrow').setLayoutType('midrow').setDefaultValue(inlineHtml);
        form.addSubmitButton('Open New Ticket');
        form.setScript('customscript_cl_edit_ticket');
        response.writePage(form);

    } else {
        nlapiSetRedirectURL('SUITELET', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket', null, null);
    }
}

/**
 * The date input fields for the "Date Created" column filter.
 * @return  {String}    inlineQty
 */
function dateCreatedSection() {
    var inlineQty = '<div class="form-group container date_filter_section">';
    inlineQty += '<div class="row">';
    // Date from field
    inlineQty += '<div class="col-xs-6 date_from">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="date_from_text">DATE CREATED FROM</span>';
    inlineQty += '<input id="date_from" class="form-control date_from" type="date"/>';
    inlineQty += '</div></div>';
    // Date to field
    inlineQty += '<div class="col-xs-6 date_to">';
    inlineQty += '<div class="input-group">';
    inlineQty += '<span class="input-group-addon" id="date_to_text">DATE CREATED TO</span>';
    inlineQty += '<input id="date_to" class="form-control date_to" type="date">';
    inlineQty += '</div></div></div></div>';

    return inlineQty;
}

/**
 * The table that will display all the tickets.
 * @return  {String}    inlineQty
 */
function dataTablePreview() {
    var inlineQty = '<style>table#tickets-preview {font-size: 12px;text-align: center;border: none;}.dataTables_wrapper {font-size: 14px;}table#tickets-preview th{text-align: center;}</style>';
    inlineQty += '<table cellpadding="15" id="tickets-preview" class="table table-responsive table-striped customer tablesorter" cellspacing="0" style="width: 100%;">';
    inlineQty += '<thead style="color: white;background-color: #607799;">';
    inlineQty += '</thead>';

    inlineQty += '<tbody id="result_tickets"></tbody>';

    inlineQty += '</table>';
    return inlineQty;
}