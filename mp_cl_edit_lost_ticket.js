/**
 * Module Description
 *
 * NSVersion    Date                Author
 * 3.00         2020-10-0808 14:20  Ravija
 *
 * Description: A ticketing system for the Customer Service.
 *
 * @Last Modified by:   Ravija Maheshwari
 * @Last Modified time: 2020-10-08 14:30:00
 *
 */

var baseURL = 'https://1048144.app.netsuite.com';
if (nlapiGetContext().getEnvironment() == "SANDBOX") {
    baseURL = 'https://1048144-sb3.app.netsuite.com';
}
var userRole = parseInt(nlapiGetContext().getRole());
var selector_list = ['barcodes', 'invoices'];

function pageInit() {

    loadTicketsTable(selector_list);

    // Initialize all tooltips : https://getbootstrap.com/docs/4.0/components/tooltips/
    $('[data-toggle="tooltip"]').tooltip();

    $('.table').each(function () {
        var table = $(this).DataTable();

        table.on('draw.dt', function () {
            // Each time the table is redrawn, we trigger tooltip for the new cells.
            $('[data-toggle="tooltip"]').tooltip();
        });

        table.on('click', '.edit_class', function () {
            var selector = $('div.tab-pane.active').attr('id');
            switch (selector) {
                case 'barcodes':
                    var selector_type = 'barcode_number';
                    break;

                case 'invoices':
                    var selector_type = 'invoice_number';
                    break;
            }
            var ticket_id = $(this).parent().siblings().eq(0).text().split('MPSD')[1];
            var selector_number = $(this).parent().siblings().eq(3).text();

            if (isNullorEmpty(selector_number.trim())) {
                var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
                selector_number = ticketRecord.getFieldValue('altname');
            }
            editTicket(ticket_id, selector_number, selector_type);
        });
    });

    // Date filtering
    /* Custom filtering function which will search data in column two between two values */
    $.fn.dataTable.ext.search.push(
        function (settings, data, dataIndex) {

            // Get value of the "Date created from" field
            var date_from_val = $('#date_from').val();
            if (isNullorEmpty(date_from_val)) {
                // The minimum date value is set to the 1st January 1970
                var date_from = new Date(0);
            } else {
                var date_from = new Date(dateSelected2Date(date_from_val));
            }

            // Get value of the "Date created to" field
            var date_to_val = $('#date_to').val();
            if (isNullorEmpty(date_to_val)) {
                // The maximum value is set to the 1st January 3000
                var date_to = new Date(3000, 0);
            } else {
                var date_to = new Date(dateSelected2Date(date_to_val));
            }

            var date_created = dateSelected2Date(data[1]);

            return (date_from <= date_created && date_created <= date_to);
        }
    );
}

var ticketsDataSet = [];
$(document).ready(function () {

    selector_list.forEach(function (selector) {
        // The inline html of the <table> tag is not correctly displayed inside 'div#' + selector when added with Suitelet.
        // Hence, the html code is added using jQuery when the page loads.
        if ((selector != 'invoices') || isFinanceRole(userRole)) {
            var inline_html_tickets_table = dataTablePreview(selector);
            $('div#' + selector).html(inline_html_tickets_table);
        }

        var table_id = '#tickets-preview-' + selector;

        switch (selector) {
            case 'barcodes':
                var columns = [
                    {
                        title: "Ticket ID",
                        type: "num-fmt"
                    },
                    {
                        title: "Date created",
                        type: "date"
                    },
                    {
                        title: "Date closed",
                        type: "date"
                    },
                    { title: "Barcode" },
                    { title: "Customer" },
                    { title: "Franchise" },
                    { title: "Owner" },
                    { title: "Status" },
                    { title: "Resolved TOLL Issues" },
                    { title: "Resolved MP Ticket Issues" },
                    { title: "Action" }
                ];
                break;

            case 'invoices':
                var columns = [
                    {
                        title: "Ticket ID",
                        type: "num-fmt"
                    },
                    {
                        title: "Date created",
                        type: "date"
                    },
                    {
                        title: "Date closed",
                        type: "date"
                    },
                    { title: "Invoice" },
                    { title: "Customer" },
                    { title: "Franchise" },
                    { title: "Owner" },
                    { title: "Status" },
                    { title: "Resolved Invoice Issues" },
                    { title: "Resolved MP Ticket Issues" },
                    { title: "Action" }
                ];
                break;
        }

        var table = $(table_id).DataTable({
            data: ticketsDataSet,
            orderCellsTop: true,
            fixedHeader: true,
            columns: columns,
            pageLength: 100
        });
        $(table_id + ' thead tr').addClass('text-center');

        // Adapted from https://datatables.net/extensions/fixedheader/examples/options/columnFiltering.html
        // Adds a row to the table head row, and adds search filters to each column.
        $(table_id + ' thead tr').clone(true).appendTo(table_id + ' thead');
        $(table_id + ' thead tr:eq(1) th').each(function (i) {
            var title = $(this).text();
            if (title == '') {
                $(this).html('<input type="checkbox" id="select_all"></input>');
            } else {
                $(this).html('<input type="text" placeholder="Search ' + title + '" />');

                $('input', this).on('keyup change', function () {
                    if (table.column(i).search() !== this.value) {
                        table
                            .column(i)
                            .search(this.value)
                            .draw();
                    }
                });
            }

        });
    });

    console.log('Datatables created');

    // Event listener to the two date filtering inputs to redraw on input
    $('#date_from, #date_to').blur(function () {
        $('.table').each(function () {
            var table = $(this).DataTable();
            table.draw();
        });
    });
})

/**
 * Open the "Edit Ticket" page corresponding to the selected ticket
 * @param   {Number}    ticket_id
 * @param   {String}    selector_number
 * @param   {String}    selector_type
 */
function editTicket(ticket_id, selector_number, selector_type) {
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
 * Redirect to the "View MP Tickets" page.
 */
function viewOpenTickets() {
    var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_edit_ticket', 'customdeploy_sl_edit_ticket');
    window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
}

/**
 * Redirect to the "View Closed Tickets" page.
 */
function viewClosedTickets() {
    var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_edit_closed_ticket', 'customdeploy_sl_edit_closed_ticket');
    window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
}


/**
 * @returns {Boolean} Whether the function has completed correctly.
 */
function saveRecord() {
    var selector = $('div.tab-pane.active').attr('id');
    switch (selector) {
        case 'barcodes':
            var selector_type = 'barcode_number';
            break;

        case 'invoices':
            var selector_type = 'invoice_number';
            break;
    }
    nlapiSetFieldValue('custpage_selector_type', selector_type);
    return true;
}

/**
 * Load all the "closed-lost" status tickets and displays them in the datatable.
 * @param   {String[]}    selector_list
 */
function loadTicketsTable(selector_list) {
    var ticketSearch = nlapiLoadSearch('customrecord_mp_ticket', 'customsearch_mp_ticket_2');
    var filters = [["custrecord_ticket_status","anyof","9"]];
    ticketSearch.setFilterExpression(filters);
    var ticketResultSet = ticketSearch.runSearch();

    var ticketsDataSetArrays = [];
    selector_list.forEach(function (selector) {
        var tbody_id = '#result_tickets_' + selector;
        $(tbody_id).empty();

        ticketsDataSetArrays.push([]);
    })

    var slice_index = 0;

    var resultTicketSlice = ticketResultSet.getResults(slice_index * 1000, (slice_index + 1) * 1000);
    if (!isNullorEmpty(resultTicketSlice)) {
        do {
            resultTicketSlice = ticketResultSet.getResults(slice_index * 1000, (slice_index + 1) * 1000);
            resultTicketSlice.forEach(function (ticketResult) {

                var ticket_id = ticketResult.getId();
                ticket_id = 'MPSD' + ticket_id;

                var date_created = ticketResult.getValue('created');
                date_created = date_created.split(' ')[0];
                date_created = dateCreated2DateSelectedFormat(date_created);

                var date_closed = ticketResult.getValue('custrecord_date_closed');
                date_closed = date_closed.split(' ')[0];
                date_closed = dateCreated2DateSelectedFormat(date_closed);

                var customer_name = ticketResult.getText('custrecord_customer1');
                var franchise_name = ticketResult.getText('custrecord_zee');

                var owners = ticketResult.getText('owner');
                owners = owners.split(',').join('<br>');

                var status_val = ticketResult.getValue('custrecord_ticket_status');

                var ticket_type = getTicketType(ticketResult);

                switch (ticket_type) {
                    case 'barcode':
                        // Barcode number
                        var barcode_number = ticketResult.getText('custrecord_barcode_number');
                        if (isNullorEmpty(barcode_number)) {
                            barcode_number = ticketResult.getValue('altname');
                        }
                        barcode_number = '<b>' + barcode_number + '</b>';

                        // Resolved TOLL Issues
                        var resolved_toll_issues = ticketResult.getText('custrecord_resolved_toll_issues');
                        if (!isNullorEmpty(resolved_toll_issues)) {
                            resolved_toll_issues = resolved_toll_issues.split(',').join('<br>');
                        }
                        break;

                    case 'invoice':
                        // Invoice number
                        var re = /Invoice #([\w]+)/;
                        var invoice_number = ticketResult.getText('custrecord_invoice_number');
                        if (isNullorEmpty(invoice_number)) {
                            invoice_number = ticketResult.getValue('altname');
                        }
                        invoice_number = invoice_number.replace(re, '$1');
                        invoice_number = '<b>' + invoice_number + '</b>';

                        // Resolved Invoice Issues
                        var resolved_invoice_issues = ticketResult.getText('custrecord_resolved_invoice_issues');
                        if (!isNullorEmpty(resolved_invoice_issues)) {
                            resolved_invoice_issues = resolved_invoice_issues.split(',').join('<br>');
                        }

                        break;
                }

                // Resolved MP Ticket Issues
                var resolved_mp_ticket_issues = ticketResult.getText('custrecord_resolved_mp_ticket_issue');
                if (!isNullorEmpty(resolved_mp_ticket_issues)) {
                    resolved_mp_ticket_issues = resolved_mp_ticket_issues.split(',').join('<br>');
                }

                var status = ticketResult.getText('custrecord_ticket_status');
                var action_button = '<button class="btn btn-success edit_class glyphicon glyphicon-eye-open" type="button" data-toggle="tooltip" data-placement="right" title="Open"></button>';

                switch (ticket_type) {
                    case 'barcode':
                        ticketsDataSetArrays[0].push([ticket_id, date_created, date_closed, barcode_number, customer_name, franchise_name, owners, status, resolved_toll_issues, resolved_mp_ticket_issues, action_button]);
                        break;

                    case 'invoice':
                        if (ticketsDataSetArrays[1] != undefined) {
                            ticketsDataSetArrays[1].push([ticket_id, date_created, date_closed, invoice_number, customer_name, franchise_name, owners, status, resolved_invoice_issues, resolved_mp_ticket_issues, action_button]);
                        }
                        break;
                }

                return true;
            });

            slice_index += 1;

        } while (resultTicketSlice.length == 1000)
    }

    console.log('ticketsDataSet : ', ticketsDataSetArrays);

    // Update datatable rows.
    selector_list.forEach(function (selector, index) {
        var table_id = '#tickets-preview-' + selector;
        var datatable = $(table_id).dataTable().api();
        datatable.clear();
        datatable.rows.add(ticketsDataSetArrays[index]);
        datatable.draw();
    });
}

/**
 * The table that will display the tickets, based on their type.
 * @param   {String}    selector
 * @return  {String}    inlineQty
 */
function dataTablePreview(selector) {
    var inlineQty = '<style>table#tickets-preview-' + selector + ' {font-size: 12px;text-align: center;border: none;}.dataTables_wrapper {font-size: 14px;}table#tickets-preview-' + selector + ' th{text-align: center;}</style>';
    inlineQty += '<table cellpadding="15" id="tickets-preview-' + selector + '" class="table table-responsive table-striped customer tablesorter" cellspacing="0" style="width: 100%;">';
    inlineQty += '<thead style="color: white;background-color: #607799;">';
    inlineQty += '</thead>';

    inlineQty += '<tbody id="result_tickets_' + selector + '"></tbody>';

    inlineQty += '</table>';
    return inlineQty;
}

/**
 * Converts the date string in the "date_to" and "date_from" fields to Javascript Date objects.
 * @param   {String}    date_selected   ex: "2020-06-04"
 * @returns {Date}      date            ex: Thu Jun 04 2020 00:00:00 GMT+1000 (Australian Eastern Standard Time)
 */
function dateSelected2Date(date_selected) {
    // date_selected = "2020-06-04"
    var date_array = date_selected.split('-');
    // date_array = ["2020", "06", "04"]
    var year = date_array[0];
    var month = date_array[1] - 1;
    var day = date_array[2];
    var date = new Date(year, month, day);
    return date;
}

/**
 * Converts the date string in the "date_created" table to the format of "date_selected".
 * @param   {String}    date_created    ex: '4/6/2020'
 * @returns {String}    date            ex: '2020-06-04'
 */
function dateCreated2DateSelectedFormat(date_created) {
    // date_created = '4/6/2020'
    var date_array = date_created.split('/');
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
 * Returns the type of record of the selected ticket.
 * @param   {nlobjSearchResult} ticketResult
 * @returns {String}            type of the ticket
 */
function getTicketType(ticketResult) {
    var barcode_number = ticketResult.getText('custrecord_barcode_number');
    if (!isNullorEmpty(barcode_number)) {
        barcode_number = barcode_number.trim();
    }

    var invoice_number = ticketResult.getText('custrecord_invoice_number');
    if (!isNullorEmpty(invoice_number)) {
        invoice_number = invoice_number.trim();
    }


    if (!isNullorEmpty(barcode_number)) {
        return 'barcode';
    } else if (!isNullorEmpty(invoice_number)) {
        return 'invoice';
    } else {
        var re_barcode = /^MPE/;
        var re_invoice = /^INV/;
        var ticket_name = ticketResult.getValue('altname');
        if (ticket_name.match(re_barcode)) {
            return 'barcode';
        } else if (ticket_name.match(re_invoice)) {
            return 'invoice';
        } else {
            return '';
        }
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