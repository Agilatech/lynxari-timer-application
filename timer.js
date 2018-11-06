const solarCalc = require('solar-calc');
const cron = require('cron');
const exec = require('child_process').execSync;

module.exports = class Timer {
	
	constructor(server, request) {

		this.server = server;
    this.serverName = this.server.httpServer.zetta.serverName;
    this.request = request;
    this.device = null;

    // the "server" is assumed to be the local hub if it is not defined
    if (typeof this.request.server == "undefined") {
      this.request.server = this.serverName;
    }

    this.arguments = (typeof this.request.command.arguments == "undefined") ? [] : this.request.command.arguments;

    this.onTickFunction = (this.request.class == "shell") ? this.fireShellRequest.bind(this) : this.fireDeviceRequest.bind(this);

    if (this.request.class == "transition") {
      this.device = this.getDevice();
    }

    this.validateSchedule();
    this.concatenateSchedule();

    this.cronjob = new cron.CronJob(this.cronpattern, this.onTickFunction);

    this.usingSun = this.checkSunInput();

    if (this.usingSun) {
      // if using sunrise, sunset, etc, then register a callback when the cron fires
      //this.onCompFunction = this.resetTimeToNextSunEvent;
      // since this is the first time, the sun position time must be calculated
      this.resetTimeToNextSunEvent();
    }

    this.cronjob.start();
	}

  getDevice() {
    let deviceSpec = {};

    if (typeof this.request.command.device_id != "undefined") { deviceSpec.id = this.request.command.device_id }
    if (typeof this.request.command.device_type != "undefined") { deviceSpec.type = this.request.command.device_type }
    if (typeof this.request.command.device_name != "undefined") { deviceSpec.name = this.request.command.device_name }

    const deviceQuery = (this.serverName == this.request.command.server) ? 
    this.server.where(deviceSpec) : this.server.from(this.server).where(deviceSpec);

    this.server.observe([deviceQuery], (device) => {
      this.device = device;
    });    
  
  }

  fireDeviceRequest() {
    if (this.device != null) {
        if (this.request.command.hasOwnProperty('arguments')) {
            this.device.call(this.request.command.execute, ...this.request.command.arguments);
        }
        else {
            this.device.call(this.request.command.execute);
        }
    }  
  }

  fireShellRequest() {
    const args = this.request.command.arguments.join(' ');
    const shellexec = exec(this.request.command.execute + ' ' + args);
  }

  resetTimeToNextSunEvent() {
    this.cronjob.stop();  // maybe, probably have to do this?

    // use the next time the sun will be in position and use it to create a new cron time
    const crontime = new cron.CronTime(this.getNextSunTime());
    
    this.cronjob.setTime(crontime);
    this.cronjob.addCallback(this.resetTimeToNextSunEvent.bind(this));
    this.cronjob.start();
  }

  getNextSunTime() {
    const now = new Date();
    const next = this.cronjob.cronTime.sendAt().toArray();

    // next[0] = year, next[1] = month, next[2] = day
    let solarDate = new Date(next[0], next[1], next[2]);

    let solar = new solarCalc(solarDate, this.request.schedule.sun.latitude, this.request.schedule.sun.longitude);

    // if the sun position event has already occured, advance the day and try again
    while ((solar[this.request.schedule.sun.position] - now) < 0) {
      solarDate.setDate(solarDate.getDate() + 1);
      solar = new solarCalc(solarDate, this.request.schedule.sun.latitude, this.request.schedule.sun.longitude);
    }

    return solar[this.request.schedule.sun.position];
  }

  checkSunInput() {
    // all parameters of sun must be present and valid in order to use sun position

    if (typeof this.request.schedule.sun == "undefined") {
      return false;
    }

    if ( (typeof this.request.schedule.sun.position == "undefined") 
    || (typeof this.request.schedule.sun.latitude == "undefined") 
    || (typeof this.request.schedule.sun.longitude == "undefined")) {
      return false;
    }

    const regexSun = /^sunrise$|^sunset$|^(civilD|d)(awn|usk)$|^nautical(Dawn|Dusk)$|^astronomical(Dawn|Dusk)$|^solarNoon$/;
    if (!regexSun.test(this.request.schedule.sun.position)) {
      return false;
    }

    const regexLat = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/;
    if (!regexLat.test(this.request.schedule.sun.latitude)) {
      return false;
    }

    const regexLon = /^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
    if (!regexLon.test(this.request.schedule.sun.longitude)) {
      return false;
    }

    return true;
  }

  validateSchedule() {
    if (typeof this.request.schedule == "undefined") { this.request.schedule = {} }
    if (typeof this.request.schedule.second == "undefined") { this.request.schedule.second = "*" }
    if (typeof this.request.schedule.minute == "undefined") { this.request.schedule.minute = "*" }
    if (typeof this.request.schedule.hour == "undefined") { this.request.schedule.hour = "*" }
    if (typeof this.request.schedule.day_of_month == "undefined") { this.request.schedule.day_of_month = "*" }
    if (typeof this.request.schedule.month == "undefined") { this.request.schedule.month = "*" }
    if (typeof this.request.schedule.day_of_week == "undefined") { this.request.schedule.day_of_week = "*" }

    // some bug in the cron module makes it wig out if day_of_month and day_of_week are both non-wildcard
    if ((this.request.schedule.day_of_month != "*") && (this.request.schedule.day_of_week != "*")) {
      this.request.schedule.day_of_month = "*"; // giving day of week the win
    }

    // matches * | 3 | 2-5 | 1,3,5 | 5-10 which will handle most cron patterns, but could still be improved
    const regExCron = /^\*$|^((?:\*|[0-5]?[0-9](?:(?:-[0-5]?[0-9])|(?:,[0-5]?[0-9])+)?)(?:\/[0-9]+)?)$/;

    // If any one of the elements of the pattern doesn't look right, it gets set to a wildcard
    if (!regExCron.test(this.request.schedule.second)) { this.request.schedule.second = "*" }
    if (!regExCron.test(this.request.schedule.minute)) { this.request.schedule.minute = "*" }
    if (!regExCron.test(this.request.schedule.hour)) { this.request.schedule.hour = "*" }
    if (!regExCron.test(this.request.schedule.day_of_month)) { this.request.schedule.day_of_month = "*" }
    if (!regExCron.test(this.request.schedule.month)) { this.request.schedule.month = "*" }
    if (!regExCron.test(this.request.schedule.day_of_week)) { this.request.schedule.day_of_week = "*" }

    // by this point, no matter how screwed up or missing the schedule config, we should have something which 
    // will be able to be parsed by the cron module, even if it's simply all wildcrds
  }

  concatenateSchedule() {
    this.cronpattern =  this.request.schedule.second + ' ' + 
                        this.request.schedule.minute + ' ' + 
                        this.request.schedule.hour + ' ' + 
                        this.request.schedule.day_of_month + ' ' + 
                        this.request.schedule.month + ' ' + 
                        this.request.schedule.day_of_week;
  }
}
