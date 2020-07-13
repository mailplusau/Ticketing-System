# Ticketing-System

The Ticketing System is destined to the Customer Service.

There are three pages :
* [View MP Tickets](https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=976&deploy=1 "View MP Tickets")
* [Open New Ticket](https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=974&deploy=1 "Open New Ticket")
* Add / Edit Contact

## Open a New Ticket
From the "Open New Ticket" page, a ticket can be created by entering it's associated barcode number / invoice number, depending on the selected option. 

### Barcode Ticket
All the informations regarding this ticket will come from the Customer Product Stock record of the barcode, especially :
* The Customer data
* The Franchisee data
* The TOLL Issues

The Customer Product Stock record will be modified, especially the "TOLL Issues" and "MP Ticket" fields.

### Invoice Ticket
All the informations regarding this ticket will come from the Invoice record associated to the ticket, especially :
* The Customer data
* The Franchisee data

### Workflow

On the opening of the ticket, the Status is passed to "Open". The user is redirected to the "Edit Ticket MPSD[`ticket_id`]" page, with the acknolegement template pre-selected. 

Once the customer has been contacted, by clicking on the "SEND EMAIL" button, the new status of the ticket is "In Progress - Customer Service".

### Escalation
If the button "Escalate" is clicked, or if there is an issue with the barcode / invoice record, the function `onEscalation()` is triggered. The user then must select at least one TOLL Issue (for a barcode ticket) or an Invoice Issue (for an Invoice ticket), one MP Ticket Issue and enter a comment before submitting the ticket by clicking on "ESCALATE TO OWNER".
Based on the MP Issues, the status of the ticket will be either "In Progress - IT" (if at least one issue linked to the IT service has been selected). Otherwise, the status can be "In Progress - Finance" or "In Progress - Operational". The owner of the ticket (i.e., the recipient of the escalation email) is automatically selected based on the MP Ticket issue.

If it's an invoice ticket, only the option "In Progress - IT" can be selected.

### Close a ticket
When the TOLL Issues (for a Barcode tTicket) or the Invoice Issues (for an Invoice Ticket) and the MP Ticket Issues have been unselected, the "Close Ticket" button will appear at the end of the page. It will set the status of the ticket to "Close" and inactivate the record.
A closed ticket is still accessible from the "View MP Tickets" page but it's values are non editable. A closed ticket can be reopened, in the case where a barcode is allocated to a new customer, and this last customer has another issue with the barcode for instance.

## View MP Tickets
From this page, all the tickets are displayed in a dynamic table.
Any ticket record can be edited with the "Action" button.

There are two tabs : "Barcodes" and "Invoice" in which there is a Datatable listing all the corresponding tickets. The "Invoice" tab is available only to the Finance team, the Administrator and the Data Systems Co-ordinator.
