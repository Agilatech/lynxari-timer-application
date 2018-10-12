![Lynxari IoT Platform](https://agilatech.com/images/lynxari/lynxari200x60.png) **IoT Platform**
## Lynxari Timer Application

### Install
```
$> npm install @agilatech/lynxari-timer-application
```
Install in the same directory in which lynxari is installed. Create a config.json file to suit.


### Purpose
The purpose of this application is to schedule actions and trigger events according to time or sun position. Through simple configuration, the app can initiate device transitions and launch shell programs at specific time periods, or at sunrise, sunset, noon, etc. No limits are placed onto the number of scheduled events, and the application may command devices on remotely linked servers as well as local ones.


### Usage
This application runs on the [Agilatech®](https://agilatech.com) Lynxari IoT platform.  As such, it is not applicable for other environments.

To use it with Lynxari, simply insert its object definition as an element in the apps array in the _applist.json_ file. On startup, the Lynxari server reads _applist.json_ and starts all applications found there.

A _config.json_ configuration file must be present in the module's main directory. For this module, that will be within the Lynxari home directory in _node\_modules/@agilatech/lynxari-timer-application/config.json_


### Configuration
The _config.json_ file defines an array of requests to be scheduled. Each request fully defines the event to be carried out and the schedule to be followed. the three main elements of a request are the class, the command, and the schedule.

**class** : Must be one of **shell | transition** The 'shell' class is used to trigger an operating system call, such as a program or a shell script. 
The 'transition' class is used to trigger a device transition.

**command** : The command is a JSON object which defines the actual instruction to be carried out. It may contain these fields:
* **execute** : In a transition class, it is the device transition name. In shell class it is the shell program name itself.
* **arguments** : (optional) Arguments to be passed to the transition or the shell program.
   The following fields are only applicable in the transition class will be ignored in shell class:
* **server** : The name of the Lynxari server to which the device is connected.
* **device_name** : The name of the device itself.  Used in the query to find the device.  Will match all devices with this name.
* **device_type** : The type of the device. Used in the query to find the device. Will match all devices of this type.
* **device_id** : The ID tag of the device. This is specific to one and only device.


**schedule** : The schedule is a JSON object which defines the time period or sun position at which to trigger the command. Time periods are specified in cron-like fashion and conform to crontab syntax, with the addition of seconds. Examples of sun position are sunrise, dusk, or noon, and take precedence over any time-of-day specification (hours/minutes/seconds).
    
* **second** : (optional) Defines the second time period. May be a integer, wildcard (*), set (5,20,45), or range (2-15).
* **minute** : (optional) Defines the minute time period. May be a integer, wildcard (*), set (5,20,45), or range (2-15).
* **hour** : (optional) Defines the hour time period. May be a integer, wildcard (*), set (5,20,45), or range (2-15).
* **day_of_month** : (optional) Defines the numerical day of the month from 1-31. May be a integer, wildcard (*), set (5,20,45), or range (2-15).
* **month** : (optional) Defines the numerical month from 0-11. May be a integer, wildcard (*), set (3,5,8), or range (2-4).
* **day_of_week** : (optional) Defines the numerical day of the week from 0-6. May be a integer, wildcard (*), set (1,3,5), or range (0-4).
* **sun** : sun is itself a JSON object which defines a sun position at a specific latitude and longitude.  If present and completely and correctly defined, it takes precedence over any time of day in the schedule.
    * **position** : Specifies the sun position. Allowed values are sunrise | sunset | dawn | dusk | solarNoon | civilDawn | civilDusk | nauticalDawn | nauticalDusk | astronomicalDawn | astronomicalDusk . Please see below for further explanation.
    * **latitude** : The latitude on the earth in decimal form (i.e. 35.642, -45.5475). Valid value range is from -90 to 90.
    * **longitude** : The longitude on the earth in decimal form (i.e. -78.64342, 124.2526). Valid value range is from -180 to 180.
   

#### **schedule examples** :
```
"schedule": {
    "second": "*",
    "minute": "*",
    "hour": "*",
    "day_of_month": "*",
    "month": "*",
    "day_of_week": "*"
}
```
If all time period commands are wildcards, the command is triggered every second of every day.

Note that any time period not specified defaults to a wildcard. In fact, if the schedule object is _completely omitted_, that is equivalent to the above definition with all wildcards defined.

```
"schedule": {
    "second": "0",
    "minute": "15",
    "day_of_month": "10,20",
    "month": "2-3"
}
```
The command will be triggered after 14:59 minutes after the top of every hour on the 10th and 20th of March and April (note that only the day of month is not zero-based). If the second were not specified to be 0, then the command would be triggered _every_ second during the 14 minute.

**NOTE:** If both day\_of\_month and day\_of\_week are defined and not wildcard, then precedence is given to day\_of\_week. 

#### **sun position definitions**

* **sunrise** is when the upper edge of the Sun appears over the eastern horizon in the morning (0.833 degrees)
* **sunset** is when the upper edge of the Sun disappears below the horizon
* **civilDawn** or just **dawn** is when there is enough light for objects to be distinguishable. This occurs when the sun is 6 degrees below the horizon in the morning
* **nauticalDawn** is when there is enough sunlight for the horizon and some objects to be distinguishable. This occurs when the Sun is 12 degrees below the horizon in the morning
* **astronomicalDawn** is when the sky is no longer completely dark. This occurs when the Sun is 18 degrees below the horizon in the morning
* **civilDusk** or just **dusk** is when the sun is 6 degrees below the horizon in the evening. At this time objects are distinguishable and some stars and planets are visible to the naked eye.
* **nauticalDusk** is when the sun is 12 degrees below the horizon in the evening. At this time, objects are no longer distinguishable, and the horizon is no longer visible to the naked eye
* **astronomicalDusk** is when the sun is 18 degrees below the horizon in the evening. At this time the sun no longer illuminates the sky, and thus no longer interferes with astronomical observations
* **solarNoon** is when the sun transits the celestial meridian – roughly the time when it is highest above the horizon


Here is an example of a valid sun position object definition:
```
"sun": {
    "position": "nauticalDusk",
    "latitude": 32.949009,
    "longitude": -105.140349
}
```

Combining the schedule and sun definitions, the following will time an event to occur every Sunday evening at astronomical dusk:
```
"schedule": {
    "day_of_week": "6",
    "sun": {
        "position": "astronomicalDusk",
        "latitude": 35.78,
        "longitude": -78.649999
    }
}
```
#### **example config.json**
Putting it all together then, a valid example config file looks like:
```
{
    "requests": [
        {
            "class": "transition",
            "command": {
                "execute": "light-switch",
                "arguments": ["high"],
                "server": "bldg1",
                "device_name": "south-flood",
            },            
            "schedule": {
                "sun":  {
                    "position": "dusk",
                    "latitude": 35.78,
                    "longitude": -78.649999
                }
            }
        },
        {
            "class": "transition",
            "command": {
                "execute": "light-switch",
                "arguments": ["low"],
                "server": "bldg1",
                "device_name": "south-flood",
            },            
            "schedule": {
                "sun":  {
                    "position": "dawn",
                    "latitude": 35.78,
                    "longitude": -78.649999
                }
            }
        },
        {
            "class": "shell",
            "command" : {
                "execute": "mysqldump",
                "arguments": ["--dump-date", "station", "> /home/systems/dbdumps"]
            },
            "schedule": {
                "second": "0",
                "minute": "0",
                "hour": "2",
            }
        }
    ]
}
```

This timer configuration will switch on the south flood light on building 1 at dusk and then off at dawn. It will also save the mysql station database every night at 2AM.

### Copyright
Copyright © 2018 [Agilatech®](https://agilatech.com). All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
