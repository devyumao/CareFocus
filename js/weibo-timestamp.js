/**
 * 格式化输出时间（参考新浪微博）
 * e.g.
 * * 刚刚
 * * 10秒前
 * * 20秒前
 * * ...
 * * 1分钟前
 * * 2分钟前
 * * ...
 * * 60分钟前
 * * ...
 * * 今天09:02
 * * ...
 * * 9月10日 07:50
 * @param time time can be a number, date, or string
 */
function weibo_timestamps(time){

    if(typeof time == 'string'){
        time = parseInt(time);
    }

    var ONE_SECOND = 1000,
        ONE_MINUTE = ONE_SECOND * 60,
        ONE_HOUR   = ONE_MINUTE * 60,
        ONE_DAY    = ONE_HOUR   * 24;

    var iTrueTime = null,
        dNow = new Date(),
        iNow = dNow.getTime(),
        ret = "";

    if(typeof time == 'number'){

        iTrueTime = time;
    } else if(typeof time == 'object'){

        if(time.getTime){// an object of Date
            iTrueTime = time.getTime();
        }
    }


    if( iTrueTime != NaN){
        var dTrueTime = new Date();
        dTrueTime.setTime(iTrueTime);
    }

    if(iTrueTime == NaN){
        ret = "-";
    }else if(iTrueTime > iNow){
        ret = "您穿越了";
    } else if( iTrueTime > iNow - ONE_SECOND * 10){
        ret = "刚刚";
    } else if( iTrueTime > iNow - ONE_MINUTE){
        // e.g. 30秒前
        ret = parseInt((iNow - iTrueTime) / ONE_SECOND / 10).toString() + "0秒前";
    } else if( iTrueTime > iNow - ONE_HOUR){
        // e.g. 3分钟前
        ret = parseInt((iNow - iTrueTime) / ONE_MINUTE) + "分钟前";
    } else if( iTrueTime > iNow - ONE_DAY){
        // e.g. 今天11:39
        ret = "今天" + dTrueTime.getHours() + ":" + dTrueTime.getMinutes();
    } else{
        if(dTrueTime.getYear() == dNow.getYear()){
            // e.g. 9月10日 07:50
            ret = dTrueTime.getMonth() + "月" + dTrueTime.getDate() + "日 " + dTrueTime.getHours() + ":" + dTrueTime.getMinutes();
        }else{
            // e.g. 2011年2月3日 12:39
            ret = dTrueTime.getFullYear() + "年" + dTrueTime.getMonth() + "月" + dTrueTime.getDate() + "日 " + dTrueTime.getHours() + ":" + dTrueTime.getMinutes();
        }
    }

    return ret;
}


module.exports = weibo_timestamps;
