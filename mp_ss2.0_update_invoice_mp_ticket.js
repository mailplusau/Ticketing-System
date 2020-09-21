/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */

define(['N/task', 'N/email', 'N/runtime', 'N/search', 'N/record', 'N/format', 'N/http'],
	function(task, email, runtime, search, record, format, http) {
		function execute(context) {

			//Search: MP Tickets - Invoices
			var updateInvoiceMPTicket = search.load({
				id: 'customsearch_update_invoice_mp_ticket'
			});

			updateInvoiceMPTicket.run().each(function(result) {

				var mpTicketInternalID = result.getValue({
					name: 'internalid'
				});

				var invoiceInternalID = result.getValue({
					name: "internalid",
					join: "CUSTRECORD_INVOICE_NUMBER"
				});

				log.audit({
					title: 'MP Ticket Internal ID',
					details: mpTicketInternalID
				});

				log.audit({
					title: 'Invoice Internal ID',
					details: invoiceInternalID
				});

				var invoiceRecord = record.load({
					type: 'invoice',
					id: invoiceInternalID,
					isDynamic: true
				});

				invoiceRecord.setValue({
					fieldId: 'custbody_mp_ticket',
					value: mpTicketInternalID
				});

				invoiceRecord.save();


				var scriptTask = task.create({
					taskType: task.TaskType.SCHEDULED_SCRIPT,
					scriptId: 'customscript_update_invoice_mp_ticket',
					deploymentId: 'customdeploy2',
					params: null
				});
				var scriptTaskId = scriptTask.submit();
				return false;
			});
		}
		return {
			execute: execute
		};
	}
);