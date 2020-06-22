# Ticketing-System

The Ticketing System is destined to the Customer Service.

There are three pages :
* [View MP Tickets](https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=976&deploy=1 "View MP Tickets")
* [Open New Ticket](https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=974&deploy=1 "Open New Ticket")
* Add / Edit Contact

## Open a New Ticket
From the "Open New Ticket" page, a ticket can be created by entering it's associated barcode number. All the informations regarding this ticket will come from the Customer Product Stock record of the barcode, especially :
* The Customer data
* The Franchisee data
* The TOLL Issues

The Customer Product Stock record will be modified, especially the "TOLL Issues" and "MP Ticket" fields.

On the opening of the ticket, the Status is passed to "Open"
If an MPEX Contact exists for the Customer, an acknoledgement email is sent to the contact. Once the customer has been contacted, the new status of the ticket is "In Progress".

## View MP Tickets
From this page, all the tickets are displayed in a dynamic table.
Any ticket record can be edited with the "Action" button.
