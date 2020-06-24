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

    $('#tickets-preview').on('draw.dt', function () {
        // Each time the table is redrawn, we trigger tooltip for the new cells.
        $('[data-toggle="tooltip"]').tooltip();
    });

    $('#tickets-preview').on('click', '.edit_class', function () {
        var ticket_id = $(this).parent().siblings().eq(0).text().split('MPSD')[1];
        var barcode_number = $(this).parent().siblings().eq(2).text();
        if (isNullorEmpty(barcode_number)) {
            var ticketRecord = nlapiLoadRecord('customrecord_mp_ticket', ticket_id);
            barcode_number = ticketRecord.getFieldValue('altname');
        }
        editTicket(ticket_id, barcode_number);
    });

    // Date filtering
    /* Custom filtering function which will search data in column two between two values */
    $.fn.dataTable.ext.search.push(
        function (settings, data, dataIndex) {
            var date_from_val = $('#date_from').val();
            if (isNullorEmpty(date_from_val)) {
                // The minimum date value is set to the 1st January 1970
                var date_from = new Date(0);
            } else {
                var date_from = new Date(dateSelected2Date(date_from_val));
            }

            var date_to_val = $('#date_to').val();
            if (isNullorEmpty(date_to_val)) {
                // The maximum value is set to the 1st January 3000
                var date_to = new Date(3000, 0);
            } else {
                var date_to = new Date(dateSelected2Date(date_to_val));
            }

            var date_created = dateSelected2Date(data[1]); // use data for the date_created column

            if (date_from <= date_created && date_created <= date_to) {
                return true;
            }
            return false;
        }
    );
}

var ticketsDataSet = [];
$(document).ready(function () {
    var table = $('#tickets-preview').DataTable({
        data: ticketsDataSet,
        orderCellsTop: true,
        fixedHeader: true,
        columns: [
            {
                title: "Ticket ID",
                type: "num-fmt"
            },
            {
                title: "Date created",
                type: "date"
            },
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
            }],
        pageLength: 100
    });
    $('#tickets-preview thead tr').addClass('text-center');

    // Adapted from https://datatables.net/extensions/fixedheader/examples/options/columnFiltering.html
    // Adds a row to the table head row, and adds search filters to each column.
    $('#tickets-preview thead tr').clone(true).appendTo('#tickets-preview thead');
    $('#tickets-preview thead tr:eq(1) th').each(function (i) {
        var title = $(this).text();
        $(this).html('<input type="text" placeholder="Search ' + title + '" />');

        $('input', this).on('keyup change', function () {
            if (table.column(i).search() !== this.value) {
                table
                    .column(i)
                    .search(this.value)
                    .draw();
            }
        });
    });

    // Event listener to the two date filtering inputs to redraw on input
    $('#date_from, #date_to').blur(function () {
        table.draw();
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
                ticket_id = 'MPSD' + ticket_id;

                var date_created = ticketResult.getValue('created');
                date_created = date_created.split(' ')[0];
                date_created = dateCreated2DateSelectedFormat(date_created);

                var barcode_number = ticketResult.getText('custrecord_barcode_number');
                if (isNullorEmpty(barcode_number)) {
                    barcode_number = ticketResult.getValue('altname');
                }
                barcode_number = '<b>' + barcode_number + '</b>';

                var customer_name = ticketResult.getText('custrecord_customer1');
                var status = ticketResult.getText('custrecord_ticket_status');
                var status_val = ticketResult.getValue('custrecord_ticket_status');

                var toll_issues = ticketResult.getText('custrecord_toll_issues');
                toll_issues = toll_issues.split(',').join('<br>');

                var resolved_toll_issues = ticketResult.getText('custrecord_resolved_toll_issues');
                if (!isNullorEmpty(resolved_toll_issues)) {
                    resolved_toll_issues = 'Resolved : <br>' + resolved_toll_issues.split(',').join('<br>');
                }

                var mp_ticket_issues = ticketResult.getText('custrecord_mp_ticket_issue');
                mp_ticket_issues = mp_ticket_issues.split(',').join('<br>');

                var resolved_mp_ticket_issues = ticketResult.getText('custrecord_resolved_mp_ticket_issue');
                if (!isNullorEmpty(resolved_mp_ticket_issues)) {
                    resolved_mp_ticket_issues = 'Resolved : <br>' + resolved_mp_ticket_issues.split(',').join('<br>');
                }

                if (status_val == 3) {
                    toll_issues = resolved_toll_issues;
                    mp_ticket_issues = resolved_mp_ticket_issues;
                }

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
