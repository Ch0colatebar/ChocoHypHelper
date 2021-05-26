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

// Alliance page (extract for HyperiumsWatchdog)
if (window.location.href.indexOf("Alliance") > -1) {
	// Generating the string with players and planets + now time
	const nowISOStr = new Date().toISOString();
	let nowStr = nowISOStr.substring(0, 10)+" "+nowISOStr.substring(11, 19);
	var str = "# Generated: "+nowStr+"\n";
	str += "#> PlayerRank PlayerName PlanetNames*\n";
	let firstLine = true;

	$('tr.line0').each(function() {
		let playerName = $(this).find('td:eq(0)').text();
		let playerPlanets = $(this).find('td:eq(1)').text();

		if(!firstLine) {
			str += "\n";
		}
		str += playerName +"\t"+playerPlanets;
		firstLine = false;
	});

console.log("str", str);

	// Adding the button to export
	let btnPlanet = $("input[name='searchplanet']");
	console.log(btnPlanet);
	let container = btnPlanet.parent();
	btnPlanet.after('<button><a href="#" class="button" id=\"btn_exportTxt\">Export .txt</a></button>');

	container.on('click', '#btn_exportTxt', function(){
		this.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(str);
    this.download = 'export.txt';
	});
}

// Fleets
if (window.location.href.indexOf("Fleets") > -1 && $("div.banner").length > 0) {
	let gasOnPlanetList = [];

  // Retrieves planets ground armies data
	$("div[class*='planetCard']").each(function() {
		let planetName = new String($(this).find("a.planet").text());
		let planetRace = $(this).find("img.vc").next().text().charAt(0);
		let groundAvgp = $(this).find("td:contains('Ground')").siblings(".vb").text();
		groundAvgp = parseFloat(groundAvgp.substring(0, groundAvgp.length-1));
		gasOnPlanetList.push({ planetName: planetName, planetRace: planetRace, groundAvgp: groundAvgp});
	});

	// Sort table by race then by groundAvgp
	sortAvgpTable(gasOnPlanetList);

	// Display a table with GAs data
	let html = `<div id="chocoavgptab"><table><tr><thead><th>Planet</th><th>Race</th><th>GAs</th></thead></tr><tbody>`;
	gasOnPlanetList.forEach((planet) => {
		html += '<tr><td>'+planet.planetName+'</td><td>'+planet.planetRace+'</td><td>'+planet.groundAvgp+'</td></tr>';
	});
	html += `</tbody></table></div>`;
	$("body").append(html);
}

function sortAvgpTable(table) {
	function compare(a, b) {
    return a.planetRace.localeCompare(b.planetRace) || b.groundAvgp - a.groundAvgp;
	}

	table.sort(compare);
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
