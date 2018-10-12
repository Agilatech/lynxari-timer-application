const solarCalc = require('solar-calc');
const cron = require('cron');

var crnpattern = '32 12 17 * 9 3';
var sunpos = 'dawn';

console.log("Starting with cron pattern '" + crnpattern + "'");

let crnjb1 = new cron.CronJob(crnpattern, () =>{
    // do something
}, null, true);

var next = crnjb1.cronTime.sendAt().toArray();
console.log(next);
var riseYr = next[0];
var riseMo = next[1];
var riseDy = next[2];

var solarDate = new Date(riseYr, riseMo, riseDy);
console.log('orig solar date = ' + solarDate);

var solar = new solarCalc(solarDate, 42.949009,-110.140349);

while (checkPast(solar[sunpos])) {
    solarDate.setDate(solarDate.getDate() + 1);
    solar = new solarCalc(solarDate, 42.949009,-110.140349);
}

console.log('new  solar date = ' + solar[sunpos]);

var crnsunrise = new cron.CronTime(solar[sunpos]);

crnjb1.setTime(crnsunrise);

next = crnjb1.cronTime.sendAt().toArray();
console.log(next);

console.log("* passes: " + testR('*'));
console.log("1 passes: " + testR('1'));
console.log("12 passes: " + testR('12'));
console.log("123 passes: " + testR('123'));
console.log("1-12 passes: " + testR('1-12'));
console.log("1,23 passes: " + testR('1,23'));
console.log("12/2 passes: " + testR('12/2'));

var request = {};
request = validateSchedule(request);
console.log(request.schedule);

request.schedule.hour = '3,5';
request.schedule.month = '8-10';
request.schedule.day_of_week = 'f3';
request = validateSchedule(request);

console.log(request.schedule);

function checkPast(date) {
    var now = new Date();
    if ((date - now) < 0) {
        return true;
    }
    return false;
}

function testR(exp) {
    const regExCron = /^\*$|^((?:\*|[0-5]?[0-9](?:(?:-[0-5]?[0-9])|(?:,[0-5]?[0-9])+)?)(?:\/[0-9]+)?)$/;
    return regExCron.test(exp);
}

function validateSchedule(request) {
    if (typeof request.schedule == "undefined") { request.schedule = {} }
    if (typeof request.schedule.second == "undefined") { request.schedule.second = "*" }
    if (typeof request.schedule.minute == "undefined") { request.schedule.minute = "*" }
    if (typeof request.schedule.hour == "undefined") { request.schedule.hour = "*" }
    if (typeof request.schedule.day_of_month == "undefined") { request.schedule.day_of_month = "*" }
    if (typeof request.schedule.month == "undefined") { request.schedule.month = "*" }
    if (typeof request.schedule.day_of_week == "undefined") { request.schedule.day_of_week = "*" }

    // some bug in the cron module makes it wig out if day_of_month and day_of_week are both non-wildcard
    if ((request.schedule.day_of_month != "*") && (request.schedule.day_of_week != "*")) {
      request.schedule.day_of_month = "*"; // giving day of week the win
    }

    // matches * | 3 | 2-5 | 1,3,5 | 5-10 which will handle most cron patterns, but could still be improved
    const regExCron = /^\*$|^((?:\*|[0-5]?[0-9](?:(?:-[0-5]?[0-9])|(?:,[0-5]?[0-9])+)?)(?:\/[0-9]+)?)$/;

    // If any one of the elements of the pattern doesn't look right, it gets set to a wildcard
    if (!regExCron.test(request.schedule.second)) { request.schedule.second = "*" }
    if (!regExCron.test(request.schedule.minute)) { request.schedule.minute = "*" }
    if (!regExCron.test(request.schedule.hour)) { request.schedule.hour = "*" }
    if (!regExCron.test(request.schedule.day_of_month)) { request.schedule.day_of_month = "*" }
    if (!regExCron.test(request.schedule.month)) { request.schedule.month = "*" }
    if (!regExCron.test(request.schedule.day_of_week)) { request.schedule.day_of_week = "*" }

    // by this point, no matter how screwed up or missing the schedule config, we should have something which 
    // will be able to be parsed by the cron module, even if it's simply all wildcrds

    return request;
  }