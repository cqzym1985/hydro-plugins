import { HomeHandler } from 'hydrooj/src/handler/home'

async function getCountdown(payload) {
    var content = new Array();
    var dateToday = new Date();
    dateToday.setHours(0, 0, 0, 0);
    var dates = new Array(payload.dates);
    dates = dates[0];
    dates.forEach(function(val, ind) {
        if (content.length < payload['max_dates']) {
            var targetDate = new Date(val.date);
            targetDate.setHours(0, 0, 0, 0);
            if (targetDate >= dateToday) {
                var diffTime = Math.floor((targetDate - dateToday) / 86400000);
                content.push({
                    name: val.name,
                    diff: diffTime
                })
            }
        }
    });
    payload.dates = content;
    return payload;
}
HomeHandler.prototype.getCountdown = async (domainId, payload) => {
    return await getCountdown(payload);
}
