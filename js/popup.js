var siteURL = {
	"weibo": "http://weibo.com/",
	"renren": "http://www.renren.com/"
};

itemHTML = '<div class="item-wrapper">'
	+	'<div class="item-avatar">'
	+		'<a target="_blank"><img class="img-circle" /></a>'
	+	'</div>'
	+	'<div class="item-status well">'
	+		'<div class="item-header">'
	+			'<a class="item-owner" target="_blank"></a>'
	+			'<span class="item-time"></span>'
	+			'<button type="button" class="close">&times;</button>'
	+		'</div>'
	+		'<div class="item-content">'
	+			'<div class="item-text"></div>'
	+			'<div class="clear"></div>'
	+		'</div>'
	+		'<div class="item-footer">'
	+			'<span class="item-from">来自<span class="item-type"></span></span>'			
	+			'<a class="item-more" target="_blank">查看详细</a>'
	+		'</div>'
	+	'</div>'
	+ '</div>';	

retweetedHTML = '<div class="item-retweeted well">'
	+	'<div class="retweeted-header">'
	+		'<a class="retweeted-owner" target="_blank"></a>'
	+		'<span class="retweeted-time"></span>'
	+	'</div>'
	+	'<div class="retweeted-content">'
	+		'<div class="retweeted-text"></div>'
	+		'<div class="clear"></div>'
	+	'</div>'
	+ '</div>';

$(document).ready(function() {
	console.log("Ready");

	// $(".tab-content").css("background-image", "url(" + chrome.extension.getURL("img/grey-cloth.png") + ")");

	if (localStorage.getItem("unreadStatuses") !== null && localStorage.getItem("unreadStatuses") !== "{}") {		
		var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
		var targets = $.evalJSON(localStorage.getItem("targets"));

		var isFirstKey = true;
		var $navTabs = $(".nav-tabs");
		var $tabContent = $(".tab-content");

		for (var key in unreadStatuses) {
			var target = targets[key];
			var targetStatuses = unreadStatuses[key];

			var count = getCountFromeObject(targetStatuses);
			$navTabs.append(
				"<li class='" + (isFirstKey ? "active" : "") + "'>" 
				+ "<a href='#t" + key + "' data-toggle='tab'>"
				+ "<span class='tab-name'>" + target["mark"] + "</span>"
				+ "<span class='badge'>" + ((count > 0) ? count : "") + "</span>"
				+ "</a>" 
				+ "</li>"
			);

			$tabContent.append(
				"<div class='tab-pane" + (isFirstKey ? " active" : "") + "' id='t" + key + "'></div>"
			);
			
			var sortedSids = getSortedKeysByTime(targetStatuses);
			var $tabPane = $("#t"+key);

			for (var i = 0; i < sortedSids.length; i++) {
				var sid = sortedSids[i];
				var status = targetStatuses[sid].data;

				$tabPane.append(itemHTML);
				var $itemWrapper = $tabPane.find(".item-wrapper").last();

				$itemWrapper.attr("id", sid);

				if (targetStatuses[sid].type === "weibo") {
					var ownerURL = siteURL["weibo"] + "u/" + status.user.id;

					$itemWrapper.find(".item-avatar img").attr("src", status.user.profile_image_url);
					$itemWrapper.find(".item-avatar a").attr("href", ownerURL);
					$itemWrapper.find(".item-owner").attr("href", ownerURL);
					$itemWrapper.find(".item-owner").text(status.user.screen_name);
					$itemWrapper.find(".item-time").text(weibo_timestamps(new Date(status.created_at)));
					$itemWrapper.find(".item-type").text(" 新浪微博");
					$itemWrapper.find(".item-text").text(status.text);
					$itemWrapper.find(".item-more").attr("href", ownerURL);

					if (status.pic_urls.length !== 0) {
						$itemWrapper.find(".item-text").before(
							'<div class="item-pic"><img src="'+ status.pic_urls[0].thumbnail_pic +'" /></div>'
						);
					}

					if (typeof status.retweeted_status !== "undefined") {
						$itemWrapper.find(".item-content").after(retweetedHTML);
						$itemRetweeted = $itemWrapper.find(".item-retweeted");
						var restatus = status.retweeted_status;

						$itemRetweeted.find(".retweeted-owner").attr("href", siteURL["weibo"] + "u/" + restatus.user.id);
						$itemRetweeted.find(".retweeted-owner").text(restatus.user.screen_name);
						$itemRetweeted.find(".retweeted-time").text(weibo_timestamps(new Date(restatus.created_at)));
						$itemRetweeted.find(".retweeted-text").text(restatus.text);

						if (restatus.pic_urls.length !== 0) {
							$itemRetweeted.find(".retweeted-text").before(
								'<div class="retweeted-pic"><img src="'+ restatus.pic_urls[0].thumbnail_pic +'" /></div>'
							);
						}
					}

				} else if (targetStatuses[sid].type === "renren") {
					var ownerURL = siteURL["renren"] + status.sourceUser.id;

					$itemWrapper.find(".item-avatar img").attr("src", status.sourceUser.avatar[0].url);
					$itemWrapper.find(".item-avatar a").attr("href", ownerURL);
					$itemWrapper.find(".item-owner").attr("href", ownerURL);
					$itemWrapper.find(".item-owner").text(status.sourceUser.name);
					$itemWrapper.find(".item-time").text(weibo_timestamps(new Date(status.time)));
					$itemWrapper.find(".item-type").text(" 人人");
					$itemWrapper.find(".item-text").text(status.message);

					switch (status.type) {
						case "PUBLISH_ONE_PHOTO":
							$itemWrapper.find(".item-text").before(
								'<div class="item-pic"><img src="'+ status.thumbnailUrl +'" /></div>'
							);
							$itemWrapper.find(".item-more").attr("href", status.attachment[0].url);
							break;

						case "PUBLISH_MORE_PHOTO":
							$itemWrapper.find(".item-text").before(
								'<div class="item-pic"><img src="'+ status.attachment[0].orginalUrl +'" /></div>'
							);
							$itemWrapper.find(".item-more").attr("href", status.resource.url);
							break;

						case "PUBLISH_BLOG":
							$itemWrapper.find(".item-more").attr("href", status.resource.url);
							if (status.thumbnailUrl !== null) {
								$itemWrapper.find(".item-text").before(
									'<div class="item-pic"><img src="'+ status.thumbnailUrl +'" /></div>'
								);
							}
							$itemWrapper.find(".item-text").text(status.resource.content);
							$itemWrapper.find(".item-content").prepend('<div class="item-title">' + status.resource.title + '</div>');
							break;

						case "SHARE_PHOTO":
						case "SHARE_VIDEO":
						case "SHARE_ALBUM":
							$itemWrapper.find(".item-more").attr("href", status.resource.url);
							$itemWrapper.find(".item-content").after(retweetedHTML);
							$itemRetweeted = $itemWrapper.find(".item-retweeted");
							$itemRetweeted.find(".retweeted-header").remove();
							if (status.resource.title !== null) {
								$itemRetweeted.find(".retweeted-text").text(status.resource.title);
							}
							$itemRetweeted.find(".retweeted-text").before(
								'<div class="retweeted-pic"><img src="'+ status.thumbnailUrl +'" /></div>'
							);
							break;

						case "SHARE_BLOG":
						case "SHARE_LINK":
							$itemWrapper.find(".item-more").attr("href", status.resource.url);
							$itemWrapper.find(".item-content").after(retweetedHTML);
							$itemRetweeted = $itemWrapper.find(".item-retweeted");
							$itemRetweeted.find(".retweeted-header").html("<span class='retweeted-title'>" + status.resource.title + "</span>");
							$itemRetweeted.find(".retweeted-text").text(status.resource.content);
							if (status.thumbnailUrl !== null) {
								$itemRetweeted.find(".retweeted-text").before(
									'<div class="retweeted-pic"><img src="'+ status.thumbnailUrl +'" /></div>'
								);
							}

						default:
							break;
					}

				} else if (targetStatuses[sid].type === "renrenSimple") {
					var ownerURL = siteURL["renren"] + status.ownerId;

					$itemWrapper.find(".item-avatar img").attr("src", target["renren"]["avatar"][0]["url"]);
					$itemWrapper.find(".item-avatar a").attr("href", ownerURL);
					$itemWrapper.find(".item-owner").attr("href", ownerURL);
					$itemWrapper.find(".item-owner").text(target["renren"]["name"]);
					$itemWrapper.find(".item-time").text(weibo_timestamps(new Date(status.createTime)));
					$itemWrapper.find(".item-type").text(" 人人");
					$itemWrapper.find(".item-text").text(status.content);
					$itemWrapper.find(".item-more").attr("href", ownerURL);
				}
				
			}

			isFirstKey = false;
		}

	} else {

	}
});


/*$(document).on("click", ".item-wrapper .close, .item-wrapper .item-more", function(e) {
	$wrapper = $(this).parents(".item-wrapper");
	var sid = $wrapper.attr("id");
	var key = $wrapper.parents(".tab-pane").attr("id").substr(1);

	$wrapper.remove();

	var $badge = $("[href=#t"+key+"]").find(".badge");
	var count = parseInt($badge.text()) - 1;
	$badge.text((count > 0) ? count : "" );

	var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
	delete unreadStatuses[key][sid];
	localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));

	var notifAmount = parseInt((localStorage.getItem("notifAmount")));
	localStorage.setItem("notifAmount", --notifAmount);
	chrome.browserAction.setBadgeText({text: (notifAmount > 0) ? ""+notifAmount : ""});
});*/


function sortTime(a, b) {
	return new Date(b.time) - new Date(a.time);
}

function getSortedKeysByTime(statuses) {
	var arr = [];
	for (var key in statuses) {
		arr.push({"key": key, "time": statuses[key].timestamp});
	}
	arr.sort(sortTime);

	var res = [];
	for (var i = 0; i < arr.length; i++) {
		res.push(arr[i].key);
	}

	return res;
}

function getCountFromeObject(obj){
	var count = 0;
	for (var key in obj) {
		count++;
	}
	return count;
}