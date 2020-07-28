/**
 * Module Description
 * 
 * NSVersion    Date                Author         
 * 3.00         2020-06-25 15:57:00 Raphael
 *
 * Description: A ticketing system for the Customer Service.
 * 
 * @Last Modified by:   raphaelchalicarnemailplus
 * @Last Modified time: 2020-07-09 15:34:00
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

    var table_barcodes = $('#tickets-preview-barcodes').DataTable();
    // Hide the checkbox for the rows which can't be selected.
    var rows = table_barcodes.rows().nodes().to$();
    var status = table_barcodes.column(5).data().toArray();
    var has_mpex_contact = table_barcodes.column(8).data().toArray();
    $.each(rows, function (index) {
        if (status[index] == "Closed" || status[index] == "In progress - IT" || !has_mpex_contact[index]) {
            $(this).children('td:first-child').removeClass('select-checkbox');
        };
    })

    // Select or deselect all rows based on the status of the checkbox "#select_all".
    $('#select_all').click(function () {
        if ($(this).prop('checked')) {
            table_barcodes.rows({ selected: false }).select();
        } else {
            table_barcodes.rows({ selected: true }).deselect();
        }
    });

    // Unselect the checkbox "#select_all" when a row is unselected.
    table_barcodes.on('deselect', function (e, dt, type, indexes) {
        if (type === 'row') {
            $('#select_all').prop('checked', false);
        }
    });

    // Prevent selection of rows if it's a closed ticket, or if the Customer has no MPEX contact.
    table_barcodes.on('select', function (e, dt, type, indexes) {
        if (type === 'row') {
            var rows = table_barcodes.rows(indexes).nodes().to$();
            var status = table_barcodes.cells(indexes, 5).data().toArray();
            var has_mpex_contact = table_barcodes.cells(indexes, 8).data().toArray();
            $.each(rows, function (index) {
                if (status[index] == "Closed" || status[index] == "In progress - IT" || !has_mpex_contact[index]) {
                    table_barcodes.row($(this)).deselect()
                };
            })
        }
    });

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
                    var ticket_id = $(this).parent().siblings().eq(1).text().split('MPSD')[1];
                    var selector_number = $(this).parent().siblings().eq(3).text();
                    var selector_type = 'barcode_number';
                    break;

                case 'invoices':
                    var ticket_id = $(this).parent().siblings().eq(0).text().split('MPSD')[1];
                    var selector_number = $(this).parent().siblings().eq(2).text();
                    var selector_type = 'invoice_number';
                    break;
            }

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

            // select the index of the date_created column
            switch (settings.nTable.id) {
                case 'tickets-preview-barcodes':
                    var date_created_column_nb = 2;
                    break;

                case 'tickets-preview-invoices':
                    var date_created_column_nb = 1;
                    break;

            }
            var date_created = dateSelected2Date(data[date_created_column_nb]);

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
                        title: ""
                    },
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
                    { title: "Has MPEX Contact" },
                    { title: "Action" },

                ];

                var columnDefs = [
                    {
                        targets: 0,
                        orderable: false,
                        className: 'select-checkbox'
                    },
                    {
                        targets: -2,
                        visible: false,
                        searchable: false
                    },
                    {
                        targets: -1,
                        data: null,
                        render: function (data, type, row, meta) {
                            if (data[5] == "Closed") {
                                var icon = 'glyphicon-eye-open';
                                var title = 'Open';
                                var button_style = 'btn-success';
                            } else {
                                var icon = 'glyphicon-pencil';
                                var title = 'Edit';
                                if (data[5] == "Open") {
                                    var button_style = 'btn-primary';
                                } else if (data[5] == "In Progress - Customer Service") {
                                    var button_style = 'btn-warning';
                                } else {
                                    var button_style = 'btn-danger';
                                }
                            }
                            return '<button class="btn ' + button_style + ' edit_class glyphicon ' + icon + '" type="button" data-toggle="tooltip" data-placement="right" title="' + title + '"></button>';
                        }
                    }
                ];

                var select = {
                    style: 'multi',
                    selector: 'td:first-child'
                };
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
                    { title: "Invoice" },
                    { title: "Customer" },
                    { title: "Status" },
                    { title: "Invoice Issues" },
                    { title: "MP Ticket Issues" },
                    { title: "Action" },

                ];

                var columnDefs = [
                    {
                        targets: -1,
                        data: null,
                        render: function (data, type, row, meta) {
                            if (data[4] == "Closed") {
                                var icon = 'glyphicon-eye-open';
                                var title = 'Open';
                                var button_style = 'btn-success';
                            } else {
                                var icon = 'glyphicon-pencil';
                                var title = 'Edit';
                                if (data[4] == "Open") {
                                    var button_style = 'btn-primary';
                                } else if (data[4] == "In Progress - Customer Service") {
                                    var button_style = 'btn-warning';
                                } else {
                                    var button_style = 'btn-danger';
                                }
                            }
                            return '<button class="btn ' + button_style + ' btn - sm edit_class glyphicon ' + icon + '" type="button" data-toggle="tooltip" data-placement="right" title="' + title + '"></button>';
                        }
                    }
                ];

                var select = false;
                break;
        }

        var table = $(table_id).DataTable({
            data: ticketsDataSet,
            orderCellsTop: true,
            fixedHeader: true,
            columns: columns,
            columnDefs: columnDefs,
            select: select,
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
 * Triggers the Scheduled script to send the "Under Investigation" email to the MPEX Contacts of the selected tickets.
 */
function onSendBulkEmails() {
    var table = $('#tickets-preview-barcodes').DataTable();
    var selected_tickets_id = table.cells('.selected', 1).data().toArray();
    selected_tickets_id = selected_tickets_id.map(
        function (ticket_number) {
            return ticket_number.split('MPSD')[1];
        });
    var param_selected_ticket_id = JSON.stringify(selected_tickets_id);
    nlapiSetFieldValue('custpage_selected_id', param_selected_ticket_id);
    $('#submitter').trigger('click');
    return true;
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
 * Load all the open tickets and displays them in the datatable.
 * @param   {String[]}    selector_list
 */
function loadTicketsTable(selector_list) {
    var ticketSearch = nlapiLoadSearch('customrecord_mp_ticket', 'customsearch_mp_ticket');
    var ticketResultSet = ticketSearch.runSearch();

    var ticketsDataSetArrays = [];
    selector_list.forEach(function (selector) {
        var tbody_id = '#result_tickets_' + selector;
        $(tbody_id).empty();

        ticketsDataSetArrays.push([]);
    })

    var slice_index = 0;
    var has_mpex_contact_dict = {};

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

                        // TOLL Issues
                        var toll_issues = ticketResult.getText('custrecord_toll_issues');
                        toll_issues = toll_issues.split(',').join('<br>');

                        // Resolved TOLL Issues
                        var resolved_toll_issues = ticketResult.getText('custrecord_resolved_toll_issues');
                        if (!isNullorEmpty(resolved_toll_issues)) {
                            resolved_toll_issues = 'Resolved : <br>' + resolved_toll_issues.split(',').join('<br>');
                        }

                        if (status_val == 3) {
                            toll_issues = resolved_toll_issues;
                        }

                        // Has MPEX Contact
                        var has_mpex_contact = false;
                        if (!isNullorEmpty(customer_id)) {
                            has_mpex_contact = has_mpex_contact_dict[customer_id];
                            if (typeof (has_mpex_contact) == 'undefined') {
                                [has_mpex_contact, has_mpex_contact_dict] = hasMpexContact(customer_id, has_mpex_contact_dict);
                            }
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

                        // Invoice Issues
                        var invoice_issues = ticketResult.getText('custrecord_invoice_issues');
                        invoice_issues = invoice_issues.split(',').join('<br>');

                        // Resolved Invoice Issues
                        var resolved_invoice_issues = ticketResult.getText('custrecord_resolved_invoice_issues');
                        if (!isNullorEmpty(resolved_invoice_issues)) {
                            resolved_invoice_issues = 'Resolved : <br>' + resolved_invoice_issues.split(',').join('<br>');
                        }

                        if (status_val == 3) {
                            invoice_issues = resolved_invoice_issues;
                        }
                        break;
                }

                // MP Ticket Issues
                var mp_ticket_issues = ticketResult.getText('custrecord_mp_ticket_issue');
                mp_ticket_issues = mp_ticket_issues.split(',').join('<br>');

                // Resolved MP Ticket Issues
                var resolved_mp_ticket_issues = ticketResult.getText('custrecord_resolved_mp_ticket_issue');
                if (!isNullorEmpty(resolved_mp_ticket_issues)) {
                    resolved_mp_ticket_issues = 'Resolved : <br>' + resolved_mp_ticket_issues.split(',').join('<br>');
                }

                if (status_val == 3) {
                    mp_ticket_issues = resolved_mp_ticket_issues;
                }

                var customer_id = ticketResult.getValue('custrecord_customer1');
                var customer_name = ticketResult.getText('custrecord_customer1');
                var status = ticketResult.getText('custrecord_ticket_status');

                switch (ticket_type) {
                    case 'barcode':
                        ticketsDataSetArrays[0].push(['', ticket_id, date_created, barcode_number, customer_name, status, toll_issues, mp_ticket_issues, has_mpex_contact]);
                        break;

                    case 'invoice':
                        if (ticketsDataSetArrays[1] != undefined) {
                            ticketsDataSetArrays[1].push([ticket_id, date_created, invoice_number, customer_name, status, invoice_issues, mp_ticket_issues]);
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
 * Look if the customer associated to the ticket has an MPEX Contact.
 * This information is added to the JSON has_mpex_contact_dict.
 * This will be used by the Customer Service to send emails to all the MPEX contacts.
 * @param   {Number}    customer_id 
 * @param   {JSON}      has_mpex_contact_dict
 * @returns {[Boolean, JSON]}     [has_mpex_contact, has_mpex_contact_dict]
 */
function hasMpexContact(customer_id, has_mpex_contact_dict) {
    var has_mpex_contact = false;
    contactsResultSet = loadContactsList(customer_id);
    if (!isNullorEmpty(contactsResultSet)) {
        contactsResultSet.forEachResult(function (contactResult) {
            var contact_role_value = contactResult.getValue('contactrole');
            if (contact_role_value == 6) {
                has_mpex_contact = true;
            }
            return true;
        });
    }
    has_mpex_contact_dict[customer_id] = has_mpex_contact
    return [has_mpex_contact, has_mpex_contact_dict];
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