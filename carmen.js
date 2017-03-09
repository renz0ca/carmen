// carmen.js

// EXTERNAL IMPORTS
var Discord = require('discord.io');

// CARMEN MODULES
var MusicPlayer = require('./musicplayer.js');
var Twitter     = require('./twitter.js');
var Games       = require('./games.js');
var Memory      = require('./memory.js');
var Money       = require('./money.js');
var Crypto      = require('./crypto.js');

// WEB SERVER MODULE
var Web         = require('./web.js');

//GLOBALS
var YELLOW         = 7458112
var LOGGING_STRING = "carmen.js  || "

var WELCOME_MESSAGE   = "Hey there! I'm Carmen! If you ever need anything just let me know :smile:.\n"
                      + "You can always call for `!help` if you're ever unsure of anything!"
var RECOG_WELCOME_MSG = "I remember you guys! As always, if you ever need anything just call for `!help`!"

var HARD_RESET_CYCLE = false;

// HELP CONSTANTS
COMMAND_SIZE_COL = 14
USAGE_SIZE_COL = 24

// GET API TOKEN FROM ARGS (IF API_TOKEN ISN'T PREDEFINED)
if (typeof process.env.API_TOKEN === 'undefined'){
    process.env.API_TOKEN = ""
    process.argv.forEach(function (val, index, array) {
        if(val === "-k" && index+1 < array.length) {
            process.env.API_TOKEN = array[index+1]
        } else if(index === array.length-1 && process.env.API_TOKEN === "") {
            console.log("Usage: carmem.js -k API_KEY")
            console.log("You must provide a Discord Token!")
            process.exit()
        }
    });
}

// INIT BOT OBJECT
var bot = new Discord.Client({
    autorun: true,
    token: process.env.API_TOKEN
});

// 0.) ---- WEB INTERFACE --------------------------------------------------------------------------- //

Web.launch_webserver(bot)

// 1.) ---- BOT EVENTS ------------------------------------------------------------------------------ //


// BOT ON READY
//
FIRST_LAUNCH = true
bot.on('ready', function(event) {
    log_event('Logged in as ' + bot.username + ' - ' + bot.id);
    if(FIRST_LAUNCH) {
        // Register Modules
        Memory.init_module(bot)
        register_commands(Games.init_module(bot))
        Twitter.init_module(bot)
        register_commands(Money.init_module(Memory, bot))
        register_commands(Crypto.init_module(bot))
        // Memory Registrations
        Memory.register_server_key("server_greeting", "Welcome %user%!")
        // BOT ON NEW SERVER
        bot.on('guildCreate', function(guild, server){
            log_event("New Server Detected...")
            is_new_server = Memory.add_server(guild)
            if(is_new_server) bot.sendMessage({ to: guild['id'], message: WELCOME_MESSAGE })
            // If currently in a restart cycle, don't print RECOG Welcome.
            else if(!HARD_RESET_CYCLE) {
                bot.sendMessage({ to: guild['id'], message: RECOG_WELCOME_MSG })
            }
        });
    }
    // Flips off HARD_RESET_CYCLE var if it was on.
    HARD_RESET_CYCLE = false;
    // Process Active Servers
    log_event("Processing Active Servers...")
    Memory.process_new_servers(bot['servers'], true)
    FIRST_LAUNCH = false;
    log_event('Ready.')
});


// BOT ON DISCONNECT
//
bot.on('disconnect', function(errMsg, code) {
    HARD_RESET_CYCLE = true;
    bot.connect()
});

// BOT ON MESSAGE
//
bot.on('message', function(user, userID, channelID, message, event) {    
    if (message === "ping"){ bot.sendMessage({ to: channelID, message: "pong" }); }
    execute_command(userID, channelID, message, event)
});


// BOT ON NEW USER
//
bot.on('guildMemberAdd', function(guild, member){
    log_event("New User Detected...")
    is_new_user = Memory.add_user(member['d']['user'])
    channelID = guild['guild_id'];
    username = member['d']['user']['username']
    if(is_new_user){
        server_id = bot['channels'][channelID]['guild_id']
        message = Memory.get_server_data(server_id, "server_greeting").replace(/%user%/g, username);
        if(message != "") bot.sendMessage({ to: channelID, message: message })
    }
});


// 2.) ---- ADMINISTRATIVE FUNCTIONS ---------------------------------------------------------------- //


// Sends the current state of CORE_MEMORY to the chat as a formatted string. 
//
// @param USERID The ID of the user making the command.
// @param CHANNELID The ID of the channel the command was made in.
// @param MESSAGE The whole message containing the command.
// @param PARAMETER_SET A dictionary containing any parameters specified with the command.
//
function dump_memory(userID, channelID, message, parameter_set){
    bot.sendMessage({ to: channelID, 
        message: "Current state of `CORE_MEMORY`:\n```" + Memory.print_core_memory() + "```" 
    })
}


// Generates and Sends Help Message. 
//
// @param USERID The ID of the user making the command.
// @param CHANNELID The ID of the channel the command was made in.
// @param MESSAGE The whole message containing the command.
// @param PARAMETER_SET A dictionary containing any parameters specified with the command.
//
function build_help(userID, channelID, message, parameter_set){
    log_event("Help requested in channel: " + channelID)
    HELP_MESSAGE = "Here are my supported commands:\n\n"
    whitespace_cmd = new Array(COMMAND_SIZE_COL + 1).join('\xa0');
    whitespace_usg = new Array(USAGE_SIZE_COL + 1).join('\xa0');
    for(module in command_dict){
        HELP_MESSAGE += "**" + module + ":**\n```"
        for(command in command_dict[module]){
            HELP_MESSAGE += (command + whitespace_cmd).substring(0, COMMAND_SIZE_COL) 
                            + " USAGE: " + (format_usage(command, false) + whitespace_usg).substring(0, USAGE_SIZE_COL) 
            if(command_dict[module][command]['desc'] != null)
                HELP_MESSAGE += " | " + command_dict[module][command]['desc']
            HELP_MESSAGE += "\n"
        }
        HELP_MESSAGE += "```\n"
    }
    bot.sendMessage({ to:channelID, message: HELP_MESSAGE })
}


// Sets the greeting for a server.
//
// @param USERID The ID of the user making the command.
// @param CHANNELID The ID of the channel the command was made in.
// @param MESSAGE The whole message containing the command.
// @param PARAMETER_SET A dictionary containing any parameters specified with the command.
//
function set_greeting(userID, channelID, message, parameter_set){ 
    usage_message = "!greeting `greeting`\n - Use `'greeting clear` to remove the server greeting."
                    + "\n - To include the new user's name in the greeting, use `%user%` in place of their name."
    serverID = bot['channels'][channelID]['guild_id']
    if(bot['servers'][serverID]['owner_id'] == userID){
        // View Greeting
        if(parameter_set['greeting'] == ""){
            bot.sendMessage({ to: channelID, 
                embed: { color: YELLOW, title: "Current Greeting:", 
                         description: Memory.get_server_data(serverID, "server_greeting").replace(/%user%/g, "`%user%`"),
                         fields: [{ name: "Usage:", value: usage_message }]
                }
            })
        // Clear Greeting
        } else if(parameter_set['greeting'] == "clear"){
            log_event("Server(ID:" + serverID + ") greeting cleared.")
            Memory.set_server_data(serverID, "server_greeting", "")
            bot.sendMessage({ to: channelID, 
                embed: { color: YELLOW, description: "The server greeting has been cleared." }
            })
        // Change Greeting
        } else {
            log_event("Server(ID:" + serverID + ") greeting changed to: " + parameter_set['greeting'])
            Memory.set_server_data(serverID, "server_greeting", parameter_set['greeting'])
            bot.sendMessage({ to: channelID, 
                embed: { color: YELLOW, title: "The server greeting has been set to:",
                    description: parameter_set['greeting'].replace(/%user%/g, "`%user%`")
                }
            })
        }
    }
}


// Executes commands that are intended to run on normal chat messages (not bot commands).
//
// @param USERID The ID of the user who sent the message
// @param CHANNELID The ID of the channel the message was sent in.
// @param MESSAGE A string containing the message sent
// @param EVENT An object containing addition details about the message sent.
//
function text_only_message(userID, channelID, message, event){
    if(userID != bot.id){
        if(Twitter.has_tweet(message)){
            bot.deleteMessage({ channelID: channelID, messageID: event['d']['id'] })
            log_event("Tweet Detected... Reformatting")
            Twitter.reformat_tweet(channelID, userID, message)
        } else {
            Money.grow_flowers(channelID)
        }
    }
}


// 3.) ---- HYBRID COMMANDS ------------------------------------------------------------------------- //


// Simulates a random coin flip, checks if bet was successful, and performs the according transaction.
//
// @param USERID The ID of the user making the command.
// @param CHANNELID The ID of the channel the command was made in.
// @param MESSAGE The whole message containing the command.
// @param PARAMETER_SET A dictionary containing any parameters specified with the command.
//
function bet_flip(userID, channelID, message, parameter_set){
    if(parameter_set['outcome'] == "heads" || parameter_set['outcome'] == "tails"){
        Money.simple_bet(userID, channelID, message, parameter_set, Games.flip)
    } else bot.sendMessage({ to: channelID, message: "You can only bet `heads` or `tails`"})
}


// 4.) ---- COMMAND PROCESSING FUNCTIONS ------------------------------------------------------------ //


// Extracts and returns a command within a message. (if there is one)
//
// @param MESSAGE The message sent in a chat.
// @return The section of the string containing a command. (null if there is none)
//
function parse_command(message){
    command = message.match(/^(!{1}|'{1}|#{1}|\]{1}|\${1}(\${2})?|>{1})\w*/);
    return command && command[0]
}


// Extracts and returns the rest of the message following a command. (if there is one)
//
// @param MESSAGE The message sent in a chat.
// @return The section of the string following a command. (null if there is none)
//
function parse_parameters(message){
    parameters = message.replace(/^(!{1}|'{1}|#{1}|\]{1}|\${1}(\${2})?|>{1})\w*/,"");
    parameters = parameters.match(/\S(.)+/);
    return parameters && parameters[0]
}


// Executes a command within a message, if there is no command execute text_only_message().
//
// @param USERID The ID of the user who sent the message
// @param CHANNELID The ID of the channel the message was sent in.
// @param MESSAGE A string containing the message sent
// @param EVENT An object containing addition details about the message sent.
//
function execute_command(userID, channelID, message, event){
    var command_name = parse_command(message)
    command_obj = get_command(command_name)
    if(command_obj !== null){
        command_obj = command_obj['c']
        parameters_set = validate_parameters(command_name, parse_parameters(message))
        if(parameters_set){
            if(command_obj['delete_calling_message']) 
                bot.deleteMessage({ channelID: channelID, messageID: event['d']['id'] })
            command_obj.function(userID, channelID, message, parameters_set)
        } else bot.sendMessage({ 
            to: channelID, 
            message: "You're not using the right format! Like this: " + format_usage(command_name)
        })
    } else {
        text_only_message(userID, channelID, message, event)
    }
}


// Formats the usage message for a given command based on 
// its definition within the command dictionary.
//
// @param COMMAND_NAME The name of the command.
// @param INCLUDE_TICKS If TRUE, usage will be "Code-Formatted" in Discord.
// @return The formatted usage message for the specified command.
//
function format_usage(command_name, include_ticks = true){
    if(include_ticks) usage = "`" + command_name
    else usage = command_name
    command_obj = get_command(command_name)['c']
    parameters = command_obj['parameters']
    for(var i=0; i < parameters.length; i++){
        if(command_obj['param_types'][i] === "username") usage += " @" + parameters[i]
        else usage += " " + parameters[i]
    }
    if(include_ticks) return usage + "`"
    else return usage
}


// Parses and validates the parameters provided by the user for a command 
// against the command's definition within the command dictionary.
//
// @param COMMAND_NAME The name of the command.
// @param PARAMETERS The section of the message following the 
//                   command which contains the parameters.
// @return A dictionary containing the parameter names and their values. 
//         Returns null if the parameters could not be parsed correctly.
//
function validate_parameters(command_name, parameters){
    if(parameters == null) parameters = ""
    command_obj = get_command(command_name)['c']
    // If there are no defined parameters return an empty set.
    if(command_obj['parameters'].length == 0) return {}
    // If the "whole_string" send the whole parameters string.
    if(command_obj['param_types'].includes("whole_string")){
        param_set = {}, param_set[command_obj['parameters'][0]] = parameters
        return param_set
    }
    given_params = parameters.split(" ")
    // Make sure given parameters and required parameters are the same in length
    if(given_params.length == command_obj['parameters'].length){
        // Make sure each required parameter has a param_type defined.
        if(command_obj['parameters'].length != command_obj['param_types'].length){
            console.log("::ERROR: " + command_name + "'s parameter definitions and parameter types don't match!")
            process.exit()
        }
        return process_parameters(command_obj, given_params)
    } else return null
}


// Takes the tokenized parameter array and casts each parameter to its 
// proper datatype according to the command's definition within the command dictionary.
//
// @param COMMAND The command's object within the command dictionary.
// @param GIVEN_PARAMS The tokenized parameter array.
// @return A dictionary containing the parameter names and their values. 
//         Returns null if the parameters could not be parsed correctly.
//
function process_parameters(command_obj, given_params){
    var param_set = {}
    for(var i=0; i < command_obj['parameters'].length; i++){
        key = command_obj['parameters'][i]
        switch(command_obj['param_types'][i]){
            case "username":
                value = given_params[i].match(/^<@(\d+)(?:>)$/)
                if(value) param_set[key] = value[1]
                else return null;
                break;
            case "number":
                value = given_params[i].match(/^\d+$/g)
                if(value) param_set[key] = parseInt(value[0])
                else return null;
                break;
            case "word":
                value = given_params[i].match(/^\S+$/g)
                if(value) param_set[key] = value[0]
                else return null;
                break;
        }
    }
    return param_set
}


// Fetches a command object from the Command Dictionary.
//
// @param COMMAND_NAME The name of the command.
// @return The command object associated with the COMMAND_NAME.
//
function get_command(command_name){
    for(var module in command_dict)
       if(command_dict[module][command_name] != null) return {c:command_dict[module][command_name], m:module}
    return null;
}


// 5.) ---- COMMAND REGISTRATION FUNCTIONS ---------------------------------------------------------- //


// Registers additional command objects within the primary command dictionary. (command_dict)
// 
// @param EXT_COMMAND_DICT A object containing additional command objects.
//
function register_commands(ext_command_dict){
    log_event("Registering module commands in command dictionary...")
    for (var module in ext_command_dict){
        for(command in ext_command_dict[module]){
            command_exist = get_command(command)
            if(command_exist != null){
                console.log("::ERROR: The '" + command + "' command has already"
                            + " been defined within the " + command_exist['m'] + " module!")
                process.exit()
            }
        }
        command_dict[module] = ext_command_dict[module]
    }
}


// 6.) ---- PRIVATE FUNCTIONS ----------------------------------------------------------------------- //


// Logs Output to the NODEJS Console.
//
// @param STRING The string to log.
// @param NEWLINE If TRUE a newline will be appended to the end of
//                the string.
// @param INCLUDE_LOG_STRING If TRUE the LOGGING_STRING will be included.
//
function log_event(string, newline = true, include_log_string = true){
    logging_string = ''
    if(include_log_string) logging_string = LOGGING_STRING
    if(newline){
        Web.print_web_console(logging_string + string + "\n")
        process.stdout.write(logging_string + string + "\n")
    } else {
        Web.print_web_console(logging_string + string)
        process.stdout.write(logging_string + string)
    }
}


// 7.) ---- MODULE COMMAND DICTIONARY --------------------------------------------------------------- //


var command_dict = {
    "Administrative":{
        "!memory": {
            parameters: [],
            param_types: [],
            delete_calling_message: false,
            desc: "Prints the current state of Carmen's internal memory.",
            function: dump_memory
        },
        "!help": {
            parameters: [],
            param_types: [],
            delete_calling_message: false,
            desc: "Lists Carmen's supported commands.",
            function: build_help
        },
        "!greeting": {
            parameters: ["greeting"],
            param_types: ["whole_string"],
            delete_calling_message: false,
            desc: "Sets the server greeting.",
            function: set_greeting
        },
        //"$betroll": {
        //    parameters: ["amount"],
        //    param_types: ["number"],
        //    delete_calling_message: false,
        //    function: bet_roll
        //},
        "$betflip": {
            parameters: ["outcome", "amount"],
            param_types: ["word", "number"],
            delete_calling_message: false,
            desc: "Bet your money on a coin flip!",
            function: bet_flip
        },
    }
}
