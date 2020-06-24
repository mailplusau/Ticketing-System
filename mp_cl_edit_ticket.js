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

function pageInit() {
    loadTicketsTable();

    // Initialize all tooltips : https://getbootstrap.com/docs/4.0/components/tooltips/
    $('[data-toggle="tooltip"]').tooltip();

    $('#tickets-preview').on('click', '.edit_class', function () {
        var ticket_id = $(this).parent().siblings().eq(0).text();
        var barcode_number = $(this).parent().siblings().eq(2).text();
        if (isNullorEmpty(barcode_number)) {
            var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
            barcode_number = ticketRecord.getFieldValue('altname');
        }
        editTicket(ticket_id, barcode_number);
    });
}

var ticketsDataSet = [];
$(document).ready(function () {
    $('#tickets-preview').DataTable({
        data: ticketsDataSet,
        columns: [
            { title: "Ticket ID" },
            { title: "Date created" },
            { title: "Barcode" },
            { title: "Customer" },
            { title: "Status" },
            { title: "TOLL Issues" },
            { title: "MP Ticket Issues" },
            { title: "Action" }
        ],
        columnDefs: [
            {
                targets: -1,
                data: null,
                render: function (data, type, row, meta) {
                    if (data[4] == "Closed") {
                        var icon = 'glyphicon-eye-open';
                        var title = 'Open';
                        var button_style = 'btn-secondary';
                    } else {
                        var icon = 'glyphicon-pencil';
                        var title = 'Edit';
                        if (data[4] == "Open") {
                            var button_style = 'btn-success';
                        } else {
                            var button_style = 'btn-warning';
                        }
                    }
                    return '<button class="btn ' + button_style + ' btn - sm edit_class glyphicon ' + icon + '" type="button" data-toggle="tooltip" data-placement="right" title="' + title + '"></button>';
                }
            }]
    });
});

/**
 * Open the "Edit Ticket" page corresponding to the selected ticket
 * @param   {Number}    ticket_id 
 * @param   {String}    barcode_number 
 */
function editTicket(ticket_id, barcode_number) {
    var params = {
        ticket_id: parseInt(ticket_id),
        barcode_number: barcode_number
    };
    params = JSON.stringify(params);
    var upload_url = baseURL + nlapiResolveURL('suitelet', 'customscript_sl_open_ticket', 'customdeploy_sl_open_ticket') + '&custparam_params=' + params;
    window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
}


/**
 * @returns {Boolean} Whether the function has completed correctly.
 */
function saveRecord() {
    return true;
}

/**
 * Load all the open tickets and displays them in the datatable. 
 */
function loadTicketsTable() {
    var ticketSearch = nlapiLoadSearch('customrecord_mp_ticket', 'customsearch_mp_ticket');
    var ticketResultSet = ticketSearch.runSearch();

    $('#result_tickets').empty();
    var ticketsDataSet = [];
    var slice_index = 0;

    var resultTicketSlice = ticketResultSet.getResults(slice_index * 1000, (slice_index + 1) * 1000);
    if (!isNullorEmpty(resultTicketSlice)) {
        do {
            resultTicketSlice = ticketResultSet.getResults(slice_index * 1000, (slice_index + 1) * 1000);
            resultTicketSlice.forEach(function (ticketResult) {

                var ticket_id = ticketResult.getId();
                var date_created = ticketResult.getValue('created');
                var barcode_number = ticketResult.getText('custrecord_barcode_number');
                var customer_name = ticketResult.getText('custrecord_customer1');
                var status = ticketResult.getText('custrecord_ticket_status');
                var toll_issues = ticketResult.getText('custrecord_toll_issues');
                toll_issues = toll_issues.split(',').join('<br>');
                var mp_ticket_issues = ticketResult.getText('custrecord_mp_ticket_issue');
                mp_ticket_issues = mp_ticket_issues.split(',').join('<br>');

                ticketsDataSet.push([ticket_id, date_created, barcode_number, customer_name, status, toll_issues, mp_ticket_issues]);

                return true;
            });

            slice_index += 1;

        } while (resultTicketSlice.length == 1000)
    }

    // Update datatable rows.
    var datatable = $('#tickets-preview').dataTable().api();
    datatable.clear();
    datatable.rows.add(ticketsDataSet);
    datatable.draw();

}
