var weiboAppKey = "82966982";

var renrenApiKey = "6c094cc7a9634012825a8fddd92dddec";
var renrenRedirectUri = "http://graph.renren.com/oauth/login_success.html";
var renrenAccessToken = (localStorage.getItem("renrenAccessToken") !== null) ? localStorage.getItem("renrenAccessToken") : "";

var doubanApiKey = "013a12dea106488403ae389be312d98c";
var doubanRedirectUri = "http://yuzhang-lille.farbox.com";
var doubanAccessToken = (localStorage.getItem("doubanAccessToken") !== null) ? localStorage.getItem("doubanAccessToken") : "";
var doubanUserId;

var siteURL = {
	"weibo": "http://weibo.com/",
	"renren": "http://www.renren.com/",
	"douban": "http://www.douban.com/"
};

var targets;
if (localStorage.getItem("targets") !== null) {
	targets = $.evalJSON(localStorage.getItem("targets"));	
}

var backgroundPage = chrome.extension.getBackgroundPage();

var $currTargetWrapper,
	currId,
	selectedTarget;

var socialNetworks = ["weibo", "renren", "douban"];

var targetHTML = '<div class="col-2 target-wrapper">'
	+	'<div class="panel">'
	+		'<div class="panel-heading">'
	+			'<span class="target-mark"></span>'
	+			'<span title="取消关注" class="glyphicon glyphicon-remove-sign" href="#modal-remove-target" data-toggle="modal"></span>'
	+			'<span title="修改备注名" class="glyphicon glyphicon-edit" href="#modal-edit-target" data-toggle="modal"></span>'
	+		'</div>'
	+		'<div class="target-avatar-block">'
	+	  		'<div class="target-avatar"></div>'
	+	  	'</div>'
	+  		'<div class="target-social-btns">'
	+  			'<a href="#modal-weibo" class="btn-weibo" data-toggle="modal" title="微博"></a>'
	+  			'<a href="#modal-renren" class="btn-renren" data-toggle="modal" title="人人"></a>'
	+			'<a href="#modal-douban" class="btn-douban" data-toggle="modal" title="豆瓣"></a>'
	+  		'</div>'
	+	'</div>'
	+ '</div>';


$(document).ready(function() {
	var originKeys = getKeysFromObject(targets).sort();
	var $rowTargets = $(".row-targets");

	$(".sound-setting input").prop("checked", $.evalJSON(localStorage.getItem("isPromptToneActive")));

	var i;
	for (i = 0; i < originKeys.length; i++) {
		$rowTargets.append(targetHTML);
		var $wrapper = $(".target-wrapper").eq(i);
		var key = originKeys[i];
		$wrapper.attr("id", "t"+key);
		$wrapper.find(".target-mark").text(targets[key]["mark"]);
		
		if (targets[key]["avatarType"] === "weibo") {
			$wrapper.find(".target-avatar").css("background-image", "url("+targets[key]["weibo"]["avatar"]+")");
		} else if (targets[key]["avatarType"] === "renren") {
			$wrapper.find(".target-avatar").css("background-image", "url("+targets[key]["renren"]["avatar"][2]["url"]+")");
		} else if (targets[key]["avatarType"] === "douban") {
			$wrapper.find(".target-avatar").css("background-image", "url("+targets[key]["douban"]["avatar"]+")");
		} else {
			$wrapper.find(".target-avatar").css("background-image", "url(img/img-null.png)");
		}

		for (var j = 0; j < socialNetworks.length; j++) {
			var social = socialNetworks[j];
			if (typeof targets[key][social] !== "undefined") {
				$wrapper.find(".btn-"+social).css("background-image", "url(/img/social-icons.png)");
			}
		}
	}

	if (i >= 3) {
		$("#btn-add").addClass("disabled");
	}
});

$(document).on("click", ".sound-setting input", function() {
	localStorage.setItem("isPromptToneActive", $.toJSON($(this).prop("checked")));
});

// glyphicons hover
$(document).on({
	mouseenter: function() {
		$(this).css("opacity", "0.8");
	},
	mouseleave: function() {
		$(this).css("opacity", "0.5");
	}
}, ".panel-heading .glyphicon");


// panel hover
$(document).on({
	mouseenter: function() {
		$(this).find(".panel-heading .glyphicon").stop(true, true).show("fast");
	},
	mouseleave: function() {
		$(this).find(".panel-heading .glyphicon").stop(true, true).hide("fast");
	}
}, ".target-wrapper .panel");

// REMOVE icon click
$(document).on("click", ".panel-heading .glyphicon-remove-sign", function() {
	$currTargetWrapper = $(this).parents(".target-wrapper");
	currId = $currTargetWrapper.attr("id").substr(1); 
	$("#modal-remove-target .modal-body span").text(" "+targets[currId]["mark"]+" ");
});

// REMOVE modal confirm
$(document).on("click", "#modal-remove-target .confirm", function() {
	delete targets[currId];
	localStorage.setItem("targets", $.toJSON(targets));

	var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
	var notifAmount = parseInt(localStorage.getItem("notifAmount") - getCountFromeObject(unreadStatuses[currId]));
	localStorage.setItem("notifAmount", notifAmount);
	chrome.browserAction.setBadgeText({text: (notifAmount > 0) ? "" + notifAmount : ""});

	delete unreadStatuses[currId];
	localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));

	var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
	delete checkPoint[currId];
	localStorage.setItem("checkPoint", $.toJSON(checkPoint));

	if (localStorage.getItem("activePane") === currId) {
		localStorage.setItem("activePane", "");
	}

	backgroundPage.location.reload();

	$currTargetWrapper.remove(); 	
	$("#btn-add").removeClass("disabled");

	$("#modal-remove-target").modal('hide');
});

// EDIT icon click
$(document).on("click", ".panel-heading .glyphicon-edit", function() {
	$currTargetWrapper = $(this).parents(".target-wrapper");
	currId = $currTargetWrapper.attr("id").substr(1); 
	$("#modal-edit-target .modal-body input").val(targets[currId]["mark"]);
});

// EDIT and ADD modal shown
$(document).on("shown.bs.modal", "#modal-edit-target, #modal-add-target", function() {
	$(this).find(".modal-body input").focus();
});

// EDIT modal confirm
$(document).on("click", "#modal-edit-target .confirm", function() {
	confirmEditTarget();
});

$(document).on("keypress", "#modal-edit-target .modal-body input", function(e) {
	if (e.keyCode === 13) {
		confirmEditTarget();
	}
});

function confirmEditTarget() {
	var inputVal = $.trim($("#modal-edit-target input").val());
	if (inputVal === "") {

	} else if (inputVal === targets[currId]["mark"]) {
		$('#modal-edit-target').modal('hide');
	} else if ($.inArray(inputVal, getMarksFromTargets(targets)) !== -1) {

	} else {
		targets[currId]["mark"] = inputVal;
		localStorage.setItem("targets", $.toJSON(targets));
		$currTargetWrapper.find(".target-mark").text(targets[currId]["mark"]);

		$('#modal-edit-target').modal('hide');
	}
}

// ADD button click
$(document).on("click", "#btn-add", function() {
	$("#modal-add-target input").val("");
});

// ADD modal confirm
$(document).on("click", "#modal-add-target .confirm", function() {
	confirmAddTarget();
});

$(document).on("keypress", "#modal-add-target .modal-body input", function(e) {
	if (e.keyCode === 13) {
		confirmAddTarget();
	}
});

function confirmAddTarget() {
	var inputVal = $.trim($("#modal-add-target input").val());
	if (inputVal === "") {

	} else if ($.inArray(inputVal, getMarksFromTargets(targets)) !== -1) {

	} else {
		var keys = getKeysFromObject(targets);
		var id;
		if (keys.length !== 0) {
			id = Math.max.apply(null, keys) + 1;
		} else {
			id = 1;
		}	

		if (keys.length >= 2) {
			$("#btn-add").addClass("disabled");
		}

		targets[id] = { 
			"mark": inputVal,
			"avatarType": "" 
		};

		var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
		unreadStatuses[id] = {};
		var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
		checkPoint[id] = {}
		localStorage.setItem("targets", $.toJSON(targets));
		localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));
		localStorage.setItem("checkPoint", $.toJSON(checkPoint));

		$(".row-targets").append(targetHTML);
		var currNum = getCountFromeObject(targets) - 1;
		var $wrapper = $(".target-wrapper").eq(currNum);
		$wrapper.attr("id", "t"+id);
		$wrapper.find(".target-mark").text(targets[id]["mark"]);


		$('#modal-add-target').modal('hide');
	}
}

// WEIBO button click
$(document).on("click", ".btn-weibo", function() {
	var $modalWeibo = $("#modal-weibo");
	var $friendInputor = $modalWeibo.find(".friend-inputor");
	var $friendAvatar = $modalWeibo.find(".selected-friend-avatar");
	var $friendName = $modalWeibo.find(".selected-friend-name a");

	$modalWeibo.find(".alert-warning").hide();

	$currTargetWrapper = $(this).parents(".target-wrapper");
	var id = $currTargetWrapper.attr("id").substr(1);

	if (typeof targets[id]["weibo"] !== "undefined") {
		selectedTarget = targets[id]["weibo"];
		$friendInputor.val(selectedTarget["name"]);
		$friendAvatar.css("background-image", "url("+selectedTarget["avatar"]+")");
		$friendName.text(selectedTarget["name"]);
		$friendName.attr("href", siteURL["weibo"] + "u/" + selectedTarget["id"]);
		$modalWeibo.find(".btn-delete").show();
	} else {
		$friendInputor.val("");
		$friendAvatar.css("background-image", "");
		$friendName.text("");
		$friendName.attr("href", "");
		$modalWeibo.find(".btn-delete").hide();
	}
	/* remember to set a condition "undefined" for data.uid */
	$.ajax({
		url: "https://api.weibo.com/2/account/get_uid.json?source="+weiboAppKey,
		type: "GET",
		dataType: "json",
		success: function(data) {
			var uid = data.uid,
				screenNames = [];
			getAllScreenNames(uid, screenNames, 0);
			$friendInputor.typeahead({
				source: screenNames,
				updater: function(item) {
					$.ajax({
						url: "https://api.weibo.com/2/users/show.json?source="+weiboAppKey+"&screen_name="+item,
						type: "GET",
						dataType: "json",
						success: function(data) {
							$friendAvatar.css("background-image", "url("+data.avatar_large+")");
							$friendName.text(item);
							$friendName.attr("href", siteURL["weibo"] + "u/" + data.id);
							selectedTarget = {
								"id": data.id,
								"name": data.screen_name,
								"avatar": data.avatar_large
							};
						},
						error: function(data) {
							console.log("Show Ajax Error");
						}
					});
					return item;
				}
			});
		},
		error: function() {
			$modalWeibo.find(".alert-warning").show();
		}
	});
});

// RENREN button click
$(document).on("click", ".btn-renren", function() {
	var $modalRenren = $("#modal-renren");

	$modalRenren.find(".alert-warning").hide();

	$currTargetWrapper = $(this).parents(".target-wrapper");
	var id = $currTargetWrapper.attr("id").substr(1);

	if (typeof targets[id]["renren"] !== "undefined") {
		selectedTarget = targets[id]["renren"];
		$modalRenren.find(".friend-inputor").val(selectedTarget["name"]);
		$modalRenren.find(".selected-friend-avatar").css("background-image", "url("+selectedTarget.avatar[2].url+")");
		$modalRenren.find(".selected-friend-name a").text(selectedTarget["name"]).attr("href", siteURL["renren"]+selectedTarget["id"]);
		$modalRenren.find(".btn-delete").show();
	} else {
		$modalRenren.find(".friend-inputor").val("");
		$modalRenren.find(".selected-friend-avatar").css("background-image", "");
		$modalRenren.find(".selected-friend-name a").text(name).attr("href", "");
		$modalRenren.find(".btn-delete").hide();
	}

	renrenAccessToken = (localStorage.getItem("renrenAccessToken") !== null) ? localStorage.getItem("renrenAccessToken") : "";
	$.ajax({
		url: "https://api.renren.com/v2/user/login/get?access_token="+renrenAccessToken,
		type: "GET",
		dataType: "json",
		success: function(data) {
			var uid = data.response.id,
				friends = [];

			getRenrenFriends(uid, friends, 1);
		},
		error: function(data) {
			$modalRenren.find(".alert-warning").show();
		}
	});
});


// DOUBAN button click
$(document).on("click", ".btn-douban", function() {
	var $modalDouban = $("#modal-douban");

	$modalDouban.find(".alert-warning").hide();

	$currTargetWrapper = $(this).parents(".target-wrapper");
	var id = $currTargetWrapper.attr("id").substr(1);

	if (typeof targets[id]["douban"] !== "undefined") {
		selectedTarget = targets[id]["douban"];
		$modalDouban.find(".friend-inputor").val(selectedTarget["name"]);
		$modalDouban.find(".selected-friend-avatar").css("background-image", "url("+selectedTarget["avatar"]+")");
		$modalDouban.find(".selected-friend-name a").text(selectedTarget["name"]).attr("href", siteURL["douban"]+"people/"+selectedTarget["id"]);
		$modalDouban.find(".btn-delete").show();
	} else {
		$modalDouban.find(".friend-inputor").val("");
		$modalDouban.find(".selected-friend-avatar").css("background-image", "");
		$modalDouban.find(".selected-friend-name a").text(name).attr("href", "");
		$modalDouban.find(".btn-delete").hide();
	}

	doubanUserId = localStorage.getItem("doubanUserId");
	if (doubanUserId !== null) {
		var friends = [];
		getDoubanFriends(doubanUserId, friends, 0);
	} else {
		$modalDouban.find(".alert-warning").show();
	}
});


// WEIBO modal confirm
$(document).on("click", "#modal-weibo .confirm", function() {
	var id = $currTargetWrapper.attr("id").substr(1);
	/* information display condition */
	if ($("#modal-weibo .selected-friend-name a").text() !== "") {
		targets[id]["weibo"] = selectedTarget;
		targets[id]["avatarType"] = "weibo";

		var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
		checkPoint[id]["weibo"] = "";
		localStorage.setItem("targets", $.toJSON(targets));
		localStorage.setItem("checkPoint", $.toJSON(checkPoint));
		backgroundPage.location.reload();

		$currTargetWrapper.find(".target-avatar").css("background-image", "url("+targets[id]["weibo"]["avatar"]+")");
		$currTargetWrapper.find(".btn-weibo").css("background-image", "url(/img/social-icons.png)");

		$("#modal-weibo").modal("hide");
	} else {

	}
});


// RENREN modal confirm
$(document).on("click", "#modal-renren .confirm", function() {
	var id = $currTargetWrapper.attr("id").substr(1);
	/* information display condition */
	if ($("#modal-renren .selected-friend-name a").text() !== "") {
		targets[id]["renren"] = selectedTarget;
		targets[id]["avatarType"] = "renren"; 

		var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
		checkPoint[id]["renren"] = "";
		checkPoint[id]["renrenSimple"] = "";
		localStorage.setItem("targets", $.toJSON(targets));
		localStorage.setItem("checkPoint", $.toJSON(checkPoint));
		backgroundPage.location.reload();

		$currTargetWrapper.find(".target-avatar").css("background-image", "url("+targets[id]["renren"]["avatar"][2]["url"]+")");
		$currTargetWrapper.find(".btn-renren").css("background-image", "url(/img/social-icons.png)");

		$("#modal-renren").modal("hide");
	} else {

	}
});

// DOUBAN modal confirm
$(document).on("click", "#modal-douban .confirm", function() {
	var id = $currTargetWrapper.attr("id").substr(1);
	/* information display condition */
	if ($("#modal-douban .selected-friend-name a").text() !== "") {
		targets[id]["douban"] = selectedTarget;
		targets[id]["avatarType"] = "douban"; 

		var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
		checkPoint[id]["douban"] = "";
		localStorage.setItem("targets", $.toJSON(targets));
		localStorage.setItem("checkPoint", $.toJSON(checkPoint));
		backgroundPage.location.reload();

		$currTargetWrapper.find(".target-avatar").css("background-image", "url("+targets[id]["douban"]["avatar"]+")");
		$currTargetWrapper.find(".btn-douban").css("background-image", "url(/img/social-icons.png)");

		$("#modal-douban").modal("hide");
	} else {

	}
});

$(document).on("click", "#modal-weibo .btn-delete", function() {
	var id = $currTargetWrapper.attr("id").substr(1);
	delete targets[id]["weibo"];
	
	var avatarURL;
	if (typeof targets[id]["renren"] !== "undefined") {
		targets[id]["avatarType"] = "renren";
		avatarURL = targets[id]["renren"]["avatar"][2]["url"];
	} else if (typeof targets[id]["douban"] !== "undefined") {
		targets[id]["avatarType"] = "douban";
		avatarURL = targets[id]["douban"]["avatar"];
	} else {
		targets[id]["avatarType"] = "";
		avatarURL = "img/img-null.png";
	}

	var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
	delete checkPoint[id]["weibo"];

	var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
	var notifAmount = parseInt(localStorage.getItem("notifAmount") - deleteStatusByTypes(unreadStatuses, id, ["weibo"]));
	chrome.browserAction.setBadgeText({text: (notifAmount > 0) ? "" + notifAmount : ""});

	localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));
	localStorage.setItem("notifAmount", notifAmount);
	localStorage.setItem("targets", $.toJSON(targets));
	localStorage.setItem("checkPoint", $.toJSON(checkPoint));
	backgroundPage.location.reload();

	$currTargetWrapper.find(".btn-weibo").css("background-image", "url(/img/social-icons-bw.png)");
	$currTargetWrapper.find(".target-avatar").css("background-image", "url("+avatarURL+")");

	$("#modal-weibo").modal("hide");
});


$(document).on("click", "#modal-renren .btn-delete", function() {
	var id = $currTargetWrapper.attr("id").substr(1);
	delete targets[id]["renren"];
	
	var avatarURL;
	if (typeof targets[id]["weibo"] !== "undefined") {
		targets[id]["avatarType"] = "weibo";
		avatarURL = targets[id]["weibo"]["avatar"];
	} else if (typeof targets[id]["douban"] !== "undefined") {
		targets[id]["avatarType"] = "douban";
		avatarURL = targets[id]["douban"]["avatar"];
	} else {
		targets[id]["avatarType"] = "";
		avatarURL = "img/img-null.png";
	}

	var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
	delete checkPoint[id]["renren"];
	delete checkPoint[id]["renrenSimple"];

	var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
	var notifAmount = parseInt(localStorage.getItem("notifAmount") - deleteStatusByTypes(unreadStatuses, id, ["renren", "renrenSimple"]));
	chrome.browserAction.setBadgeText({text: (notifAmount > 0) ? "" + notifAmount : ""});

	localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));
	localStorage.setItem("notifAmount", notifAmount);
	localStorage.setItem("targets", $.toJSON(targets));
	localStorage.setItem("checkPoint", $.toJSON(checkPoint));
	backgroundPage.location.reload();

	$currTargetWrapper.find(".btn-renren").css("background-image", "url(/img/social-icons-bw.png)");
	$currTargetWrapper.find(".target-avatar").css("background-image", "url("+avatarURL+")");

	$("#modal-renren").modal("hide");
});


$(document).on("click", "#modal-douban .btn-delete", function() {
	var id = $currTargetWrapper.attr("id").substr(1);
	delete targets[id]["douban"];
	
	var avatarURL;
	if (typeof targets[id]["weibo"] !== "undefined") {
		targets[id]["avatarType"] = "weibo";
		avatarURL = targets[id]["weibo"]["avatar"];
	} else if (typeof targets[id]["renren"] !== "undefined") {
		targets[id]["avatarType"] = "renren";
		avatarURL = targets[id]["renren"]["avatar"][2]["url"];
	} else {
		targets[id]["avatarType"] = "";
		avatarURL = "img/img-null.png";
	}

	var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
	delete checkPoint[id]["douban"];

	var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
	var notifAmount = parseInt(localStorage.getItem("notifAmount") - deleteStatusByTypes(unreadStatuses, id, ["douban"]));
	chrome.browserAction.setBadgeText({text: (notifAmount > 0) ? "" + notifAmount : ""});

	localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));
	localStorage.setItem("notifAmount", notifAmount);
	localStorage.setItem("targets", $.toJSON(targets));
	localStorage.setItem("checkPoint", $.toJSON(checkPoint));
	backgroundPage.location.reload();

	$currTargetWrapper.find(".btn-douban").css("background-image", "url(/img/social-icons-bw.png)");
	$currTargetWrapper.find(".target-avatar").css("background-image", "url("+avatarURL+")");

	$("#modal-douban").modal("hide");
});


$(document).on("click", ".alert-link", function() {
	$(this).parents(".modal").modal('hide');
});


$(document).on("click", "#modal-renren .alert-link", function() {
	window.open("https://graph.renren.com/oauth/authorize?client_id="+renrenApiKey+"&redirect_uri="+renrenRedirectUri+"&response_type=code&scope=read_user_feed+read_user_status+read_user_share+read_user_album");
});


$(document).on("click", "#modal-douban .alert-link", function() {
	window.open("https://www.douban.com/service/auth2/auth?client_id="+doubanApiKey+"&redirect_uri="+doubanRedirectUri+"&response_type=code");
});


function getAllScreenNames(uid, screenNames, cursor) {
	$.ajax({
		url: "https://api.weibo.com/2/friendships/friends.json?source="+weiboAppKey+"&uid="+uid+"&count=100&cursor="+cursor,
		type: "GET",
		dataType: "json",
		success: function(data) {
			var len = data.users.length;
			if (0 === len) { 
				$("#modal-weibo .modal-body input").focus();
			} else {
				for (var i = 0; i < len; i++) {
					var user = data.users[i];
					screenNames.push(user.screen_name); 
				}
				getAllScreenNames(uid, screenNames, cursor + 100);
			}
		},
		error: function(data) {
			console.log("Friends Ajax Error");
		}
	});
}

function getRenrenFriends(uid, friends, pageNum) {
	$.ajax({
		url: "https://api.renren.com/v2/user/friend/list?access_token="+renrenAccessToken+"&userId="+uid+"&pageSize=100&pageNumber="+pageNum,
		type: "GET",
		dataType: "json",
		success: function(data) {
			if (0 === data.response.length) {
				var names, map;
				var $modalRenren = $("#modal-renren");

				$modalRenren.find(".friend-inputor").typeahead({
					source: function(query, process) {
					    names = [];
					    map = {};

					    $.each(friends, function (i, friend) {
					        map[friend.id] = {
					        	"id": friend.id,
					        	"name": friend.name,
					        	"avatar": friend.avatar
					        };
					        names.push(friend.name+"\t<span>"+friend.id+"</span>");
					    });

					    process(names);
					},

					matcher: function(item) {
						var name = item.split("\t")[0];
					    if (name.toLowerCase().indexOf(this.query.trim().toLowerCase()) != -1) {
					        return true;
					    }
					},

					highlighter: function (item) {
					    var regex = new RegExp( '(' + this.query + ')', 'gi' );
					    var name = item.split("\t")[0];
					    return name.replace( regex, "<strong>$1</strong>" );
					},

					updater: function(item) {
						var nameAndId = item.split("\t");
						var name = nameAndId[0];
						var id = nameAndId[1].match(/[0-9]+/);

						selectedTarget = map[id];

						$modalRenren.find(".selected-friend-avatar").css("background-image", "url("+selectedTarget.avatar[2].url+")");
						$modalRenren.find(".selected-friend-name a").text(name).attr("href", siteURL["renren"]+id);

					    return name;
					}
				});
				$modalRenren.find(".modal-body input").focus();
			} else {
				getRenrenFriends(uid, friends.concat(data.response), pageNum + 1);
			}
		},
		error: function(data) {
			console.log("FriendList Ajax Error");
		}
	});
}

function getDoubanFriends(uid, friends, start) {
	$.ajax({
		url: "https://api.douban.com/shuo/v2/users/"+uid+"/following?count=100&start="+start+"&apikey="+doubanApiKey,
		type: "GET",
		dataType: "json",
		success: function(data) {
			if (0 === data.length) {
				var names, map;
				var $modalDouban = $("#modal-douban");

				$modalDouban.find(".friend-inputor").typeahead({
					source: function(query, process) {
					    names = [];
					    map = {};

					    $.each(friends, function (i, friend) {
					    	if (friend.type === "user") {
						    	map[friend.id] = {
						        	"id": friend.id,
						        	"name": friend.screen_name,
						        	"avatar": friend.large_avatar
						        };
						        names.push(friend.screen_name+"\t<span>"+friend.id+"</span>");
					    	}		        
					    });

					    process(names);
					},

					matcher: function(item) {
						var name = item.split("\t")[0];
					    if (name.toLowerCase().indexOf(this.query.trim().toLowerCase()) != -1) {
					        return true;
					    }
					},

					highlighter: function (item) {
					    var regex = new RegExp( '(' + this.query + ')', 'gi' );
					    var name = item.split("\t")[0];
					    return name.replace( regex, "<strong>$1</strong>" );
					},

					updater: function(item) {
						var nameAndId = item.split("\t");
						var name = nameAndId[0];
						var id = nameAndId[1].match(/[0-9]+/);

						selectedTarget = map[id];

						$modalDouban.find(".selected-friend-avatar").css("background-image", "url("+selectedTarget.avatar+")");
						$modalDouban.find(".selected-friend-name a").text(name).attr("href", siteURL["douban"]+"people/"+id);

					    return name;
					}
				});
				$modalDouban.find(".modal-body input").focus();
			} else {
				getDoubanFriends(uid, friends.concat(data), start + 100);
			}
		},
		error: function(data) {
			console.log("Shuo Ajax Error");
		}
	});
}

function getKeysFromObject(obj) {
	var keys = [];
	for (var key in obj) {
		keys.push(parseInt(key));
	}
	return keys;
}

function getCountFromeObject(obj){
	var count = 0;
	for (var key in obj) {
		count++;
	}
	return count;
}

function getMarksFromTargets(targets) {
	var marks = [];
	for (var key in targets) {
		marks.push(targets[key]["mark"]);
	}
	return marks;
}

function deleteStatusByTypes(obj, key, types) {
	var count = 0;
	for (var sid in obj[key]) {
		if ($.inArray(obj[key][sid]["type"], types) !== -1 ) {
			count++;
			delete obj[key][sid];
		}
	}
	return count;
}