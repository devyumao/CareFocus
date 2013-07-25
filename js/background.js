//open -a Google\ Chrome --args -disable-web-security
//iphone客户端：5786724301

var notifAmount;
if (localStorage.getItem("notifAmount") !== null) {
	notifAmount = parseInt(localStorage.getItem("notifAmount")); 	
} else {
	notifAmount = 0;
}

if (localStorage.getItem("unreadStatuses") !== null) {
	var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
} else {
	var unreadStatuses = [];
}

function checkUserStatusesUpdate() {
	$.ajax({
		url: "https://api.weibo.com/2/statuses/user_timeline.json?source=5786724301&uid=1656472237&trim_user=0",
		type: "GET",
		dataType: "json",
		success: function(data) {
			var currCheckPoint = new Date();
			var isStatusesUpdated = false;
			if (localStorage.getItem("checkPoint") !== null) {
				for (var i = 0; i < data.statuses.length; i++) {
					var status = data.statuses[i];
					var createdAt = new Date(status.created_at);
					var lastCheckPoint = new Date(localStorage.getItem("checkPoint"));
					console.log(createdAt+" | "+lastCheckPoint+"\n");
					if (createdAt > lastCheckPoint) {
						unreadStatuses.push({type: "weibo", data: status});
						notifAmount++;
						isStatusesUpdated = true;
					} else {
						break;
					}
				};
			}
			if(notifAmount === 0) {
				chrome.browserAction.setBadgeText({text: ""});
			} else {
				chrome.browserAction.setBadgeText({text: "" + notifAmount});
			}
			localStorage.setItem("checkPoint", currCheckPoint);
			if (isStatusesUpdated) {
				localStorage.setItem("notifAmount", notifAmount);
				localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));
			}
			
		},
		error: function(data) {
			alert("UserTimeLine Ajax Error");
		}
	});
	setTimeout(checkUserStatusesUpdate, 30000);
}

checkUserStatusesUpdate();

