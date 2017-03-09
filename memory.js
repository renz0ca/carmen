//memory.js

// WEB SERVER MODULE
var Web = require('./web.js');

// IMPORTS
var fs = require('fs');

// GLOBALS
var BOT            = null
var CORE_MEMORY    = {}
var LOGGING_STRING = "memory.js  || "


// 1.) ---- PUBLIC FUNCTIONS ------------------------------------------------------------------------ //


module.exports = {
    
    // Sets the global bot variable and loads the bot's memory in from core_memory.json
    // into CORE_MEMORY. If no memory file exists one will be created.
    //
    // @param BOT The bot being used.
    //
    init_module: function(bot){ 
        BOT = bot
        log_event("Initizaling Memory Module...")
        if(fs.existsSync("./core_memory.json")){
            CORE_MEMORY = require("./core_memory.json");
            console.log(CORE_MEMORY)
            log_event("Memory File Loaded.")
        } else {
            log_event("No Memory File Found.")
            build_core_memory()
        }
    },
    
    // Registers a System Key in CORE_MEMORY
    //
    // @param KEY_NAME The name of the key
    // @param VALUE The value of the key
    //
    register_system_key: function(key_name, value){
        if(CORE_MEMORY['SYSTEM'][key_name] === undefined){
            log_event("REGISTERING KEY - '" + key_name + "' - TO CORE SYSTEM MEMORY.")
            CORE_MEMORY['SYSTEM'][key_name] = value
            save_memory()
        }
    },
    
    // Returns a System Key Value from CORE_MEMORY
    //
    // @param KEY_NAME The name of the key.
    // @return The value of the key requested.
    //
    get_system_data: function(key_name){
        if(CORE_MEMORY['SYSTEM'][key_name]){
            return CORE_MEMORY['SYSTEM'][key_name]
        } else return null
    },
    
    // Sets a System Key Value in CORE_MEMORY
    //
    // @param KEY_NAME The name of the key.
    // @param VALUE The new value for the key.
    // @return True if the key was updated successfully, false otherwise.
    //
    set_system_data: function(key_name, value, write_file = true){
        if(CORE_MEMORY['SYSTEM'][key_name] !== undefined){
            CORE_MEMORY['SYSTEM'][key_name] = value
            if(write_file) save_memory()
            return true
        } else return false
    },
    
    // Registers a User Key and assigns the key and default_value pair
    // to each user in CORE_MEMORY. 
    //
    // @param KEY_NAME The name of the key
    // @param DEFAULT_VALUE The default value of the key
    //
    register_user_key: function(key_name, default_value){
        if(!user_key_exists(key_name)){
            log_event("REGISTERING KEY - '" + key_name + "' - TO CORE USER MEMORY.")
            CORE_MEMORY['SYSTEM']['USER_KEYS'].push(key_name)
            CORE_MEMORY['SYSTEM']['USER_DEF_VALUES'].push(default_value)
            for (var user in CORE_MEMORY['USERS'])
                CORE_MEMORY['USERS'][user][key_name] = default_value
            save_memory()
        }
    },
    
    // Returns a User Key Value from a specific user in CORE_MEMORY
    //
    // @param USERID The ID of the user.
    // @param KEY_NAME The name of the key.
    // @return The value of the key requested.
    //
    get_user_data: function(userID, key_name){
        if(user_key_exists(key_name)){
            return CORE_MEMORY['USERS'][userID][key_name]
        } else return null
    },
    
    // Sets a User Key Value for a specific user in CORE_MEMORY
    //
    // @param USERID The ID of the user.
    // @param KEY_NAME The name of the key.
    // @param VALUE The new value for the key.
    // @return True if the key was updated successfully, false otherwise.
    //
    set_user_data: function(userID, key_name, value, write_file = true){
        if(user_key_exists(key_name)){    
            CORE_MEMORY['USERS'][userID][key_name] = value
            if(write_file) save_memory()
            return true
        } else return false
    },
    
    // Registers a Server Key and assigns the key and default_value pair
    // to each server in CORE_MEMORY. 
    //
    // @param KEY_NAME The name of the key
    // @param DEFAULT_VALUE The default value of the key
    //
    register_server_key: function(key_name, default_value){
        if(!server_key_exists(key_name)){
            log_event("REGISTERING KEY - '" + key_name + "' - TO CORE SERVER MEMORY.")
            CORE_MEMORY['SYSTEM']['SERVER_KEYS'].push(key_name)
            CORE_MEMORY['SYSTEM']['SERVER_DEF_VALUES'].push(default_value)
            for (var server in CORE_MEMORY['SERVERS'])
                CORE_MEMORY['SERVERS'][server][key_name] = default_value
            save_memory()
        }
    },
    
    // Returns a Server Key Value from a specific server in CORE_MEMORY
    //
    // @param SERVERID The ID of the server.
    // @param KEY_NAME The name of the key.
    // @return The value of the key requested.
    //
    get_server_data: function(serverID, key_name){
        if(server_key_exists(key_name)){
            return CORE_MEMORY['SERVERS'][serverID][key_name]
        } else return null
    },
    
    // Sets a Server Key Value for a specific server in CORE_MEMORY
    //
    // @param SERVERID The ID of the server.
    // @param KEY_NAME The name of the key.
    // @param VALUE The new value for the key.
    // @return True if the key was updated successfully, false otherwise.
    //
    set_server_data: function(serverID, key_name, value, write_file = true){
        if(server_key_exists(key_name)){    
            CORE_MEMORY['SERVERS'][serverID][key_name] = value
            if(write_file) save_memory()
            return true
        } else return false
    },
    
    // Processes a collection of Servers. If a server is not recognized it's details will be added
    // to CORE_MEMORY. Afterward, new users are checked for in the server and then added to 
    // CORE_MEMORY (if not already present).
    //
    // @param SERVER_POOL An object containing one or more server objects.
    // @param TRUNCATED_LOG If true, only important details regarding a server process will
    //                      be printed to the console.
    //
    process_new_servers(server_pool, truncated_log = false){
        for (var server in server_pool) this.add_server(server_pool[server], truncated_log)
    },
    
    // Adds a new server to CORE_MEMORY and applies all registered Server Keys
    // and their default values.
    //
    // @param SERVER The user to add.
    // @param TRUNCATED_LOG If true, only important details regarding a server addition will
    //                      be printed to the console.
    // @return TRUE if The server is new, return FALSE if server is recognized.
    //
    add_server: function(server, truncated_log = false){
        new_server = true
        server_id = server['id']
        if(CORE_MEMORY['SERVERS'][server_id] === undefined){
            log_event("Adding Server: " + server['name'])
            CORE_MEMORY['SERVERS'][server_id] = {}
            SERVER_KEYS = CORE_MEMORY['SYSTEM']['SERVER_KEYS']
            for(var i=0; i<SERVER_KEYS.length; i++){
                if(CORE_MEMORY['SERVERS'][server_id][SERVER_KEYS[i]] === undefined){
                    CORE_MEMORY['SERVERS'][server_id][SERVER_KEYS[i]] = CORE_MEMORY['SYSTEM']['SERVER_DEF_VALUES'][i]
                }
            }
        } else {
            log_event("Server " + server['name'] + "(ID:" + server_id + ") Recognized")
            new_server = false
        }
        log_event("Processing Users in Server...")
        for (var user in server['members']) this.add_user(server['members'][user], false, truncated_log)
        save_memory();
        return new_server
    },
    
    // Adds a new user to CORE_MEMORY and applies all registered User Keys
    // and their default values.
    //
    // @param USER The user to add.
    // @param SILENT If true, the recognized user statement will not be printed to the console.
    // @return TRUE if The user is new, return FALSE if user is recognized.
    //
    add_user: function(user, save_mem=true, silent = false){
        user_id = user['id']
        if(CORE_MEMORY['USERS'][user_id] === undefined){
            log_event("Adding User: " + user['username'])
            CORE_MEMORY['USERS'][user_id] = {}
            USER_KEYS = CORE_MEMORY['SYSTEM']['USER_KEYS']
            for(var i=0; i<USER_KEYS.length; i++){
                if(CORE_MEMORY['USERS'][user_id][USER_KEYS[i]] === undefined){
                    CORE_MEMORY['USERS'][user_id][USER_KEYS[i]] = CORE_MEMORY['SYSTEM']['USER_DEF_VALUES'][i]
                }
            }
            if(save_mem) save_memory();
            return true;
        } else {
            if(!silent) log_event("User " + BOT['users'][user_id]['username'] + "(ID:" + user_id + ") Recognized")
            return false;
        }
    },
    
    // Returns a formatted string representation of CORE_MEMORY
    //
    // @return a formatted string representation of CORE_MEMORY
    //
    print_core_memory: function(){
        return JSON.stringify(CORE_MEMORY, null, 4)   
    }

}


// 2.) ---- PRIVATE FUNCTIONS ----------------------------------------------------------------------- //


// Constructs the bot's memory structure and saves it out to core_memory.json
//
function build_core_memory(){
    log_event("Constructing Memory File...")
    CORE_MEMORY['SYSTEM'] = { 
        USER_KEYS: [],
        USER_DEF_VALUES: [],
        SERVER_KEYS: [],
        SERVER_DEF_VALUES: []
    }, CORE_MEMORY['USERS'] = {}, CORE_MEMORY['SERVERS'] = {}
    for (var user in BOT.users)
        CORE_MEMORY['USERS'][user] = {}
    for (var server in BOT.servers)
        CORE_MEMORY['SERVERS'][server] = {}
    save_memory();
}


// Checks if a specified key is a Registered User Key. 
//
// @param KEY The name of the key.
// @return True if the key is a Registered User Key, false otherwise.
//
function user_key_exists(key){
    return CORE_MEMORY['SYSTEM']['USER_KEYS'].includes(key)
}


// Checks if a specified key is a Registered Server Key. 
//
// @param KEY The name of the key.
// @return True if the key is a Registered Server Key, false otherwise.
//
function server_key_exists(key){
    return CORE_MEMORY['SYSTEM']['SERVER_KEYS'].includes(key)
}


// Saves the current state of CORE_MEMORY to core_memory.json
//
// @param ASYNC If TRUE the core_memory.json will be saved asynchronously,
//              otherwise it will be saved synchronously.
//
function save_memory(async = false){
    if(async = false){
        fs.writeFile( "core_memory.json", JSON.stringify( CORE_MEMORY ), "utf8", () => {
            log_event("MEMORY SAVED")
        });
    } else {
        fs.writeFileSync( "core_memory.json", JSON.stringify( CORE_MEMORY ), "utf8")
        log_event("MEMORY SAVED")
    }
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