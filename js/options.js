var targets,
	unreadStatuses;
if (localStorage.getItem("targets") !== null) {
	targets = $.evalJSON(localStorage.getItem("targets"));
	unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses")); 	
} else {
	targets = {};
	unreadStatuses = {};
}

var backgroundPage = chrome.extension.getBackgroundPage();

var $currTargetWrapper,
	currId,
	selectedTarget;

var targetHTML = '<div class="col-lg-2 target-wrapper">'
	+	'<div class="panel">'
	+		'<div class="panel-heading">'
	+			'<span class="target-mark"></span>'
	+			'<span class="glyphicon glyphicon-remove-sign" href="#modal-remove-target" data-toggle="modal"></span>'
	+			'<span class="glyphicon glyphicon-edit" href="#modal-edit-target" data-toggle="modal"></span>'
	+		'</div>'
	+		'<div>'
	+	  		'<img class="target-avatar" />'
	+	  	'</div>'
	+  		'<div class="target-social-btns btn-group">'
	+  			'<a href="#target-modal" class="btn btn-default social-btn-first" data-toggle="modal">wb</a>'
	+  		'</div>'
	+	'</div>'
	+ '</div>';


$(document).ready(function() {
	var originKeys = getKeysFromObject(targets).sort();
	var $rowTargets = $(".row-targets");

	for (var i = 0; i < originKeys.length; i++) {
		$rowTargets.append(targetHTML);
		var $wrapper = $(".target-wrapper").eq(i);
		var key = originKeys[i];
		$wrapper.attr("id", "t"+key);
		$wrapper.find(".target-mark").text(targets[key]["mark"]);
		if (typeof targets[key]["weibo"] !== "undefined") {
			$wrapper.find(".target-avatar").attr("src", targets[key]["weibo"]["avatar_large"]);
		}
	}
});


$(document).on({
	mouseenter: function() {
		$(this).find(".panel-heading .glyphicon").stop(true, true).show("fast");
	},
	mouseleave: function() {
		$(this).find(".panel-heading .glyphicon").stop(true, true).hide("fast");
	}
}, ".target-wrapper .panel");

$(document).on("click", ".panel-heading .glyphicon-remove-sign", function() {
	$currTargetWrapper = $(this).parents(".target-wrapper");
	currId = $currTargetWrapper.attr("id").substr(1); 
	$("#modal-remove-target .modal-body span").text(targets[currId]["mark"]);
});

$(document).on("click", "#modal-remove-target .confirm", function() {
	var isReloadNeeded = (typeof targets[currId]["weibo"] !== "undefined") ? true : false;
	delete targets[currId];
	delete unreadStatuses[currId];
	localStorage.setItem("targets", $.toJSON(targets));
	localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));
	if (isReloadNeeded) {
		backgroundPage.location.reload();
	}
	$currTargetWrapper.remove(); 	

	$("#modal-remove-target").modal('hide');
});

$(document).on("click", ".panel-heading .glyphicon-edit", function() {
	$currTargetWrapper = $(this).parents(".target-wrapper");
	currId = $currTargetWrapper.attr("id").substr(1); 
	$("#modal-edit-target .modal-body input").val(targets[currId]["mark"]);
});

$(document).on("shown.bs.modal", "#modal-edit-target", function() {
	$("#modal-edit-target .modal-body input").focus();
});

$(document).on("click", "#modal-edit-target .confirm", function() {
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
});

$(document).on("click", "#btn-add", function() {
	$("#modal-add-target input").val("");
});

$(document).on("click", "#modal-add-target .confirm", function() {
	var inputVal = $.trim($("#modal-add-target input").val());
	if (inputVal === "") {

	} else if ($.inArray(inputVal, getMarksFromTargets(targets)) !== -1) {

	} else {
		var keys = getKeysFromObject(targets);
		var id;
		if (keys.length !== 0) {
			id = Math.max.apply(null,keys) + 1;
		} else {
			id = 1;
		}	
		targets[id] = { "mark": inputVal };
		unreadStatuses[id] = [];
		localStorage.setItem("targets", $.toJSON(targets));
		localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));

		$(".row-targets").append(targetHTML);
		var currNum = getCountFromeObject(targets) - 1;
		var $wrapper = $(".target-wrapper").eq(currNum);
		$wrapper.attr("id", "t"+id);
		$wrapper.find(".target-mark").text(targets[id]["mark"]);

		$('#modal-add-target').modal('hide');
	}
});

$(document).on("click", ".social-btn-first", function() {
	$('#friend-inputor').val("");
	$("#selected-friend-avatar").attr("src", "");
	$("#selected-friend-name").text("");
	$currTargetWrapper = $(this).parents(".target-wrapper");
	/* remember to set a condition "undefined" for data.uid */
	$.ajax({
		url: "https://api.weibo.com/2/account/get_uid.json?source=5786724301",
		type: "GET",
		dataType: "json",
		success: function(data) {
			var uid = data.uid,
				screenNames = [];
			getAllScreenNames(uid, screenNames, 0);
			$('#friend-inputor').typeahead({
				source: screenNames,
				updater: function(item) {
					$.ajax({
						url: "https://api.weibo.com/2/users/show.json?source=5786724301&screen_name="+item,
						type: "GET",
						dataType: "json",
						success: function(data) {
							$("#selected-friend-avatar").attr("src", data.avatar_large);
							$("#selected-friend-name").text(item);
							selectedTarget = data;
						},
						error: function(data) {
							alert("Show Ajax Error");
						}
					});
					return item;
				}
			});
		},
		error: function(data) {
			alert("GetUid Ajax Error");
		}
	});
});

$(document).on("click", "#target-modal .confirm", function() {
	var id = $currTargetWrapper.attr("id").substr(1);
	/* information display condition */
	if ($.trim($("#selected-friend-name").text()) !== "") {
		targets[id]["weibo"] = {
			"id": selectedTarget.id,
			"screen_name": selectedTarget.screen_name,
			"profile_image_url": selectedTarget.profile_image_url,
			"avatar_large": selectedTarget.avatar_large
		};
		localStorage.setItem("targets", $.toJSON(targets));
		backgroundPage.location.reload();

		$currTargetWrapper.find(".target-avatar").attr("src", targets[id]["weibo"]["avatar_large"]);

		$('#target-modal').modal('hide');
	} else {

	}
});

function getAllScreenNames(uid, screenNames, cursor) {
	$.ajax({
		url: "https://api.weibo.com/2/friendships/friends.json?source=5786724301&uid="+uid+"&count=100&cursor="+cursor,
		type: "GET",
		dataType: "json",
		success: function(data) {
			var len = data.users.length;
			if (0 === len) { 
			} else {
				for (var i = 0; i < len; i++) {
					var user = data.users[i];
					screenNames.push(user.screen_name); 
				}
				getAllScreenNames(uid, screenNames, cursor + 100);
			}
		},
		error: function(data) {
			alert("Friends Ajax Error");
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