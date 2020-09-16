/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */

define(['N/task', 'N/email', 'N/runtime', 'N/search', 'N/record', 'N/format', 'N/http'],
	function(task, email, runtime, search, record, format, http) {
		function execute(context) {

			//Search: MP Tickets - MPEX Issue Category Null
			var mpTicketNullIssueCategory = search.load({
				id: 'customsearch_mp_ticket_null_issue_cat'
			});

			mpTicketNullIssueCategory.run().each(function(result) {

				var mpTicketInternalID = result.getValue({
					name: 'internalid'
				});

				var currentTollIssues = result.getValue({
					name: 'custrecord_toll_issues'
				});

				var resolvedTollIssues = result.getValue({
					name: 'custrecord_resolved_toll_issues'
				});

				//Combine current and resolved TOLL issues into 1 variable
				var combinedTollIssues = currentTollIssues.concat(resolvedTollIssues);

				log.audit({
					title: 'Combined TOLL Issues',
					details: combinedTollIssues
				});

				var issueCategory = new Array();

				/*
				Below List of TOLL Issues are categorised as TOLL

				Address: Not Safe to Leave - Re-delivery Organised	
				Address: Unserviced Remote Area	
				Alternative Delivery Point	
				Damaged Item	
				Delayed +1 Day	
				Delayed +2 Days	
				Delayed >2 Days	
				Delivered to Incorrect Address	
				Dispute of Delivery	
				Missorted	
				Out for delivery – ETA requested
				Lost Item	
				 */
				if ((combinedTollIssues.indexOf(16) != -1) || (combinedTollIssues.indexOf(15) != -1) || (combinedTollIssues.indexOf(7) != -1) || (combinedTollIssues.indexOf(5) != -1) || (combinedTollIssues.indexOf(12) != -1) || (combinedTollIssues.indexOf(8) != -1) || (combinedTollIssues.indexOf(9) != -1) || (combinedTollIssues.indexOf(3) != -1) || (combinedTollIssues.indexOf(17) != -1) || (combinedTollIssues.indexOf(14) != -1) || (combinedTollIssues.indexOf(18) != -1) || (combinedTollIssues.indexOf(4) != -1)) {
					issueCategory[issueCategory.length] = 2;
				}

				/*
				Below List of TOLL Issues are categorised as Customer

				Address: Receiver No Longer at Address	
				Incorrect Address: Incomplete	
				Incorrect Address: No Address	
				Incorrect Address: P.O. Box	
				Returned to Sender
				Overweight	
				 */

				if ((combinedTollIssues.indexOf(13) != -1) || (combinedTollIssues.indexOf(10) != -1) || (combinedTollIssues.indexOf(11) != -1) || (combinedTollIssues.indexOf(1) != -1) || (combinedTollIssues.indexOf(2) != -1) || (combinedTollIssues.indexOf(6) != -1)) {
					issueCategory[issueCategory.length] = 1;
				}

				var mpTicketRecord = record.load({
					type: 'customrecord_mp_ticket',
					id: mpTicketInternalID
				});

				mpTicketRecord.setValue({
					fieldId: 'custrecord_mpex_issue_category',
					value: issueCategory
				});

				mpTicketRecord.save();

				log.audit({
					title: 'Issue Category',
					details: issueCategory
				});

				var scriptTask = task.create({
					taskType: task.TaskType.SCHEDULED_SCRIPT,
					scriptId: 'customscript_ss_update_issue_cat',
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