var weiboAppKey = "82966982";
var renrenAccessToken = "239309%7C6.402c6ec451f9faf2b9b51cbfa757e216.2592000.1378130400-702002529";

if(localStorage.length === 0) {
	localStorage.setItem("notifAmount", "0");
	localStorage.setItem("targets", $.toJSON({}));
	localStorage.setItem("checkPoint", $.toJSON({}));
	localStorage.setItem("unreadStatuses", $.toJSON({}));
} else {
	var originNotif = parseInt((localStorage.getItem("notifAmount")));
	if(originNotif === 0) {
		chrome.browserAction.setBadgeText({text: ""});
	} else {
		chrome.browserAction.setBadgeText({text: "" + originNotif});
	}

	var targets = $.evalJSON(localStorage.getItem("targets"));
	var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
	for (var key in targets) {
		for (var social in targets[key]) {
			if (social !== "mark") {	
				var apiURL;
				switch (social) {
					case "weibo":
						apiURL = "https://api.weibo.com/2/statuses/user_timeline.json?source="+weiboAppKey+"&uid="+targets[key][social]["id"]+"&trim_user=1";
						break;
					case "renren":
						apiURL = "https://api.renren.com/v2/feed/list?access_token="+renrenAccessToken+"&userId="+targets[key][social]["id"];
						break;
					default:
						break;
				}
				checkStatusesUpdate(key, apiURL, social)(); 
			}
		}
	}
}


function checkStatusesUpdate(key, apiURL, social) {
	return function() {
		$.ajax({
			url: apiURL,
			type: "GET",
			dataType: "json",
			success: function(data) {

				console.log(key + "-" + social + ": " + Date());

				var unreadStatuses, 
					notifAmount;

				var statuses,
					timestamp;
				switch (social) {
					case "weibo":
						statuses = data.statuses;
						timestamp = "created_at";
						break;
					case "renren":
						statuses = data.response;
						timestamp = "time";
						break;
					default:
						break;
				}


				if (checkPoint[key][social] !== " ") {
					var lastCheckPoint = new Date(checkPoint[key][social]);

					for (var i = 0; i < statuses.length; i++) {
						var status = statuses[i];
						var createdAt = new Date(status[timestamp]);
						if (createdAt > lastCheckPoint) {
							if(0 === i) {
								checkPoint[key][social] = status[timestamp];
								localStorage.setItem("checkPoint", $.toJSON(checkPoint));	
							}
							unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
							unreadStatuses[key].push({type: social, data: status});
							localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));

							notifAmount = parseInt((localStorage.getItem("notifAmount")));
							localStorage.setItem("notifAmount", ++notifAmount);

						} else {
							break;
						}
					}
				} else if (typeof statuses[0] !== "undefined") {
					alert($.toJSON(statuses[0]));
					localStorage.setItem("checkPoint", $.toJSON(checkPoint));
				} else {
					checkPoint[key][social] = new Date();
					localStorage.setItem("checkPoint", $.toJSON(checkPoint));
				}

				notifAmount = parseInt((localStorage.getItem("notifAmount")));
				if(notifAmount === 0) {
					chrome.browserAction.setBadgeText({text: ""});
				} else {
					chrome.browserAction.setBadgeText({text: "" + notifAmount});
				}	
			},
			error: function(data) {
				alert("UserTimeLine Ajax Error: " + key + ", " + social);
			}
		});

		setTimeout(checkStatusesUpdate(key, apiURL, social), 30000);
	};
	
}