// crypto.js

// WEB SERVER MODULE
var Web = require('./web.js');

// IMPORTS
var crypto = require('crypto');

// GLOBALS
var BOT                 = null
var LOGGING_STRING      = "crypto.js  || "


// 1.) ---- PUBLIC FUNCTIONS ------------------------------------------------------------------------ //


module.exports = {
    
    // Sets the bot variable and returns the module's command dictionary.
    //
    // @param BOT The bot being used.
    // @return The module's command dictionary
    //
    init_module: function(bot){
        BOT = bot 
        log_event("Initializing Crypto Module...")
        return command_dict
    },
    
    // Converts a specified text to a set of diffrent encodings and hashes.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    compute_hashes: function(userID, channelID, message, parameter_set){
        if(validate_params(parameter_set['message'], channelID, '#hash')){
            var md5sum = crypto.createHash('md5').update(parameter_set['message']).digest('hex');
            var sha1sum = crypto.createHash('sha1').update(parameter_set['message']).digest('hex');
            var sha256sum = crypto.createHash('sha256').update(parameter_set['message']).digest('hex');
            var sha512sum = crypto.createHash('sha512').update(parameter_set['message']).digest('hex');
            base64 = new Buffer(parameter_set['message']).toString('base64');
            BOT.sendMessage({ to:channelID, embed:{
                color: 3901635,
                description: ":hash:\n\n**MD5:**\n" + md5sum + "\n\n**SHA1:**\n" 
                             + sha1sum + "\n\n**SHA256:**\n" + sha256sum + "\n\n**SHA512:**\n" 
                             + sha512sum + "\n\n**Base64:**\n" + base64
            }})
        }
    },
    
    // Converts a specified text to it's MD5 Hash Equivalent.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    to_md5: function(userID, channelID, message, parameter_set){
        if(validate_params(parameter_set['message'], channelID, '#md5')){
            var md5sum = crypto.createHash('md5');
            md5sum.update(parameter_set['message']);
            send_hash(channelID, md5sum.digest('hex'), "MD5")
        }
    },
    
    // Converts a specified text to it's SHA1 Hash Equivalent.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    to_sha1: function(userID, channelID, message, parameter_set){
        if(validate_params(parameter_set['message'], channelID, '#sha1')){
            var sha1sum = crypto.createHash('sha1');
            sha1sum.update(parameter_set['message']);
            send_hash(channelID, sha1sum.digest('hex'), "SHA1")
        }
    },
    
    // Converts a specified text to it's SHA256 Hash Equivalent.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    to_sha256: function(userID, channelID, message, parameter_set){
        if(validate_params(parameter_set['message'], channelID, '#sha256')){
            var sha256sum = crypto.createHash('sha256');
            sha256sum.update(parameter_set['message']);
            send_hash(channelID, sha256sum.digest('hex'), "SHA256")
        }
    },
    
    // Converts a specified text to it's SHA512 Hash Equivalent.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    to_sha512: function(userID, channelID, message, parameter_set){
        if(validate_params(parameter_set['message'], '#sha512')){
            var sha512sum = crypto.createHash('sha512');
            sha512sum.update(parameter_set['message']);
            send_hash(channelID, sha512sum.digest('hex'), "SHA512")
        }
    },
    
    // Converts a specified text to it's Base64 Equivalent.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    to_base64: function(userID, channelID, message, parameter_set){
        if(validate_params(parameter_set['message'], channelID, '#base64')){
            base64 = new Buffer(parameter_set['message']).toString('base64');
            send_hash(channelID, base64, "Base64")
        }
    },
    
}


// 2.) ---- PRIVATE FUNCTIONS ----------------------------------------------------------------------- //


// Returns TRUE if MESSAGE contains text. If it does not, it sends an error message
// to the chat and returns FALSE.
//
// @param MESSAGE The message to hash.
// @param CHANNELID The ID of the channel the message was sent from.
// @param COMMAND_NAME The name of the hash (or encoding) being used.
// @return TRUE if MESSAGE contains text, FALSE otherwise.
//
function validate_params(message, channelID, command_name){
    if(message == ""){
        BOT.sendMessage({ to:channelID, message: "What text do you want me to hash? Try it like this: `" + command_name + " message`"})
        return false;
    } else return true;
}


// Sends a formatted (embed block) to the chat containing the hash.
//
// @param CHANNELID The ID of the channel the message was sent from.
// @param HASH The computed hash.
// @param HASH_TYPE The name of the hash (or encoding) being used.
//
function send_hash(channelID, hash, hash_type){
    BOT.sendMessage({ to:channelID, embed:{
        color: 3901635,
        description: ":hash: **" + hash_type + ":** " + hash
    }})
}


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



// 3.) ---- MODULE COMMAND DICTIONARY --------------------------------------------------------------- //


var command_dict = {
    "Cryptography":{
        "#hash": {
            parameters: ['message'],
            param_types: ['whole_string'],
            delete_calling_message: false,
            desc: "Convert a message to a list of it's equivalent hashes",
            function: module.exports['compute_hashes']
        },
        "#md5": {
            parameters: ['message'],
            param_types: ['whole_string'],
            delete_calling_message: false,
            desc: "Message to MD5 Hash equivalent",
            function: module.exports['to_md5']
        },
        "#sha1": {
            parameters: ['message'],
            param_types: ['whole_string'],
            delete_calling_message: false,
            desc: "Message to SHA1 Hash equivalent",
            function: module.exports['to_sha1']
        },
        "#sha256": {
            parameters: ['message'],
            param_types: ['whole_string'],
            delete_calling_message: false,
            desc: "Message to SHA256 Hash equivalent",
            function: module.exports['to_sha256']
        },
        "#sha512": {
            parameters: ['message'],
            param_types: ['whole_string'],
            delete_calling_message: false,
            desc: "Message to SHA512 Hash equivalent",
            function: module.exports['to_sha512']
        },
        "#base64": {
            parameters: ['message'],
            param_types: ['whole_string'],
            delete_calling_message: false,
            desc: "Message to Base64 equivalent",
            function: module.exports['to_base64']
        },
    }
}
