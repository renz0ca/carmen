// carmen_interface.js

// Binds the "Reset API Client" button to the appropriate AJAX request.
function bind_elements() {
    $("#reset-api").on("click", function(){
         $.ajax({
            "type": "POST",
            "dataType": "json",
            "data": JSON.stringify({OPCODE: 'reset_api'}),
            "contentType": "application/json",
            "processData": false,
        });
    });
}

// Set's the Online/Offline Status Box.
function set_online(is_online){
    if(is_online){
        $("#status-box").addClass('online')
        $("#status-box").removeClass('offline')
    } else {
        $("#status-box").removeClass('online')
        $("#status-box").addClass('offline')
    }
}

// Client-Side Long Polling Functionality (.5 second intervals)
// If query_state == True --> Ask webserver for the current state of the bot.
// If query_state == False --> Request only new updates from the bot.
function fetch_updates(query_state = false){
    setTimeout(function(){
        if(query_state) action = "fetch_state"
        else action = "fetch_updates"
        $.ajax({
            "type": "POST",
            "dataType": "json",
            "data": JSON.stringify({OPCODE: action}),
            "contentType": "application/json",
            "processData": false,
            "success": process_updates
        });
    }, 500)
}

// Process new updates fetched by fetch_updates() and then
// calls fetch_updates() again.
function process_updates(response){
    if(response['STATUS'] !== undefined){
        if(response['STATUS']) set_online(true)
        else set_online(false)
    }
    if(response['CONSOLE'] !== undefined){
        console.log(response['CONSOLE'])
        $('#console').append(response['CONSOLE']);
        $('#console').scrollTop($('#console')[0].scrollHeight);
    } 
    fetch_updates()
}

// Run Script
$( document ).ready(function() {
    bind_elements()
    fetch_updates(true)
});