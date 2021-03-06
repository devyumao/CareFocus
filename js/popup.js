var siteURL = {
	"weibo": "http://weibo.com/",
	"renren": "http://www.renren.com/",
	"douban": "http://www.douban.com/"
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
	+			'<div class="item-from"></div>'			
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
		var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
		var activePane = localStorage.getItem("activePane");


		var isFirstKey = true;
		var $navTabs = $(".nav-tabs");
		var $tabContent = $(".tab-content");

		for (var key in unreadStatuses) {
			var target = targets[key];
			var targetStatuses = unreadStatuses[key];
			var count = getCountFromeObject(targetStatuses);

			if (isFirstKey && activePane === "") {
				activePane = key;
				localStorage.setItem("activePane", activePane);
			}

			$navTabs.append(
				"<li class='" + ((activePane === key) ? "active" : "") + "'>" 
				+ "<a href='#t" + key + "' data-toggle='tab'>"
				+ "<span class='tab-name'>" + target["mark"] + "</span>"
				+ "<span class='badge'>" + ((count > 0) ? count : "") + "</span>"
				+ "</a>" 
				+ "</li>"
			);

			$tabContent.append(
				"<div class='tab-pane" + ((activePane === key) ? " active" : "") + "' id='t" + key + "'></div>"
			);
			
			var sortedSids = getSortedKeysByTime(targetStatuses);
			var $tabPane = $("#t"+key);

			if (getCountFromeObject(checkPoint[key]) === 0) {
				$tabPane.html(
					'<div class="pane-info alert alert-info">' 
					+ '您还没有给 <span class="mark">' + target["mark"] +'</span> 设置任何社交帐号, 前往<a class="alert-link" target="_blank" href="options.html">设置</a>。'
					+'</div>'
				);
			} else if (sortedSids.length === 0) {
				$tabPane.html(
					'<div class="pane-no-unread">还没有新消息哦</div>'
				);
			}

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
					$itemWrapper.find(".item-from").css("background-position-x", "-21px");
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
					$itemWrapper.find(".item-from").css("background-position-x", "-86px");
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
							$itemRetweeted.find(".retweeted-header").html("<a class='retweeted-title' target='_blank' href='" + status.resource.url + "'>" + status.resource.title + "</a>");
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
					$itemWrapper.find(".item-from").css("background-position-x", "-86px");
					$itemWrapper.find(".item-text").text(status.content);
					$itemWrapper.find(".item-more").attr("href", ownerURL);

				} else if (targetStatuses[sid].type === "douban") {

					var ownerURL = siteURL["douban"] + "people/" + status.user.id

					$itemWrapper.find(".item-avatar img").attr("src", status.user.small_avatar);
					$itemWrapper.find(".item-avatar a").attr("href", ownerURL);
					$itemWrapper.find(".item-owner").attr("href", ownerURL);
					$itemWrapper.find(".item-owner").text(status.user.screen_name);
					$itemWrapper.find(".item-time").text(weibo_timestamps(new Date(status.created_at)));
					$itemWrapper.find(".item-from").css("background-position-x", "0");
					$itemWrapper.find(".item-text").text(status.text);
					$itemWrapper.find(".item-more").attr("href", ownerURL+"/statuses");

					var attachments = status.attachments;

					if (attachments.length > 0) {
						var media = attachments[0].media;

						if (media.length > 0) {
							if (media[0].type === "image") {
								$itemWrapper.find(".item-text").before(
									'<div class="item-pic"><img src="'+ media[0].src +'" /></div>'
								);
							} else if (media[0].type === "flash") {
								$itemWrapper.find(".item-text").before(
									'<div class="item-pic"><img src="'+ media[0].imgsrc +'" /></div>'
								);
							}
						}

						if (attachments[0].type !== "null" && status.title != "说：") {
							var action,
								obj = attachments[0].title,
								stars = "";

							var tag = "[score]";
							var index = status.title.indexOf(tag);

							if (index !== -1) {
								action = status.title.substr(0, index);
								var score = parseInt(status.title.substr(index + tag.length));
								for (var num = 0; num < score; num++) {
									stars += "\u2605";
								}
							} else {
								action = status.title;
							}
							
							$itemWrapper.find(".item-content").prepend(
								'<div class="item-title">' 
								+ action + '&nbsp;'
								+ '<a target="_blank" href="'+ attachments[0].expaned_href +'">' + obj + '</a>' + "&nbsp;"
								+ '<span class="stars">' + stars + '</span>'
								+ '</div>'
							);
						}
					}

					if (typeof status.reshared_status !== "undefined") {
						$itemWrapper.find(".item-text").text("转播");

						$itemWrapper.find(".item-content").after(retweetedHTML);
						$itemRetweeted = $itemWrapper.find(".item-retweeted");
						var restatus = status.reshared_status;

						var origUserURL = "";
						if (restatus.user.type === "user") {
							origUserURL = siteURL["douban"] + "people/" + restatus.user.id;
						} else if (restatus.user.type === "virtual") {
							origUserURL = restatus.user.original_site_url;
						}

						var origAttachments = restatus.attachments;

						if (origAttachments.length > 0) {
							var origMedia = origAttachments[0].media;
							if (origMedia.length > 0) {
								if (origMedia[0].type === "image") {
									console.log(": "+origMedia[0].src);
									$itemRetweeted.find(".retweeted-text").before(
										'<div class="retweeted-pic"><img src="'+ origMedia[0].src +'" /></div>'
									);
								} else if (origMedia[0].type === "flash") {
									$itemRetweeted.find(".retweeted-text").before(
										'<div class="retweeted-pic"><img src="'+ origMedia[0].imgsrc +'" /></div>'
									);
								}
							}

							if (origAttachments[0].type !== "null") {
								var action,
									obj = origAttachments[0].title,
									stars = "";

								var tag = "[score]";
								var index = restatus.title.indexOf(tag);

								if (index !== -1) {
									action = restatus.title.substr(0, index);
									var score = parseInt(restatus.title.substr(index + tag.length));
									for (var num = 0; num < score; num++) {
										stars += "\u2605";
									}
								} else {
									action = restatus.title;
								}
								
								$itemRetweeted.find(".retweeted-header").html(
									'<span class="retweeted-title">'
									+ '<a target="_blank" href="'+ origUserURL +'"">' + restatus.user.screen_name + '</a>' + '&nbsp;' 
									+ action + '&nbsp;'
									+ '<a target="_blank" href="'+ origAttachments[0].expaned_href +'">' + obj + '</a>' + '&nbsp;'
									+ '<span class="stars">' + stars + '</span>'
									+ '</span>'
								);
							}
						}

						/*$itemRetweeted.find(".retweeted-header").html(
							'<span class="retweeted-title">' 
							+ '<a target="_blank" href="'+ origUserURL +'"">' + restatus.user.screen_name + '</a>' 
							+ '&nbsp;' + restatus.title + '&nbsp;'
							+ '<a target="_blank" href="' + restatus.attachments[0].expaned_href + '">' + restatus.attachments[0].title + '</a>'
							+ '</span>'
						);*/

						$itemRetweeted.find(".retweeted-text").text(restatus.text);
						$itemWrapper.find(".item-more").attr("href", restatus.attachments[0].expaned_href);
					}

				}		
			}

			isFirstKey = false;
		}

		$navTabs.append(
			'<span title="设置" class="glyphicon glyphicon-cog"></span>'
			+ '<span title="刷新" class="glyphicon glyphicon-refresh"></span>'
			+ '<span title="清空当前对象的消息" class="glyphicon glyphicon-trash"></span>'
		);
	} else {
		$("body").html(
			'<ul class="nav navbar-fixed-top navbar-inverse"></ul>'
			+ '<div class="welcome-wrap">'
				+ '<div class="welcome-logo">'
					+ '<img src="img/logo.png" />'
				+ '</div>'
				+ '<button type="button" class="welcome-btn btn btn-primary">添加关注对象</button>'
			+'</div>'
		);
	}
});


$(document).on("click", ".nav-tabs li a", function() {
	var key = $(this).attr("href").substr(2);
	localStorage.setItem("activePane", key); 
});

$(document).on("click", ".item-wrapper .close, .item-wrapper .item-more", function() {
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
});


$(document).on("click", ".nav .glyphicon-refresh", function() {
	window.location.reload();
});


$(document).on("click", ".nav .glyphicon-trash", function() {
	$(".tab-content .active .item-wrapper").remove();

	var key = $(".tab-content .active").attr("id").substr(1);
	var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));

	var notifAmount = parseInt(localStorage.getItem("notifAmount") - getCountFromeObject(unreadStatuses[key]));
	localStorage.setItem("notifAmount", notifAmount);
	chrome.browserAction.setBadgeText({text: (notifAmount > 0) ? ""+notifAmount : ""});

	unreadStatuses[key] = {};
	localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));

	$("[href=#t"+key+"]").find(".badge").text("");
});


$(document).on("click", ".nav .glyphicon-cog, .welcome-btn", function() {
	chrome.tabs.create({url: "options.html"});
});


$(document).on({
	mouseenter: function() {
		$(this).css("opacity", "1");
	},
	mouseleave: function() {
		$(this).css("opacity", "0.7");
	}
}, ".nav .glyphicon");


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