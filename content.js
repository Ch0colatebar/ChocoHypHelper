// Planet overview page
if(window.location.href.indexOf("Home") > -1 || window.location.href.indexOf("Preferences") > -1) {
	const pattern = /Energy: (?<units>[0-9]+) units \((?<percents>[0-9]+)%\)/;

	$("td[onmouseover*=Energy]").each(function() {
		let attr = $(this).attr('onmouseover');
		let regex = attr.match(pattern).groups;
		let maxEnergy = parseInt(regex.units * 100 / regex.percents);
		let energyStr = isNaN(maxEnergy) ? "0" : regex.units+"/"+maxEnergy;
		let customNrjBars = "";
		let i=0;
		const NB_OF_BARS = 5;

		// Filling the full cells
		while(i < regex.percents / (100/NB_OF_BARS)) {
			customNrjBars += '<td class="nrj nrj1"></td>';
			i++;
		}

		// Filling the empty cells
		while(i < NB_OF_BARS) {
			customNrjBars += '<td class="nrj nrj0"></td>';
			i++;
		}
		customNrjBars += '<td class="chocoNrjStr chocoNrjBar">'+energyStr+'</td>';

		 $(this).find('tr').empty().append(customNrjBars);
		 $(this).attr('width', '70px');
	});
}

// Trading page
if (window.location.href.indexOf("Trading") > -1) {
	const firstField = $('input[name="expl0"]');
	const btnPopulate = $( "<button type=\"button\" id=\"btnPopulate\">Populate</button>" );

	firstField.change(function() {
	  addFormPanel();
	});

	btnPopulate.click(function() {
		populateFields();
	});

	function addFormPanel() {
		const td = firstField.closest('td');
		td.append(btnPopulate);
	}

	function populateFields() {
		for(let i=1; i < 99; i++) {
			var otherField = $('input[name="expl'+i+'"]');
					console.log('populate:'+otherField.toString);
			if(otherField == null || otherField.val() == null) {
				break;
			}
			otherField.val(firstField.val());
		}
	}
}

// Forum page - thread list
if(window.location.href.indexOf("forumid") > -1 && window.location.href.indexOf("threadid") <= 0) {
	const regex = /threadid=(?<threadid>[0-9]+)/;
	const playerName = $('a.megaTextItem[rel="playerSubmenu"]').text().split(' ')[1];

	$('table.forumArray tr').each(function() {
		var thisTr = $(this);
		// Ignore first tr (headers)
		if($(this).attr('id') == "forumArray") return;

		// First link
		let firstTdLink = $(this).find("td:first a");
		let href = firstTdLink.attr('href');
		let thisThreadId = href.match(regex).groups.threadid;

		// Date of last post
		let lastPostDate = $(this).find("td:eq(3)").text();
		lastPostDate = lastPostDate.replace(' ', 'T');

		// last author
		let lastAuthor = $(this).find("td:eq(4)").text();

		chrome.storage.sync.get([thisThreadId], function(result) {
			result = result[thisThreadId];
			let playerIsNotTheAuthor = playerName != lastAuthor;

			if(playerIsNotTheAuthor &&
				($.isEmptyObject(result) || !result.read
			|| new Date(lastPostDate).getTime() > new Date(result.lastread).getTime()))  {
				// Addind a flag for UNREAD threads
				thisTr.find("td:first-child").prepend('<span class="microtext chocoNewThread">[NEW] </span>');
			}
		});
	});
}

// Forum page - thread page
if(window.location.href.indexOf("forumid") > -1 && window.location.href.indexOf("threadid") > -1) {
	var urlParams = new URLSearchParams(window.location.search);
	let thisThreadId = urlParams.get('threadid');
	console.log(thisThreadId);

	let serverTime = $("div.servertime").first().text();
	serverTime = serverTime.substring(13, serverTime.length);
	serverTime = serverTime.replace(' ', 'T');

	console.log(serverTime);

	let threadInfo = {read: true, lastread: serverTime};

	chrome.storage.sync.set({ [thisThreadId]: threadInfo}, function() {});
}
