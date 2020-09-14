const fetch = require('node-fetch');
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

AWS.config.update({region: "us-west-2"});

exports.handler = async (event) => {
     let language = "";
       var dbParams = 
    {
      TableName: "mlsupport-Messages",
      Key: 
      {
        MsgGroup: "1000_GreetingLanguage"
      }
    };
 
    dynamodb.get(dbParams, (error, data) =>{
        if(error){
            console.log(error);
            language = "en-US";
        }else{
            language = data.Item.CurrentLanguage; 
        }
        
    });
    
    let {slots, name, fulfillmentState} = event.currentIntent; 
    if(slots.drink && fulfillmentState != "Fulfilled"){
    let link = "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=" + slots.drink;
    try {
     
    const res = await fetch(link);

    const json = await res.json();
    
    const drinkName = json["drinks"][0]["strDrink"];
    const instructions = json["drinks"][0]["strInstructions"]
    
    let ingridientI = "strIngredient";
    let counter = 1; 
    let index = ingridientI + counter; 
    let str = ""
       let conjuction = "and "
    
    if(language === "es-US"){
        conjuction = "y "
    }
    while( json["drinks"][0][index] !== null ){
        
        if(json["drinks"][0][ingridientI + (counter + 1)] === null){
            str += conjuction + json["drinks"][0][index];
             counter ++;
            index = ingridientI + counter
            continue;
        }
        str += json["drinks"][0][index] + ", "; 
         counter ++;
        index = ingridientI + counter
       
    }
    let myMessage = ""; 
    
    if(language === "en-US"){
    myMessage += "<speak>Here's the  " + drinkName + " you asked for.";
    myMessage += "Here are the main ingredients: " + str + ". "; 
     myMessage+= "Here's how to make it: " + instructions + "<speak>";
    
    }else{
         myMessage += "Aquí esta la " + drinkName+ ".";
        myMessage += "Estos son los ingredientes principales: " + str + ". ";
        myMessage += "He aquí cómo hacerlo:"+ instructions + "\n";
    }
      return {
            dialogAction: {
                type: "ElicitIntent", 
                message: {
                    contentType: "PlainText", 
                    content: myMessage
                }
            }
        }
        
    }catch (error){
        return {
            dialogAction: {
                type: "ElicitIntent", 
            message: {
                contentType: "PlainText", 
                content: " We could not find your drink, Please try again. "
            }
            }
            
        }
    }
    
    }else{
        return {
            dialogAction: {
                intentName: name, 
                type: "ElicitSlot", 
                slotToElicit: "drink", 
                slots :{
                    drink: ""
                }
            }
        }
    }
    
    return {
        dialogAction: {
            intentName: name, 
            type: "Delegate", 
            slots, 
        }
    }
    
};