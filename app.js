/**
 * Created by Aditya on 4/9/2017.
 */

var app = require('express')();
var bodyParser = require('body-parser');


//socket functionalities
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var mongoC = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/persons"; //persons is the db
var globalSocket;

setupSocket();

//Below is the route to be used by doctor to send all the vitals
//These are the vitals that will be tracked
app.post('/dSendVitals', function(req,res){
     /*Request message format
     * p_id: patient id
     * Name: patient name,  Age, Weight, Gender
     * Vitals:
     * */
     /*Flow:
     * 1. First check if it is an existing patient -> in that case only update the vitals
     * 2. Else -> new entries in patients and doctor-patient
     * Collections -> patient, patient-doctor (currently only assumed one doctor)
     * */
    //process based on how you receive the vitals
    //Step 1
    console.log("Form submitted")
    var pat_id = req.body._id;
    //check in the "patient database"
    mongoC.connect(url, function(err, db){
        if(err) console.log("Error connecting to database");
        else {
            var collection = db.collection('patient');

            //insert newly
            var name = req.body.name;
            console.log(name=="");
            var gender = req.body.gender;
            var age = req.body.age;
            var weight = req.body.weight;
            var heartRate = req.body.heartRate;
            var sleep = req.body.sleep;
            var calorieBurnt = req.body.calorieBurnt;
            var steps = req.body.steps;

            //we assume doctor id
            var vitals = {"heartRate": heartRate, "sleep": sleep, "calorieBurnt": calorieBurnt, "steps": steps};
            //if bio fields are not null ->, if null, then a different query
            //if else logic is for re-visit, the update inside the if is an upsert and is a provision existing/new patients
            if (!(name=="")) {
                //This upsert logic: we are using the same page for new and existing. So this is a provision for error free insert
            collection.update(
                {"_id": parseInt(pat_id)},
                {
                    "_id": parseInt(pat_id),
                    "name": name, "age": age, "gender": gender, "weight": weight,
                    "vitals": vitals
                },
                true
            );
            }
            else {
                //a simulation for: if we actually create a page for existing patient
                //currently we simulate this by not putting the patients name
                collection.update(
                    {"_id": parseInt(pat_id)},
                    {"$set":{"vitals": vitals}}
                );
            }
            //the true is for the upsert
            db.close();
        } //else ends
        });
    //#todo: try to re-draw the main page
    res.send("<h1>Vitals have been set</h1>");

});

//connect, client sends connection
//#todo: server should check if this is the first time or second time
//#This works, if not, please check the way request is send
//should be in xx-www-form-urlencodeds
app.post('/cConnect',function(req, res){
    //request should contain client_id
    //response should contain parameters
    //response parameters will be in JSON parameters
        console.log("One client connected through mobile app");

        var user_id = req.body._id;
        console.log(req.body);
        mongoC.connect(url, function(err, db){
        var collection = db.collection('patient');

        var cursor = collection.find({"_id":parseInt(user_id)});
        //this will always return a patient
        //because patient is set from the doctor application -> so when the user hits, records will be returned
        //what if patient enters a wrong id -> #todo: optional, not handled yet
        cursor.forEach(function(db, err){
            if(err) console.log(err);
            else {
                var vitals = db.vitals;
                console.log("Vitals> "+JSON.stringify(vitals));
               // res.sendFile("view/simple-form.html",{root: __dirname });
                res.send(vitals);
                //res.redirect("simple-form.html");
            }
        });
        db.close();
    });

});


app.post('/cAppointment', function(req, res){
    //this request will contain a json file
    //send patient_id and availability to findAvailability.js
    var patient_id = req.body._id;
    var patient_appointment = req.body.appointment; //this is an array

    //send this to findAvailability.js
    //return -> available slot and date
    //slot is only a number -> get mapping to actual time
    //the response would be an
    //send a JSON file as a response
    res.send();
});

//route for: message from client that threshhold has crossed
//#todo: should also recieive patient id
app.post('/cThresholdCrossed',function(req,res){
    console.log("Danger: user vitals have crossed threshhold");
    console.log("Sockets open ? "+globalSocket.connected);
    globalSocket.emit('notif',{message:"doctor ye le message"});

});

function setupSocket(){
    var http = require('http').Server(app);
    var io = require('socket.io')(http);

    io.on('connection', function(socket){
        console.log("socket atleast started");
        globalSocket = socket;
    });

    http.listen(8080, function(){
        console.log("Listening on port");
    });
}





